import { db, type Row } from "./store";
import { coursePrice } from "./pricing";

/** Effective status. Replaces Zoho's scheduled job: computed at read time, so it's never stale. */
export function courseStatus(c: Row): "Active" | "Inactive" | "Completed" | "Full" {
  if (c.status === "Inactive") return "Inactive";
  const today = new Date().toISOString().slice(0, 10);
  if (c.end_date && String(c.end_date) < today) return "Completed";
  return "Active";
}

export async function openCourses() {
  const all = await db.list("courses", { order: "start_date", ascending: true });
  return all
    .filter((c) => courseStatus(c) === "Active")
    .map((c) => ({ id: c.id, name: String(c.name), level: String(c.level ?? ""), start_date: String(c.start_date ?? ""), price: coursePrice(String(c.level)) }));
}

export async function sortedGroups() {
  const all = await db.list("groups");
  return all
    .map((g) => ({ id: g.id, name: String(g.name), code: String(g.group_code ?? ""), is_subtenant: Boolean(g.is_subtenant) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

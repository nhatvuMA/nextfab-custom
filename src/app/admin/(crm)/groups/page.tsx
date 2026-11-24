import { redirect } from "next/navigation";
import { db, DuplicateError } from "@/lib/store";
import { siteUrl } from "@/lib/integration";
import { Badge, PageHead, Table } from "@/components/admin/ui";

export default async function Groups({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const [groups, members] = await Promise.all([db.list("groups"), db.list("members")]);
  groups.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  async function create(fd: FormData) {
    "use server";
    const name = String(fd.get("name") ?? "").trim();
    const code = String(fd.get("group_code") ?? "").trim().toUpperCase();
    if (!name || !code) redirect("/admin/groups?e=Name+and+Group+ID+are+required");
    if (await db.findOne("groups", { group_code: code })) redirect("/admin/groups?e=That+Group+ID+is+taken");
    try {
      await db.insert("groups", { name, group_code: code, is_subtenant: fd.get("is_subtenant") === "on", seats: Number(fd.get("seats") || 0) || null });
    } catch (err) {
      if (!(err instanceof DuplicateError)) throw err;
    }
    redirect("/admin/groups");
  }

  return (
    <>
      <PageHead title="Groups" sub="Formerly CRM Accounts. Feeds the Group ID dropdown on the group sign-up link (sorted A–Z)." />
      <form action={create} className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-[2fr_1fr_100px_auto_auto]">
        <input name="name" placeholder="Group name" className="nf-input !py-1.5 text-sm" />
        <input name="group_code" placeholder="Group ID" className="nf-input !py-1.5 text-sm" />
        <input name="seats" type="number" min="0" placeholder="Seats" className="nf-input !py-1.5 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_subtenant" /> Subtenant</label>
        <button className="nf-btn text-sm">Add group</button>
        {e && <p className="nf-err sm:col-span-5">{e}</p>}
      </form>
      <Table head={["Group", "Group ID", "Members", "Type", "Sign-up link"]} empty={!groups.length}>
        {groups.map((g) => {
          const count = members.filter((m) => m.group_id === g.id).length;
          return (
            <tr key={g.id}>
              <td className="px-4 py-3 font-medium">{String(g.name)}</td>
              <td className="px-4 py-3 font-mono text-xs">{String(g.group_code)}</td>
              <td className="px-4 py-3">{count}{g.seats ? ` / ${g.seats}` : ""}</td>
              <td className="px-4 py-3">{g.is_subtenant ? <Badge tone="blue">Subtenant → thank-you page</Badge> : <Badge>Standard</Badge>}</td>
              <td className="px-4 py-3"><code className="select-all text-xs text-gray-500">{siteUrl()}/join/membership-sign-up?type=group&amp;group={g.id}</code></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

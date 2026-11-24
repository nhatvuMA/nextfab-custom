import { redirect } from "next/navigation";
import { db, DuplicateError } from "@/lib/store";
import { courseStatus, slugify } from "@/lib/courses";
import { coursePrice, money } from "@/lib/pricing";
import { siteUrl } from "@/lib/integration";
import { Badge, PageHead, Table, fmtDate, statusTone } from "@/components/admin/ui";

export default async function Courses({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const [courses, signups] = await Promise.all([db.list("courses", { order: "start_date", ascending: true }), db.list("signups", { eq: { type: "maker-series" } })]);
  const today = new Date().toISOString().slice(0, 10);

  async function create(fd: FormData) {
    "use server";
    const name = String(fd.get("name") ?? "").trim();
    const level = String(fd.get("level") ?? "");
    const start = String(fd.get("start_date") ?? "");
    const end = String(fd.get("end_date") ?? "");
    const t = new Date().toISOString().slice(0, 10);
    const err = !name || !level || !start || !end ? "All fields are required"
      : start < t ? "Start date cannot be in the past"
      : end < start ? "End Date must be on or after the Start Date" : null;
    if (err) redirect(`/admin/courses?e=${encodeURIComponent(err)}`);
    let slug = slugify(name);
    if (await db.findOne("courses", { slug })) slug = `${slug}-${start}`;
    try {
      await db.insert("courses", { name, level, start_date: start, end_date: end, status: "Active", slug, description: String(fd.get("description") ?? "") || null });
    } catch (x) {
      if (x instanceof DuplicateError) redirect("/admin/courses?e=A+course+with+that+name+and+date+exists");
      throw x;
    }
    redirect("/admin/courses");
  }
  async function setStatus(fd: FormData) {
    "use server";
    await db.update("courses", String(fd.get("id")), { status: String(fd.get("status")) });
    redirect("/admin/courses");
  }

  return (
    <>
      <PageHead title="Maker Series" sub="Course set-up. Price is set by level: Beginner $799, all others $999. Status updates automatically when a course ends." />
      <form action={create} className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input name="name" placeholder="Course name" className="nf-input !py-1.5 text-sm" />
        <select name="level" className="nf-input !py-1.5 text-sm" defaultValue=""><option value="" disabled>Level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <label className="text-xs text-gray-500">Start<input name="start_date" type="date" min={today} className="nf-input !py-1.5 text-sm" /></label>
        <label className="text-xs text-gray-500">End<input name="end_date" type="date" min={today} className="nf-input !py-1.5 text-sm" /></label>
        <button className="nf-btn self-end text-sm">Create course</button>
        {e && <p className="nf-err sm:col-span-full">{e}</p>}
      </form>
      <Table head={["Course", "Level", "Price", "Dates", "Enrolled", "Status", "Registration link", ""]} empty={!courses.length}>
        {courses.map((c) => {
          const st = courseStatus(c);
          const n = signups.filter((s) => s.course_id === c.id && (s.status === "paid" || s.status === "pending_payment")).length;
          return (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium">{String(c.name)}</td>
              <td className="px-4 py-3">{String(c.level)}</td>
              <td className="px-4 py-3">{money(coursePrice(String(c.level)))}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</td>
              <td className="px-4 py-3">{n}</td>
              <td className="px-4 py-3"><Badge tone={statusTone(st === "Completed" ? "inactive" : st)}>{st}</Badge></td>
              <td className="px-4 py-3"><code className="select-all text-xs text-gray-500">{siteUrl()}/join/membership-sign-up?type=maker-series&amp;course={c.id}</code></td>
              <td className="px-4 py-3">
                <form action={setStatus}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value={c.status === "Inactive" ? "Active" : "Inactive"} />
                  <button className="text-sm text-nf-blue underline">{c.status === "Inactive" ? "Reopen" : "Close course"}</button>
                </form>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

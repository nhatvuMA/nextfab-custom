import Link from "next/link";
import { db } from "@/lib/store";
import { MEMBERSHIP_STATUSES } from "@/lib/picklists";
import { Badge, NewButton, PageHead, Table, fmtDate, statusTone } from "@/components/admin/ui";

export default async function Members({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  let rows = await db.list("members");
  if (status) rows = rows.filter((r) => r.membership_status === status);
  if (q) rows = rows.filter((r) => `${r.first_name} ${r.last_name} ${r.email} ${r.mmid ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const groups = Object.fromEntries((await db.list("groups")).map((g) => [g.id, g.name]));
  return (
    <>
      <PageHead title="Members" sub="Formerly the Contacts module. Email is unique — duplicates are blocked." action={<NewButton href="/admin/members/new">Create Member</NewButton>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="status" defaultValue={status} className="nf-input !w-auto !py-1.5 text-sm">
          <option value="">Any status</option>{MEMBERSHIP_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="Search name, email, MMID" className="nf-input !w-64 !py-1.5 text-sm" />
        <button className="rounded bg-nf-navy px-3 text-sm text-white">Filter</button>
      </form>
      <Table head={["Name", "Email", "Status", "Type", "Group", "Start date", "Source"]} empty={!rows.length}>
        {rows.map((m) => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="px-4 py-3"><Link className="font-medium text-nf-blue" href={`/admin/members/${m.id}`}>{String(m.first_name)} {String(m.last_name ?? "")}</Link></td>
            <td className="px-4 py-3 text-gray-600">{String(m.email ?? "")}</td>
            <td className="px-4 py-3"><Badge tone={statusTone(m.membership_status)}>{String(m.membership_status ?? "")}</Badge></td>
            <td className="px-4 py-3">{String(m.membership_type ?? "")}</td>
            <td className="px-4 py-3">{m.group_id ? String(groups[String(m.group_id)] ?? "") : ""}</td>
            <td className="px-4 py-3 text-gray-500">{fmtDate(m.membership_start_date)}</td>
            <td className="px-4 py-3 text-gray-500">{m.converted_from_lead_id ? "Converted lead" : "Direct"}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

import Link from "next/link";
import { db } from "@/lib/store";
import { LEAD_STATUSES } from "@/lib/picklists";
import { Badge, NewButton, PageHead, Table, fmtDate, statusTone } from "@/components/admin/ui";

export default async function Leads({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; show?: string }> }) {
  const { q = "", status = "", show = "open" } = await searchParams;
  let rows = await db.list("leads");
  if (show === "open") rows = rows.filter((r) => !r.converted_at);
  if (show === "converted") rows = rows.filter((r) => r.converted_at);
  if (status) rows = rows.filter((r) => r.lead_status === status);
  if (q) rows = rows.filter((r) => `${r.first_name} ${r.last_name} ${r.email} ${r.phone}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHead title="Leads" sub="Prospects who toured, inquired or showed interest but haven't joined." action={<NewButton href="/admin/leads/new">Create Lead</NewButton>} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="show" defaultValue={show} className="nf-input !w-auto !py-1.5 text-sm">
          <option value="open">Open leads</option><option value="converted">Converted leads</option><option value="all">All</option>
        </select>
        <select name="status" defaultValue={status} className="nf-input !w-auto !py-1.5 text-sm">
          <option value="">Any status</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="Search" className="nf-input !w-56 !py-1.5 text-sm" />
        <button className="rounded bg-nf-navy px-3 text-sm text-white">Filter</button>
      </form>
      <Table head={["Name", "Email", "Phone", "Status", "Type", "Source", "Lead date", "Owner"]} empty={!rows.length}>
        {rows.map((l) => (
          <tr key={l.id} className="hover:bg-gray-50">
            <td className="px-4 py-3"><Link className="font-medium text-nf-blue" href={`/admin/leads/${l.id}`}>{String(l.first_name)} {String(l.last_name ?? "")}</Link></td>
            <td className="px-4 py-3 text-gray-600">{String(l.email ?? "")}</td>
            <td className="px-4 py-3 text-gray-600">{String(l.phone ?? "")}</td>
            <td className="px-4 py-3">{l.converted_at ? <Badge tone="blue">Converted</Badge> : <Badge tone={statusTone(l.lead_status)}>{String(l.lead_status ?? "New")}</Badge>}</td>
            <td className="px-4 py-3">{String(l.lead_type ?? "")}</td>
            <td className="px-4 py-3">{String(l.lead_source ?? "")}</td>
            <td className="px-4 py-3 text-gray-500">{fmtDate(l.lead_date)}</td>
            <td className="px-4 py-3 text-gray-500">{String(l.lead_owner ?? "")}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

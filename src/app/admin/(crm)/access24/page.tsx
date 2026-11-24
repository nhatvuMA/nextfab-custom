import Link from "next/link";
import { db } from "@/lib/store";
import { isOpen, requirements, today as todayNY } from "@/lib/access24";
import { Badge, PageHead, Table, fmtDate, fmtDateTime, statusTone } from "@/components/admin/ui";

const FILTERS = [["open", "Open"], ["Approved", "Approved"], ["Denied", "Denied"], ["all", "All"]];

export default async function Access24List({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "open", q = "" } = await searchParams;
  const [all, members, calls] = await Promise.all([db.list("access24_requests"), db.list("members"), db.list("access24_safety_calls")]);
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));
  let rows = all.filter((r) => byId[String(r.member_id)]);
  if (filter === "open") rows = rows.filter(isOpen);
  else if (filter !== "all") rows = rows.filter((r) => r.status === filter);
  if (q) rows = rows.filter((r) => { const m = byId[String(r.member_id)]; return `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q.toLowerCase()); });
  const today = todayNY();
  const expiring = members.filter((m) => m.access24_status === "Approved" && m.coi_end_date && String(m.coi_end_date) < new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  return (
    <>
      <PageHead title="24-Hour Access" sub="Requests from active members. Log the safety call, record trainings and insurance, then approve." action={<a href="/join/24-hour-access" target="_blank" className="text-sm text-nf-blue underline">Public request form ↗</a>} />
      {expiring.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <b>{expiring.length} approved member{expiring.length > 1 ? "s have" : " has"} insurance ending within 30 days (or already ended).</b>
          <ul className="mt-1 text-sm">{expiring.map((m) => <li key={m.id}><Link className="underline" href={`/admin/members/${m.id}`}>{String(m.first_name)} {String(m.last_name ?? "")}</Link> · COI ends {fmtDate(m.coi_end_date)}{String(m.coi_end_date) < today ? " (ended)" : ""}</li>)}</ul>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, l]) => (
          <Link key={k} href={`?filter=${k}`} className={`rounded-full px-3 py-1 text-sm ${filter === k ? "bg-nf-navy text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{l}</Link>
        ))}
        <form className="ml-auto"><input type="hidden" name="filter" value={filter} /><input name="q" defaultValue={q} placeholder="Search name or email" className="nf-input !py-1.5 text-sm" /></form>
      </div>
      <Table head={["Member", "Email", "Status", "Checklist", "COI ends", "Requested"]} empty={!rows.length}>
        {rows.map((r) => {
          const m = byId[String(r.member_id)];
          const reqs = requirements(r, m, calls.filter((c) => c.request_id === r.id));
          const done = reqs.filter((x) => x.done).length;
          return (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3"><Link className="font-medium text-nf-blue" href={`/admin/access24/${r.id}`}>{String(m.first_name)} {String(m.last_name ?? "")}</Link></td>
              <td className="px-4 py-3 text-gray-600">{String(m.email)}</td>
              <td className="px-4 py-3"><Badge tone={statusTone(r.status)}>{String(r.status)}</Badge></td>
              <td className="px-4 py-3"><span className={done === reqs.length ? "font-medium text-emerald-700" : "text-gray-600"}>{done}/{reqs.length}</span></td>
              <td className="px-4 py-3">{r.coi_end_date ? fmtDate(r.coi_end_date) : <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-3 text-gray-500">{fmtDateTime(r.created_at)}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

import Link from "next/link";
import { db } from "@/lib/store";
import { money } from "@/lib/pricing";
import { Badge, PageHead, Table, fmtDateTime, statusTone } from "@/components/admin/ui";

const FILTERS = [["all", "All"], ["pending_payment", "Awaiting payment"], ["paid", "Paid"], ["complete", "Complete (no payment)"], ["error", "Errors"]];

export default async function Signups({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const { filter = "all", q = "" } = await searchParams;
  let rows = await db.list("signups");
  if (filter === "error") rows = rows.filter((r) => r.integration_status === "Error");
  else if (filter !== "all") rows = rows.filter((r) => r.status === filter);
  if (q) rows = rows.filter((r) => `${r.first_name} ${r.last_name} ${r.email}`.toLowerCase().includes(q.toLowerCase()));
  const groups = Object.fromEntries((await db.list("groups")).map((g) => [g.id, g.name]));

  return (
    <>
      <PageHead title="Sign-ups" sub="Every Membership Agreement submission (Membership, Group and Maker Series links)." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, l]) => (
          <Link key={k} href={`?filter=${k}`} className={`rounded-full px-3 py-1 text-sm ${filter === k ? "bg-nf-navy text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>{l}</Link>
        ))}
        <form className="ml-auto"><input type="hidden" name="filter" value={filter} /><input name="q" defaultValue={q} placeholder="Search name or email" className="nf-input !py-1.5 text-sm" /></form>
      </div>
      <Table head={["Name", "Email", "Link type", "Plan / Group / Course", "Total", "Status", "Integration", "Submitted"]} empty={!rows.length}>
        {rows.map((s) => (
          <tr key={s.id} className="hover:bg-gray-50">
            <td className="px-4 py-3"><Link className="font-medium text-nf-blue" href={`/admin/signups/${s.id}`}>{String(s.first_name)} {String(s.last_name)}</Link></td>
            <td className="px-4 py-3 text-gray-600">{String(s.email)}</td>
            <td className="px-4 py-3 capitalize">{String(s.type).replace("-", " ")}</td>
            <td className="px-4 py-3">{String(s.course_name ?? (s.group_id ? groups[String(s.group_id)] : (s.quote_lines as { label: string }[])?.[0]?.label) ?? "")}</td>
            <td className="px-4 py-3">{money(Number(s.total ?? 0))}</td>
            <td className="px-4 py-3"><Badge tone={statusTone(s.status)}>{String(s.status).replace("_", " ")}</Badge></td>
            <td className="px-4 py-3"><Badge tone={statusTone(s.integration_status)}>{String(s.integration_status)}</Badge></td>
            <td className="px-4 py-3 text-gray-500">{fmtDateTime(s.created_at)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

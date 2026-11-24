import Link from "next/link";
import { db } from "@/lib/store";
import { money } from "@/lib/pricing";
import { Badge, Card, PageHead, Table, fmtDateTime, statusTone } from "@/components/admin/ui";

export default async function Dashboard() {
  const [signups, leads, members, access24] = await Promise.all([db.list("signups"), db.list("leads"), db.list("members"), db.list("access24_requests")]);
  const access24Open = access24.filter((r) => r.status === "Requested").length;
  const errors = signups.filter((s) => s.integration_status === "Error");
  const pending = signups.filter((s) => s.status === "pending_payment");
  const activeLeads = leads.filter((l) => !l.converted_at);
  const active = members.filter((m) => m.membership_status === "Active");
  const mrr = signups.filter((s) => s.status === "paid" && s.interval === "month").reduce((a, s) => a + Number(s.total ?? 0), 0);

  const stats: [string, string | number, string, string?][] = [
    ["Active members", active.length, "/admin/members"],
    ["Open leads", activeLeads.length, "/admin/leads"],
    ["Awaiting payment", pending.length, "/admin/signups"],
    ["New monthly revenue", money(mrr), "/admin/signups"],
  ];

  return (
    <>
      <PageHead title="Dashboard" sub="Sign-ups, leads and members in one place — no more Creator ↔ CRM sync." />
      {errors.length > 0 && (
        <Link href="/admin/signups?filter=error" className="mb-6 block rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <b>{errors.length} sign-up{errors.length > 1 ? "s" : ""} failed integration.</b> Review and retry →
        </Link>
      )}
      {access24Open > 0 && (
        <Link href="/admin/access24" className="mb-6 block rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-900">
          <b>{access24Open} new 24-hour access request{access24Open > 1 ? "s" : ""}</b> waiting for a safety call →
        </Link>
      )}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v, h]) => (
          <Link key={l} href={h} className="rounded-lg border border-gray-200 bg-white p-5 hover:border-nf-sky">
            <p className="text-xs uppercase tracking-wider text-gray-500">{l}</p>
            <p className="mt-1 text-3xl font-semibold text-nf-navy">{v}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 font-semibold">Recent sign-ups</h2>
          <Table head={["Name", "Type", "Total", "Status", "Integration", "When"]} empty={!signups.length}>
            {signups.slice(0, 8).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Link className="font-medium text-nf-blue" href={`/admin/signups/${s.id}`}>{String(s.first_name)} {String(s.last_name)}</Link></td>
                <td className="px-4 py-3 capitalize">{String(s.type).replace("-", " ")}</td>
                <td className="px-4 py-3">{money(Number(s.total ?? 0))}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(s.status)}>{String(s.status).replace("_", " ")}</Badge></td>
                <td className="px-4 py-3"><Badge tone={statusTone(s.integration_status)}>{String(s.integration_status)}</Badge></td>
                <td className="px-4 py-3 text-gray-500">{fmtDateTime(s.created_at)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <Card title="Lead pipeline">
          <ul className="space-y-2">
            {Object.entries(activeLeads.reduce<Record<string, number>>((a, l) => { const k = String(l.lead_status || "New"); a[k] = (a[k] ?? 0) + 1; return a; }, {}))
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => (
                <li key={k} className="flex items-center justify-between"><Badge tone={statusTone(k)}>{k}</Badge><span className="font-semibold">{n}</span></li>
              ))}
            {!activeLeads.length && <li className="text-gray-400">No open leads.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

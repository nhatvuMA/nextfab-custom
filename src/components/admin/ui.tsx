import Link from "next/link";

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-nf-navy">{title}</h1>
        {sub && <p className="text-gray-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="nf-btn text-sm">+ {children}</Link>;
}

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
};
export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
}

export function statusTone(s: unknown): keyof typeof TONES {
  const v = String(s ?? "").toLowerCase();
  if (["active", "paid", "success", "complete", "qualified", "approved"].includes(v)) return "green";
  if (["error", "inactive", "cancelled", "not qualified", "denied", "withdrawn"].includes(v)) return "red";
  if (["pending payment", "pending_payment", "unpaid", "pending", "submitted", "pending review", "requested"].includes(v)) return "amber";
  if (["safety call scheduled", "in onboarding", "notify when eligible"].includes(v)) return "blue";
  if (v.includes("tour") || v.includes("converted")) return "blue";
  return "gray";
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-gray-400">Nothing here yet.</p>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>}
      {children}
    </section>
  );
}

export function DL({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wider text-gray-400">{k}</dt>
          <dd className="break-words">{v === null || v === undefined || v === "" ? <span className="text-gray-300">—</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const fmtDate = (d: unknown) =>
  d ? new Date(String(d).length === 10 ? `${d}T00:00` : String(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
export const fmtDateTime = (d: unknown) =>
  d ? new Date(String(d)).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

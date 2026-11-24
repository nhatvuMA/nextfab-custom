import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, fileUrl } from "@/lib/store";
import { money, PLANS, type PlanId } from "@/lib/pricing";
import { markPaid, runIntegration } from "@/lib/integration";
import { Badge, Card, DL, PageHead, fmtDate, fmtDateTime, statusTone } from "@/components/admin/ui";

export default async function SignupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.get("signups", id);
  if (!s) notFound();
  const [photo, proof, sig, group] = await Promise.all([
    fileUrl(s.photo_path), fileUrl(s.discount_proof_path), fileUrl(s.signature_path),
    s.group_id ? db.get("groups", String(s.group_id)) : null,
  ]);

  async function retry() {
    "use server";
    try { await runIntegration(id); } catch { /* status written to record */ }
    redirect(`/admin/signups/${id}`);
  }
  async function paid() {
    "use server";
    await markPaid(id);
    redirect(`/admin/signups/${id}`);
  }

  const lines = (s.quote_lines as { label: string; amount: number }[]) ?? [];
  const addons = ["credits", "adobe", "shipping", "access24"].filter((a) => s[`addon_${a}`]);

  return (
    <>
      <PageHead
        title={`${s.first_name} ${s.last_name}`}
        sub={`${String(s.type).replace("-", " ")} sign-up · ${fmtDateTime(s.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/signups/${id}/agreement`} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">View signed agreement</Link>
            {s.member_id ? <Link href={`/admin/members/${s.member_id}`} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm">Open member →</Link> : null}
          </div>
        }
      />

      <div className={`mb-6 flex flex-wrap items-center gap-4 rounded-lg border p-4 ${s.integration_status === "Error" ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"}`}>
        <div className="flex gap-2"><Badge tone={statusTone(s.status)}>{String(s.status).replace("_", " ")}</Badge><Badge tone={statusTone(s.integration_status)}>Integration: {String(s.integration_status)}</Badge></div>
        {Boolean(s.integration_error) && <p className="text-sm text-red-800">{String(s.integration_error)}</p>}
        <div className="ml-auto flex gap-2">
          <form action={retry}><button className="rounded bg-nf-navy px-3 py-1.5 text-sm text-white">Retry integration</button></form>
          {s.status === "pending_payment" && <form action={paid}><button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm">Mark as paid</button></form>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card title="Selection">
            <DL items={[
              ["Plan", s.plan ? PLANS[s.plan as PlanId]?.label : null],
              ["Discount", s.discount_type ? `${s.discount_type} — ${s.discount_plan}` : null],
              ["Proof", s.discount_proof_link ? <a className="text-nf-blue underline" href={String(s.discount_proof_link).startsWith("http") ? String(s.discount_proof_link) : `https://${s.discount_proof_link}`} target="_blank">{String(s.discount_proof_link)}</a> : proof ? <a className="text-nf-blue underline" href={proof} target="_blank">View upload</a> : null],
              ["Add-ons", addons.join(", ")],
              ["Group", group ? `${group.name}${group.is_subtenant ? " (Subtenant)" : ""}` : null],
              ["Course", s.course_name as string],
            ]} />
          </Card>
          <Card title="Member information">
            <DL items={[
              ["Email", s.email as string], ["Phone", s.phone as string], ["Preferred name", s.preferred_name as string], ["Date of birth", fmtDate(s.dob)],
              ["Address", [s.address_line1, s.address_line2, s.city, s.state, s.postal_code, s.country].filter(Boolean).join(", ")],
              ["Emergency contact", `${s.ec_first_name} ${s.ec_last_name} · ${s.ec_phone}`],
            ]} />
          </Card>
          <Card title="Integration">
            <DL items={[["Member record", s.member_id as string], ["Stripe customer", s.stripe_customer_id as string], ["Checkout session", s.stripe_session_id as string], ["Paid at", fmtDateTime(s.paid_at)], ["Signer IP", s.signer_ip as string], ["Terms version", s.terms_version as string]]} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Amount">
            <ul className="space-y-1 text-sm">{lines.map((l) => <li key={l.label} className="flex justify-between"><span>{l.label}</span><span>{money(l.amount)}</span></li>)}</ul>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>Sub Total</dt><dd>{money(Number(s.subtotal ?? 0))}</dd></div>
              {Number(s.coupon_discount) > 0 && <div className="flex justify-between text-emerald-700"><dt>Coupon {String(s.coupon_code)}</dt><dd>−{money(Number(s.coupon_discount))}</dd></div>}
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(Number(s.total ?? 0))}{s.interval && s.interval !== "one-time" ? ` / ${s.interval}` : ""}</dd></div>
            </dl>
          </Card>
          <Card title="Member ID photo">
            {photo ? (String(s.photo_path).endsWith(".pdf") ? <a href={photo} className="text-nf-blue underline" target="_blank">Open PDF</a> : <img src={photo} alt="Member photo" className="max-h-64 rounded" />) : <p className="text-gray-400">None</p>}
          </Card>
          <Card title="Signature">
                        {sig && <img src={sig} alt="Signature" className="w-full rounded border bg-white" />}
          </Card>
        </div>
      </div>
    </>
  );
}

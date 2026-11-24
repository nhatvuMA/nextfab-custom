import { notFound } from "next/navigation";
import { db, fileUrl } from "@/lib/store";
import { money } from "@/lib/pricing";
import { fmtDate, fmtDateTime } from "@/components/admin/ui";
import PrintButton from "@/components/admin/PrintButton";

// Printable signed agreement (browser "Save as PDF"), replacing Zoho's generated PDF.
export default async function Agreement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.get("signups", id);
  if (!s) notFound();
  const sig = await fileUrl(s.signature_path);
  const lines = (s.quote_lines as { label: string; amount: number }[]) ?? [];
  return (
    <article className="mx-auto max-w-3xl bg-white p-10 text-[13px] leading-6 shadow print:shadow-none">
      <div className="mb-6 flex items-start justify-between">
        <div><h1 className="text-2xl font-semibold">NextFab Membership Agreement</h1><p className="text-gray-500">Terms version {String(s.terms_version)} · Ref {s.id.slice(0, 8)}</p></div>
        <PrintButton />
      </div>
      <h2 className="mt-4 font-semibold uppercase tracking-wider text-gray-500">Member</h2>
      <p>{String(s.first_name)} {String(s.last_name)}{s.preferred_name ? ` ("${s.preferred_name}")` : ""} · {String(s.email)} · {String(s.phone)} · DOB {fmtDate(s.dob)}</p>
      <p>{[s.address_line1, s.address_line2, s.city, s.state, s.postal_code, s.country].filter(Boolean).join(", ")}</p>
      <p>Emergency contact: {String(s.ec_first_name)} {String(s.ec_last_name)}, {String(s.ec_phone)}</p>
      <h2 className="mt-4 font-semibold uppercase tracking-wider text-gray-500">Selection</h2>
      <ul>{lines.map((l) => <li key={l.label}>{l.label}: {money(l.amount)}</li>)}</ul>
      <p>Sub Total {money(Number(s.subtotal))} · Coupon {money(Number(s.coupon_discount ?? 0))} · <b>Total {money(Number(s.total))}{s.interval && s.interval !== "one-time" ? ` / ${s.interval}` : ""}</b></p>
      <h2 className="mt-4 font-semibold uppercase tracking-wider text-gray-500">Signature</h2>
            {sig && <img src={sig} alt="signature" className="h-28 border-b" />}
      <p className="text-gray-500">Signed electronically {fmtDateTime(s.signed_at)} from IP {String(s.signer_ip ?? "unknown")}</p>
    </article>
  );
}

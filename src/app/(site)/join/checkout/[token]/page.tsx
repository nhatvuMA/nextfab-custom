import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { db } from "@/lib/store";
import { markPaid, stripe } from "@/lib/integration";
import { money } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Stand-in for Stripe Checkout while STRIPE_SECRET_KEY isn't set.
export default async function MockCheckout({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (stripe) notFound();
  const s = await db.findOne("signups", { resume_token: token });
  if (!s) notFound();
  if (s.status === "paid") redirect(`/join/thank-you?t=${token}`);

  async function pay() {
    "use server";
    const row = await db.findOne("signups", { resume_token: token });
    if (row) await markPaid(row.id);
    redirect(`/join/thank-you?t=${token}`);
  }

  const lines = (s.quote_lines as { label: string; amount: number }[]) ?? [];
  const total = Number(s.total ?? 0);
  return (
    <>
      <SiteHeader solid />
      <main className="nf-dots min-h-[70vh] px-4 py-16">
        <div className="mx-auto max-w-md bg-white p-8 shadow-lg">
          <p className="mb-4 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">Demo checkout — Stripe isn&apos;t connected yet. Add STRIPE_SECRET_KEY to use real Stripe Checkout.</p>
          <h1 className="text-2xl font-medium">{total > 0 ? "Payment" : "Confirm your membership"}</h1>
          <p className="text-sm text-gray-500">{String(s.first_name)} {String(s.last_name)} · {String(s.email)}</p>
          <ul className="my-6 space-y-2 border-y border-gray-100 py-4 text-sm">
            {lines.map((l) => <li key={l.label} className="flex justify-between"><span>{l.label}</span><span>{money(l.amount)}</span></li>)}
            {Number(s.coupon_discount) > 0 && <li className="flex justify-between text-green-700"><span>Coupon {String(s.coupon_code)}</span><span>−{money(Number(s.coupon_discount))}</span></li>}
          </ul>
          <p className="flex justify-between text-lg font-semibold"><span>Total due today</span><span>{money(total)}</span></p>
          <form action={pay} className="mt-6 space-y-3">
            <input disabled className="nf-input" value="4242 4242 4242 4242   12/30   123" readOnly />
            <button className="nf-btn w-full py-3 uppercase tracking-wider">{total > 0 ? `Pay ${money(total)}` : "Save card & finish"}</button>
          </form>
          <Link href={`/join/membership-sign-up?resume=${token}`} className="mt-4 block text-center text-sm text-nf-blue underline">← Back to edit my sign-up</Link>
        </div>
      </main>
    </>
  );
}

// Replaces Zoho's Stripe_Integration function. Runs after a sign-up is saved:
//   1. find-or-create the Member (dedupe on email), auto-convert a matching Lead
//   2. create Stripe customer + Checkout session (or a mock checkout if Stripe isn't configured)
//   3. write the outcome back to the sign-up (integration_status / integration_error)
// It's idempotent, so staff can safely press "Retry" from the admin.
import Stripe from "stripe";
import { db, normEmail, type Row } from "./store";
import { PLANS, DISCOUNT_PLANS, type PlanId, type DiscountPlanId } from "./pricing";

const stripeKey = process.env.STRIPE_SECRET_KEY;
export const stripe = stripeKey ? new Stripe(stripeKey) : null;
export const stripeMode = stripeKey ? (stripeKey.startsWith("sk_live") ? "live" : "test") : "mock";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function lookupCoupon(code: string) {
  const c = code.trim();
  if (!c) return null;
  if (stripe) {
    try {
      const coupon = await stripe.coupons.retrieve(c);
      if (!coupon.valid) return null;
      return { code: coupon.id, amount_off: coupon.amount_off ? coupon.amount_off / 100 : null, percent_off: coupon.percent_off ?? null };
    } catch {
      // fall through: also allow Stripe promotion codes
      const promos = await stripe.promotionCodes.list({ code: c, active: true, limit: 1 });
      const p = promos.data[0];
      if (!p) return null;
      // API versions differ on where the coupon lives on a promotion code.
      const raw = (p as unknown as { coupon?: unknown; promotion?: { coupon?: unknown } }).coupon ?? (p as unknown as { promotion?: { coupon?: unknown } }).promotion?.coupon;
      const coupon = typeof raw === "string" ? await stripe.coupons.retrieve(raw) : (raw as Stripe.Coupon);
      if (!coupon?.valid) return null;
      return { code: coupon.id, amount_off: coupon.amount_off ? coupon.amount_off / 100 : null, percent_off: coupon.percent_off ?? null };
    }
  }
  const row = await db.findOne("coupons", { code: c.toUpperCase() });
  if (!row || row.active === false) return null;
  return { code: String(row.code), amount_off: (row.amount_off as number) ?? null, percent_off: (row.percent_off as number) ?? null };
}

export function membershipTypeFor(s: Row): string {
  if (s.type === "group") return "Group";
  if (s.type === "maker-series") return "Maker Series";
  if (s.plan === "discounted") return DISCOUNT_PLANS[s.discount_plan as DiscountPlanId]?.label ?? "Discounted";
  return PLANS[s.plan as PlanId]?.label ?? "";
}

const MEMBER_FIELDS = [
  "first_name", "last_name", "preferred_name", "phone", "dob", "photo_path",
  "address_line1", "address_line2", "city", "state", "postal_code", "country",
  "ec_first_name", "ec_last_name", "ec_phone",
] as const;

async function upsertMember(s: Row): Promise<{ member: Row; created: boolean }> {
  const email = normEmail(s.email);
  const fields: Record<string, unknown> = {};
  for (const k of MEMBER_FIELDS) if (s[k] !== undefined && s[k] !== "") fields[k] = s[k];
  fields.membership_type = membershipTypeFor(s);
  fields.group_id = s.group_id || null;
  if (s.addon_access24) fields.access24_status = "Notify When Eligible";

  const existing = await db.findOne("members", { email });
  if (existing) {
    // Never downgrade an active member to "Pending Payment" because they re-submitted.
    if (existing.membership_status !== "Active") fields.membership_status = "Pending Payment";
    return { member: await db.update("members", existing.id, fields), created: false };
  }

  const lead = await db.findOne("leads", { email });
  const fromLead: Record<string, unknown> = {};
  if (lead && !lead.converted_at) {
    Object.assign(fromLead, {
      lead_source: lead.lead_source, lead_date: lead.lead_date, referred_by: lead.referred_by,
      tour_guide: lead.tour_guide, tour_date: lead.tour_date, member_owner: lead.lead_owner,
      business_name: lead.business_name, business_website: lead.business_website, business_social: lead.business_social,
      converted_from_lead_id: lead.id,
    });
  }
  const member = await db.insert("members", {
    email,
    membership_status: "Pending Payment",
    member_owner: "Member Services",
    ...fromLead,
    ...fields,
  });
  if (lead && !lead.converted_at) {
    await db.update("leads", lead.id, { converted_at: new Date().toISOString(), converted_member_id: member.id, lead_status: "Closed Lead" });
    await db.insert("lead_status_history", { lead_id: lead.id, member_id: member.id, status: "Converted (self sign-up)", changed_by: "System" });
  }
  return { member, created: true };
}

export async function runIntegration(signupId: string): Promise<{ redirect: string; signup: Row }> {
  let s = (await db.get("signups", signupId))!;
  try {
    const { member } = await upsertMember(s);
    s = await db.update("signups", s.id, { member_id: member.id });

    const group = s.group_id ? await db.get("groups", String(s.group_id)) : null;
    if (group?.is_subtenant) {
      await db.update("members", member.id, { membership_status: "Active", membership_start_date: today() });
      s = await db.update("signups", s.id, { status: "complete", integration_status: "Success", integration_error: null });
      return { redirect: `/join/thank-you?t=${s.resume_token}`, signup: s };
    }

    const successUrl = `${siteUrl()}/join/thank-you?t=${s.resume_token}`;
    const cancelUrl = `${siteUrl()}/join/membership-sign-up?resume=${s.resume_token}`;
    let checkoutUrl: string;
    let customerId = (member.stripe_customer_id as string) || null;
    let sessionId: string;

    if (stripe) {
      if (!customerId) {
        const c = await stripe.customers.create({
          email: String(member.email),
          name: `${s.first_name} ${s.last_name}`,
          phone: String(s.phone ?? ""),
          metadata: { member_id: member.id, signup_id: s.id },
        });
        customerId = c.id;
        await db.update("members", member.id, { stripe_customer_id: customerId });
      }
      const lines = (s.quote_lines as { label: string; amount: number }[]) ?? [];
      const recurring = s.interval === "month" ? { interval: "month" as const } : s.interval === "6 months" ? { interval: "month" as const, interval_count: 6 } : null;
      const total = Number(s.total ?? 0);
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: total === 0 ? "setup" : recurring ? "subscription" : "payment",
        currency: "usd",
        ...(total > 0 && {
          line_items: lines.filter((l) => l.amount > 0).map((l) => ({
            quantity: 1,
            price_data: { currency: "usd", unit_amount: Math.round(l.amount * 100), product_data: { name: l.label }, ...(recurring && { recurring }) },
          })),
          ...(s.coupon_code ? { discounts: [{ coupon: String(s.coupon_code) }] } : {}),
        }),
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { signup_id: s.id, member_id: member.id },
        client_reference_id: s.id,
      });
      checkoutUrl = session.url!;
      sessionId = session.id;
    } else {
      sessionId = `mock_cs_${s.resume_token}`;
      customerId = customerId || `mock_cus_${member.id.slice(0, 8)}`;
      await db.update("members", member.id, { stripe_customer_id: customerId });
      checkoutUrl = `/join/checkout/${s.resume_token}`;
    }

    s = await db.update("signups", s.id, {
      status: "pending_payment",
      stripe_customer_id: customerId,
      stripe_session_id: sessionId,
      integration_status: "Success",
      integration_error: null,
    });
    return { redirect: checkoutUrl, signup: s };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    s = await db.update("signups", s.id, { status: "error", integration_status: "Error", integration_error: msg });
    throw Object.assign(new Error(msg), { signup: s });
  }
}

export async function markPaid(signupId: string) {
  const s = await db.get("signups", signupId);
  if (!s || s.status === "paid") return s;
  await db.update("signups", s.id, { status: "paid", paid_at: new Date().toISOString() });
  if (s.member_id) {
    const m = await db.get("members", String(s.member_id));
    await db.update("members", String(s.member_id), {
      membership_status: "Active",
      membership_start_date: (m?.membership_start_date as string) || today(),
    });
  }
  return db.get("signups", signupId);
}

export const today = () => new Date().toISOString().slice(0, 10);

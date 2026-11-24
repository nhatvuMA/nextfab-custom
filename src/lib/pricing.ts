// Single source of truth for prices. Used by the form (live total) AND
// recomputed on the server at submission — the client total is never trusted.

export type SignupType = "membership" | "group" | "maker-series";

export const SIGNUP_TYPES: Record<SignupType, string> = {
  membership: "Membership",
  group: "Group",
  "maker-series": "Maker Series",
};

export function parseSignupType(v: string | null | undefined): SignupType {
  const s = (v ?? "").toLowerCase().replace(/[\s_]+/g, "-");
  if (s === "group") return "group";
  if (s === "maker-series") return "maker-series";
  return "membership";
}

export type PlanId = "month_to_month" | "annual" | "six_month" | "discounted";
export type DiscountPlanId = "month_to_month" | "annual";

export const PLANS: Record<PlanId, { label: string; price: number; per: string; note?: string }> = {
  month_to_month: { label: "Month-to-Month", price: 149, per: "month" },
  annual: { label: "Annual Contract", price: 134, per: "month", note: "12-month commitment, 10% off the monthly rate" },
  six_month: { label: "Six-Month Bundle", price: 1345, per: "6 months", note: "Includes one month free and $1,200 in credits" },
  discounted: { label: "Apply for Discounted Membership", price: 0, per: "month" },
};

export const DISCOUNT_PLANS: Record<DiscountPlanId, { label: string; price: number }> = {
  month_to_month: { label: "Discounted Month-to-Month", price: 129 },
  annual: { label: "Discounted Annual Contract", price: 116 },
};

export const DISCOUNT_TYPES = [
  "Artisan",
  "Current Student",
  "Recent Graduate",
  "Educator",
  "Military Personnel",
  "Veteran",
  "Senior",
  "First Responder",
] as const;

export type AddonId = "credits" | "adobe" | "shipping" | "access24";

export const ADDONS: Record<AddonId, { label: string; price: number; details: string; billedNow: boolean }> = {
  credits: {
    label: "Credit Bundle",
    price: 100,
    details: "200 credits each month for classes, private training, machine reservations, workshops and proficiency checks.",
    billedNow: true,
  },
  adobe: {
    label: "Adobe Software",
    price: 29,
    details: "Remote access to 20+ Adobe Creative Cloud apps, including Photoshop, Illustrator, Premiere Pro and InDesign.",
    billedNow: true,
  },
  shipping: {
    label: "Shipping & Purchasing",
    price: 29,
    details: "Business shipping and purchasing address, freight and forklift services, and preferred vendor discounts.",
    billedNow: true,
  },
  access24: {
    label: "24-Hour Access",
    price: 49,
    details: "Requires a Certificate of Insurance and safety onboarding. We'll notify you when you're eligible — not billed until approved.",
    billedNow: false,
  },
};

export const MAKER_SERIES_PRICE = { beginner: 799, other: 999 };

export function coursePrice(level: string | null | undefined) {
  return (level ?? "").toLowerCase() === "beginner" ? MAKER_SERIES_PRICE.beginner : MAKER_SERIES_PRICE.other;
}

export type Coupon = { code: string; amount_off?: number | null; percent_off?: number | null };

export type QuoteInput = {
  type: SignupType;
  plan?: PlanId | "";
  discountPlan?: DiscountPlanId | "";
  addons?: Partial<Record<AddonId, boolean>>;
  courseLevel?: string | null;
  hasCourse?: boolean;
  hasGroup?: boolean;
  coupon?: Coupon | null;
};

export type Quote = {
  lines: { label: string; amount: number }[];
  subtotal: number;
  discount: number;
  total: number;
  interval: "month" | "6 months" | "one-time" | null;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function computeQuote(input: QuoteInput): Quote {
  const lines: Quote["lines"] = [];
  let interval: Quote["interval"] = null;

  if (input.type === "group") {
    return { lines: input.hasGroup ? [{ label: "Group membership (billed to group)", amount: 0 }] : [], subtotal: 0, discount: 0, total: 0, interval: null };
  }

  if (input.type === "maker-series") {
    if (!input.hasCourse) return { lines, subtotal: 0, discount: 0, total: 0, interval: null };
    const price = coursePrice(input.courseLevel);
    lines.push({ label: `Maker Series course`, amount: price });
    interval = "one-time";
  } else {
    const plan = input.plan || "";
    if (plan === "discounted") {
      if (input.discountPlan) {
        const dp = DISCOUNT_PLANS[input.discountPlan];
        lines.push({ label: dp.label, amount: dp.price });
        interval = "month";
      }
    } else if (plan) {
      lines.push({ label: PLANS[plan].label, amount: PLANS[plan].price });
      interval = plan === "six_month" ? "6 months" : "month";
    }
    if (lines.length) {
      for (const id of Object.keys(ADDONS) as AddonId[]) {
        if (!input.addons?.[id]) continue;
        if (id === "credits" && plan === "six_month") continue; // credits already included
        const a = ADDONS[id];
        if (!a.billedNow) continue;
        lines.push({ label: `${a.label} add-on`, amount: a.price });
      }
    }
  }

  const subtotal = round(lines.reduce((s, l) => s + l.amount, 0));
  let discount = 0;
  if (input.coupon && subtotal > 0) {
    if (input.coupon.percent_off) discount = round((subtotal * input.coupon.percent_off) / 100);
    else if (input.coupon.amount_off) discount = Math.min(subtotal, round(input.coupon.amount_off));
  }
  return { lines, subtotal, discount, total: round(subtotal - discount), interval };
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0 });

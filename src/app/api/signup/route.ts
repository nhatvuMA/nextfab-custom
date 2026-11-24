import { NextResponse } from "next/server";
import { db, saveFile, newToken, normEmail, type Row } from "@/lib/store";
import { computeQuote, parseSignupType, type AddonId, type DiscountPlanId, type PlanId } from "@/lib/pricing";
import { validateSignup, checkFile } from "@/lib/validation";
import { runIntegration, lookupCoupon } from "@/lib/integration";

export const runtime = "nodejs";

const TEXT_FIELDS = [
  "plan", "discount_type", "discount_plan", "discount_proof_link", "coupon_code", "group_id", "course_id",
  "first_name", "last_name", "preferred_name", "email", "confirm_email", "phone", "dob",
  "address_line1", "address_line2", "city", "state", "postal_code", "country",
  "ec_first_name", "ec_last_name", "ec_phone", "agree_terms",
];

export async function POST(req: Request) {
  const form = await req.formData();
  const type = parseSignupType(String(form.get("type") ?? ""));
  const f: Record<string, string> = {};
  for (const k of TEXT_FIELDS) f[k] = String(form.get(k) ?? "").trim();
  const addons: Partial<Record<AddonId, boolean>> = {
    credits: form.get("addon_credits") === "yes",
    adobe: form.get("addon_adobe") === "yes",
    shipping: form.get("addon_shipping") === "yes",
    access24: form.get("addon_access24") === "yes",
  };
  if (f.plan === "six_month") addons.credits = false;

  // Resume an earlier attempt (link from the payment page's "back" button).
  const resumeToken = String(form.get("resume") ?? "");
  const existing = resumeToken ? await db.findOne("signups", { resume_token: resumeToken }) : null;
  if (existing && existing.status === "paid") return NextResponse.json({ ok: false, errors: { _form: "This sign-up is already paid." } }, { status: 409 });

  const photo = form.get("photo") as File | null;
  const proof = form.get("discount_proof") as File | null;
  const signature = String(form.get("signature") ?? "");
  const files = {
    photo: (photo && photo.size > 0) || Boolean(existing?.photo_path),
    proof: (proof && proof.size > 0) || Boolean(existing?.discount_proof_path),
    signature: signature.startsWith("data:image/png;base64,") && signature.length > 200,
  };

  const errors = validateSignup(type, f, files);
  const photoErr = photo && photo.size > 0 ? checkFile(photo) : null;
  if (photoErr) errors.photo = photoErr;
  const proofErr = proof && proof.size > 0 ? checkFile(proof) : null;
  if (proofErr) errors.discount_proof = proofErr;

  // Server-side lookups — the browser can't fake a price, group or course.
  let group: Row | null = null, course: Row | null = null;
  if (type === "group" && f.group_id) {
    group = await db.get("groups", f.group_id);
    if (!group) errors.group_id = "Unknown Group ID";
  }
  if (type === "maker-series" && f.course_id) {
    course = await db.get("courses", f.course_id);
    if (!course || course.status === "Inactive") errors.course_id = "This course is not open for registration";
  }
  let coupon = null;
  if (f.coupon_code && type !== "group") {
    coupon = await lookupCoupon(f.coupon_code);
    if (!coupon) errors.coupon_code = "Coupon not found";
  }

  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const quote = computeQuote({
    type,
    plan: f.plan as PlanId,
    discountPlan: f.discount_plan as DiscountPlanId,
    addons,
    courseLevel: course?.level as string,
    hasCourse: Boolean(course),
    hasGroup: Boolean(group),
    coupon,
  });

  const folder = `signups/${normEmail(f.email).replace(/[^a-z0-9]/g, "_")}`;
  const photo_path = photo && photo.size > 0 ? await saveFile(folder, photo, photo.name) : existing?.photo_path;
  const discount_proof_path =
    f.plan === "discounted" && f.discount_type !== "Artisan"
      ? proof && proof.size > 0 ? await saveFile(folder, proof, proof.name) : existing?.discount_proof_path
      : null;
  const sigBuf = Buffer.from(signature.split(",")[1], "base64");
  const signature_path = await saveFile(folder, new Blob([sigBuf], { type: "image/png" }), "signature.png");

  const record = {
    type,
    plan: type === "membership" ? f.plan : null,
    discount_type: f.plan === "discounted" ? f.discount_type : null,
    discount_plan: f.plan === "discounted" ? f.discount_plan : null,
    discount_proof_link: f.plan === "discounted" && f.discount_type === "Artisan" ? f.discount_proof_link : null,
    discount_proof_path,
    addon_credits: type === "membership" && !!addons.credits,
    addon_adobe: type === "membership" && !!addons.adobe,
    addon_shipping: type === "membership" && !!addons.shipping,
    addon_access24: type === "membership" && !!addons.access24,
    coupon_code: coupon?.code ?? null,
    group_id: group?.id ?? null,
    course_id: course?.id ?? null,
    course_name: course?.name ?? null,
    quote_lines: quote.lines,
    subtotal: quote.subtotal,
    coupon_discount: quote.discount,
    total: quote.total,
    interval: quote.interval,
    first_name: f.first_name,
    last_name: f.last_name,
    preferred_name: f.preferred_name || null,
    email: normEmail(f.email),
    phone: f.phone,
    dob: f.dob,
    photo_path,
    address_line1: f.address_line1,
    address_line2: f.address_line2 || null,
    city: f.city,
    state: f.state,
    postal_code: f.postal_code,
    country: f.country,
    ec_first_name: f.ec_first_name,
    ec_last_name: f.ec_last_name,
    ec_phone: f.ec_phone,
    signature_path,
    signed_at: new Date().toISOString(),
    terms_version: "2026-01",
    signer_ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    status: "submitted",
    integration_status: "Pending",
    integration_error: null,
  };

  const signup = existing
    ? await db.update("signups", existing.id, record)
    : await db.insert("signups", { ...record, resume_token: newToken() });

  try {
    const { redirect } = await runIntegration(signup.id);
    return NextResponse.json({ ok: true, redirect });
  } catch {
    // Record is saved and flagged for staff; tell the person plainly.
    return NextResponse.json(
      { ok: false, errors: { _form: "We saved your sign-up but couldn't start payment. Our team has been notified and will reach out — no need to resubmit." } },
      { status: 502 },
    );
  }
}

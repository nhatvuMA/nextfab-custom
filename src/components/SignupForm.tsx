"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADDONS, DISCOUNT_PLANS, DISCOUNT_TYPES, PLANS, SIGNUP_TYPES, computeQuote, money,
  type AddonId, type Coupon, type DiscountPlanId, type PlanId, type SignupType,
} from "@/lib/pricing";
import { MSG, ageOn, checkFile, validateSignup, type FieldErrors } from "@/lib/validation";
import { DateSelect, Field, PhoneInput } from "./fields";
import SignaturePad from "./SignaturePad";

type Group = { id: string; name: string; code: string; is_subtenant: boolean };
type Course = { id: string; name: string; level: string; start_date: string; price: number };

export type SignupInitial = Record<string, string> & { hasPhoto?: string; hasProof?: string };

const TERMS = `NEXTFAB MEMBERSHIP AGREEMENT (v2026-01)

1. Membership. Membership grants access to NextFab facilities during staffed hours, subject to completing required safety orientation and proficiency checks for each tool.
2. Billing. Recurring memberships renew automatically at the selected interval until cancelled with 30 days' written notice. Annual Contract memberships are a 12-month commitment.
3. Safety. Members must follow all posted safety rules and staff instructions, wear appropriate PPE, and never operate equipment they are not checked out on.
4. Assumption of Risk & Release. Member acknowledges the inherent risks of using tools and machinery and releases NextFab, its staff and agents from liability to the fullest extent permitted by law.
5. Conduct. Members agree to the NextFab Code of Conduct. NextFab may suspend or terminate membership for violations.
6. Media. NextFab may photograph activities in the space for promotional use; members may opt out in writing.
7. Member ID. The photo provided will be printed on your member badge and used for access control.`;

export default function SignupForm({ type, groups, courses, initial = {}, resume }: {
  type: SignupType; groups: Group[]; courses: Course[]; initial?: SignupInitial; resume?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [plan, setPlan] = useState<PlanId | "">((initial.plan as PlanId) ?? "");
  const [discountType, setDiscountType] = useState(initial.discount_type ?? "");
  const [discountPlan, setDiscountPlan] = useState<DiscountPlanId | "">((initial.discount_plan as DiscountPlanId) ?? "");
  const [addons, setAddons] = useState<Record<AddonId, boolean>>({
    credits: initial.addon_credits === "true", adobe: initial.addon_adobe === "true",
    shipping: initial.addon_shipping === "true", access24: initial.addon_access24 === "true",
  });
  const [groupId, setGroupId] = useState(initial.group_id ?? "");
  const [courseId, setCourseId] = useState(initial.course_id ?? "");
  const [couponInput, setCouponInput] = useState(initial.coupon_code ?? "");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [email, setEmail] = useState(initial.email ?? "");
  const [confirmEmail, setConfirmEmail] = useState(initial.email ?? "");
  const [signature, setSignature] = useState("");

  const course = courses.find((c) => c.id === courseId);
  const quote = useMemo(
    () => computeQuote({ type, plan, discountPlan, addons, courseLevel: course?.level, hasCourse: !!course, hasGroup: !!groupId, coupon }),
    [type, plan, discountPlan, addons, course, groupId, coupon],
  );

  const setErr = (k: string, v?: string) => setErrors((e) => { const n = { ...e }; if (v) n[k] = v; else delete n[k]; return n; });

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) { setCoupon(null); setCouponMsg(null); return; }
    setCouponMsg({ ok: true, text: "Checking…" });
    const r = await fetch("/api/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) }).then((r) => r.json());
    if (r.valid) {
      setCoupon(r.coupon);
      setCouponMsg({ ok: true, text: `Coupon Applied — ${r.coupon.percent_off ? `${r.coupon.percent_off}% off` : `${money(r.coupon.amount_off)} off`}` });
      setErr("coupon_code");
    } else {
      setCoupon(null);
      setCouponMsg({ ok: false, text: "Coupon not found" });
    }
  }

  function onFile(name: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      const err = checkFile(f);
      if (err) e.target.value = "";
      setErr(name, err ?? undefined);
    };
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set("signature", signature);
    const fields: Record<string, string> = {};
    fd.forEach((v, k) => { if (typeof v === "string") fields[k] = v; });
    const photo = fd.get("photo") as File | null;
    const proof = fd.get("discount_proof") as File | null;
    const errs = validateSignup(type, fields, {
      photo: (photo?.size ?? 0) > 0 || initial.hasPhoto === "true",
      proof: (proof?.size ?? 0) > 0 || initial.hasProof === "true",
      signature: !!signature,
    });
    if (couponInput.trim() && !coupon) errs.coupon_code = "Apply a valid coupon or clear the field";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!coupon) fd.delete("coupon_code");
    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        if (data.redirect.startsWith("http")) window.location.href = data.redirect;
        else router.push(data.redirect);
        return;
      }
      setErrors(data.errors ?? { _form: "Something went wrong. Please try again." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ _form: "Network error — your entries are still here. Please try again." });
    }
    setSubmitting(false);
  }

  const v = (k: string) => initial[k] ?? "";
  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="type" value={type} />
      {resume && <input type="hidden" name="resume" value={resume} />}

      <div className="bg-white p-5 shadow-sm sm:p-8">
        {errors._form && <div role="alert" className="mb-6 border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">{errors._form}</div>}
        {resume && <div className="mb-6 border-l-4 border-nf-sky bg-nf-mist p-4 text-sm">Welcome back — we&apos;ve restored your saved entries. Please re-sign below to continue.</div>}

        {type === "membership" && (
          <Section n={1} title="Choose your plan" sub="Prices update automatically as you choose.">
            <div id="plan" className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(PLANS) as PlanId[]).map((id) => (
                <label key={id} className={`cursor-pointer border-2 p-4 transition ${plan === id ? "border-nf-sky bg-nf-mist" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="plan" value={id} checked={plan === id} className="sr-only" onChange={() => {
                    setPlan(id); setErr("plan");
                    if (id === "six_month") setAddons((a) => ({ ...a, credits: false }));
                  }} />
                  <span className="block font-medium">{PLANS[id].label}</span>
                  <span className="text-sm text-gray-600">{id === "discounted" ? "$129 or $116 / month with proof of eligibility" : `${money(PLANS[id].price)} / ${PLANS[id].per}`}</span>
                  {PLANS[id].note && <span className="mt-1 block text-xs text-gray-500">{PLANS[id].note}</span>}
                </label>
              ))}
            </div>
            {errors.plan && <p className="nf-err">{errors.plan}</p>}

            {plan === "discounted" && (
              <div className="mt-6 grid gap-5 border-l-4 border-nf-sky bg-nf-mist/60 p-5 sm:grid-cols-2">
                <p className="text-sm text-gray-600 sm:col-span-2">For artisans, current students, recent graduates (up to one year after graduation), educators, military personnel, veterans, seniors and first responders.</p>
                <Field label="Discount type" name="discount_type" required error={errors.discount_type}>
                  <select id="discount_type" name="discount_type" className="nf-input" value={discountType} aria-invalid={!!errors.discount_type} onChange={(e) => { setDiscountType(e.target.value); setErr("discount_type"); }}>
                    <option value="">Select…</option>
                    {DISCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Discounted plan" name="discount_plan" required error={errors.discount_plan}>
                  <select id="discount_plan" name="discount_plan" className="nf-input" value={discountPlan} aria-invalid={!!errors.discount_plan} onChange={(e) => { setDiscountPlan(e.target.value as DiscountPlanId); setErr("discount_plan"); }}>
                    <option value="">Select…</option>
                    {(Object.keys(DISCOUNT_PLANS) as DiscountPlanId[]).map((k) => <option key={k} value={k}>{DISCOUNT_PLANS[k].label} — {money(DISCOUNT_PLANS[k].price)}/month</option>)}
                  </select>
                </Field>
                {discountType === "Artisan" ? (
                  <Field className="sm:col-span-2" label="Website, Instagram or portfolio link" name="discount_proof_link" required error={errors.discount_proof_link}>
                    <input id="discount_proof_link" name="discount_proof_link" className="nf-input" defaultValue={v("discount_proof_link")} placeholder="https://… or @handle" aria-invalid={!!errors.discount_proof_link} />
                  </Field>
                ) : discountType ? (
                  <Field className="sm:col-span-2" label="Proof of eligibility" name="discount_proof" required error={errors.discount_proof} hint={initial.hasProof === "true" ? "A file is already on record — upload only to replace it." : "Student ID, military ID, educator badge, etc. PNG, JPG, GIF or PDF up to 5 MB."}>
                    <input id="discount_proof" name="discount_proof" type="file" accept=".png,.jpg,.jpeg,.gif,.pdf" className="nf-input" onChange={onFile("discount_proof")} />
                  </Field>
                ) : null}
              </div>
            )}

            {plan && (
              <div className="mt-6">
                <h3 className="mb-3 font-medium">Add-ons</h3>
                <div className="divide-y divide-gray-100 border border-gray-200">
                  {(Object.keys(ADDONS) as AddonId[]).filter((id) => !(id === "credits" && plan === "six_month")).map((id) => (
                    <div key={id} className="flex flex-wrap items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ADDONS[id].label} <span className="text-nf-blue">{money(ADDONS[id].price)}/month</span></p>
                        <p className="text-sm text-gray-500">{ADDONS[id].details}</p>
                      </div>
                      <div className="flex overflow-hidden rounded-full border border-gray-300 text-sm">
                        {(["yes", "no"] as const).map((yn) => (
                          <label key={yn} className={`cursor-pointer px-4 py-1.5 ${(addons[id] ? "yes" : "no") === yn ? "bg-nf-blue text-white" : "bg-white"}`}>
                            <input type="radio" className="sr-only" name={`addon_${id}`} value={yn} checked={(addons[id] ? "yes" : "no") === yn} onChange={() => setAddons((a) => ({ ...a, [id]: yn === "yes" }))} />
                            {yn === "yes" ? (id === "access24" ? "Yes, notify me" : "Yes") : "No"}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {plan === "six_month" && <p className="mt-2 text-sm text-gray-500">Credit Bundle isn&apos;t offered with the Six-Month Bundle — $1,200 in credits are already included.</p>}
              </div>
            )}
          </Section>
        )}

        {type === "group" && (
          <Section n={1} title="Your group">
            <Field label="Group ID" name="group_id" required error={errors.group_id}>
              <select id="group_id" name="group_id" className="nf-input" value={groupId} aria-invalid={!!errors.group_id} onChange={(e) => { setGroupId(e.target.value); setErr("group_id"); }}>
                <option value="">Select your group…</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
              </select>
            </Field>
            <p className="mt-4 bg-nf-mist p-4 text-sm leading-6">Group members aren&apos;t charged here — your organization&apos;s terms cover your membership. Adult members with any level of membership can add a junior member aged 10 to 17. <Link href="/join/junior" className="text-nf-blue underline">Learn more about junior memberships</Link>.</p>
          </Section>
        )}

        {type === "maker-series" && (
          <Section n={1} title="Choose your course">
            {courses.length === 0 ? (
              <p className="bg-nf-mist p-4 text-sm">No Maker Series courses are open for registration right now. <Link className="text-nf-blue underline" href="/#contact">Contact us</Link> to join the interest list.</p>
            ) : (
              <div id="course_id" className="grid gap-3">
                {courses.map((c) => (
                  <label key={c.id} className={`flex cursor-pointer items-center justify-between gap-4 border-2 p-4 ${courseId === c.id ? "border-nf-sky bg-nf-mist" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="course_id" value={c.id} className="sr-only" checked={courseId === c.id} onChange={() => { setCourseId(c.id); setErr("course_id"); }} />
                    <span>
                      <span className="block font-medium">{c.name}</span>
                      <span className="text-sm text-gray-500">{c.level} · starts {new Date(c.start_date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </span>
                    <span className="text-lg font-semibold text-nf-blue">{money(c.price)}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.course_id && <p className="nf-err">{errors.course_id}</p>}
          </Section>
        )}

        <Section n={2} title="Member information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="First name" name="first_name" required error={errors.first_name}>
              <input id="first_name" name="first_name" autoComplete="given-name" className="nf-input" defaultValue={v("first_name")} aria-invalid={!!errors.first_name} />
            </Field>
            <Field label="Last name" name="last_name" required error={errors.last_name}>
              <input id="last_name" name="last_name" autoComplete="family-name" className="nf-input" defaultValue={v("last_name")} aria-invalid={!!errors.last_name} />
            </Field>
            <Field label="Preferred name" name="preferred_name">
              <input id="preferred_name" name="preferred_name" className="nf-input" defaultValue={v("preferred_name")} />
            </Field>
            <Field label="Phone" name="phone" required error={errors.phone}>
              <PhoneInput name="phone" defaultValue={v("phone")} invalid={!!errors.phone} />
            </Field>
            <Field label="Email" name="email" required error={errors.email}>
              <input id="email" name="email" type="email" autoComplete="email" className="nf-input" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Confirm email" name="confirm_email" required error={errors.confirm_email}>
              <input id="confirm_email" name="confirm_email" type="email" autoComplete="off" className="nf-input" value={confirmEmail} aria-invalid={!!errors.confirm_email}
                onChange={(e) => { setConfirmEmail(e.target.value); if (errors.confirm_email && e.target.value.trim().toLowerCase() === email.trim().toLowerCase()) setErr("confirm_email"); }}
                onBlur={() => setErr("confirm_email", confirmEmail && confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase() ? MSG.emailMismatch : undefined)}
                onPaste={(e) => e.preventDefault()} />
            </Field>
            <Field label="Date of birth" name="dob" required error={errors.dob} hint="You must be 18 or older. Under 18? See junior memberships.">
              <DateSelect name="dob" defaultValue={v("dob")} invalid={!!errors.dob} minAge={10} maxAge={100}
                onChange={(iso) => setErr("dob", iso && ageOn(iso) < 18 ? MSG.underage : undefined)} />
            </Field>
            <Field label="Member ID photo" name="photo" required error={errors.photo}
              hint={initial.hasPhoto === "true" ? "Photo already on file — upload only to replace it." : "Cropped face photo, shoulders up — not a driver's license. PNG, JPG, GIF or PDF, up to 5 MB."}>
              <input id="photo" name="photo" type="file" accept=".png,.jpg,.jpeg,.gif,.pdf" capture="user" className="nf-input" onChange={onFile("photo")} aria-invalid={!!errors.photo} />
            </Field>
          </div>

          <h3 className="mb-3 mt-8 font-medium">Billing address</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Address line 1" name="address_line1" required error={errors.address_line1}>
              <input id="address_line1" name="address_line1" autoComplete="address-line1" className="nf-input" defaultValue={v("address_line1")} aria-invalid={!!errors.address_line1} />
            </Field>
            <Field className="sm:col-span-2" label="Address line 2" name="address_line2">
              <input id="address_line2" name="address_line2" autoComplete="address-line2" className="nf-input" defaultValue={v("address_line2")} />
            </Field>
            <Field label="City / District" name="city" required error={errors.city}>
              <input id="city" name="city" autoComplete="address-level2" className="nf-input" defaultValue={v("city")} aria-invalid={!!errors.city} />
            </Field>
            <Field label="State / Province" name="state" required error={errors.state}>
              <input id="state" name="state" autoComplete="address-level1" className="nf-input" defaultValue={v("state")} aria-invalid={!!errors.state} />
            </Field>
            <Field label="Postal code" name="postal_code" required error={errors.postal_code}>
              <input id="postal_code" name="postal_code" autoComplete="postal-code" className="nf-input" defaultValue={v("postal_code")} aria-invalid={!!errors.postal_code} />
            </Field>
            <Field label="Country" name="country" required error={errors.country}>
              <input id="country" name="country" autoComplete="country-name" className="nf-input" defaultValue={v("country") || "United States"} aria-invalid={!!errors.country} />
            </Field>
          </div>

          <h3 className="mb-3 mt-8 font-medium">Emergency contact</h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="First name" name="ec_first_name" required error={errors.ec_first_name}>
              <input id="ec_first_name" name="ec_first_name" className="nf-input" defaultValue={v("ec_first_name")} aria-invalid={!!errors.ec_first_name} />
            </Field>
            <Field label="Last name" name="ec_last_name" required error={errors.ec_last_name}>
              <input id="ec_last_name" name="ec_last_name" className="nf-input" defaultValue={v("ec_last_name")} aria-invalid={!!errors.ec_last_name} />
            </Field>
            <Field label="Phone" name="ec_phone" required error={errors.ec_phone}>
              <PhoneInput name="ec_phone" defaultValue={v("ec_phone")} invalid={!!errors.ec_phone} />
            </Field>
          </div>
        </Section>

        <Section n={3} title="Review & sign">
          <label className="nf-label">Terms & Conditions</label>
          <div className="h-48 overflow-y-auto whitespace-pre-line border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700" tabIndex={0}>{TERMS}</div>
          <label id="agree_terms" className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" name="agree_terms" className="mt-0.5 h-4 w-4 accent-nf-blue" onChange={(e) => e.target.checked && setErr("agree_terms")} />
            I have read and agree to the NextFab Membership Agreement.
          </label>
          {errors.agree_terms && <p className="nf-err">{errors.agree_terms}</p>}

          <div id="signature" className="mt-6">
            <label className="nf-label nf-req">Signature</label>
            <SignaturePad onChange={setSignature} invalid={!!errors.signature} />
            {errors.signature && <p className="nf-err">{errors.signature}</p>}
          </div>
        </Section>
      </div>

      {/* Order summary */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="bg-nf-navy p-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest text-nf-ice">{SIGNUP_TYPES[type]} sign-up</p>
          <h3 className="mt-1 text-2xl font-medium">Summary</h3>
          <ul className="mt-5 space-y-2 text-sm">
            {quote.lines.length === 0 && <li className="text-white/50">{type === "group" ? "Select your group" : type === "maker-series" ? "Select a course" : "Select a plan"} to see your total.</li>}
            {quote.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-3"><span className="text-white/80">{l.label}</span><span>{money(l.amount)}</span></li>
            ))}
            {type === "membership" && addons.access24 && plan && <li className="flex justify-between gap-3 text-white/50"><span>24-Hour Access (when eligible)</span><span>$49</span></li>}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between"><dt>Sub Total</dt><dd>{money(quote.subtotal)}</dd></div>
            {quote.discount > 0 && <div className="flex justify-between text-nf-ice"><dt>Coupon</dt><dd>−{money(quote.discount)}</dd></div>}
            <div className="flex items-baseline justify-between pt-2 text-lg font-semibold"><dt>Total Amount</dt><dd className="text-2xl">{money(quote.total)}{quote.interval && quote.interval !== "one-time" && <span className="text-sm font-normal text-white/60"> / {quote.interval}</span>}</dd></div>
          </dl>

          {type !== "group" && (
            <div className="mt-5">
              <label htmlFor="coupon_code" className="text-xs uppercase tracking-widest text-white/60">Coupon</label>
              <div className="mt-1 flex">
                <input id="coupon_code" name="coupon_code" value={couponInput} onChange={(e) => { setCouponInput(e.target.value); setCoupon(null); setCouponMsg(null); }} className="nf-input !rounded-none text-nf-ink" placeholder="Code" />
                <button type="button" onClick={applyCoupon} className="bg-nf-tile px-4 text-sm font-medium hover:bg-nf-sky">Apply</button>
              </div>
              {(couponMsg || errors.coupon_code) && <p className={`mt-1 text-sm ${couponMsg?.ok ? "text-nf-ice" : "text-red-300"}`}>{couponMsg?.text ?? errors.coupon_code}</p>}
            </div>
          )}

          <button type="submit" disabled={submitting} className="nf-btn mt-6 w-full py-3 text-base uppercase tracking-wider">
            {submitting ? "Saving…" : "Continue"}
          </button>
          <p className="mt-3 text-center text-xs text-white/50">{quote.total > 0 ? "You'll confirm payment securely on the next step." : "No payment is due today."}</p>
        </div>
        {Object.keys(errors).length > 0 && !errors._form && (
          <p className="mt-3 bg-red-50 p-3 text-sm text-red-800">Please fix {Object.keys(errors).length} highlighted field{Object.keys(errors).length > 1 ? "s" : ""}.</p>
        )}
      </aside>
    </form>
  );
}

// Defined at module level so React doesn't remount the inputs inside on each render.
function Section({ n, title, children, sub }: { n: number; title: string; children: React.ReactNode; sub?: string }) {
  return (
    <section className="border-t border-gray-200 py-8 first:border-t-0 first:pt-0">
      <h2 className="mb-1 flex items-center gap-3 text-xl font-medium">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-nf-blue text-sm text-white">{n}</span>{title}
      </h2>
      {sub && <p className="mb-5 ml-11 text-sm text-gray-500">{sub}</p>}
      <div className={sub ? "" : "mt-5"}>{children}</div>
    </section>
  );
}

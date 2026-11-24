"use client";
import { useState } from "react";
import { DateSelect, Field, PhoneInput } from "./fields";
import { ageOn, type FieldErrors, validateJunior } from "@/lib/validation";

export default function JuniorForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f: Record<string, string> = {};
    fd.forEach((v, k) => (f[k] = String(v)));
    const errs = validateJunior(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const r = await fetch("/api/junior", { method: "POST", body: fd }).then((r) => r.json());
    setBusy(false);
    if (r.ok) setDone(true);
    else setErrors(r.errors ?? { _form: "Something went wrong" });
  }

  if (done)
    return <div className="mt-10 bg-white p-10 text-center shadow-sm"><h2 className="text-2xl font-medium">Junior member added</h2><p className="mt-2 text-gray-600">We&apos;ll confirm with the parent member by email.</p></div>;

  return (
    <form onSubmit={submit} noValidate className="mt-10 grid gap-5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
      {errors._form && <p className="nf-err sm:col-span-2">{errors._form}</p>}
      <Field className="sm:col-span-2" label="Parent member email" name="parent_email" required error={errors.parent_email} hint="The email on your NextFab membership.">
        <input id="parent_email" name="parent_email" type="email" className="nf-input" aria-invalid={!!errors.parent_email} />
      </Field>
      <Field label="Junior first name" name="first_name" required error={errors.first_name}><input id="first_name" name="first_name" className="nf-input" /></Field>
      <Field label="Junior last name" name="last_name" required error={errors.last_name}><input id="last_name" name="last_name" className="nf-input" /></Field>
      <Field label="Date of birth" name="dob" required error={errors.dob}>
        <DateSelect name="dob" minAge={9} maxAge={18} invalid={!!errors.dob} onChange={(iso) => setErrors((x) => { const n = { ...x }; const a = iso ? ageOn(iso) : NaN; if (iso && (a < 10 || a > 17)) n.dob = "Junior members must be between 10 and 17 years old"; else delete n.dob; return n; })} />
      </Field>
      <Field label="Emergency phone" name="ec_phone" required error={errors.ec_phone}><PhoneInput name="ec_phone" /></Field>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="agree_terms" className="mt-0.5 h-4 w-4 accent-nf-blue" />
        As parent/guardian, I consent to this junior membership and agree to accompany the junior member at all times.
      </label>
      {errors.agree_terms && <p className="nf-err sm:col-span-2">{errors.agree_terms}</p>}
      <button disabled={busy} className="nf-btn py-3 uppercase tracking-wider sm:col-span-2">{busy ? "Saving…" : "Add Junior Member"}</button>
    </form>
  );
}

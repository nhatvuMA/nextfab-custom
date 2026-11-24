"use client";
import { useState } from "react";
import { DateSelect, Field } from "./fields";
import { checkFile, type FieldErrors } from "@/lib/validation";
import { validateAccess24 } from "@/lib/access24";

const AREAS: [string, string][] = [
  ["uses_hazmat", "Hazardous materials (chemicals, solvents, resins)"],
  ["uses_compressed_gas", "Compressed gas (welding, cutting)"],
  ["uses_paint_booth", "Paint booth"],
];

export default function Access24Form() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState<null | { needsCoi: boolean }>(null);
  const [busy, setBusy] = useState(false);
  const [hasCoi, setHasCoi] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const f: Record<string, string> = {};
    fd.forEach((v, k) => { if (typeof v === "string") f[k] = v; });
    const coi = fd.get("coi") as File | null;
    const withCoi = Boolean(coi && coi.size > 0);
    const errs = validateAccess24(f, withCoi);
    const coiErr = withCoi ? checkFile(coi) : null;
    if (coiErr) errs.coi = coiErr;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const r = await fetch("/api/access24", { method: "POST", body: fd }).then((r) => r.json());
      if (r.ok) setDone({ needsCoi: r.needsCoi });
      else setErrors(r.errors ?? { _form: "Something went wrong. Please try again." });
    } catch {
      setErrors({ _form: "We couldn't reach the server. Your entries are still here. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="mt-10 bg-white p-10 text-center shadow-sm">
        <h2 className="text-2xl font-medium">Request received</h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-gray-600">Member Services will contact you to schedule your safety call. Access is turned on once your trainings and onboarding are complete.</p>
        {done.needsCoi && <p className="mx-auto mt-4 max-w-md rounded bg-amber-50 p-3 text-sm text-amber-900">We still need your Certificate of Insurance. Email it to Member Services before your safety call.</p>}
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="mt-10 grid gap-5 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
      {errors._form && <p className="nf-err rounded bg-red-50 p-3 sm:col-span-2" role="alert">{errors._form}</p>}

      <Field className="sm:col-span-2" label="Member email" name="email" required error={errors.email} hint="The email on your NextFab membership.">
        <input id="email" name="email" type="email" autoComplete="email" className="nf-input" aria-invalid={!!errors.email} />
      </Field>
      <Field className="sm:col-span-2" label="Date of birth" name="dob" required error={errors.dob} hint="We use this with your email to confirm it's you.">
        <DateSelect name="dob" minAge={18} maxAge={100} invalid={!!errors.dob} />
      </Field>

      <Field className="sm:col-span-2" label="What will you work on after hours?" name="reason" required error={errors.reason}>
        <textarea id="reason" name="reason" rows={4} maxLength={2000} className="nf-input" aria-invalid={!!errors.reason} placeholder="Projects, shops and machines you plan to use" />
      </Field>

      <fieldset className="sm:col-span-2">
        <legend className="nf-label">Will you use any of these after hours?</legend>
        <p className="mb-2 text-xs text-gray-500">Each one needs its own safety training before access is approved.</p>
        <div className="space-y-2">
          {AREAS.map(([name, label]) => (
            <label key={name} className="flex items-start gap-3 text-sm"><input type="checkbox" name={name} className="mt-0.5 h-4 w-4 accent-nf-blue" />{label}</label>
          ))}
        </div>
      </fieldset>

      <Field label="Certificate of Insurance" name="coi" error={errors.coi} hint="PNG, JPG, GIF or PDF, up to 5 MB. You can also send it later.">
        <input id="coi" name="coi" type="file" accept=".png,.jpg,.jpeg,.gif,.pdf" className="nf-input" onChange={(e) => setHasCoi(Boolean(e.target.files?.length))} />
      </Field>
      <Field label="COI end date" name="coi_end_date" required={hasCoi} error={errors.coi_end_date}>
        <input id="coi_end_date" name="coi_end_date" type="date" className="nf-input" disabled={!hasCoi} aria-invalid={!!errors.coi_end_date} />
      </Field>

      <div className="rounded bg-nf-mist p-4 text-sm leading-6 text-gray-700 sm:col-span-2">
        <p className="font-medium">24-hour access rules</p>
        <ul className="mt-1 list-disc pl-5">
          <li>Access starts only after Member Services approves it. It costs $49/month and isn&apos;t billed until then.</li>
          <li>Keep a current Certificate of Insurance on file. Access stops when it ends.</li>
          <li>Never work alone on equipment you haven&apos;t been checked out on.</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">Placeholder text. NextFab to supply the final rules.</p>
      </div>
      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" name="agree_rules" className="mt-0.5 h-4 w-4 accent-nf-blue" />
        I have read and agree to the 24-hour access rules.
      </label>
      {errors.agree_rules && <p className="nf-err sm:col-span-2">{errors.agree_rules}</p>}

      <button disabled={busy} className="nf-btn py-3 uppercase tracking-wider sm:col-span-2">{busy ? "Sending…" : "Request 24-Hour Access"}</button>
    </form>
  );
}

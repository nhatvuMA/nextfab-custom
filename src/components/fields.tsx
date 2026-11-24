"use client";
import { useState } from "react";

export const COUNTRY_CODES = [
  ["+1", "US/CA"], ["+44", "UK"], ["+52", "MX"], ["+61", "AU"], ["+33", "FR"], ["+49", "DE"], ["+91", "IN"],
  ["+86", "CN"], ["+81", "JP"], ["+82", "KR"], ["+55", "BR"], ["+234", "NG"], ["+63", "PH"], ["+84", "VN"],
];

export function Field({ label, name, error, required, children, hint, className = "" }: {
  label: string; name: string; error?: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className={`nf-label ${required ? "nf-req" : ""}`}>{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="nf-err" id={`${name}-err`} role="alert">{error}</p>}
    </div>
  );
}

/** Country-code selector + number; emits "+1 2155550123" to a hidden input named `name`. */
export function PhoneInput({ name, defaultValue = "", invalid, onBlur }: { name: string; defaultValue?: string; invalid?: boolean; onBlur?: () => void }) {
  const m = defaultValue.match(/^(\+\d{1,3})\s*(.*)$/);
  const [code, setCode] = useState(m?.[1] ?? "+1");
  const [num, setNum] = useState(m?.[2] ?? defaultValue);
  return (
    <div className="flex">
      <select aria-label="Country code" className="nf-input !w-28 shrink-0 border-r-0" value={code} onChange={(e) => setCode(e.target.value)}>
        {COUNTRY_CODES.map(([c, l]) => <option key={c} value={c}>{c} {l}</option>)}
      </select>
      <input id={name} className="nf-input" inputMode="tel" autoComplete="tel-national" aria-invalid={invalid} value={num} onChange={(e) => setNum(e.target.value)} onBlur={onBlur} placeholder="(215) 555-0123" />
      <input type="hidden" name={name} value={num ? `${code} ${num}` : ""} />
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Month / Day / Year dropdowns (as on the current form) → hidden ISO date. */
export function DateSelect({ name, defaultValue = "", invalid, onChange, minAge = 0, maxAge = 100 }: {
  name: string; defaultValue?: string; invalid?: boolean; onChange?: (iso: string) => void; minAge?: number; maxAge?: number;
}) {
  const [y0, m0, d0] = defaultValue ? defaultValue.split("-") : ["", "", ""];
  const [y, setY] = useState(y0);
  const [m, setM] = useState(m0);
  const [d, setD] = useState(d0);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: maxAge - minAge + 1 }, (_, i) => String(thisYear - minAge - i));
  const daysIn = y && m ? new Date(Number(y), Number(m), 0).getDate() : 31;
  const iso = y && m && d && Number(d) <= daysIn ? `${y}-${m}-${d}` : "";
  const set = (fn: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    fn(e.target.value);
    const next = { y, m, d, [e.target.dataset.part!]: e.target.value };
    const dim = next.y && next.m ? new Date(Number(next.y), Number(next.m), 0).getDate() : 31;
    onChange?.(next.y && next.m && next.d && Number(next.d) <= dim ? `${next.y}-${next.m}-${next.d}` : "");
  };
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1.1fr] gap-2">
      <select id={name} data-part="m" aria-label="Month" className="nf-input" aria-invalid={invalid} value={m} onChange={set(setM)}>
        <option value="">Month</option>
        {MONTHS.map((mn, i) => <option key={mn} value={String(i + 1).padStart(2, "0")}>{mn}</option>)}
      </select>
      <select data-part="d" aria-label="Day" className="nf-input" aria-invalid={invalid} value={d} onChange={set(setD)}>
        <option value="">Day</option>
        {Array.from({ length: daysIn }, (_, i) => String(i + 1).padStart(2, "0")).map((v) => <option key={v} value={v}>{Number(v)}</option>)}
      </select>
      <select data-part="y" aria-label="Year" className="nf-input" aria-invalid={invalid} value={y} onChange={set(setY)}>
        <option value="">Year</option>
        {years.map((v) => <option key={v}>{v}</option>)}
      </select>
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}

// Schema-driven create/edit form used by Leads and Members.
export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "date" | "datetime-local" | "select" | "textarea" | "tel" | "url" | "number";
  options?: readonly string[] | { value: string; label: string }[];
  required?: boolean;
  span?: 2;
};
export type SectionDef = { title: string; note?: string; fields: FieldDef[] };

export default function RecordForm({ sections, values = {}, action, submitLabel, error }: {
  sections: SectionDef[];
  values?: Record<string, unknown>;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {error && <p className="rounded border-l-4 border-red-500 bg-red-50 p-3 text-red-800">{error}</p>}
      {sections.map((s) => (
        <section key={s.title} className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{s.title}</h2>
          {s.note && <p className="mt-1 text-xs text-gray-400">{s.note}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.fields.map((f) => {
              const v = values[f.name];
              const dv = v === null || v === undefined ? "" : f.type === "datetime-local" ? String(v).slice(0, 16) : String(v);
              const cls = "nf-input !py-2 text-sm";
              return (
                <div key={f.name} className={f.span === 2 || f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
                  <label htmlFor={f.name} className={`mb-1 block text-xs font-medium text-gray-600 ${f.required ? "nf-req" : ""}`}>{f.label}</label>
                  {f.type === "select" ? (
                    <select id={f.name} name={f.name} defaultValue={dv} required={f.required} className={cls}>
                      <option value="">—</option>
                      {f.options!.map((o) => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea id={f.name} name={f.name} defaultValue={dv} rows={3} className={cls} />
                  ) : (
                    <input id={f.name} name={f.name} type={f.type ?? "text"} defaultValue={dv} required={f.required} className={cls} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="sticky bottom-0 -mx-1 flex justify-end gap-3 bg-[#f4f6f8]/90 px-1 py-3 backdrop-blur">
        <button className="nf-btn">{submitLabel}</button>
      </div>
    </form>
  );
}

export function formValues(fd: FormData, sections: SectionDef[]) {
  const out: Record<string, string | null> = {};
  for (const s of sections) for (const f of s.fields) {
    const v = String(fd.get(f.name) ?? "").trim();
    out[f.name] = v === "" ? null : f.type === "email" ? v.toLowerCase() : v;
  }
  return out;
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, fileUrl, saveFile } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { checkFile } from "@/lib/validation";
import { ACCESS24_PRICE, isOpen, requirements, today } from "@/lib/access24";
import { Badge, Card, DL, PageHead, fmtDate, fmtDateTime, statusTone } from "@/components/admin/ui";

const STAGES = ["Requested", "Safety Call Scheduled", "In Onboarding"];
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const back = (id: string, q: string): never => redirect(`/admin/access24/${id}?${q}`);

// Every action re-checks the staff session and that the request is still open.
async function guard(id: string) {
  if (!(await isAdmin())) redirect("/admin/login");
  const r = await db.get("access24_requests", id);
  if (!r || !isOpen(r)) back(id, `e=${encodeURIComponent("This request is closed.")}`);
  return r!;
}

export default async function Access24Detail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const req = await db.get("access24_requests", id);
  if (!req) notFound();
  const member = await db.get("members", String(req.member_id));
  if (!member) notFound();
  const [calls, coi] = await Promise.all([
    db.list("access24_safety_calls", { eq: { request_id: id }, order: "called_at", ascending: true }),
    fileUrl(req.coi_path),
  ]);
  const reqs = requirements(req, member, calls);
  const ready = reqs.every((r) => r.done);
  const open = isOpen(req);

  async function setStage(fd: FormData) {
    "use server";
    const r = await guard(id);
    const s = str(fd, "status");
    if (!STAGES.includes(s)) back(id, "e=Unknown+status");
    await db.update("access24_requests", id, { status: s });
    await db.update("members", String(r.member_id), { access24_status: s === "Requested" ? "Requested" : "In Onboarding" });
    back(id, "ok=Status+updated");
  }

  async function addCall(fd: FormData) {
    "use server";
    const r = await guard(id);
    const staff = str(fd, "staff_person"), at = str(fd, "called_at");
    if (!staff || !at) back(id, "e=Staff+person+and+call+time+are+required");
    await db.insert("access24_safety_calls", { request_id: id, member_id: r.member_id, staff_person: staff, called_at: new Date(at).toISOString(), eoc_decision_details: str(fd, "eoc_decision_details") || null });
    // A logged call moves the request into onboarding.
    if (r.status !== "In Onboarding") {
      await db.update("access24_requests", id, { status: "In Onboarding" });
      await db.update("members", String(r.member_id), { access24_status: "In Onboarding" });
    }
    back(id, "ok=Safety+call+logged");
  }

  async function saveOnboarding(fd: FormData) {
    "use server";
    const r = await guard(id);
    const coiFile = fd.get("coi") as File | null;
    const patch: Record<string, unknown> = { eoc_rating: str(fd, "eoc_rating") || null, coi_end_date: str(fd, "coi_end_date") || null };
    if (coiFile && coiFile.size > 0) {
      const err = checkFile(coiFile);
      if (err) back(id, `e=${encodeURIComponent(err)}`);
      patch.coi_path = await saveFile(`access24/${r.member_id}`, coiFile, coiFile.name);
    }
    await db.update("access24_requests", id, patch);
    await db.update("members", String(r.member_id), {
      hazmat_training_date: str(fd, "hazmat_training_date") || null,
      compressed_gas_training_date: str(fd, "compressed_gas_training_date") || null,
      paint_booth_training_date: str(fd, "paint_booth_training_date") || null,
      access24_onboarding_date: str(fd, "access24_onboarding_date") || null,
    });
    back(id, "ok=Onboarding+saved");
  }

  async function approve(fd: FormData) {
    "use server";
    const r = await guard(id);
    const m = await db.get("members", String(r.member_id));
    const c = await db.list("access24_safety_calls", { eq: { request_id: id } });
    const missing = requirements(r, m!, c).filter((x) => !x.done);
    if (missing.length) back(id, `e=${encodeURIComponent(`Can't approve yet. Missing: ${missing.map((x) => x.label).join(", ")}`)}`);
    const by = str(fd, "decided_by") || "Staff";
    await db.update("access24_requests", id, { status: "Approved", decided_by: by, decided_at: new Date().toISOString(), decision_notes: str(fd, "decision_notes") || null });
    await db.update("members", String(r.member_id), { access24_status: "Approved", access24_response_date: today(), coi_end_date: r.coi_end_date, eoc_rating: r.eoc_rating });
    back(id, "ok=Approved");
  }

  async function close(fd: FormData) {
    "use server";
    const r = await guard(id);
    const outcome = str(fd, "outcome");
    const notes = str(fd, "decision_notes");
    if (!["Denied", "Withdrawn"].includes(outcome)) back(id, "e=Unknown+outcome");
    if (outcome === "Denied" && !notes) back(id, "e=Add+a+reason+before+denying");
    await db.update("access24_requests", id, { status: outcome, decided_by: str(fd, "decided_by") || "Staff", decided_at: new Date().toISOString(), decision_notes: notes || null });
    await db.update("members", String(r.member_id), { access24_status: outcome === "Denied" ? "Denied" : "Not Requested", access24_response_date: outcome === "Denied" ? today() : null });
    back(id, `ok=${outcome}`);
  }

  const trainings: [string, string, boolean][] = [
    ["hazmat_training_date", "Hazardous Materials training", Boolean(req.uses_hazmat)],
    ["compressed_gas_training_date", "Compressed Gas training", Boolean(req.uses_compressed_gas)],
    ["paint_booth_training_date", "Paint Booth Safety training", Boolean(req.uses_paint_booth)],
  ];
  const v = (x: unknown) => (x ? String(x).slice(0, 10) : "");

  return (
    <>
      <PageHead
        title={`24-hour access · ${member.first_name} ${member.last_name ?? ""}`}
        sub={`Requested ${fmtDateTime(req.created_at)}`}
        action={<Badge tone={statusTone(req.status)}>{String(req.status)}</Badge>}
      />
      {sp.ok && <p className="mb-4 rounded bg-emerald-50 p-3 text-emerald-800">{sp.ok}.</p>}
      {sp.e && <p className="mb-4 rounded bg-red-50 p-3 text-red-800" role="alert">{sp.e}</p>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Request">
            <DL items={[
              ["Member", <Link key="m" className="text-nf-blue underline" href={`/admin/members/${member.id}`}>{String(member.first_name)} {String(member.last_name ?? "")}</Link>],
              ["Email", String(member.email ?? "")],
              ["Membership", `${member.membership_type ?? "—"} · ${member.membership_status ?? "—"}`],
              ["Will use", [req.uses_hazmat && "Hazardous materials", req.uses_compressed_gas && "Compressed gas", req.uses_paint_booth && "Paint booth"].filter(Boolean).join(", ") || "None of the controlled areas"],
              ["Certificate of Insurance", coi ? <a key="c" href={coi} target="_blank" className="text-nf-blue underline">Open file</a> : "Not uploaded"],
              ["Agreed to rules", req.agreed_rules_at ? `${fmtDateTime(req.agreed_rules_at)} · v${req.rules_version}` : "—"],
            ]} />
            <p className="mt-4 text-xs uppercase tracking-wider text-gray-400">What they&apos;ll work on</p>
            <p className="mt-1 whitespace-pre-wrap">{String(req.reason ?? "")}</p>
          </Card>

          <Card title="Onboarding record">
            <form action={saveOnboarding} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm"><span className="nf-label">EOC rating</span><input name="eoc_rating" defaultValue={String(req.eoc_rating ?? "")} disabled={!open} className="nf-input" /></label>
              <label className="text-sm"><span className="nf-label">COI end date</span><input type="date" name="coi_end_date" defaultValue={v(req.coi_end_date)} disabled={!open} className="nf-input" /></label>
              {trainings.map(([name, label, needed]) => (
                <label key={name} className="text-sm"><span className="nf-label">{label}{needed ? " *" : <span className="font-normal text-gray-400"> (not needed)</span>}</span><input type="date" name={name} defaultValue={v(member[name])} disabled={!open} className="nf-input" /></label>
              ))}
              <label className="text-sm"><span className="nf-label">24-hour access onboarding completed *</span><input type="date" name="access24_onboarding_date" defaultValue={v(member.access24_onboarding_date)} disabled={!open} className="nf-input" /></label>
              <label className="text-sm sm:col-span-2"><span className="nf-label">{req.coi_path ? "Replace" : "Upload"} Certificate of Insurance</span><input type="file" name="coi" accept=".png,.jpg,.jpeg,.gif,.pdf" disabled={!open} className="nf-input" /></label>
              {open && <button className="nf-btn text-sm sm:col-span-2">Save onboarding record</button>}
            </form>
            <p className="mt-3 text-xs text-gray-400">Training and onboarding dates are saved to the member record.</p>
          </Card>

          <Card title="Safety call fulfilment">
            <ul className="mb-4 space-y-3 text-sm">
              {calls.map((c) => (
                <li key={c.id} className="border-l-2 border-nf-sky pl-3">
                  <p className="font-medium">{fmtDateTime(c.called_at)} · {String(c.staff_person)}</p>
                  {Boolean(c.eoc_decision_details) && <p className="whitespace-pre-wrap text-gray-600">{String(c.eoc_decision_details)}</p>}
                </li>
              ))}
              {!calls.length && <li className="text-gray-400">No safety calls logged.</li>}
            </ul>
            {open && (
              <form action={addCall} className="grid gap-2 sm:grid-cols-2">
                <input name="staff_person" placeholder="Staff person" className="nf-input !py-1.5 text-sm" required />
                <input type="datetime-local" name="called_at" className="nf-input !py-1.5 text-sm" required />
                <textarea name="eoc_decision_details" placeholder="EOC decision details" rows={2} className="nf-input text-sm sm:col-span-2" />
                <button className="rounded border border-gray-300 py-1.5 text-sm sm:col-span-2">+ Add row</button>
              </form>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Approval checklist">
            <ul className="space-y-2 text-sm">
              {reqs.map((r) => (
                <li key={r.key} className="flex items-start gap-2">
                  <span aria-hidden className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${r.done ? "bg-emerald-600" : "bg-gray-300"}`}>{r.done ? "✓" : ""}</span>
                  <span className={r.done ? "" : "text-gray-600"}>{r.label}{r.detail && <span className="block text-xs text-gray-400">{r.detail}</span>}</span>
                  <span className="sr-only">{r.done ? "done" : "not done"}</span>
                </li>
              ))}
            </ul>
          </Card>

          {open ? (
            <>
              <Card title="Stage">
                <form action={setStage} className="flex gap-2">
                  <select name="status" defaultValue={String(req.status)} className="nf-input !py-1.5 text-sm">{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
                  <button className="rounded border border-gray-300 px-3 text-sm">Set</button>
                </form>
              </Card>
              <Card title="Decision">
                <form action={approve} className="space-y-2">
                  <input name="decided_by" placeholder="Your name" className="nf-input !py-1.5 text-sm" />
                  <textarea name="decision_notes" placeholder="Notes (optional)" rows={2} className="nf-input text-sm" />
                  <button disabled={!ready} className="nf-btn w-full text-sm disabled:cursor-not-allowed disabled:opacity-40">Approve 24-hour access</button>
                  {!ready && <p className="text-xs text-gray-500">Complete every checklist item to approve.</p>}
                  {ready && <p className="text-xs text-gray-500">Billing (${ACCESS24_PRICE}/month) isn&apos;t automatic yet. Add it in Stripe after approving.</p>}
                </form>
                <form action={close} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                  <input name="decided_by" placeholder="Your name" className="nf-input !py-1.5 text-sm" />
                  <textarea name="decision_notes" placeholder="Reason (required to deny)" rows={2} className="nf-input text-sm" />
                  <div className="flex gap-2">
                    <button name="outcome" value="Denied" className="flex-1 rounded border border-red-300 py-1.5 text-sm text-red-700">Deny</button>
                    <button name="outcome" value="Withdrawn" className="flex-1 rounded border border-gray-300 py-1.5 text-sm">Mark withdrawn</button>
                  </div>
                </form>
              </Card>
            </>
          ) : (
            <Card title="Decision">
              <DL items={[["Outcome", <Badge key="o" tone={statusTone(req.status)}>{String(req.status)}</Badge>], ["By", String(req.decided_by ?? "")], ["When", fmtDate(req.decided_at)], ["Notes", String(req.decision_notes ?? "")]]} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

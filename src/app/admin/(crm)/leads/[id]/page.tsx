import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, DuplicateError } from "@/lib/store";
import { LEAD_SECTIONS } from "@/lib/schemas";
import { convertLead, logLeadStatus } from "@/lib/crm";
import RecordForm, { formValues } from "@/components/admin/RecordForm";
import { Badge, Card, PageHead, fmtDateTime, statusTone } from "@/components/admin/ui";

export default async function LeadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; dup?: string; conflict?: string; saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const lead = await db.get("leads", id);
  if (!lead) notFound();
  const [visits, history] = await Promise.all([
    db.list("lead_visits", { eq: { lead_id: id }, order: "visited_at" }),
    db.list("lead_status_history", { eq: { lead_id: id }, order: "created_at", ascending: true }),
  ]);
  const conflict = sp.conflict ? await db.get("members", sp.conflict) : null;

  async function save(fd: FormData) {
    "use server";
    const v = formValues(fd, LEAD_SECTIONS);
    if (!v.first_name) redirect(`/admin/leads/${id}?e=First+Name+is+required`);
    try {
      const before = await db.get("leads", id);
      const after = await db.update("leads", id, v);
      if (before?.lead_status !== after.lead_status) await logLeadStatus(after);
    } catch (err) {
      if (err instanceof DuplicateError) redirect(`/admin/leads/${id}?e=Another+lead+already+uses+that+email`);
      throw err;
    }
    redirect(`/admin/leads/${id}?saved=1`);
  }
  async function addVisit(fd: FormData) {
    "use server";
    const at = String(fd.get("visited_at") ?? "");
    if (at) await db.insert("lead_visits", { lead_id: id, visited_at: at, host_member: String(fd.get("host_member") ?? "") || null });
    redirect(`/admin/leads/${id}`);
  }
  async function convert(fd: FormData) {
    "use server";
    const merge = String(fd.get("merge_into") ?? "") || undefined;
    let memberId: string;
    try {
      memberId = (await convertLead(id, { mergeInto: merge })).id;
    } catch (err) {
      if (err instanceof DuplicateError) redirect(`/admin/leads/${id}?conflict=${err.message}`);
      redirect(`/admin/leads/${id}?e=${encodeURIComponent((err as Error).message)}`);
    }
    redirect(`/admin/members/${memberId}?converted=1`);
  }

  const durations = history.map((h, i) => {
    const end = history[i + 1]?.created_at ?? new Date().toISOString();
    return Math.max(0, Math.round((+new Date(String(end)) - +new Date(String(h.created_at))) / 86400000));
  });

  return (
    <>
      <PageHead
        title={`${lead.first_name} ${lead.last_name ?? ""}`}
        sub={lead.converted_at ? "Converted lead" : `Lead · ${lead.lead_source ?? "unknown source"}`}
        action={
          lead.converted_at ? (
            <Link href={`/admin/members/${lead.converted_member_id}`} className="nf-btn text-sm">Open member →</Link>
          ) : (
            <form action={convert}><button className="nf-btn text-sm">Convert to Member</button></form>
          )
        }
      />
      {sp.saved && <p className="mb-4 rounded bg-emerald-50 p-3 text-emerald-800">Saved.</p>}
      {sp.dup && <p className="mb-4 rounded bg-amber-50 p-3 text-amber-800">A lead with that email already existed — you&apos;re looking at it.</p>}
      {lead.lead_status !== "Qualified" && !lead.converted_at && <p className="mb-4 text-sm text-gray-500">Tip: leads are usually converted once Lead Status is <b>Qualified</b> and the Membership Agreement is signed.</p>}
      {conflict && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">Possible duplicate: a Member already uses {String(conflict.email)}.</p>
          <p className="text-sm text-amber-800">{String(conflict.first_name)} {String(conflict.last_name ?? "")} · {String(conflict.membership_status ?? "")} · <Link className="underline" href={`/admin/members/${conflict.id}`}>view</Link></p>
          <form action={convert} className="mt-3"><input type="hidden" name="merge_into" value={conflict.id} /><button className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white">Merge lead into this member &amp; convert</button></form>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <RecordForm sections={LEAD_SECTIONS} values={lead} action={save} submitLabel="Save Lead" error={sp.e} />
        <div className="space-y-6">
          <Card title="Visit history">
            <ul className="mb-4 space-y-2 text-sm">
              {visits.map((v) => <li key={v.id}>{fmtDateTime(v.visited_at)}{v.host_member ? ` · hosted by ${v.host_member}` : ""}</li>)}
              {!visits.length && <li className="text-gray-400">No visits logged.</li>}
            </ul>
            <form action={addVisit} className="space-y-2">
              <input type="datetime-local" name="visited_at" className="nf-input !py-1.5 text-sm" required />
              <input name="host_member" placeholder="Host member" className="nf-input !py-1.5 text-sm" />
              <button className="w-full rounded border border-gray-300 py-1.5 text-sm">+ Add row</button>
            </form>
          </Card>
          <Card title="Lead status history">
            <ol className="space-y-3 text-sm">
              {history.map((h, i) => (
                <li key={h.id} className="flex items-start justify-between gap-2">
                  <span><Badge tone={statusTone(h.status)}>{String(h.status)}</Badge><span className="mt-0.5 block text-xs text-gray-400">{fmtDateTime(h.created_at)} · {String(h.changed_by ?? "")}</span></span>
                  <span className="text-xs text-gray-500">{durations[i]}d</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

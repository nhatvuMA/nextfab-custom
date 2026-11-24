import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, fileUrl, DuplicateError } from "@/lib/store";
import { memberSections } from "@/lib/schemas";
import { sortedGroups } from "@/lib/courses";
import { money } from "@/lib/pricing";
import RecordForm, { formValues } from "@/components/admin/RecordForm";
import { Badge, Card, DL, PageHead, fmtDate, fmtDateTime, statusTone } from "@/components/admin/ui";

export default async function MemberDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string; saved?: string; converted?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const m = await db.get("members", id);
  if (!m) notFound();
  const sections = memberSections(await sortedGroups());
  const [signups, history, juniors, photo, access24] = await Promise.all([
    db.list("signups", { eq: { member_id: id } }),
    db.list("lead_status_history", { eq: { member_id: id }, order: "created_at", ascending: true }),
    db.list("junior_members", { eq: { parent_member_id: id } }),
    fileUrl(m.photo_path),
    db.list("access24_requests", { eq: { member_id: id } }),
  ]);

  async function save(fd: FormData) {
    "use server";
    const v = formValues(fd, sections);
    if (!v.first_name || !v.email) redirect(`/admin/members/${id}?e=First+Name+and+Email+are+required`);
    try {
      await db.update("members", id, v);
    } catch (err) {
      if (err instanceof DuplicateError) redirect(`/admin/members/${id}?e=Another+member+already+uses+that+email`);
      throw err;
    }
    redirect(`/admin/members/${id}?saved=1`);
  }

  return (
    <>
      <PageHead title={`${m.first_name} ${m.last_name ?? ""}`} sub={String(m.email ?? "")} action={<Badge tone={statusTone(m.membership_status)}>{String(m.membership_status ?? "—")}</Badge>} />
      {sp.saved && <p className="mb-4 rounded bg-emerald-50 p-3 text-emerald-800">Saved.</p>}
      {sp.converted && <p className="mb-4 rounded bg-sky-50 p-3 text-sky-800">Lead converted. Lead history has been carried over.</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <RecordForm sections={sections} values={m} action={save} submitLabel="Save Member" error={sp.e} />
        <div className="space-y-6">
          <Card title="Member photo">
                        {photo && !String(m.photo_path).endsWith(".pdf") ? <img src={photo} alt="" className="max-h-56 rounded" /> : <p className="text-gray-400">{photo ? <a href={photo} className="text-nf-blue underline">PDF</a> : "No photo"}</p>}
          </Card>
          <Card title="Lead history">
            <DL items={[["Lead source", m.lead_source as string], ["Lead date", fmtDate(m.lead_date)], ["Referred by", m.referred_by as string], ["Tour guide", m.tour_guide as string], ["Tour date", fmtDate(m.tour_date)]]} />
            {m.converted_from_lead_id ? <Link className="mt-3 block text-sm text-nf-blue underline" href={`/admin/leads/${m.converted_from_lead_id}`}>Original lead →</Link> : <p className="mt-3 text-xs text-gray-400">Created directly (no prior lead).</p>}
          </Card>
          {history.length > 0 && (
            <Card title="Leads status history">
              <ol className="space-y-2 text-sm">{history.map((h) => <li key={h.id}><Badge tone={statusTone(h.status)}>{String(h.status)}</Badge> <span className="text-xs text-gray-400">{fmtDateTime(h.created_at)}</span></li>)}</ol>
            </Card>
          )}
          <Card title="Sign-ups & payments">
            <ul className="space-y-2 text-sm">
              {signups.map((s) => (
                <li key={s.id} className="flex justify-between gap-2"><Link className="text-nf-blue" href={`/admin/signups/${s.id}`}>{fmtDate(s.created_at)} · {String(s.type)}</Link><span>{money(Number(s.total ?? 0))} <Badge tone={statusTone(s.status)}>{String(s.status).replace("_", " ")}</Badge></span></li>
              ))}
              {!signups.length && <li className="text-gray-400">None</li>}
            </ul>
            {Boolean(m.stripe_customer_id) && <p className="mt-3 text-xs text-gray-400">Stripe: {String(m.stripe_customer_id)}</p>}
          </Card>
          <Card title="24-hour access requests">
            <ul className="space-y-2 text-sm">
              {access24.map((r) => <li key={r.id} className="flex justify-between gap-2"><Link className="text-nf-blue" href={`/admin/access24/${r.id}`}>{fmtDate(r.created_at)}</Link><Badge tone={statusTone(r.status)}>{String(r.status)}</Badge></li>)}
              {!access24.length && <li className="text-gray-400">None</li>}
            </ul>
          </Card>
          {juniors.length > 0 && (
            <Card title="Junior members">
              <ul className="text-sm">{juniors.map((j) => <li key={j.id}>{String(j.first_name)} {String(j.last_name)} · {fmtDate(j.dob)} <Badge tone={statusTone(j.status)}>{String(j.status)}</Badge></li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

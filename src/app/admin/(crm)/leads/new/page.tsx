import { redirect } from "next/navigation";
import { db, DuplicateError } from "@/lib/store";
import { LEAD_SECTIONS } from "@/lib/schemas";
import { logLeadStatus } from "@/lib/crm";
import RecordForm, { formValues } from "@/components/admin/RecordForm";
import { PageHead } from "@/components/admin/ui";

export default async function NewLead({ searchParams }: { searchParams: Promise<{ e?: string; m?: string }> }) {
  const { e, m } = await searchParams;
  async function create(fd: FormData) {
    "use server";
    const v = formValues(fd, LEAD_SECTIONS);
    if (!v.first_name) redirect("/admin/leads/new?e=First+Name+is+required");
    if (v.email) {
      const member = await db.findOne("members", { email: v.email });
      if (member) redirect(`/admin/leads/new?e=${encodeURIComponent(`${v.email} is already a Member.`)}&m=${member.id}`);
    }
    let lead;
    try {
      lead = await db.insert("leads", { lead_status: "New", lead_date: new Date().toISOString().slice(0, 10), ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null)) });
    } catch (err) {
      if (err instanceof DuplicateError) {
        const ex = await db.findOne("leads", { email: v.email });
        redirect(`/admin/leads/${ex?.id}?dup=1`);
      }
      throw err;
    }
    await logLeadStatus(lead);
    redirect(`/admin/leads/${lead.id}`);
  }
  return (
    <>
      <PageHead title="Create Lead" />
      {m && <p className="mb-4 text-sm"><a className="text-nf-blue underline" href={`/admin/members/${m}`}>Open the existing member →</a></p>}
      <RecordForm sections={LEAD_SECTIONS} action={create} submitLabel="Save Lead" error={e} values={{ lead_owner: "Member Services", lead_status: "New" }} />
    </>
  );
}

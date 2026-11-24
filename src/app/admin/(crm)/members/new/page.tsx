import Link from "next/link";
import { redirect } from "next/navigation";
import { db, DuplicateError } from "@/lib/store";
import { memberSections } from "@/lib/schemas";
import { sortedGroups } from "@/lib/courses";
import RecordForm, { formValues } from "@/components/admin/RecordForm";
import { PageHead } from "@/components/admin/ui";

export default async function NewMember({ searchParams }: { searchParams: Promise<{ e?: string; lead?: string; member?: string }> }) {
  const sp = await searchParams;
  const sections = memberSections(await sortedGroups());
  async function create(fd: FormData) {
    "use server";
    const v = formValues(fd, sections);
    if (!v.first_name || !v.email) redirect("/admin/members/new?e=First+Name+and+Email+are+required");
    // Check Leads first so their history isn't lost by creating a duplicate Member.
    const lead = await db.findOne("leads", { email: v.email });
    if (lead && !lead.converted_at) redirect(`/admin/members/new?e=${encodeURIComponent("This email belongs to an open Lead — convert it instead so lead history is kept.")}&lead=${lead.id}`);
    let m;
    try {
      m = await db.insert("members", Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null)));
    } catch (err) {
      if (err instanceof DuplicateError) {
        const ex = await db.findOne("members", { email: v.email });
        redirect(`/admin/members/new?e=${encodeURIComponent("A member with this email already exists.")}&member=${ex?.id}`);
      }
      throw err;
    }
    redirect(`/admin/members/${m.id}`);
  }
  return (
    <>
      <PageHead title="Create Member" sub="Walk-ins and hand-entered sign-ups. Leave 24-Hour Access and NFAS blank until onboarding." />
      {sp.lead && <p className="mb-4 text-sm"><Link className="text-nf-blue underline" href={`/admin/leads/${sp.lead}`}>Open the lead and convert it →</Link></p>}
      {sp.member && <p className="mb-4 text-sm"><Link className="text-nf-blue underline" href={`/admin/members/${sp.member}`}>Open the existing member →</Link></p>}
      <RecordForm sections={sections} action={create} submitLabel="Save Member" error={sp.e} values={{ membership_status: "Unpaid", member_owner: "Member Services" }} />
    </>
  );
}

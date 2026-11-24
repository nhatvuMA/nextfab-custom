import SiteHeader from "@/components/SiteHeader";
import SignupForm, { type SignupInitial } from "@/components/SignupForm";
import { parseSignupType, SIGNUP_TYPES } from "@/lib/pricing";
import { openCourses, sortedGroups } from "@/lib/courses";
import { db } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "NextFab | Membership Agreement" };

const COPY = {
  membership: "Co-work, artwork, invention, and entrepreneurship in the ultimate place for innovation. Join a vibrant and diverse community of creative, entrepreneurial people like you — become a NextFab Member!",
  group: "Joining NextFab through your organization? Pick your group, tell us about yourself and sign the membership agreement.",
  "maker-series": "Enroll in a Maker Series course: a guided, project-based program that includes membership while you learn.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [groups, courses] = await Promise.all([sortedGroups(), openCourses()]);

  // Resume via an unguessable token (Zoho used the raw record ID in the URL).
  const resumed = sp.resume ? await db.findOne("signups", { resume_token: sp.resume }) : null;
  const type = resumed ? parseSignupType(String(resumed.type)) : parseSignupType(sp.type);

  const initial: SignupInitial = {};
  if (resumed && resumed.status !== "paid") {
    for (const [k, val] of Object.entries(resumed)) if (val !== null && typeof val !== "object") initial[k] = String(val);
    initial.hasPhoto = String(Boolean(resumed.photo_path));
    initial.hasProof = String(Boolean(resumed.discount_proof_path));
  } else {
    if (sp.plan) initial.plan = sp.plan;
    if (sp.addon) initial[`addon_${sp.addon}`] = "true";
    if (sp.course) initial.course_id = sp.course;
    if (sp.group) initial.group_id = sp.group;
  }

  return (
    <>
      <SiteHeader solid />
      <section className="relative bg-cover bg-center py-16 text-center text-white" style={{ backgroundImage: "url(https://nextfab.com/wp-content/uploads/2021/10/nextfab-membership-signup-hero.jpg)" }}>
        <div className="absolute inset-0 bg-[rgba(0,22,33,0.7)]" />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="text-sm uppercase tracking-[0.3em] text-nf-ice">{SIGNUP_TYPES[type]}</p>
          <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Membership Agreement</h1>
          <p className="mt-4 leading-7 text-white/85">{COPY[type]}</p>
        </div>
      </section>
      <main className="nf-dots px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {resumed?.status === "paid" ? (
            <p className="bg-white p-8 text-center shadow-sm">This sign-up is already complete. Welcome to NextFab!</p>
          ) : (
            <SignupForm type={type} groups={groups} courses={courses} initial={initial} resume={resumed ? sp.resume : undefined} />
          )}
        </div>
      </main>
    </>
  );
}

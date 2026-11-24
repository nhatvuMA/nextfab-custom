import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { db } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const s = t ? await db.findOne("signups", { resume_token: t }) : null;
  const name = s ? String(s.preferred_name || s.first_name) : "";
  return (
    <>
      <SiteHeader solid />
      <main className="nf-dots min-h-[70vh] px-4 py-20">
        <div className="mx-auto max-w-xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-nf-mist text-nf-blue">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-3xl font-medium">Welcome to NextFab{name && `, ${name}`}!</h1>
          <p className="mt-4 leading-7 text-gray-600">
            {s?.type === "maker-series"
              ? `You're enrolled in ${s.course_name}. We'll email your schedule and first-day details shortly.`
              : "Your membership agreement is signed. Next step: book your New Member Orientation — we'll email you a link along with your member badge pickup details."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="nf-btn">Back to Home</Link>
            <Link href="/join/junior" className="border border-nf-blue px-6 py-2.5 font-medium text-nf-blue">Add a Junior Member</Link>
          </div>
        </div>
      </main>
    </>
  );
}

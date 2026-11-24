import SiteHeader from "@/components/SiteHeader";
import Access24Form from "@/components/Access24Form";

export const metadata = { title: "NextFab | 24-Hour Access" };

export default function Access24Page() {
  return (
    <>
      <SiteHeader solid />
      <main className="nf-dots px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-4xl font-medium">24-Hour Access</h1>
          <p className="mx-auto mt-3 max-w-xl text-center leading-7 text-gray-600">
            Active members can request access to the shop outside staffed hours. After you apply, Member Services will schedule a safety call,
            check your insurance and trainings, and complete your onboarding.
          </p>
          <ol className="mx-auto mt-6 grid max-w-xl gap-2 text-sm text-gray-700 sm:grid-cols-4">
            {["Request", "Safety call", "Trainings & onboarding", "Approved"].map((s, i) => (
              <li key={s} className="flex items-center gap-2 bg-white px-3 py-2 shadow-sm"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nf-blue text-xs text-white">{i + 1}</span>{s}</li>
            ))}
          </ol>
          <Access24Form />
        </div>
      </main>
    </>
  );
}

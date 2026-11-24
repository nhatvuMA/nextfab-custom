import SiteHeader from "@/components/SiteHeader";
import JuniorForm from "@/components/JuniorForm";

export const metadata = { title: "NextFab | Junior Membership" };

export default function JuniorPage() {
  return (
    <>
      <SiteHeader solid />
      <main className="nf-dots px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-4xl font-medium">Junior Membership</h1>
          <p className="mx-auto mt-3 max-w-xl text-center leading-7 text-gray-600">Adult members with any level of membership can add a junior member aged 10 to 17. Juniors must be accompanied by their parent or guardian member at all times.</p>
          <JuniorForm />
        </div>
      </main>
    </>
  );
}

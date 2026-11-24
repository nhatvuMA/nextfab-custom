import { redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { db, normEmail } from "@/lib/store";

export const metadata = { title: "NextFab | Take a Tour" };

// Tour requests land directly in Leads with status "Tour Scheduled".
export default async function TourPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  async function book(fd: FormData) {
    "use server";
    const email = normEmail(fd.get("email"));
    const first = String(fd.get("first_name") ?? "").trim();
    if (!first || !email.includes("@")) redirect("/tour?ok=0");
    const data = {
      first_name: first, last_name: String(fd.get("last_name") ?? "").trim() || null, phone: String(fd.get("phone") ?? "") || null,
      tour_date: String(fd.get("tour_date") ?? "") || null, lead_status: "Tour Scheduled",
    };
    const existing = await db.findOne("leads", { email });
    if (existing) await db.update("leads", existing.id, data);
    else await db.insert("leads", { ...data, email, lead_source: "Contact Us Form", lead_type: "Month-to-Month Membership", lead_date: new Date().toISOString().slice(0, 10), lead_owner: "Member Services" });
    redirect("/tour?ok=1");
  }
  return (
    <>
      <SiteHeader solid />
      <main className="nf-dots px-4 py-14">
        <div className="mx-auto max-w-xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-medium">Take a Tour</h1>
          <p className="mt-2 text-gray-600">See the shops, meet the staff and find the right membership. Tours run Saturday–Thursday.</p>
          {ok === "1" ? (
            <p className="mt-6 bg-nf-mist p-4">Thanks! We&apos;ll confirm your tour time by email.</p>
          ) : (
            <form action={book} className="mt-6 grid gap-4 sm:grid-cols-2">
              {ok === "0" && <p className="nf-err sm:col-span-2">Please enter your first name and a valid email.</p>}
              <input name="first_name" required placeholder="First name *" className="nf-input" />
              <input name="last_name" placeholder="Last name" className="nf-input" />
              <input name="email" type="email" required placeholder="Email *" className="nf-input sm:col-span-2" />
              <input name="phone" placeholder="Phone" className="nf-input" />
              <input name="tour_date" type="date" min={new Date().toISOString().slice(0, 10)} className="nf-input" />
              <button className="nf-btn py-3 uppercase tracking-wider sm:col-span-2">Request Tour</button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

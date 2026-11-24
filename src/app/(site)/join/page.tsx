import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { ADDONS, PLANS, DISCOUNT_PLANS, money } from "@/lib/pricing";
import { openCourses } from "@/lib/courses";

export const metadata = { title: "NextFab | Join Our Makerspaces in Philadelphia, PA" };
export const dynamic = "force-dynamic";

const CDN = "https://nextfab.com/wp-content/uploads";
const SIGNUP = "/join/membership-sign-up";

export default async function JoinPage() {
  const courses = await openCourses();
  return (
    <>
      <SiteHeader />
      <section className="relative flex min-h-[520px] items-end bg-cover bg-center pb-20 pt-40" style={{ backgroundImage: `url(${CDN}/2021/10/nextfab-membership-signup-hero.jpg)` }}>
        <div className="absolute inset-0 bg-black/45" />
        <p className="relative mx-auto max-w-3xl px-4 text-center text-lg leading-8 text-white">
          Whether you&apos;ve got a big idea you want to make a reality, need access to tools to work on your passion projects, or just want to learn how to make things with your hands, a NextFab membership can help you get there.
        </p>
      </section>

      <p className="mx-auto max-w-4xl px-4 py-12 text-center text-lg leading-8">
        Membership gains you unlimited access to NextFab&apos;s makerspace. Schedule a class, private training, or proficiency check to gain access to tools and equipment.
      </p>

      <section className="relative bg-cover bg-center py-20" style={{ backgroundImage: `url(${CDN}/2022/05/membership-levels-bg2.jpg)` }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-4xl font-medium text-white sm:text-5xl">Membership Options</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {([
              ["month_to_month", "Pay monthly with no long-term commitment.", false],
              ["annual", "Sign up for an annual contract and enjoy 10% off your monthly rate.", true],
            ] as const).map(([id, blurb, popular]) => (
              <div key={id} className={`flex flex-col text-center shadow-xl ${popular ? "bg-nf-blue text-white ring-2 ring-nf-sky" : "bg-white"}`}>
                <div className={`px-6 pb-5 pt-6 ${popular ? "" : "bg-nf-mist"}`}>
                  {popular && <p className="mb-1 text-[10px] font-bold uppercase tracking-widest">Most Popular</p>}
                  <h3 className="text-lg uppercase">{PLANS[id].label}</h3>
                  <p className="mt-1 text-5xl font-semibold"><sup className="text-xl">$</sup>{PLANS[id].price}<span className="text-sm font-normal">/month</span></p>
                  <p className="text-sm italic opacity-80">{money(DISCOUNT_PLANS[id].price)}/month Discounted Membership</p>
                </div>
                <div className="flex flex-1 flex-col px-6 py-5">
                  <p className="border-b border-current/20 pb-3 font-medium">Unlimited Days</p>
                  <p className="flex-1 py-4">{blurb}</p>
                  <Link href={`${SIGNUP}?type=membership&plan=${id}`} className={`nf-btn uppercase tracking-wider ${popular ? "!bg-none bg-white !text-nf-blue" : ""}`}>Select {PLANS[id].label}</Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`${SIGNUP}?type=membership`} className="nf-btn w-72 uppercase tracking-wider">Sign Up Now</Link>
          </div>
        </div>
      </section>

      <section className="bg-nf-mist py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-3 text-center text-4xl font-medium">Add-Ons</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center">Add on any of the below products to your membership to customize your experience. Each add-on will be combined with your monthly subscription.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(["credits", "adobe", "shipping", "access24"] as const).map((id) => (
              <div key={id} className="flex flex-col bg-white p-6 text-center shadow-sm">
                <h3 className="text-xl font-medium">{ADDONS[id].label.replace(" Bundle", "s").replace(" Software", "").replace(" & Purchasing", "")}</h3>
                <p className="my-2 text-4xl font-semibold text-nf-blue">${ADDONS[id].price}</p>
                <p className="flex-1 text-sm leading-6 text-gray-600">{ADDONS[id].details}</p>
                <Link href={`${SIGNUP}?type=membership&addon=${id}`} className="nf-btn mt-4 text-sm uppercase tracking-wider">Add {ADDONS[id].label.split(" ")[0]}</Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm">Already a member? <Link href="/join/24-hour-access" className="font-medium text-nf-blue underline">Request 24-hour access</Link></p>
        </div>
      </section>

      <section id="classes" className="bg-nf-mist pb-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <span className="nf-btn nf-btn-dark mb-10">Pre-Packaged Programs</span>
          <h2 className="text-4xl font-medium">Class Packages</h2>
          <p className="mx-auto mt-3 max-w-3xl">Includes membership, unlimited access to the space, and pre-selected or choose your learning pathway in selected departments. Great for getting started at NextFab.</p>
          <div className="mt-10 grid gap-6 text-left md:grid-cols-2">
            <div className="flex flex-col bg-white p-7 shadow-sm">
              <h3 className="text-xl font-medium uppercase">Pay Six Months Upfront (Get One Month Free)</h3>
              <p className="my-2 text-3xl font-semibold text-nf-blue">{money(PLANS.six_month.price)}</p>
              <p className="flex-1 text-sm leading-6 text-gray-600">Add 1,200 credits upfront to spend on classes, private training, and machine reservations. Equivalent to 6-12 classes. Unused credits will roll over.</p>
              <Link href={`${SIGNUP}?type=membership&plan=six_month`} className="nf-btn mt-5 self-start uppercase tracking-wider">Sign Up</Link>
            </div>
            {courses.map((c) => (
              <div key={c.id} className="flex flex-col bg-white p-7 shadow-sm">
                <h3 className="text-xl font-medium uppercase">{c.name} <span className="text-nf-sky">Maker Series</span></h3>
                <p className="my-2 text-3xl font-semibold text-nf-blue">{money(c.price)}</p>
                <p className="flex-1 text-sm text-gray-600">Starts {new Date(c.start_date + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {c.level}</p>
                <Link href={`${SIGNUP}?type=maker-series&course=${c.id}`} className="nf-btn mt-5 self-start uppercase tracking-wider">Sign Up</Link>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-gray-600">Joining through an organization? <Link className="text-nf-blue underline" href={`${SIGNUP}?type=group`}>Group member sign-up</Link> · Adding a 10–17 year old? <Link className="text-nf-blue underline" href="/join/junior">Junior membership</Link></p>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const CDN = "https://nextfab.com/wp-content";
const DEPTS = [
  ["2D Printing", "icon-2d-printing-photography2"],
  ["3D Printing", "icon-3d-printing-scanning"],
  ["Design Software", "icon-software"],
  ["Electronics", "icon-electronics"],
  ["Jewelry Making", "icon-jewelry"],
  ["Laser Cutting & Engraving", "icon-laser-cutting"],
  ["Metalworking", "icon-metalworking"],
  ["Sewing & Leatherworking", "icon-textiles"],
  ["Woodworking", "icon-woodworking"],
];
const FEATURED = [
  ["Maker Series Interest Form", `${CDN}/uploads/2023/12/corporate-team-building.png`, "/join/membership-sign-up?type=maker-series"],
  ["Take a Tour", `${CDN}/uploads/2022/06/slide-class-intro-woodshop-01.jpg`, "/tour"],
  ["NextFab Tools & Equipment", `${CDN}/uploads/2022/10/Untitled-design-21-min-1.png`, "/#makerspace"],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      {/* Hero */}
      <section className="relative flex h-[min(100vh,820px)] min-h-[560px] flex-col justify-end overflow-hidden bg-nf-navy">
        <video className="absolute inset-0 h-full w-full object-cover opacity-70" src={`${CDN}/uploads/2022/05/home-hero-4c.mp4`} autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-28 text-center">
          <h1 className="nf-outline text-5xl leading-[1.05] sm:text-7xl lg:text-[101px]">Your Success<br />In The Making</h1>
          <button className="mt-8 flex items-center gap-3 text-lg text-white/95">
            Watch Video
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/80">
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M0 0l10 6-10 6z" /></svg>
            </span>
          </button>
        </div>
        <div className="relative z-10 grid grid-cols-3 border-t border-white/30 text-center text-[13px] uppercase tracking-wider text-white sm:text-sm">
          {[["How To Join", "/join"], ["Classes Available", "/join#classes"], ["Take A Tour", "/tour"]].map(([l, h], i) => (
            <Link key={l} href={h} className={`bg-black/30 py-4 backdrop-blur-[2px] hover:bg-nf-blue/70 ${i ? "border-l border-white/30" : ""}`}>{l}</Link>
          ))}
        </div>
      </section>

      {/* Intro + department tiles */}
      <section id="about" className="nf-grid-bg py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-medium sm:text-[40px]">NextFab: Makerspace in Philadelphia</h2>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-5 text-[15px] leading-7">
              <p className="text-lg font-medium italic leading-7 text-nf-ink">NextFab is a collaborative makerspace for professional makers. Here you can expand your skills, find your passions, and turn ideas into realities.</p>
              <div className="h-0.5 w-28 bg-nf-sky" />
              <p>A NextFab membership provides machinery, classes, community, and studio space for you to grow in your craft. We are constantly finding cutting-edge ways to combine digital technology with traditional tools. This multidisciplinary approach, combined with the physical space to make whatever you can imagine, is a whole new way to create.</p>
              <p>We believe in learning by doing, and we&apos;re here to welcome, support, and inspire you as you learn and make. Access our makerspace by becoming a member today! Unlock 24/7 access to our makerspace by applying for extended access.</p>
              <Link href="/join" className="nf-btn mt-3">Join NextFab</Link>
            </div>
            <div id="makerspace">
              <h3 className="mb-5 text-center text-2xl font-medium">Explore Community Workshop Pages</h3>
              <div className="grid grid-cols-3 gap-3">
                {DEPTS.map(([name, icon]) => (
                  <a key={name} href="#" className="group flex aspect-[1.15] flex-col items-center justify-end bg-nf-tile p-3 text-center text-[13px] text-white transition hover:bg-nf-blue">
                    <span className="mb-auto mt-4 h-12 w-12 bg-contain bg-center bg-no-repeat transition group-hover:scale-110" style={{ backgroundImage: `url(${CDN}/themes/nextfab2021/img/${icon}.svg)` }} />
                    {name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join */}
      <section className="bg-nf-mist py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-3xl font-medium sm:text-[40px]">Join NextFab Philadelphia</h2>
          <div className="grid gap-8 text-[15px] leading-7 md:grid-cols-2">
            <p>To make big ideas into reality and access space and tools for your passion projects, join our network of makers. A NextFab membership grants access to all of our features:</p>
            <ul className="space-y-1">
              {["North Philadelphia Makerspace", "All of our workshops, woodshops, studios, and classes", "Entry into our talented member community", "Guidance from expert staff", "NextFab's tools, resources, machines, & software"].map((t) => (
                <li key={t}>+ {t}</li>
              ))}
            </ul>
          </div>
          <div className="mt-10 text-center"><Link href="/join" className="nf-btn">See Membership Options</Link></div>
        </div>
      </section>

      <section className="bg-nf-mist pb-20">
        <div className="mx-auto max-w-4xl space-y-5 px-4 text-center text-[15px] leading-7">
          <h2 className="text-3xl font-medium sm:text-[40px] sm:leading-tight">Makerspaces, Studios, Machines, and Workshops Nearby</h2>
          <p>Have you outgrown your home hobby workstation? Is your material storage starting to take up too much space? Here at NextFab, you can build and store anything you can dream of.</p>
          <p>We provide state-of-the-art tools, equipment, and training at all skill levels and departments. Our classes span the world of making, from 3D printing to laser cutting to textiles.</p>
          <Link href="/#contact" className="nf-btn">View Location</Link>
        </div>
      </section>

      {/* Community + featured */}
      <section id="members" className="nf-dots py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl space-y-5 text-center text-[15px] leading-7">
            <h2 className="text-3xl font-medium sm:text-[40px]">NextFab Community Workshop</h2>
            <p>We believe that experiences are better in community—woodworking, shop classes, jewelry making—you name it. We designed our environment to spark collaboration because innovation and passion don&apos;t just happen in a vacuum. After all, we&apos;re just a building with tools without our makers.</p>
            <Link href="/join" className="nf-btn">Sign Up for a Membership</Link>
          </div>

          <div className="relative mt-14 aspect-[16/8] overflow-hidden bg-nf-navy">
            <video className="absolute inset-0 h-full w-full object-cover" src={`${CDN}/uploads/2019/03/Emma-Clip-2.mp4`} autoPlay muted loop playsInline />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-10">
              <h4 className="text-2xl font-medium sm:text-3xl">Featured Story</h4>
              <div className="space-y-3">
                <p className="sm:text-lg">Meet a NextFab Maker: Emma Fried-Cassorla, Philly Love Notes</p>
                <button className="nf-btn">Watch Video</button>
              </div>
            </div>
          </div>

          <div id="events" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map(([t, img, href]) => (
              <Link key={t} href={href} className="group relative flex aspect-[4/3.4] flex-col justify-between overflow-hidden p-5 text-white">
                <span className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${img})` }} />
                <span className="absolute inset-0 bg-black/45" />
                <span className="relative text-xl font-medium">Featured Page</span>
                <span className="relative">
                  <span className="block text-lg">{t}</span>
                  <span className="nf-btn mt-3 px-5 py-1.5 text-sm">Learn More</span>
                </span>
              </Link>
            ))}
            <div className="flex aspect-[4/3.4] flex-col justify-between bg-nf-navy p-5 text-white">
              <span className="text-xl font-medium">#NextFabMade</span>
              <span className="nf-btn self-start px-5 py-1.5 text-sm">See More</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="blog" className="bg-[#0d2a38] py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-medium">Sign-Up for Our Newsletter</h2>
          <form action="/api/contact" method="post" className="mt-8 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <input type="hidden" name="source" value="Newsletters" />
            <input required type="email" name="email" placeholder="Email Address *" className="nf-input text-nf-ink" />
            <input name="first_name" placeholder="First Name" className="nf-input text-nf-ink" />
            <input name="last_name" placeholder="Last Name" className="nf-input text-nf-ink" />
            <button className="nf-btn">Subscribe</button>
          </form>
        </div>
      </section>
    </>
  );
}

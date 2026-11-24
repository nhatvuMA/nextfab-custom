"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LEFT = [
  { label: "About", href: "/#about", sub: ["About NextFab", "Our Team", "Hire a Maker", "Artisan Accelerator"] },
  { label: "Makerspace", href: "/#makerspace", sub: ["North Philadelphia", "Equipment Lists", "Studio Space Rentals", "Workshops"] },
  { label: "Membership", href: "/join", sub: ["Take a Tour", "Join", "Classes", "Membership Agreement"] },
];
const RIGHT = [
  { label: "Our Members", href: "/#members" },
  { label: "Events", href: "/#events" },
  { label: "Blog", href: "/#blog" },
  { label: "Contact", href: "/#contact" },
];

export function Logo({ className = "h-7" }: { className?: string }) {
  // Hot-linked from nextfab.com for the prototype; replace with a local asset.
  return <img src="https://nextfab.com/wp-content/themes/nextfab2021/img/logo.svg" alt="NextFab" className={className} />;
}

export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`${solid ? "sticky" : "fixed"} inset-x-0 top-0 z-50`}>
      <div className="flex h-7 items-center justify-end bg-gradient-to-r from-[#4fb9e8] to-[#2a8fc9] text-[13px] text-white">
        <p className="hidden flex-1 truncate text-center sm:block">Join Us At NextFab&apos;s Miracle on American Street Gift Market! Saturday, Nov. 21st</p>
        <Link href="/admin" className="flex h-full items-center gap-1.5 bg-[#2a8fc9] px-6 font-medium sm:px-10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5C21 16.5 17 14 12 14Z" /></svg>
          Member Login
        </Link>
      </div>
      <nav className={`transition-colors ${scrolled || solid ? "bg-[rgba(0,22,33,0.95)]" : "bg-[rgba(0,22,33,0.84)]"} text-white`}>
        <div className="mx-auto flex h-[78px] max-w-[1400px] items-center px-4 lg:px-5">
          <ul className="hidden flex-1 items-center gap-10 text-[14.8px] uppercase lg:flex">
            {LEFT.map((l) => (
              <li key={l.label} className="group relative py-7">
                <Link href={l.href} className="hover:text-nf-ice">{l.label}</Link>
                <div className="invisible absolute left-0 top-full min-w-56 bg-[rgba(0,22,33,0.95)] py-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
                  {l.sub.map((s) => (
                    <Link key={s} href={l.href} className="block px-5 py-2 text-[13px] normal-case tracking-wide text-white/85 hover:bg-white/5 hover:text-nf-ice">{s}</Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <Link href="/" className="lg:mx-8"><Logo className="h-[26px] lg:h-[30px]" /></Link>
          <ul className="hidden flex-1 items-center justify-end gap-9 text-[14.8px] uppercase lg:flex">
            {RIGHT.map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:text-nf-ice">{l.label}</Link></li>
            ))}
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            </li>
          </ul>
          <button className="ml-auto p-2 lg:hidden" aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6 6 18" : "M3 6h18M3 12h18M3 18h18"} /></svg>
          </button>
        </div>
        {open && (
          <ul className="border-t border-white/10 px-4 pb-4 uppercase lg:hidden">
            {[...LEFT, ...RIGHT].map((l) => (
              <li key={l.label}><Link onClick={() => setOpen(false)} href={l.href} className="block py-3 text-sm">{l.label}</Link></li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}

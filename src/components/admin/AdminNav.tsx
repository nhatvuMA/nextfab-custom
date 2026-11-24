"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["Dashboard", "/admin"],
  ["Sign-ups", "/admin/signups"],
  ["Leads", "/admin/leads"],
  ["Members", "/admin/members"],
  ["24-Hour Access", "/admin/access24"],
  ["Groups", "/admin/groups"],
  ["Maker Series", "/admin/courses"],
];

export default function AdminNav({ mobile }: { mobile?: boolean }) {
  const path = usePathname();
  const active = (h: string) => (h === "/admin" ? path === h : path.startsWith(h));
  if (mobile)
    return (
      <nav className="flex gap-3 overflow-x-auto text-xs">
        {ITEMS.map(([l, h]) => <Link key={h} href={h} className={active(h) ? "text-nf-ice" : "text-white/80"}>{l}</Link>)}
      </nav>
    );
  return (
    <nav className="mt-2 space-y-0.5 px-2">
      {ITEMS.map(([l, h]) => (
        <Link key={h} href={h} className={`block rounded px-3 py-2 ${active(h) ? "bg-white/10 text-nf-ice" : "text-white/75 hover:bg-white/5 hover:text-white"}`}>{l}</Link>
      ))}
    </nav>
  );
}

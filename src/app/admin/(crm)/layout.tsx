import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, logout } from "@/lib/auth";
import { usingSupabase } from "@/lib/store";
import { stripeMode } from "@/lib/integration";
import { Logo } from "@/components/SiteHeader";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  async function signOut() {
    "use server";
    await logout();
    redirect("/admin/login");
  }
  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-[14px]">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col bg-nf-navy text-white md:flex print:!hidden">
        <Link href="/admin" className="block px-5 py-5"><Logo className="h-5" /><span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-nf-ice">Member CRM</span></Link>
        <AdminNav />
        <div className="mt-auto space-y-1 border-t border-white/10 p-4 text-[11px] text-white/50">
          <p>DB: {usingSupabase ? "Supabase" : "Local file (demo)"}</p>
          <p>Stripe: {stripeMode}</p>
          <form action={signOut}><button className="mt-2 text-white/70 hover:text-white">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 bg-nf-navy px-4 py-3 text-white md:hidden"><Logo className="h-5" /><AdminNav mobile /></div>
        <main className="mx-auto max-w-7xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { Logo } from "@/components/SiteHeader";

export const metadata = { title: "NextFab Staff Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; e?: string }> }) {
  const { next, e } = await searchParams;
  async function act(fd: FormData) {
    "use server";
    const ok = await login(String(fd.get("password") ?? ""));
    const dest = String(fd.get("next") || "/admin");
    if (!ok) redirect(`/admin/login?e=1&next=${encodeURIComponent(dest)}`);
    redirect(dest.startsWith("/admin") ? dest : "/admin");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-nf-navy px-4">
      <form action={act} className="w-full max-w-sm space-y-4 bg-white p-8 shadow-xl">
        <div className="-mx-8 -mt-8 mb-6 bg-nf-navy px-8 py-5"><Logo className="h-6" /></div>
        <h1 className="text-xl font-medium">Staff sign in</h1>
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <input type="password" name="password" placeholder="Staff password" className="nf-input" autoFocus />
        {e && <p className="nf-err">Incorrect password.</p>}
        <button className="nf-btn w-full py-2.5">Sign in</button>
        <p className="text-xs text-gray-500">Prototype: shared password from ADMIN_PASSWORD (default &quot;nextfab&quot;). Production should use Supabase Auth staff accounts.</p>
      </form>
    </main>
  );
}

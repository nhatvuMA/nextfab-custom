import { NextResponse, type NextRequest } from "next/server";

// Cheap gate: bounce to login if there's no staff cookie. The signature is
// verified server-side in the admin layout (isAdmin), which has Node crypto.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!req.cookies.get("nf_admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };

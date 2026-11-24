import { NextResponse } from "next/server";
import { db, normEmail, DuplicateError } from "@/lib/store";

// Footer contact form + newsletter → Leads (replaces the Zoho Forms embed).
export async function POST(req: Request) {
  const f = await req.formData();
  const email = normEmail(f.get("email"));
  const back = new URL(req.headers.get("referer") || "/", req.url);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    back.searchParams.set("contact", "invalid");
    return NextResponse.redirect(back, 303);
  }
  const name = String(f.get("name") ?? "").trim();
  const first = String(f.get("first_name") ?? "").trim() || name.split(" ")[0] || email.split("@")[0];
  const last = String(f.get("last_name") ?? "").trim() || name.split(" ").slice(1).join(" ");
  const source = String(f.get("source") ?? "") === "Newsletters" ? "Newsletters" : "Contact Us Form";
  const message = String(f.get("message") ?? "").slice(0, 4000);

  const member = await db.findOne("members", { email });
  const existing = await db.findOne("leads", { email });
  if (!member) {
    try {
      if (existing) {
        await db.update("leads", existing.id, { notes: [existing.notes, message].filter(Boolean).join("\n---\n") || null });
      } else {
        await db.insert("leads", {
          first_name: first, last_name: last || null, email, lead_source: source,
          lead_status: source === "Newsletters" ? "New" : "Contact Us Form",
          lead_date: new Date().toISOString().slice(0, 10), lead_owner: "Member Services", notes: message || null,
        });
      }
    } catch (e) {
      if (!(e instanceof DuplicateError)) throw e;
    }
  }
  back.searchParams.set("contact", "thanks");
  back.hash = "contact";
  return NextResponse.redirect(back, 303);
}

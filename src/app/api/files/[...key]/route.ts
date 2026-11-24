import { readLocalFile } from "@/lib/store";
import { isAdmin } from "@/lib/auth";

// Local-mode file server (Supabase mode uses signed URLs instead). Staff only.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { key } = await params;
  const k = key.join("/");
  try {
    const buf = await readLocalFile(k);
    const ext = k.split(".").pop()?.toLowerCase();
    const type = ext === "pdf" ? "application/pdf" : ext === "gif" ? "image/gif" : ext === "png" ? "image/png" : "image/jpeg";
    return new Response(new Uint8Array(buf), { headers: { "content-type": type, "cache-control": "private, max-age=300" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

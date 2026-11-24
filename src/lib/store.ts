// Data access layer. Uses Supabase when NEXT_PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY are set; otherwise falls back to a local JSON file
// (.data/db.json) so the prototype runs with zero setup.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export type Row = Record<string, unknown> & { id: string; created_at: string };
export type Table =
  | "groups"
  | "courses"
  | "coupons"
  | "signups"
  | "members"
  | "junior_members"
  | "leads"
  | "lead_visits"
  | "lead_status_history"
  | "access24_requests"
  | "access24_safety_calls";

type ListOpts = { eq?: Record<string, unknown>; order?: string; ascending?: boolean; limit?: number };

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const usingSupabase = Boolean(SB_URL && SB_KEY);

let sb: SupabaseClient | null = null;
function supabase() {
  if (!sb) sb = createClient(SB_URL!, SB_KEY!, { auth: { persistSession: false } });
  return sb;
}

export class DuplicateError extends Error {}

// ---------- local JSON fallback ----------
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
type LocalDb = Partial<Record<Table, Row[]>>;
let cache: LocalDb | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<LocalDb> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    cache = {};
    const { seed } = await import("./seed");
    for (const [t, rows] of Object.entries(seed)) {
      cache[t as Table] = rows.map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }) as Row);
    }
    await persist();
  }
  return cache!;
}
async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2));
}
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}
const matches = (r: Row, eq?: Record<string, unknown>) =>
  !eq || Object.entries(eq).every(([k, v]) => (r[k] ?? null) === (v ?? null));

// Unique keys enforced in both backends (Postgres has the same unique indexes).
const UNIQUE: Partial<Record<Table, string[]>> = { members: ["email"], leads: ["email"], courses: ["slug"], coupons: ["code"] };

// ---------- public API ----------
export const db = {
  async list(table: Table, opts: ListOpts = {}): Promise<Row[]> {
    const order = opts.order ?? "created_at";
    const asc = opts.ascending ?? false;
    if (usingSupabase) {
      let q = supabase().from(table).select("*");
      if (opts.eq) q = q.match(opts.eq as Record<string, string>);
      q = q.order(order, { ascending: asc });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return data as Row[];
    }
    const all = (await load())[table] ?? [];
    const rows = all.filter((r) => matches(r, opts.eq));
    rows.sort((a, b) => {
      const x = String(a[order] ?? ""), y = String(b[order] ?? "");
      return asc ? x.localeCompare(y) : y.localeCompare(x);
    });
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  },

  async get(table: Table, id: string): Promise<Row | null> {
    if (!id) return null;
    return this.findOne(table, { id });
  },

  async findOne(table: Table, eq: Record<string, unknown>): Promise<Row | null> {
    if (usingSupabase) {
      const { data, error } = await supabase().from(table).select("*").match(eq as Record<string, string>).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Row) ?? null;
    }
    return ((await load())[table] ?? []).find((r) => matches(r, eq)) ?? null;
  },

  async insert(table: Table, data: Record<string, unknown>): Promise<Row> {
    if (usingSupabase) {
      const { data: row, error } = await supabase().from(table).insert(data).select("*").single();
      if (error) {
        if (error.code === "23505") throw new DuplicateError(error.message);
        throw new Error(error.message);
      }
      return row as Row;
    }
    return locked(async () => {
      const d = await load();
      const rows = (d[table] ??= []);
      for (const k of UNIQUE[table] ?? []) {
        if (data[k] && rows.some((r) => r[k] === data[k])) throw new DuplicateError(`${table}.${k} already exists`);
      }
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...data } as Row;
      rows.push(row);
      await persist();
      return row;
    });
  },

  async update(table: Table, id: string, patch: Record<string, unknown>): Promise<Row> {
    const p = { ...patch, updated_at: new Date().toISOString() };
    if (usingSupabase) {
      const { data, error } = await supabase().from(table).update(p).eq("id", id).select("*").single();
      if (error) {
        if (error.code === "23505") throw new DuplicateError(error.message);
        throw new Error(error.message);
      }
      return data as Row;
    }
    return locked(async () => {
      const rows = (await load())[table] ?? [];
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error(`${table} ${id} not found`);
      for (const k of UNIQUE[table] ?? []) {
        if (p[k as keyof typeof p] && rows.some((r) => r.id !== id && r[k] === p[k as keyof typeof p]))
          throw new DuplicateError(`${table}.${k} already exists`);
      }
      rows[i] = { ...rows[i], ...p };
      await persist();
      return rows[i];
    });
  },

  async remove(table: Table, id: string) {
    if (usingSupabase) {
      const { error } = await supabase().from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      return;
    }
    await locked(async () => {
      const d = await load();
      d[table] = (d[table] ?? []).filter((r) => r.id !== id);
      await persist();
    });
  },
};

// ---------- file storage ----------
const BUCKET = "member-files";
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export async function saveFile(folder: string, file: Blob, name: string): Promise<string> {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const key = `${folder}/${crypto.randomUUID()}-${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());
  if (usingSupabase) {
    const { error } = await supabase().storage.from(BUCKET).upload(key, buf, { contentType: file.type || undefined });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return key;
  }
  const full = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return key;
}

/** URL staff can open (signed for Supabase, admin-protected route locally). */
export async function fileUrl(key: unknown): Promise<string | null> {
  if (!key || typeof key !== "string") return null;
  if (usingSupabase) {
    const { data } = await supabase().storage.from(BUCKET).createSignedUrl(key, 60 * 60);
    return data?.signedUrl ?? null;
  }
  return `/api/files/${key}`;
}

export async function readLocalFile(key: string) {
  const full = path.join(UPLOAD_DIR, key);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) throw new Error("bad path");
  return fs.readFile(full);
}

export const newToken = () => crypto.randomBytes(24).toString("base64url");
export const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();

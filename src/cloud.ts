/*
  배포 데이터 동기화 — 제작자가 /editor 에서 수정한 내용을 "모든 방문자"에게 보여주기 위한 장치.

  우선순위
   1) Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 빌드에 들어있을 때)
   2) 정적 파일 ./phone-data.json (public/ 폴더에 넣고 배포)
   3) 둘 다 없으면 코드에 들어있는 기본 데이터

  방문자 브라우저의 LocalStorage(읽음 표시, 메모 수정 등)는 유지하되,
  제작자가 새로 게시하면(rev가 더 크면) 새 데이터로 교체된다.
*/
import type { PhoneData } from "./store";

const ENV = import.meta.env as Record<string, string | undefined>;
export const SB_URL = (ENV.VITE_SUPABASE_URL || "").replace(/\/$/, "");
export const SB_KEY = ENV.VITE_SUPABASE_ANON_KEY || "";
export const SB_ROW = ENV.VITE_SUPABASE_ROW || "main";
export const cloudEnabled = () => !!(SB_URL && SB_KEY);

const REV_KEY = "taesik-phone:rev";
const SESSION_KEY = "taesik-phone:sb-session";

export type Published = { rev: number; data: PhoneData };

export function localRev() {
  try {
    return Number(localStorage.getItem(REV_KEY) || 0);
  } catch {
    return 0;
  }
}
export function setLocalRev(r: number) {
  try {
    localStorage.setItem(REV_KEY, String(r));
  } catch {
    /* ignore */
  }
}

const sbHeaders = (token?: string) => ({
  apikey: SB_KEY,
  Authorization: `Bearer ${token || SB_KEY}`,
  "Content-Type": "application/json",
});

/** 게시된 데이터 가져오기 */
export async function fetchPublished(): Promise<Published | null> {
  if (cloudEnabled()) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/phone_state?id=eq.${encodeURIComponent(SB_ROW)}&select=data,updated_at`, { headers: sbHeaders(), cache: "no-store" });
      if (r.ok) {
        const rows = (await r.json()) as { data: PhoneData & { _rev?: number }; updated_at: string }[];
        if (rows[0]) return { rev: rows[0].data._rev || Date.parse(rows[0].updated_at), data: rows[0].data };
      }
    } catch {
      /* 오프라인 등 → 정적 파일로 */
    }
  }
  try {
    const r = await fetch(`./phone-data.json`, { cache: "no-store" });
    if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
      const j = (await r.json()) as PhoneData & { _rev?: number };
      return { rev: j._rev || 1, data: j };
    }
  } catch {
    /* 없음 */
  }
  return null;
}

/* ───── 제작자 로그인 (Supabase Auth, 이메일/비밀번호) ───── */
type Session = { access_token: string; refresh_token: string; expires_at: number; email: string };
export function getSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
function saveSession(j: { access_token: string; refresh_token: string; expires_in: number; user?: { email?: string } }) {
  const s: Session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 - 60000, email: j.user?.email || "" };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}
export async function signIn(email: string, password: string) {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: sbHeaders(), body: JSON.stringify({ email, password }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || "로그인 실패");
  return saveSession(j);
}
export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}
async function validSession() {
  const s = getSession();
  if (!s) return null;
  if (Date.now() < s.expires_at) return s;
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: sbHeaders(), body: JSON.stringify({ refresh_token: s.refresh_token }) });
  if (!r.ok) return null;
  return saveSession(await r.json());
}

/** 현재 데이터를 Supabase에 게시 (모든 방문자에게 반영) */
export async function publish(data: PhoneData) {
  const s = await validSession();
  if (!s) throw new Error("먼저 로그인하세요");
  const rev = Date.now();
  const body = { id: SB_ROW, data: { ...data, _rev: rev }, updated_at: new Date(rev).toISOString() };
  const r = await fetch(`${SB_URL}/rest/v1/phone_state?on_conflict=id`, {
    method: "POST",
    headers: { ...sbHeaders(s.access_token), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error((await r.text()) || `게시 실패 (${r.status})`);
  setLocalRev(rev);
  return rev;
}

/** Supabase SQL 편집기에 붙여넣을 테이블/권한 설정 */
export const SETUP_SQL = `-- 최태식 폰: 게시 데이터 테이블
create table if not exists public.phone_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  owner uuid not null default auth.uid()
);
alter table public.phone_state enable row level security;
grant select on public.phone_state to anon, authenticated;
grant insert, update on public.phone_state to authenticated;

drop policy if exists "read" on public.phone_state;
create policy "read" on public.phone_state for select to anon, authenticated using (true);
drop policy if exists "owner insert" on public.phone_state;
create policy "owner insert" on public.phone_state for insert to authenticated with check (owner = auth.uid());
drop policy if exists "owner update" on public.phone_state;
create policy "owner update" on public.phone_state for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());`;

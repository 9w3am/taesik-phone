import { useSyncExternalStore } from "react";
import { defaultData, DATA_VERSION } from "./data";

/* ───────── 타입 ───────── */
export type AppKind = "messages" | "kakao" | "insta";
export type MsgKind = "text" | "pay" | "photo" | "deleted" | "call" | "link" | "date";
export type Msg = {
  id: string;
  from: "me" | "them" | "system";
  who?: string; // 단체방 발신자 이름
  text: string;
  kind?: MsgKind;
  amount?: number; // 송금 카드
  photo?: string; // 사진 id
  tap?: string; // 아이메시지 반응 (heart/like/dislike/haha/emph/q)
  replyTo?: string; // 답장한 말풍선 내용
};
export type Thread = {
  id: string;
  app: AppKind;
  name: string;
  unread: number;
  pinned?: boolean;
  members?: number; // 단체방 인원
  muted?: boolean;
  sms?: boolean; // 메시지: 초록 말풍선(문자)
  notice?: string; // 카톡 단체방 공지 (상단 고정)
  unsendAfterRead?: boolean; // 아이메시지: 다 읽으면 상대가 전송 취소
  draft?: string; // 보내지 않은 초안 (전송 버튼으로 보낼 수 있음)
  last?: string; // 목록에 보이는 날짜 표기 (예: 어제, 목요일)
  messages: Msg[];
};
export type Call = {
  id: string;
  name: string;
  number?: string;
  kind: "missed" | "in" | "out";
  label: string;
  count?: number;
  when: string;
  lines: string[]; // 상대방 대사만
};
export type Contact = { id: string; name: string; phone: string; label: string; note?: string; fav?: boolean };
export type Note = { id: string; folder: string; title: string; body: string; pinned?: boolean; lockCode?: string; when: string };
export type CalEvent = { id: string; days: number[]; time: string; end?: string; title: string; place?: string; color: string };
export type Tx = { id: string; when: string; name: string; amount: number; memo: string };
/** 직접 만든 앱의 글 하나 (목록 한 줄 · 피드 글 · 사진 한 장) */
export type CustomItem = { id: string; title: string; sub: string; body: string; photo: string; when: string };
/** 편집 화면에서 직접 만드는 앱 (템플릿용) */
export type CustomApp = {
  id: string;
  name: string;
  iconBg: string;
  iconText: string;
  iconImg?: string;
  theme: "light" | "dark";
  tint: string;
  /** list: 목록 → 눌러서 자세히 / feed: SNS처럼 글+사진 / grid: 사진 모음 / page: 웹페이지(글 한 편) */
  layout: "list" | "feed" | "grid" | "page";
  header: string;
  items: CustomItem[];
};
/** 홈 화면 배치: 아이콘 칸(grid) · 아래 독(dock) · 폴더. 어디에도 없으면 숨김 */
export type HomeLayout = { grid: string[]; dock: string[]; folders: Record<string, string[]> };
export type Song = { id: string; title: string; artist: string; album: string; url: string; hue: number; cover?: string; /** 곡 길이(초) */ dur?: number; /** 가사. [00:12.34] 처럼 시간을 붙이면 노래에 맞춰 내려감 */ lyrics?: string; /** 가사 싱크 조절(초): + 면 가사가 늦게, - 면 빨리 */ lyricsOffset?: number; /** 30초 미리듣기 주소 (애플) */ preview?: string; /** 소리용 유튜브 링크 (곡 링크가 유튜브가 아닐 때 전곡 재생용) */ yt?: string };
export type Photo = { id: string; kind?: string; asset?: string; src?: string; deleted?: boolean; vault?: boolean; caption: string; when: string; album?: string; fav?: boolean };
export type Post = { id: string; user: string; caption: string; photo: string; likes: number; comments: number; when: string };
export type Story = { id: string; user: string; text: string; bg: string; when: string; photo?: string; style?: "box" | "classic" };
export type IgUser = { handle: string; name: string; bio: string; posts: number; followers: number; following: number; private?: boolean; avatar?: string };
export type SearchResult = { title: string; url: string; desc: string; source?: string };
export type Comment = { who: string; text: string };
export type Page =
  | { type: "search"; engine: "naver" | "google"; query: string; results: SearchResult[] }
  | { type: "cafe"; cafe: string; board: string; title: string; author: string; views: number; body: string; comments: Comment[] }
  | { type: "board"; site: string; gallery: string; title: string; author: string; views: number; recommend: number; body: string; comments: Comment[] }
  | { type: "market"; site: "daangn" | "bunjang" | "joongna"; title: string; price: string; area: string; seller: string; temp: number; body: string; photo: string; meta: string }
  | { type: "car"; title: string; price: string; specs: [string, string][]; body: string; dealer: string }
  | { type: "shop"; name: string; price: string; discount: string; rating: number; reviews: number; delivery: string; seller: string }
  | { type: "wiki"; title: string; updated: string; sections: { h: string; body: string }[] }
  | { type: "video"; title: string; channel: string; subs: string; views: string; when: string; duration: string; desc: string; comments: Comment[] }
  | { type: "sns"; query: string; posts: { name: string; handle: string; text: string; when: string; replies: number; reposts: number; likes: number }[] }
  | { type: "job"; site: string; company: string; title: string; pay: string; conditions: string[]; body: string }
  | { type: "news"; press: string; title: string; body: string; reporter: string }
  | { type: "blank" };
export type SafariTab = { id: string; title: string; url: string; page: Page };
export type Job = { id: string; code: string; title: string; kind: string; via: string; due: string; pay: string; memo: string; status: "new" | "doing" | "done" | "declined"; step: number };
export type Alarm = { id: string; time: string; label: string; on: boolean };
export type Place = { id: string; name: string; note: string; x: number; y: number };

export type PhoneData = {
  owner: string;
  deviceName: string;
  passcode: string;
  passcodeHint: string;
  decoyCode?: string; // 위장 암호: 치면 텅 빈 가짜 폰이 열림
  vault?: { code: string; notes: string[] }; // 계산기 금고: 숫자 치고 = 누르면 열림
  carrier: string;
  battery: number;
  weather: { city: string; temp: number; cond: string; hi: number; lo: number };
  allowSend: boolean;
  quickWords?: string[]; // 키보드 위 자동완성 단어
  phoneSeen?: boolean; // 전화 앱을 열어 봤는지 (부재중 알림 지우기)
  autoLockSec?: number; // 자동 잠금 (초, 0이면 끔) // 초안 외에 직접 타자 전송 허용
  events: {
    incomingCall: { enabled: boolean; afterSec: number; name: string; lines: string[] };
    banner: { enabled: boolean; afterSec: number; app: AppKind; title: string; text: string };
    lowBattery: { enabled: boolean; afterSec: number };
    watcher?: { enabled: boolean; afterSec: number }; // 오래 보면 한 번: Face ID가 얼굴을 못 알아보고 잠김
  };
  lockNotifs: { app: AppKind | "phone" | "bank"; title: string; text: string; when: string }[];
  threads: Thread[];
  calls: Call[];
  contacts: Contact[];
  notes: Note[];
  calendar: CalEvent[];
  dday: { title: string; date: string };
  bank: { name: string; account: string; balance: number; txs: Tx[] };
  songs: Song[];
  /** 홈 화면 배치 (앱 보이기 · 숨기기 · 순서) */
  home: HomeLayout;
  /** 직접 만든 앱들 */
  customApps: CustomApp[];
  photos: Photo[];
  ig: { me: IgUser; users: IgUser[]; feed: Post[]; stories: string[]; storyItems: Story[]; notes: { user: string; text: string }[]; seen?: string[] };
  safari: { tabs: SafariTab[]; history: string[]; favorites: { title: string; url: string }[] };
  alarms: Alarm[];
  places: Place[];
  kakaoProfile: { status: string };
  /** 숨은 장치: 키패드에 번호를 누르면 전화 (out: 걸면 받음 / in: 끊기면 잠시 뒤 걸려옴) */
  triggers?: { id: string; code: string; name: string; mode: "out" | "in"; lines: string[] }[];
  /** '업무' 앱: 들어온 의뢰와 진행 단계 */
  jobs: Job[];
  /** 스크린 타임 */
  screenTime: { total: string; hours: number[]; apps: [string, string][]; pickups: number; firstPickup: string };
  /** 음성 메모 (재생하면 글자로) */
  voiceMemos: { id: string; title: string; when: string; lines: string[] }[];
  /** 건강 앱 */
  health: { move: number; moveGoal: number; exercise: number; stand: number; km: number; sleep: string; heart: number[]; peakAt: string };
  /** 캐시워크 (개그용) */
  cashwalk: {
    steps: number;
    cash: number;
    todayWon: number;
    streak: number;
    bubbles: number;
    badges: string[];
    friends: { name: string; steps: number }[];
    quiz: { q: string; options: string[]; answer: number };
    shop: { name: string; price: number; note?: string }[];
    history: { name: string; when: string }[];
  };
  /** 벨소리·알림음 (에디터에서 올린 소리 파일, data URL) */
  sounds?: { ringtone?: string; notify?: string; muted?: boolean };
};

/* ───────── 저장소 (LocalStorage 자동 동기화) ───────── */
const KEY = "taesik-phone:data:v2"; // v2: 설정 개편 — 예전 저장본은 무시하고 새 기본값으로 시작
export const uid = () => Math.random().toString(36).slice(2, 10);

let state: PhoneData = load();
const listeners = new Set<() => void>();

/** 보안: 불러온 데이터가 폰 데이터 모양인지 확인하고, 모르는 항목·위험한 키는 버림 */
export function sanitize(o: unknown): PhoneData | null {
  if (!o || typeof o !== "object" || Array.isArray(o)) return null;
  const x = o as Record<string, unknown>;
  if (!Array.isArray(x.threads) || !Array.isArray(x.contacts) || !Array.isArray(x.notes)) return null;
  const base = defaultData() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(base)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    if (k in x && x[k] !== undefined && typeof x[k] === typeof base[k]) out[k] = x[k];
  }
  // 기본값에 없는 선택 항목들
  for (const k of ["sounds", "triggers", "decoyCode", "vault", "quickWords", "autoLockSec", "phoneSeen"]) if (k in x) out[k] = x[k];
  // 직접 만든 앱: 칸마다 모양 검사
  const pick = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
  out.customApps = (Array.isArray(x.customApps) ? x.customApps : [])
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      id: (typeof v.id === "string" && /^[\w-]{1,40}$/.test(v.id) ? v.id : Math.random().toString(36).slice(2)) as string,
      name: typeof v.name === "string" ? v.name.slice(0, 40) : "앱",
      iconBg: typeof v.iconBg === "string" && /^#[0-9a-f]{3,8}$/i.test(v.iconBg) ? v.iconBg : "#8E8E93",
      iconText: typeof v.iconText === "string" ? v.iconText.slice(0, 4) : "",
      iconImg: typeof v.iconImg === "string" && v.iconImg.startsWith("data:image/") ? v.iconImg : undefined,
      theme: pick(v.theme, ["light", "dark"] as const, "light"),
      tint: typeof v.tint === "string" && /^#[0-9a-f]{3,8}$/i.test(v.tint) ? v.tint : "#007AFF",
      layout: pick(v.layout, ["list", "feed", "grid", "page"] as const, "list"),
      header: typeof v.header === "string" ? v.header.slice(0, 200) : "",
      items: (Array.isArray(v.items) ? v.items : [])
        .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
        .slice(0, 300)
        .map((i) => ({ id: typeof i.id === "string" ? i.id.slice(0, 64) : Math.random().toString(36).slice(2), title: typeof i.title === "string" ? i.title.slice(0, 300) : "", sub: typeof i.sub === "string" ? i.sub.slice(0, 300) : "", body: typeof i.body === "string" ? i.body.slice(0, 10000) : "", photo: typeof i.photo === "string" ? i.photo.slice(0, 3_000_000) : "", when: typeof i.when === "string" ? i.when.slice(0, 60) : "" })),
    }));
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((i): i is string => typeof i === "string").slice(0, 60) : []);
  const h = (x.home && typeof x.home === "object" ? x.home : {}) as Record<string, unknown>;
  const baseHome = (base as unknown as { home: HomeLayout }).home;
  out.home = {
    grid: Array.isArray(h.grid) ? ids(h.grid) : baseHome.grid,
    dock: Array.isArray(h.dock) ? ids(h.dock).slice(0, 4) : baseHome.dock,
    folders: h.folders && typeof h.folders === "object" ? Object.fromEntries(Object.entries(h.folders as Record<string, unknown>).slice(0, 12).map(([k, v]) => [k.slice(0, 20), ids(v)])) : baseHome.folders,
  };
  // 노래: 칸마다 모양 검사 (이상한 값이 들어 있으면 고쳐서 받음 — 앱이 멈추지 않게)
  const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  out.songs = (Array.isArray(out.songs) ? out.songs : [])
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      id: str(v.id, 64) || Math.random().toString(36).slice(2),
      title: str(v.title, 300),
      artist: str(v.artist, 300),
      album: str(v.album, 300),
      url: str(v.url),
      hue: num(v.hue) ?? 200,
      cover: str(v.cover, 3_000_000).startsWith("data:image/") ? str(v.cover, 3_000_000) : undefined,
      dur: num(v.dur),
      lyrics: str(v.lyrics, 20000) || undefined,
      lyricsOffset: num(v.lyricsOffset),
      preview: str(v.preview) || undefined,
      yt: str(v.yt) || undefined,
    }));
  return out as unknown as PhoneData;
}

function load(): PhoneData {
  const base = defaultData();
  try {
    const raw = localStorage.getItem(KEY);
    const ver = localStorage.getItem(KEY + ":ver");
    // 기본 콘텐츠가 바뀌면(DATA_VERSION 증가) 예전 저장본 대신 새 내용으로 시작
    if (raw && ver === String(DATA_VERSION)) return sanitize(JSON.parse(raw)) ?? base;
  } catch {
    /* 비공개 창 등 */
  }
  return base;
}

export function getData() {
  return state;
}
export function setData(next: PhoneData) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(KEY + ":ver", String(DATA_VERSION));
  } catch {
    alert("저장 공간이 부족합니다. 업로드한 사진 수를 줄여 주세요.");
  }
  listeners.forEach((l) => l());
}
/* 되돌리기 / 다시 하기: 바뀌기 전 모습을 최근 30개까지 기억 (연달아 타자 친 건 한 번으로 묶음) */
const past: PhoneData[] = [];
const future: PhoneData[] = [];
let lastPush = 0;
export function update(fn: (d: PhoneData) => void) {
  const d = structuredClone(state);
  fn(d);
  const now = Date.now();
  // 글자 칸에서 연달아 타자 친 것만 한 번으로 묶음 (버튼 누른 건 하나씩 되돌림)
  const typing = typeof document !== "undefined" && (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement);
  if (!typing || now - lastPush > 800) {
    past.push(state);
    if (past.length > 30) past.shift();
  }
  lastPush = now;
  future.length = 0;
  setData(d);
}
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;
export function undo() {
  const p = past.pop();
  if (!p) return;
  future.push(state);
  lastPush = 0;
  setData(p);
}
export function redo() {
  const f = future.pop();
  if (!f) return;
  past.push(state);
  lastPush = 0;
  setData(f);
}
export function resetData() {
  setData(defaultData());
}
export function useData(): PhoneData {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// 다른 탭(예: /editor)에서 수정하면 폰 화면도 즉시 갱신
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        const s = sanitize(JSON.parse(e.newValue));
        if (s) {
          state = s;
          listeners.forEach((l) => l());
        }
      } catch {
        /* ignore */
      }
    }
  });
}

/* ───────── 공용 유틸 ───────── */
export const won = (n: number) => n.toLocaleString("ko-KR");
export const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* ───────── 게시 데이터 반영 (Supabase 또는 phone-data.json) ───────── */
export async function syncPublished() {
  const { fetchPublished, localRev, setLocalRev } = await import("./cloud");
  const pub = await fetchPublished();
  if (!pub || pub.rev <= localRev()) return false;
  const clean = sanitize(pub.data);
  if (!clean) return false;
  setData(clean);
  setLocalRev(pub.rev);
  return true;
}

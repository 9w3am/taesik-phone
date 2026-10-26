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
  auto?: string; // '나중에 일어나는 일'로 들어온 말 (새로 열면 사라지고 다시 일어남)
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
  auto?: string; // '나중에 일어나는 일'로 새로 생긴 방
};
/** 나중에 일어나는 일: 시간이 지나거나 어떤 방을 읽으면 메시지 · 전화 · 입금이 옴 */
export type LaterEv = {
  id: string;
  on: boolean;
  /** start: 잠금 풀고 몇 초 뒤 / read: 정한 대화방을 열고 몇 초 뒤 */
  when: "start" | "read";
  readThread?: string;
  afterSec: number;
  kind: "msg" | "call" | "deposit";
  /** 메시지: 보낼 방 (비우면 새 방) */
  thread?: string;
  newApp?: AppKind;
  newName?: string;
  /** 메시지 여러 줄 = 말풍선 여러 개 (차례로 도착) */
  texts: string[];
  /** 전화 */
  callName?: string;
  lines?: string[];
  /** 입금 */
  depositName?: string;
  amount?: number;
  /** 입금되면 메모에서 이 글이 들어간 체크 줄을 자동 체크 */
  checkNote?: string;
  /** 배너 알림 띄우기 */
  banner?: boolean;
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
export type Tx = { id: string; when: string; name: string; amount: number; memo: string; auto?: string };
/* ───── 흔히 쓰는 앱들 (메일 · 미리 알림 · 지갑 · 유튜브 · 넷플릭스 · X · 쿠팡 · 배민 · 카카오 T) ───── */
export type Mail = { id: string; from: string; addr: string; subject: string; body: string; when: string; unread: boolean; box: "inbox" | "sent" | "junk" | "trash"; flag?: boolean };
export type Reminder = { id: string; text: string; note: string; due: string; done: boolean; list: string; flag?: boolean };
export type WalletCard = { id: string; name: string; sub: string; number: string; color: string };
export type YtVideo = { id: string; title: string; channel: string; views: string; when: string; duration: string; hue: number; photo: string; progress: number; desc?: string };
export type NfTitle = { id: string; title: string; ep: string; progress: number; hue: number; photo: string; desc?: string; year?: string; eps?: number };
export type XPost = { id: string; name: string; handle: string; text: string; when: string; replies: number; reposts: number; likes: number; photo: string };
export type ShopOrder = { id: string; name: string; option: string; price: string; when: string; status: string; photo: string };
export type FoodOrder = { id: string; store: string; menu: string; price: string; when: string; status: string; photo: string };
export type Ride = { id: string; kind: string; from: string; to: string; when: string; price: string };
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
  | { type: "car"; photo?: string; title: string; price: string; specs: [string, string][]; body: string; dealer: string }
  | { type: "shop"; photo?: string; name: string; price: string; discount: string; rating: number; reviews: number; delivery: string; seller: string }
  | { type: "wiki"; title: string; updated: string; sections: { h: string; body: string }[] }
  | { type: "video"; title: string; channel: string; subs: string; views: string; when: string; duration: string; desc: string; comments: Comment[] }
  | { type: "sns"; query: string; posts: { name: string; handle: string; text: string; when: string; replies: number; reposts: number; likes: number }[] }
  | { type: "job"; site: string; company: string; title: string; pay: string; conditions: string[]; body: string }
  | { type: "news"; press: string; title: string; body: string; reporter: string }
  | { type: "blog"; category: string; title: string; author: string; when: string; body: string; photo: string; likes: number; comments: Comment[] }
  | { type: "qna"; question: string; detail: string; asker: string; when: string; views: number; answers: { who: string; text: string }[] }
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
  mail: Mail[];
  reminders: Reminder[];
  wallet: WalletCard[];
  youtube: { feed: YtVideo[]; history: YtVideo[]; searches: string[] };
  netflix: { profile: string; watching: NfTitle[]; myList: NfTitle[] };
  x: { name: string; handle: string; feed: XPost[] };
  coupang: ShopOrder[];
  baemin: FoodOrder[];
  kakaot: Ride[];
  /** 홈 화면 배치 버전 (새 앱 폴더가 생겼을 때 예전 저장본에도 넣어 주려고) */
  homeVer?: number;
  /** 기본 사진(무료 사진) 채움 버전 */
  photoVer?: number;
  photos: Photo[];
  ig: { me: IgUser; users: IgUser[]; feed: Post[]; stories: string[]; storyItems: Story[]; notes: { user: string; text: string }[]; seen?: string[] };
  safari: { tabs: SafariTab[]; history: string[]; favorites: { title: string; url: string }[] };
  alarms: Alarm[];
  places: Place[];
  kakaoProfile: { status: string };
  /** 숨은 장치: 키패드에 번호를 누르면 전화 (out: 걸면 받음 / in: 끊기면 잠시 뒤 걸려옴) */
  triggers?: { id: string; code: string; name: string; mode: "out" | "in"; lines: string[] }[];
  /** 나중에 일어나는 일 (시간 지나면 오는 메시지 · 전화 · 입금) */
  later?: LaterEv[];
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
  for (const k of ["sounds", "later", "triggers", "decoyCode", "vault", "quickWords", "autoLockSec", "phoneSeen", "photoVer"]) if (k in x) out[k] = x[k];
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
  // 예전 저장본: 새로 생긴 "생활" · "엔터" 폴더를 홈 화면에 넣어 줌 (한 번만)
  if (((x.homeVer as number) ?? 1) < 2) {
    const hm = out.home as HomeLayout;
    for (const [k, v] of Object.entries(baseHome.folders)) if (!hm.folders[k]) {
      hm.folders[k] = v;
      if (!hm.grid.includes("folder:" + k)) hm.grid.push("folder:" + k);
    }
  }
  out.homeVer = 2;
  // 예전 저장본: 비어 있던 사진 칸을 기본 사진으로 채움 (직접 넣은 사진은 그대로)
  if (!x.photoVer) {
    const b = base as unknown as PhoneData;
    const fill = <T extends { photo?: string }>(list: unknown, defs: T[], key: (t: T) => string) => {
      if (!Array.isArray(list)) return;
      for (const it of list as T[]) {
        if (!it || it.photo) continue;
        const m = defs.find((d) => key(d) === key(it));
        if (m?.photo) it.photo = m.photo;
      }
    };
    const o = out as unknown as PhoneData;
    fill(o.youtube?.feed, b.youtube.feed, (t) => t.title);
    fill(o.youtube?.history, b.youtube.history, (t) => t.title);
    fill(o.coupang, b.coupang, (t) => t.name);
    fill(o.baemin, b.baemin, (t) => t.store);
    const pages = (o.safari?.tabs ?? []).map((t) => t.page as { photo?: string; title?: string; name?: string });
    fill(pages, b.safari.tabs.map((t) => t.page as { photo?: string; title?: string; name?: string }), (p) => p.title ?? p.name ?? "");
  }
  out.photoVer = 1;
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

/** '나중에 일어나는 일'로 생긴 것들을 걷어 냄 (새로 열 때마다 다시 일어나게 · 내보낼 땐 원래 내용만) */
function AUTO_KEY() {
  return "taesik-phone:auto-checked";
}
export function cleanAuto(src: PhoneData): PhoneData {
  const d = structuredClone(src);
  d.threads = d.threads.filter((t) => !t.auto);
  for (const t of d.threads) t.messages = t.messages.filter((m) => !m.auto);
  const gone = d.bank.txs.filter((t) => t.auto);
  d.bank.balance -= gone.reduce((a, t) => a + t.amount, 0);
  d.bank.txs = d.bank.txs.filter((t) => !t.auto);
  // 자동으로 체크했던 메모 줄 되돌리기
  try {
    const ck = JSON.parse(localStorage.getItem(AUTO_KEY()) || "[]") as { note: string; line: string }[];
    for (const c of ck) {
      const n = d.notes.find((x) => x.id === c.note);
      if (n) n.body = n.body.split("\n").map((l) => (l === "[x] " + c.line ? "[ ] " + c.line : l)).join("\n");
    }
  } catch {
    /* 무시 */
  }
  return d;
}
/** 메모에서 글이 들어간 체크 줄을 체크 (되돌릴 수 있게 기록) */
export function autoCheck(d: PhoneData, text: string) {
  if (!text.trim()) return;
  for (const n of d.notes) {
    const ls = n.body.split("\n");
    let hit = false;
    ls.forEach((l, i) => {
      if (l.startsWith("[ ] ") && l.includes(text.trim())) {
        ls[i] = "[x] " + l.slice(4);
        hit = true;
        try {
          const ck = JSON.parse(localStorage.getItem(AUTO_KEY()) || "[]");
          ck.push({ note: n.id, line: l.slice(4) });
          localStorage.setItem(AUTO_KEY(), JSON.stringify(ck));
        } catch {
          /* 무시 */
        }
      }
    });
    if (hit) n.body = ls.join("\n");
  }
}

function load(): PhoneData {
  const base = defaultData();
  try {
    const raw = localStorage.getItem(KEY);
    const ver = localStorage.getItem(KEY + ":ver");
    // 기본 콘텐츠가 바뀌면(DATA_VERSION 증가) 예전 저장본 대신 새 내용으로 시작
    if (raw && ver === String(DATA_VERSION)) {
      const d = sanitize(JSON.parse(raw));
      const out = d ? cleanAuto(d) : base;
      localStorage.removeItem(AUTO_KEY());
      return out;
    }
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

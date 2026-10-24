import { useSyncExternalStore } from "react";
import { defaultData } from "./data";

/* ───────── 타입 ───────── */
export type AppKind = "messages" | "kakao" | "insta";
export type MsgKind = "text" | "pay" | "photo" | "deleted" | "call" | "link";
export type Msg = {
  id: string;
  from: "me" | "them" | "system";
  who?: string; // 단체방 발신자 이름
  text: string;
  kind?: MsgKind;
  amount?: number; // 송금 카드
  photo?: string; // 사진 id (procedural 또는 업로드)
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
export type Song = { id: string; title: string; artist: string; album: string; url: string; hue: number };
export type Photo = { id: string; kind?: string; asset?: string; src?: string; caption: string; when: string; album?: string; fav?: boolean };
export type Post = { id: string; user: string; caption: string; photo: string; likes: number; comments: number; when: string };
export type Story = { id: string; user: string; text: string; bg: string; when: string; photo?: string };
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
export type Alarm = { id: string; time: string; label: string; on: boolean };
export type Place = { id: string; name: string; note: string; x: number; y: number };

export type PhoneData = {
  owner: string;
  deviceName: string;
  passcode: string;
  passcodeHint: string;
  carrier: string;
  battery: number;
  weather: { city: string; temp: number; cond: string; hi: number; lo: number };
  allowSend: boolean; // 초안 외에 직접 타자 전송 허용
  events: {
    incomingCall: { enabled: boolean; afterSec: number; name: string; lines: string[] };
    banner: { enabled: boolean; afterSec: number; app: AppKind; title: string; text: string };
    lowBattery: { enabled: boolean; afterSec: number };
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
  photos: Photo[];
  ig: { me: IgUser; users: IgUser[]; feed: Post[]; stories: string[]; storyItems: Story[]; notes: { user: string; text: string }[]; seen?: string[] };
  safari: { tabs: SafariTab[]; history: string[]; favorites: { title: string; url: string }[] };
  alarms: Alarm[];
  places: Place[];
  kakaoProfile: { status: string };
};

/* ───────── 저장소 (LocalStorage 자동 동기화) ───────── */
const KEY = "taesik-phone:data:v2"; // v2: 설정 개편 — 예전 저장본은 무시하고 새 기본값으로 시작
export const uid = () => Math.random().toString(36).slice(2, 10);

let state: PhoneData = load();
const listeners = new Set<() => void>();

function load(): PhoneData {
  const base = defaultData();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
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
  } catch {
    alert("저장 공간이 부족합니다. 업로드한 사진 수를 줄여 주세요.");
  }
  listeners.forEach((l) => l());
}
export function update(fn: (d: PhoneData) => void) {
  const d = structuredClone(state);
  fn(d);
  setData(d);
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
        state = { ...defaultData(), ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
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
  const { _rev, ...rest } = pub.data as PhoneData & { _rev?: number };
  void _rev;
  setData({ ...defaultData(), ...rest });
  setLocalRev(pub.rev);
  return true;
}

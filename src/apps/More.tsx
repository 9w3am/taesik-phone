/* 흔히 쓰는 앱들 — 메일 · 미리 알림 · 지갑 · 유튜브 · 넷플릭스 · X · 쿠팡 · 배달의민족 · 카카오 T
   내용은 전부 편집 화면 '사파리 · 그 밖의 앱'에서 고침. 실제 앱 화면 배치 · 색 · 버튼을 따라 그림 */
import { useState } from "react";
import {
  ChevronLeft, ChevronRight, SquarePen, Inbox, Send as SendIcon, ShieldAlert, Trash2, Reply, Flag, Archive, Plus, Calendar as CalIcon, CalendarClock, List, CheckCircle2, Circle, MoreHorizontal,
  Search, Bell, Cast, House, Clapperboard, CirclePlus, Youtube, User, Play, Download, MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, Mail as MailIcon, Users, ShoppingCart, LayoutGrid, Menu, MapPin, Car, Bike, ParkingSquare, ArrowUpRight, Clock, Package, UtensilsCrossed,
} from "lucide-react";
import { useData, update, type Mail, type YtVideo, type NfTitle, type XPost } from "../store";
import { photoSrc } from "../photos";
import { LargeTitle, NavBar, TabBar, useScrolled, useStatusBar, Img } from "../ui";

const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const Avatar = ({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) => (
  <span className="rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(160deg, hsl(${hue ?? hueOf(name)} 25% 62%), hsl(${hue ?? hueOf(name)} 22% 44%))` }}>
    {name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 1).toUpperCase() || "?"}
  </span>
);
/** 썸네일: 올린 사진이 있으면 사진, 없으면 색 그라데이션 */
function Thumb({ photo, hue, className, style, children, text }: { photo: string; hue: number; className?: string; style?: React.CSSProperties; children?: React.ReactNode; text?: string }) {
  const d = useData();
  const src = photoSrc(photo, d.photos);
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 40% 38%), hsl(${(hue + 40) % 360} 35% 18%))`, ...style }}>
      {src && <Img src={src} className="absolute inset-0 w-full h-full" />}
      {!src && text && (
        <span className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 text-white font-black leading-[1.15] tracking-[-0.03em] line-clamp-3" style={{ fontSize: "clamp(13px, 7cqw, 26px)", textShadow: "0 2px 0 rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.3)", WebkitTextStroke: "0.5px rgba(0,0,0,0.3)" }}>
          {text}
        </span>
      )}
      {children}
    </div>
  );
}

/* ═════════════ 메일 (iOS) ═════════════ */
const BOX_NAME: Record<Mail["box"], string> = { inbox: "받은 편지함", sent: "보낸 편지함", junk: "정크" };
export function MailApp() {
  useStatusBar(true);
  const d = useData();
  const [box, setBox] = useState<Mail["box"] | null>("inbox");
  const [openId, setOpenId] = useState<string | null>(null);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const list = d.mail.filter((m) => m.box === box);
  const cur = d.mail.find((m) => m.id === openId);
  const open = (m: Mail) => {
    setOpenId(m.id);
    if (m.unread)
      update((x) => {
        const y = x.mail.find((z) => z.id === m.id);
        if (y) y.unread = false;
      });
  };
  return (
    <div className="absolute inset-0 bg-white">
      {box === null ? (
        <>
          <NavBar title="메일상자" scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} />
          <div ref={ref} className="absolute inset-0 scroll bg-[#F2F2F7]" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
            <LargeTitle>메일상자</LargeTitle>
            <div className="mx-4 rounded-[12px] bg-white overflow-hidden">
              {(
                [
                  ["inbox", <Inbox key="i" size={24} />],
                  ["sent", <SendIcon key="s" size={22} />],
                  ["junk", <ShieldAlert key="j" size={23} />],
                ] as const
              ).map(([b, icon], i) => {
                const n = d.mail.filter((m) => m.box === b && (b === "inbox" ? m.unread : true)).length;
                return (
                  <button key={b} onClick={() => setBox(b)} className="w-full flex items-center gap-[14px] pl-[14px] text-left active:bg-black/5">
                    <span className="text-[#007AFF] w-[26px] flex justify-center">{icon}</span>
                    <span className={`flex-1 flex items-center py-[12px] pr-[12px] ${i < 2 ? "hair-b" : ""}`}>
                      <span className="flex-1 text-[17px]">{BOX_NAME[b]}</span>
                      {n > 0 && <span className="text-[17px] text-black/45 mr-1">{n}</span>}
                      <ChevronRight size={18} className="text-black/25" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <NavBar title={BOX_NAME[box]} back="메일상자" onBack={() => setBox(null)} scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} />
          <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
            <LargeTitle>{BOX_NAME[box]}</LargeTitle>
            <div className="px-4 pb-2">
              <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
                <Search size={16} /> 검색
              </div>
            </div>
            {list.length === 0 && <div className="text-center text-black/35 pt-[100px]">메일 없음</div>}
            {list.map((m) => (
              <button key={m.id} onClick={() => open(m)} className="w-full flex text-left active:bg-black/5">
                <span className="w-[26px] flex justify-center pt-[16px] shrink-0">{m.unread && <span className="w-[10px] h-[10px] rounded-full bg-[#007AFF]" />}</span>
                <div className="flex-1 min-w-0 py-[10px] pr-4 hair-b">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 text-[17px] font-semibold truncate">{m.from}</span>
                    <span className="text-[15px] text-black/45 shrink-0 flex items-center">
                      {m.when}
                      <ChevronRight size={15} className="text-black/25 ml-1" />
                    </span>
                  </div>
                  <div className="text-[15px] truncate">{m.subject}</div>
                  <div className="text-[15px] text-black/45 leading-[20px] line-clamp-2">{m.body.replace(/\n+/g, " ")}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {/* 아래 도구 막대 */}
      <div className="absolute bottom-0 left-0 right-0 blur-bar flex items-center justify-between px-[18px] pt-[10px] text-[#007AFF]" style={{ paddingBottom: "calc(var(--sab) + 4px)", background: "rgba(249,249,249,0.92)", boxShadow: "inset 0 0.5px 0 var(--sep)" }}>
        <span className="w-[24px]" />
        <span className="text-[11px] text-black/70">방금 업데이트됨</span>
        <SquarePen size={24} />
      </div>
      {cur && (
        <div className="absolute inset-0 z-30 bg-white push flex flex-col">
          <div style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[44px] flex items-center px-2 text-[#007AFF]">
              <button data-back onClick={() => setOpenId(null)} className="flex items-center text-[17px]">
                <ChevronLeft size={28} strokeWidth={2.2} /> {BOX_NAME[cur.box]}
              </button>
            </div>
          </div>
          <div className="flex-1 scroll px-4 pb-[90px]">
            <div className="flex items-center gap-[12px] py-[10px] hair-b">
              <Avatar name={cur.from} size={42} hue={210} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline">
                  <span className="flex-1 text-[17px] font-semibold truncate">{cur.from}</span>
                  <span className="text-[14px] text-black/45">{cur.when}</span>
                </div>
                <div className="text-[14px] text-black/45 truncate">받는 사람: 나</div>
              </div>
            </div>
            <div className="text-[22px] font-bold leading-[28px] mt-[14px]">{cur.subject}</div>
            <div className="text-[13px] text-black/40 mt-[2px]">{cur.addr}</div>
            <div className="text-[16px] leading-[24px] mt-[18px] whitespace-pre-wrap">{cur.body}</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 blur-bar flex items-center justify-around pt-[10px] text-[#007AFF]" style={{ paddingBottom: "calc(var(--sab) + 4px)", background: "rgba(249,249,249,0.92)", boxShadow: "inset 0 0.5px 0 var(--sep)" }}>
            <Trash2 size={22} />
            <Archive size={22} />
            <Flag size={22} />
            <Reply size={24} />
            <SquarePen size={22} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════ 미리 알림 (iOS) ═════════════ */
const LIST_COLOR = ["#007AFF", "#FF9500", "#34C759", "#AF52DE", "#FF2D55", "#5AC8FA"];
export function RemindersApp() {
  useStatusBar(true);
  const d = useData();
  const [view, setView] = useState<null | { title: string; color: string; filter: (r: (typeof d.reminders)[number]) => boolean }>(null);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const lists = [...new Set(d.reminders.map((r) => r.list || "미리 알림"))];
  const toggle = (rid: string) =>
    update((x) => {
      const y = x.reminders.find((z) => z.id === rid);
      if (y) y.done = !y.done;
    });
  const smart: [string, string, React.ReactNode, (r: (typeof d.reminders)[number]) => boolean][] = [
    ["오늘", "#007AFF", <CalIcon key="t" size={17} color="#fff" />, (r) => r.due === "오늘" && !r.done],
    ["예정", "#FF3B30", <CalendarClock key="s" size={17} color="#fff" />, (r) => !!r.due && !r.done],
    ["전체", "#3A3A3C", <Inbox key="a" size={17} color="#fff" />, (r) => !r.done],
    ["완료됨", "#8E8E93", <CheckCircle2 key="d" size={17} color="#fff" />, (r) => r.done],
  ];
  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      <NavBar title="" scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} bg="rgba(242,242,247,0.9)" />
      <div ref={ref} className="absolute inset-0 scroll px-4" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
        <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px] mb-[14px]">
          <Search size={16} /> 검색
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {smart.map(([name, color, icon, f]) => (
            <button key={name} onClick={() => setView({ title: name, color, filter: f })} className="rounded-[12px] bg-white p-[10px] text-left active:opacity-70">
              <div className="flex justify-between items-start">
                <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: color }}>
                  {icon}
                </span>
                <span className="text-[28px] font-bold leading-[30px]">{d.reminders.filter(f).length}</span>
              </div>
              <div className="text-[16px] font-semibold text-black/60 mt-[8px]">{name}</div>
            </button>
          ))}
        </div>
        <div className="text-[20px] font-bold mt-[24px] mb-[8px]">나의 목록</div>
        <div className="rounded-[12px] bg-white overflow-hidden">
          {lists.map((l, i) => (
            <button key={l} onClick={() => setView({ title: l, color: LIST_COLOR[i % LIST_COLOR.length], filter: (r) => (r.list || "미리 알림") === l && !r.done })} className="w-full flex items-center gap-[12px] pl-[12px] text-left active:bg-black/5">
              <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: LIST_COLOR[i % LIST_COLOR.length] }}>
                <List size={16} color="#fff" strokeWidth={2.6} />
              </span>
              <span className={`flex-1 flex items-center py-[12px] pr-[12px] ${i < lists.length - 1 ? "hair-b" : ""}`}>
                <span className="flex-1 text-[17px]">{l}</span>
                <span className="text-[17px] text-black/45 mr-1">{d.reminders.filter((r) => (r.list || "미리 알림") === l && !r.done).length}</span>
                <ChevronRight size={18} className="text-black/25" />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pt-[10px] text-[#007AFF] text-[17px]" style={{ paddingBottom: "calc(var(--sab) + 6px)" }}>
        <span className="flex items-center gap-[6px] font-semibold">
          <span className="w-[22px] h-[22px] rounded-full bg-[#007AFF] flex items-center justify-center">
            <Plus size={16} color="#fff" strokeWidth={3} />
          </span>
          새로운 미리 알림
        </span>
        <span>목록 추가</span>
      </div>
      {view && (
        <div className="absolute inset-0 z-30 bg-white push flex flex-col">
          <div style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[44px] flex items-center justify-between px-2 text-[#007AFF]">
              <button data-back onClick={() => setView(null)} className="flex items-center text-[17px]">
                <ChevronLeft size={28} strokeWidth={2.2} /> 목록
              </button>
              <MoreHorizontal size={22} className="mr-2" />
            </div>
          </div>
          <div className="flex-1 scroll px-4 pb-[90px]">
            <div className="text-[34px] font-bold mb-[6px]" style={{ color: view.color }}>
              {view.title}
            </div>
            {d.reminders.filter(view.filter).length === 0 && <div className="text-black/35 text-center pt-[90px]">미리 알림 없음</div>}
            {d.reminders.filter(view.filter).map((r) => (
              <div key={r.id} className="flex gap-[12px] py-[10px] hair-b">
                <button onClick={() => toggle(r.id)} aria-label="완료" className="pt-[1px] shrink-0">
                  {r.done ? (
                    <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${view.color}` }}>
                      <span className="w-[14px] h-[14px] rounded-full" style={{ background: view.color }} />
                    </span>
                  ) : (
                    <Circle size={22} className="text-black/25" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-[17px] ${r.done ? "text-black/35" : ""}`}>{r.text}</div>
                  {r.note && <div className="text-[15px] text-black/45">{r.note}</div>}
                  {r.due && <div className="text-[15px]" style={{ color: r.due === "오늘" && !r.done ? "#FF3B30" : "rgba(0,0,0,0.45)" }}>{r.due}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════ 지갑 (iOS Wallet) ═════════════ */
export function WalletApp() {
  useStatusBar(true);
  const d = useData();
  const [sel, setSel] = useState<string | null>(null);
  const cards = d.wallet;
  const si = cards.findIndex((c) => c.id === sel);
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll px-4" style={{ paddingTop: "calc(var(--sat) + 10px)", paddingBottom: 40 }}>
        <div className="flex items-center justify-between h-[44px]">
          <span className="text-[34px] font-bold">지갑</span>
          <div className="flex gap-[10px]">
            <span className="w-[32px] h-[32px] rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <Plus size={20} />
            </span>
            <span className="w-[32px] h-[32px] rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <MoreHorizontal size={20} />
            </span>
          </div>
        </div>
        {cards.length === 0 && <div className="text-center text-black/35 pt-[120px]">카드 없음</div>}
        {/* 카드 묶음: 겹쳐 쌓여 있고, 누르면 그 카드가 펼쳐짐 */}
        <div className="relative mt-[14px]" style={{ height: cards.length ? (si >= 0 ? 230 + 46 * (cards.length - 1) + 140 : 230 + 52 * (cards.length - 1)) : 0 }}>
          {cards.map((c, i) => {
            const top = si < 0 ? i * 52 : i === si ? 0 : 230 + 46 * (i < si ? i : i - 1) + 14;
            return (
              <button
                key={c.id}
                onClick={() => setSel(sel === c.id ? null : c.id)}
                className="absolute left-0 right-0 h-[215px] rounded-[16px] p-[16px] text-left text-white flex flex-col"
                style={{ top, background: `linear-gradient(145deg, ${c.color}, ${c.color}cc)`, boxShadow: "0 -1px 0 rgba(255,255,255,0.15) inset, 0 4px 18px rgba(0,0,0,0.18)", transition: "top .45s cubic-bezier(.2,.9,.25,1)", zIndex: i === si ? 50 : i }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[17px] font-semibold">{c.name}</span>
                  <span className="text-[12px] opacity-80">{c.sub}</span>
                </div>
                <div className="flex-1" />
                <div className="text-[17px] tabular tracking-[1px] opacity-90">{c.number}</div>
              </button>
            );
          })}
          {si >= 0 && (
            <div className="absolute left-0 right-0 text-center" style={{ top: 230 + 46 * (cards.length - 1) + 40 }}>
              <div className="text-[15px] text-black/45">카드를 누르면 다시 쌓여요</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════ 유튜브 ═════════════ */
function YtCard({ v, onOpen }: { v: YtVideo; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left pb-[18px]">
      <Thumb photo={v.photo} hue={v.hue} className="w-full aspect-video" style={{ containerType: "inline-size" }} text={v.title.split(/[([]/)[0].trim()}>
        <span className="absolute right-[8px] bottom-[8px] text-[12px] font-semibold text-white bg-black/80 rounded-[4px] px-[4px] py-[1px]">{v.duration}</span>
        {v.progress > 0 && <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${v.progress * 100}%` }} />}
      </Thumb>
      <div className="flex gap-[12px] px-[12px] pt-[10px]">
        <Avatar name={v.channel} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] leading-[20px] font-medium line-clamp-2">{v.title}</div>
          <div className="text-[12px] text-black/55 mt-[2px]">
            {v.channel} · {v.views} · {v.when}
          </div>
        </div>
        <MoreHorizontal size={18} className="rotate-90 text-black/70 shrink-0" />
      </div>
    </button>
  );
}
export function YoutubeApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("home");
  const [chip, setChip] = useState("전체");
  const [play, setPlay] = useState<YtVideo | null>(null);
  const yt = d.youtube;
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[44px] flex items-center px-[12px] gap-[18px]">
          <span className="flex items-center gap-[2px] flex-1">
            <svg width="30" height="21" viewBox="0 0 30 21">
              <rect width="30" height="21" rx="6" fill="#FF0000" />
              <path d="M12 6v9l8-4.5z" fill="#fff" />
            </svg>
            <span className="text-[19px] font-bold tracking-[-1px] ml-[2px]" style={{ fontFamily: "Arial, sans-serif" }}>
              YouTube
            </span>
          </span>
          <Cast size={22} />
          <Bell size={22} />
          <Search size={22} />
        </div>
        {tab === "home" && (
          <div className="flex gap-[8px] px-[12px] pb-[10px] overflow-x-auto no-scrollbar">
            {["전체", "음악", "게임", "운동", "자동차", "뉴스", "최근에 업로드된 동영상"].map((c) => (
              <button key={c} onClick={() => setChip(c)} className="h-[32px] px-[12px] rounded-[8px] text-[14px] font-medium whitespace-nowrap shrink-0" style={chip === c ? { background: "#0F0F0F", color: "#fff" } : { background: "rgba(0,0,0,0.05)" }}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 scroll" style={{ paddingTop: `calc(var(--sat) + ${tab === "home" ? 86 : 44}px)`, paddingBottom: 100 }}>
        {tab === "home" && (yt.feed.length ? yt.feed.map((v) => <YtCard key={v.id} v={v} onOpen={() => setPlay(v)} />) : <div className="text-center text-black/35 pt-[100px]">동영상 없음</div>)}
        {tab === "shorts" && <div className="text-center text-black/35 pt-[140px]">Shorts</div>}
        {tab === "subs" && <div className="text-center text-black/35 pt-[140px]">구독한 채널의 새 동영상이 없습니다</div>}
        {tab === "me" && (
          <div className="px-[12px]">
            <div className="flex items-center gap-[14px] py-[10px]">
              <span className="w-[64px] h-[64px] rounded-full bg-[#5C6BC0] text-white text-[28px] font-semibold flex items-center justify-center">T</span>
              <div>
                <div className="text-[22px] font-bold">내 채널</div>
                <div className="text-[13px] text-black/55">채널 보기 ›</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-[14px] mb-[10px]">
              <span className="text-[20px] font-bold">기록</span>
              <span className="text-[14px] font-medium border border-black/15 rounded-full px-[12px] h-[30px] flex items-center">모두 보기</span>
            </div>
            <div className="flex gap-[10px] overflow-x-auto no-scrollbar -mx-[12px] px-[12px]">
              {yt.history.map((v) => (
                <button key={v.id} onClick={() => setPlay(v)} className="w-[160px] shrink-0 text-left">
                  <Thumb photo={v.photo} hue={v.hue} className="w-full aspect-video rounded-[10px]" style={{ containerType: "inline-size" }} text={v.title.split(/[([]/)[0].trim()}>
                    <span className="absolute right-[6px] bottom-[6px] text-[11px] font-semibold text-white bg-black/80 rounded-[4px] px-[4px]">{v.duration}</span>
                    {v.progress > 0 && <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${v.progress * 100}%` }} />}
                  </Thumb>
                  <div className="text-[13px] font-medium leading-[17px] line-clamp-2 mt-[6px]">{v.title}</div>
                  <div className="text-[12px] text-black/55 truncate">{v.channel}</div>
                </button>
              ))}
            </div>
            {yt.searches.length > 0 && (
              <>
                <div className="text-[20px] font-bold mt-[24px] mb-[6px]">최근 검색어</div>
                {yt.searches.map((s) => (
                  <div key={s} className="flex items-center gap-[14px] py-[10px] text-[16px]">
                    <Clock size={20} className="text-black/55" />
                    <span className="flex-1">{s}</span>
                    <ArrowUpRight size={18} className="text-black/40 -scale-x-100" />
                  </div>
                ))}
              </>
            )}
            {[
              [<Play key="1" size={22} />, "내 동영상"],
              [<Download key="2" size={22} />, "오프라인 저장 동영상"],
            ].map(([ic, l]) => (
              <div key={l as string} className="flex items-center gap-[18px] py-[12px] text-[16px]">
                {ic}
                {l}
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#0F0F0F"
        inactive="#0F0F0F"
        bg="#fff"
        items={[
          { id: "home", label: "홈", icon: <House size={24} fill={tab === "home" ? "#0F0F0F" : "none"} strokeWidth={1.7} /> },
          { id: "shorts", label: "Shorts", icon: <Clapperboard size={23} strokeWidth={1.7} /> },
          { id: "add", label: "", icon: <CirclePlus size={34} strokeWidth={1.1} /> },
          { id: "subs", label: "구독", icon: <Youtube size={24} strokeWidth={1.7} /> },
          { id: "me", label: "나", icon: <User size={24} strokeWidth={1.7} fill={tab === "me" ? "#0F0F0F" : "none"} /> },
        ]}
      />
      {play && (
        <div className="absolute inset-0 z-30 bg-white sheet flex flex-col" style={{ paddingTop: "var(--sat)" }}>
          <Thumb photo={play.photo} hue={play.hue} className="w-full aspect-video shrink-0">
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="w-[56px] h-[56px] rounded-full bg-black/50 flex items-center justify-center">
                <Play size={28} fill="#fff" color="#fff" />
              </span>
            </div>
            <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${Math.max(0.02, play.progress) * 100}%` }} />
          </Thumb>
          <div className="flex-1 scroll px-[12px] pt-[12px]">
            <div className="text-[18px] font-bold leading-[24px]">{play.title}</div>
            <div className="text-[12px] text-black/55 mt-[4px]">
              {play.views} · {play.when}
            </div>
            <div className="flex items-center gap-[10px] mt-[14px]">
              <Avatar name={play.channel} size={36} />
              <span className="flex-1 text-[15px] font-semibold">{play.channel}</span>
              <span className="h-[34px] px-[16px] rounded-full bg-[#0F0F0F] text-white text-[14px] font-semibold flex items-center">구독</span>
            </div>
            <div className="flex gap-[8px] mt-[14px] overflow-x-auto no-scrollbar">
              {["👍 좋아요", "공유", "오프라인 저장", "저장"].map((b) => (
                <span key={b} className="h-[34px] px-[14px] rounded-full bg-black/5 text-[14px] font-medium flex items-center whitespace-nowrap">
                  {b}
                </span>
              ))}
            </div>
            <div className="rounded-[12px] bg-black/5 p-[12px] mt-[14px] text-[14px]">
              <span className="font-semibold">댓글</span>
              <div className="text-black/55 mt-[4px]">댓글이 사용 중지되었습니다.</div>
            </div>
          </div>
          <button data-back onClick={() => setPlay(null)} className="absolute right-[12px] w-[32px] h-[32px] rounded-full bg-black/50 text-white flex items-center justify-center" style={{ top: "calc(var(--sat) + 8px)" }} aria-label="닫기">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ═════════════ 넷플릭스 ═════════════ */
function NfPoster({ t, w = 108 }: { t: NfTitle; w?: number }) {
  return (
    <div className="shrink-0" style={{ width: w }}>
      <Thumb photo={t.photo} hue={t.hue} className="rounded-[4px]" style={{ width: w, height: w * 1.45 }}>
        <span className="absolute left-[6px] top-[4px] text-[#E50914] font-black text-[18px]" style={{ fontFamily: "Arial Black, sans-serif" }}>
          N
        </span>
        <span className="absolute left-[6px] right-[6px] bottom-[8px] text-white text-[13px] font-bold leading-[16px]" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {t.title}
        </span>
      </Thumb>
      {t.progress > 0 && (
        <div className="h-[3px] bg-white/25 mt-[3px] rounded-full overflow-hidden">
          <div className="h-full bg-[#E50914]" style={{ width: `${t.progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
export function NetflixApp() {
  useStatusBar(false);
  const d = useData();
  const n = d.netflix;
  const [tab, setTab] = useState("home");
  const hero = n.watching[0] ?? n.myList[0];
  return (
    <div className="absolute inset-0 bg-black text-white">
      <div className="absolute inset-0 scroll" style={{ paddingBottom: 100 }}>
        {tab === "home" ? (
          <>
            <div className="relative" style={{ paddingTop: "var(--sat)" }}>
              {hero && <Thumb photo={hero.photo} hue={hero.hue} className="absolute inset-0" style={{ opacity: 0.55 }} />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 30%, transparent 55%, #000)" }} />
              <div className="relative">
                <div className="h-[44px] flex items-center px-[16px] gap-[18px]">
                  <span className="flex-1 text-[22px] font-bold">{n.profile ? `${n.profile}님` : "회원님"}을 위한 콘텐츠</span>
                  <Download size={22} />
                  <Search size={22} />
                </div>
                <div className="flex gap-[8px] px-[16px] mt-[4px]">
                  {["시리즈", "영화", "카테고리 ⌄"].map((c) => (
                    <span key={c} className="h-[32px] px-[14px] rounded-full border border-white/50 text-[14px] flex items-center">
                      {c}
                    </span>
                  ))}
                </div>
                {hero && (
                  <div className="mx-[24px] mt-[18px] mb-[22px] rounded-[10px] overflow-hidden border border-white/15" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                    <Thumb photo={hero.photo} hue={hero.hue} className="w-full" style={{ aspectRatio: "3/4" }}>
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85))" }} />
                      <div className="absolute left-0 right-0 bottom-[16px] px-[16px] text-center">
                        <div className="text-[32px] font-black leading-[36px]">{hero.title}</div>
                        <div className="flex gap-[10px] mt-[14px]">
                          <span className="flex-1 h-[40px] rounded-[4px] bg-white text-black text-[16px] font-bold flex items-center justify-center gap-[6px]">
                            <Play size={20} fill="#000" /> 재생
                          </span>
                          <span className="flex-1 h-[40px] rounded-[4px] bg-white/25 text-white text-[16px] font-bold flex items-center justify-center gap-[6px]">
                            <Plus size={20} /> 내가 찜한 리스트
                          </span>
                        </div>
                      </div>
                    </Thumb>
                  </div>
                )}
              </div>
            </div>
            {n.watching.length > 0 && (
              <>
                <div className="px-[16px] text-[19px] font-bold mb-[8px]">{n.profile ? `${n.profile}님` : "회원님"}이 시청 중인 콘텐츠</div>
                <div className="flex gap-[8px] px-[16px] overflow-x-auto no-scrollbar mb-[22px]">
                  {n.watching.map((t) => (
                    <div key={t.id}>
                      <NfPoster t={t} />
                      <div className="text-[11px] text-white/55 mt-[3px] w-[108px] truncate">{t.ep}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {n.myList.length > 0 && (
              <>
                <div className="px-[16px] text-[19px] font-bold mb-[8px]">내가 찜한 리스트</div>
                <div className="flex gap-[8px] px-[16px] overflow-x-auto no-scrollbar">
                  {n.myList.map((t) => (
                    <NfPoster key={t.id} t={t} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="px-[16px]" style={{ paddingTop: "calc(var(--sat) + 10px)" }}>
            <div className="text-[24px] font-bold mb-[14px]">{tab === "new" ? "NEW & HOT" : "나의 넷플릭스"}</div>
            {tab === "my" ? (
              <>
                <div className="flex flex-col items-center py-[10px]">
                  <span className="w-[72px] h-[72px] rounded-[6px] bg-[#0071EB] text-[30px] font-bold flex items-center justify-center">{n.profile || "?"}</span>
                  <div className="text-[18px] font-bold mt-[8px]">{n.profile || "프로필"}</div>
                </div>
                <div className="text-[17px] font-bold mt-[16px] mb-[8px]">시청 중인 콘텐츠</div>
                <div className="flex gap-[8px] overflow-x-auto no-scrollbar">
                  {n.watching.map((t) => (
                    <NfPoster key={t.id} t={t} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-white/45 text-center pt-[100px]">공개 예정 콘텐츠 없음</div>
            )}
          </div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#fff"
        inactive="#808080"
        dark
        bg="rgba(18,18,18,0.96)"
        items={[
          { id: "home", label: "홈", icon: <House size={23} fill={tab === "home" ? "#fff" : "none"} strokeWidth={1.7} /> },
          { id: "new", label: "NEW & HOT", icon: <Clapperboard size={23} strokeWidth={1.7} /> },
          { id: "my", label: "나의 넷플릭스", icon: <span className="w-[22px] h-[22px] rounded-[4px] bg-[#0071EB] text-[12px] font-bold text-white flex items-center justify-center">{n.profile.slice(0, 1) || "?"}</span> },
        ]}
      />
    </div>
  );
}

/* ═════════════ X (트위터) — 아이디는 랜덤 ═════════════ */
const fmtN = (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(1).replace(/\.0$/, "")}만` : v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}천` : String(v || ""));
function XRow({ p }: { p: XPost }) {
  const d = useData();
  const [liked, setLiked] = useState(false);
  const src = photoSrc(p.photo, d.photos);
  return (
    <div className="flex gap-[10px] px-[14px] py-[12px] hair-b">
      <Avatar name={p.name || p.handle} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[4px] text-[15px]">
          <span className="font-bold truncate max-w-[45%]">{p.name}</span>
          <span className="text-[#536471] truncate">
            {p.handle} · {p.when}
          </span>
          <span className="flex-1" />
          <MoreHorizontal size={16} className="text-[#536471] shrink-0" />
        </div>
        <div className="text-[15px] leading-[20px] whitespace-pre-wrap mt-[1px]">{p.text}</div>
        {src && <Img src={src} className="w-full rounded-[16px] mt-[10px] border border-black/10" style={{ aspectRatio: "16/10" }} />}
        <div className="flex justify-between text-[#536471] text-[13px] mt-[10px] pr-[6px]">
          <span className="flex items-center gap-[5px]">
            <MessageCircle size={17} /> {fmtN(p.replies)}
          </span>
          <span className="flex items-center gap-[5px]">
            <Repeat2 size={18} /> {fmtN(p.reposts)}
          </span>
          <button onClick={() => setLiked(!liked)} className="flex items-center gap-[5px]" style={{ color: liked ? "#F91880" : undefined }}>
            <Heart size={17} fill={liked ? "#F91880" : "none"} /> {fmtN(p.likes + (liked ? 1 : 0))}
          </button>
          <span className="flex items-center gap-[5px]">
            <BarChart2 size={17} /> {fmtN(p.likes * 37 + 120)}
          </span>
          <span className="flex items-center gap-[12px]">
            <Bookmark size={17} />
            <Share size={17} />
          </span>
        </div>
      </div>
    </div>
  );
}
export function XApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState<"for" | "following">("for");
  const [nav, setNav] = useState("home");
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute top-0 left-0 right-0 z-10 blur-bar" style={{ paddingTop: "var(--sat)", background: "rgba(255,255,255,0.88)" }}>
        <div className="h-[44px] flex items-center justify-between px-[14px]">
          <Avatar name={d.x.name || d.x.handle || "?"} size={32} />
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43z" fill="#0F1419" />
          </svg>
          <span className="w-[32px]" />
        </div>
        {nav === "home" && (
          <div className="flex hair-b">
            {(
              [
                ["for", "추천"],
                ["following", "팔로우 중"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className="flex-1 h-[46px] flex flex-col items-center justify-center text-[15px]" style={{ fontWeight: tab === k ? 700 : 500, color: tab === k ? "#0F1419" : "#536471" }}>
                <span className="relative">
                  {l}
                  {tab === k && <span className="absolute left-0 right-0 -bottom-[12px] h-[4px] rounded-full bg-[#1D9BF0]" />}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 scroll" style={{ paddingTop: `calc(var(--sat) + ${nav === "home" ? 91 : 44}px)`, paddingBottom: 100 }}>
        {nav === "home" ? (
          tab === "for" ? (
            d.x.feed.length ? d.x.feed.map((p) => <XRow key={p.id} p={p} />) : <div className="text-center text-[#536471] pt-[100px]">게시물 없음</div>
          ) : (
            <div className="px-[30px] pt-[60px]">
              <div className="text-[28px] font-extrabold leading-[32px]">팔로우하는 계정이 없습니다</div>
              <div className="text-[15px] text-[#536471] mt-[8px]">계정을 팔로우하면 여기에 게시물이 표시됩니다.</div>
            </div>
          )
        ) : nav === "search" ? (
          <div className="px-[14px]">
            <div className="h-[38px] rounded-full bg-[#EFF3F4] flex items-center gap-[8px] px-[14px] text-[#536471] text-[15px]">
              <Search size={17} /> 검색
            </div>
            <div className="text-[20px] font-extrabold mt-[18px]">나를 위한 트렌드</div>
            {["#오늘의날씨", "#새벽운동", "중고차"].map((t, i) => (
              <div key={t} className="py-[10px]">
                <div className="text-[13px] text-[#536471]">대한민국 트렌드 · {i + 1}</div>
                <div className="text-[15px] font-bold">{t}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[#536471] pt-[120px] text-[15px]">{nav === "noti" ? "아직 알림이 없습니다" : "받은 쪽지가 없습니다"}</div>
        )}
      </div>
      {nav === "home" && (
        <span className="absolute right-[16px] z-20 w-[56px] h-[56px] rounded-full bg-[#1D9BF0] text-white flex items-center justify-center" style={{ bottom: "calc(var(--sab) + 66px)", boxShadow: "0 4px 12px rgba(29,155,240,0.4)" }}>
          <Plus size={28} strokeWidth={2.4} />
        </span>
      )}
      <TabBar
        active={nav}
        onChange={setNav}
        tint="#0F1419"
        inactive="#0F1419"
        bg="rgba(255,255,255,0.95)"
        items={[
          { id: "home", label: "", icon: <House size={26} fill={nav === "home" ? "#0F1419" : "none"} strokeWidth={1.8} /> },
          { id: "search", label: "", icon: <Search size={25} strokeWidth={nav === "search" ? 2.8 : 1.8} /> },
          { id: "comm", label: "", icon: <Users size={25} strokeWidth={1.8} /> },
          { id: "noti", label: "", icon: <Bell size={25} fill={nav === "noti" ? "#0F1419" : "none"} strokeWidth={1.8} /> },
          { id: "dm", label: "", icon: <MailIcon size={25} strokeWidth={nav === "dm" ? 2.6 : 1.8} /> },
        ]}
      />
    </div>
  );
}

/* ═════════════ 쿠팡 (마이쿠팡 > 주문목록) ═════════════ */
export function CoupangApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("my");
  const groups = [...new Set(d.coupang.map((o) => o.when))];
  return (
    <div className="absolute inset-0 bg-[#F0F2F5]">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[48px] flex items-center px-[12px] gap-[10px] border-b border-black/[0.06]">
          <ChevronLeft size={26} />
          <span className="flex-1 text-center text-[17px] font-bold mr-[26px]">주문목록</span>
        </div>
        <div className="px-[12px] py-[10px]">
          <div className="h-[40px] rounded-[6px] border border-black/15 flex items-center gap-[8px] px-[12px] text-[14px] text-black/40">
            <Search size={17} /> 주문한 상품을 검색할 수 있어요!
          </div>
        </div>
      </div>
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 109px)", paddingBottom: 100 }}>
        {d.coupang.length === 0 && <div className="text-center text-black/40 pt-[100px]">주문 내역이 없습니다</div>}
        {groups.map((g) => (
          <div key={g} className="bg-white mb-[8px] px-[14px] py-[14px]">
            <div className="flex justify-between items-center mb-[10px]">
              <span className="text-[17px] font-bold">{g} 주문</span>
              <span className="text-[14px] text-[#346AFF] font-medium">주문 상세보기 ›</span>
            </div>
            {d.coupang
              .filter((o) => o.when === g)
              .map((o) => (
                <div key={o.id} className="rounded-[8px] border border-black/[0.08] p-[12px] mb-[8px]">
                  <div className="text-[16px] font-bold" style={{ color: o.status.includes("완료") ? "#111" : "#00891A" }}>
                    {o.status}
                    {o.status.includes("완료") && <span className="text-[#00891A] font-semibold"> · 문 앞</span>}
                  </div>
                  <div className="flex gap-[12px] mt-[10px]">
                    <Thumb photo={o.photo} hue={hueOf(o.name)} className="w-[72px] h-[72px] rounded-[6px] border border-black/[0.05] shrink-0" style={o.photo ? undefined : { background: "#F3F4F6" }}>
                      {!o.photo && <Package size={30} strokeWidth={1.4} className="absolute inset-0 m-auto text-black/25" />}
                    </Thumb>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] leading-[19px] line-clamp-2">{o.name}</div>
                      <div className="text-[13px] text-black/45 mt-[2px]">{o.option}</div>
                      <div className="text-[15px] font-bold mt-[4px]">{o.price}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-[6px] mt-[12px]">
                    {["배송조회", "교환, 반품 신청", "리뷰 작성하기"].map((b) => (
                      <span key={b} className="h-[36px] rounded-[4px] border border-black/15 text-[13px] flex items-center justify-center">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#111"
        inactive="#999"
        bg="#fff"
        items={[
          { id: "home", label: "홈", icon: <House size={23} strokeWidth={1.7} /> },
          { id: "cat", label: "카테고리", icon: <Menu size={23} strokeWidth={1.7} /> },
          { id: "search", label: "검색", icon: <Search size={23} strokeWidth={1.7} /> },
          { id: "my", label: "마이쿠팡", icon: <User size={23} strokeWidth={1.7} fill={tab === "my" ? "#111" : "none"} /> },
          { id: "cart", label: "장바구니", icon: <ShoppingCart size={23} strokeWidth={1.7} /> },
        ]}
      />
    </div>
  );
}

/* ═════════════ 배달의민족 (주문내역) ═════════════ */
const BAEMIN = "#2AC1BC";
export function BaeminApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("orders");
  return (
    <div className="absolute inset-0 bg-[#F6F6F6]">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[50px] flex items-center justify-center text-[18px] font-bold border-b border-black/[0.06]">주문내역</div>
        <div className="flex gap-[8px] px-[14px] py-[10px]">
          {["배달 · 포장", "장보기 · 쇼핑", "선물하기"].map((c, i) => (
            <span key={c} className="h-[32px] px-[12px] rounded-full text-[14px] flex items-center" style={i === 0 ? { background: "#222", color: "#fff", fontWeight: 600 } : { background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 scroll px-[14px]" style={{ paddingTop: "calc(var(--sat) + 104px)", paddingBottom: 100 }}>
        {d.baemin.length === 0 && <div className="text-center text-black/40 pt-[100px]">주문내역이 없어요</div>}
        {d.baemin.map((o) => (
          <div key={o.id} className="bg-white rounded-[14px] p-[16px] mb-[10px]">
            <div className="flex justify-between items-center text-[13px] text-black/45">
              <span>
                {o.status} · {o.when}
              </span>
              <span>주문상세</span>
            </div>
            <div className="flex gap-[12px] mt-[10px]">
              <Thumb photo={o.photo} hue={hueOf(o.store)} className="w-[64px] h-[64px] rounded-[10px] shrink-0">
                {!o.photo && <UtensilsCrossed size={26} strokeWidth={1.6} className="absolute inset-0 m-auto text-white/80" />}
              </Thumb>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-bold flex items-center">
                  <span className="truncate">{o.store}</span>
                  <ChevronRight size={18} className="shrink-0" />
                </div>
                <div className="text-[14px] text-black/60 mt-[2px] line-clamp-2">{o.menu}</div>
                <div className="text-[14px] mt-[2px]">{o.price}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-[8px] mt-[14px]">
              <span className="h-[40px] rounded-[8px] border border-black/15 text-[14px] font-semibold flex items-center justify-center">같은 메뉴 담기</span>
              <span className="h-[40px] rounded-[8px] text-[14px] font-semibold flex items-center justify-center" style={{ background: "#E8F8F7", color: "#139F99" }}>
                리뷰 쓰기
              </span>
            </div>
          </div>
        ))}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#222"
        inactive="#999"
        bg="#fff"
        items={[
          { id: "home", label: "홈", icon: <House size={23} strokeWidth={1.7} /> },
          { id: "search", label: "검색", icon: <Search size={23} strokeWidth={1.7} /> },
          { id: "like", label: "찜", icon: <Heart size={23} strokeWidth={1.7} /> },
          { id: "orders", label: "주문내역", icon: <List size={23} strokeWidth={tab === "orders" ? 2.6 : 1.7} color={tab === "orders" ? BAEMIN : undefined} /> },
          { id: "my", label: "my배민", icon: <User size={23} strokeWidth={1.7} /> },
        ]}
      />
    </div>
  );
}

/* ═════════════ 카카오 T ═════════════ */
export function KakaoTApp() {
  useStatusBar(true);
  const d = useData();
  const [hist, setHist] = useState(false);
  const services: [string, React.ReactNode][] = [
    ["택시", <Car key="1" size={28} />],
    ["대리", <Car key="2" size={28} />],
    ["바이크", <Bike key="3" size={28} />],
    ["주차", <ParkingSquare key="4" size={28} />],
    ["퀵 · 배송", <LayoutGrid key="5" size={28} />],
    ["전체", <Menu key="6" size={28} />],
  ];
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: 60 }}>
        <div className="flex items-center justify-between px-[18px] h-[44px]">
          <span className="text-[22px] font-black tracking-[-0.5px]">
            kakao <span className="text-[#FFC800]">T</span>
          </span>
          <Bell size={22} />
        </div>
        <div className="mx-[18px] mt-[8px] h-[54px] rounded-[14px] bg-[#FFE600] flex items-center px-[16px] gap-[10px] text-[17px] font-bold">
          <Search size={20} strokeWidth={2.6} /> 어디로 갈까요?
        </div>
        <div className="grid grid-cols-3 gap-y-[18px] px-[18px] mt-[22px]">
          {services.map(([l, ic]) => (
            <div key={l} className="flex flex-col items-center gap-[6px]">
              <span className="w-[62px] h-[62px] rounded-[18px] bg-[#F5F6F7] flex items-center justify-center text-[#333]">{ic}</span>
              <span className="text-[13px] font-medium">{l}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setHist(true)} className="w-full flex items-center justify-between px-[18px] mt-[26px] mb-[6px]">
          <span className="text-[18px] font-bold">최근 이용</span>
          <span className="text-[14px] text-black/45 flex items-center">
            이용기록 <ChevronRight size={16} />
          </span>
        </button>
        {d.kakaot.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-center gap-[12px] px-[18px] py-[10px]">
            <MapPin size={20} className="text-black/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold truncate">{r.to}</div>
              <div className="text-[13px] text-black/45 truncate">{r.from}에서</div>
            </div>
          </div>
        ))}
      </div>
      {hist && (
        <div className="absolute inset-0 z-30 bg-[#F5F6F7] push flex flex-col">
          <div className="bg-white" style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center px-[10px]">
              <button data-back onClick={() => setHist(false)} aria-label="뒤로">
                <ChevronLeft size={28} />
              </button>
              <span className="flex-1 text-center text-[17px] font-bold mr-[28px]">이용기록</span>
            </div>
          </div>
          <div className="flex-1 scroll px-[14px] pt-[12px] pb-[40px]">
            {d.kakaot.length === 0 && <div className="text-center text-black/40 pt-[100px]">이용기록이 없습니다</div>}
            {d.kakaot.map((r) => (
              <div key={r.id} className="bg-white rounded-[14px] p-[16px] mb-[10px]">
                <div className="flex justify-between text-[13px] text-black/45">
                  <span>{r.kind}</span>
                  <span>{r.when}</span>
                </div>
                <div className="mt-[10px] flex gap-[10px]">
                  <div className="flex flex-col items-center pt-[6px]">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#333]" />
                    <span className="w-px flex-1 bg-black/15 my-[3px]" />
                    <span className="w-[8px] h-[8px] rounded-full bg-[#FFC800]" />
                  </div>
                  <div className="flex-1 min-w-0 text-[16px]">
                    <div className="truncate">{r.from}</div>
                    <div className="truncate mt-[10px] font-semibold">{r.to}</div>
                  </div>
                  <div className="text-[17px] font-bold self-end">{r.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

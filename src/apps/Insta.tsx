/* Instagram (2025 하단 탭: 홈 · 릴스 · DM · 검색 · 프로필) */
import { useEffect, useRef, useState } from "react";
import { Home as HomeI, Clapperboard, Send, Search, Heart, MessageCircle, Bookmark, MoreHorizontal, Plus, ChevronDown, ChevronLeft, Lock, Camera, SquarePen, Phone, Video, Music2, Grid3x3, UserSquare2, Menu, X, Mic, Image as ImageIcon, Sticker } from "lucide-react";
import { useData, update, uid, won, type Post, type Thread } from "../store";
import { photoSrc } from "../photos";
import { usePhoneCtx, Img } from "../ui";
import { markRead, useAutoBottom, useComposer } from "./Messages";

const RING = "conic-gradient(from 200deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5, #FEDA75)";
const logo = { fontFamily: "'Grand Hotel', 'Snell Roundhand', cursive", fontSize: 31, lineHeight: "34px" };
/** 프로필 사진: ig.users[].avatar 에 사진 id를 넣으면 그 사진, 없으면 인스타 기본 프로필 */
function useAvatar(handle: string) {
  const d = useData();
  const u = d.ig.users.find((x) => x.handle === handle);
  return u?.avatar ? photoSrc(u.avatar, d.photos) : "";
}

function IgAvatar({ handle, size = 32, ring = false, me = false }: { handle: string; size?: number; ring?: boolean; me?: boolean }) {
  const src = useAvatar(handle);
  const inner = me || !src ? (
    <div className="rounded-full bg-[#DBDBDB] flex items-end justify-center overflow-hidden" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="16" r="7" fill="#fff" />
        <path d="M6 38c1.5-8 7-12 14-12s12.5 4 14 12z" fill="#fff" />
      </svg>
    </div>
  ) : (
    <img src={src} className="rounded-full object-cover" style={{ width: size, height: size }} alt="" />
  );
  if (!ring) return inner;
  return (
    <div className="rounded-full p-[2.5px]" style={{ background: RING }}>
      <div className="rounded-full p-[2.5px] bg-white">{inner}</div>
    </div>
  );
}

function PostView({ p }: { p: Post }) {
  const d = useData();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article className="pb-[14px]">
      <div className="flex items-center gap-[10px] px-[12px] h-[52px]">
        <IgAvatar handle={p.user} size={32} ring />
        <span className="text-[14px] font-semibold flex-1">{p.user}</span>
        <MoreHorizontal size={20} />
      </div>
      <Img src={photoSrc(p.photo, d.photos)} className="w-full aspect-[4/5]" onClick={() => setLiked(true)} />
      <div className="flex items-center gap-[16px] px-[12px] pt-[10px]">
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-[5px] text-[14px] font-semibold">
          <Heart size={25} strokeWidth={1.8} fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "currentColor"} />
          {won(p.likes + (liked ? 1 : 0))}
        </button>
        <span className="flex items-center gap-[5px] text-[14px] font-semibold">
          <MessageCircle size={24} strokeWidth={1.8} style={{ transform: "scaleX(-1)" }} />
          {p.comments}
        </span>
        <Send size={23} strokeWidth={1.8} />
        <button className="ml-auto" onClick={() => setSaved(!saved)}>
          <Bookmark size={24} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="px-[12px] pt-[8px] text-[14px] leading-[19px]">
        <span className="font-semibold mr-[5px]">{p.user}</span>
        {p.caption}
      </div>
      <div className="px-[12px] pt-[4px] text-[12px] text-black/45">{p.when}</div>
    </article>
  );
}

/* 스토리 뷰어 — 실제 인스타처럼
   · 위 진행 막대(그 사람 스토리 개수만큼) · 5초 자동 넘김
   · 짧게 탭: 왼쪽 1/3 이전 / 나머지 다음 · 꾹 누르면 멈춤(화면 위 UI 숨김)
   · 아래로 쓸어내리면 닫힘 · 다른 사람으로 넘어갈 때 큐브처럼 넘어감 */
function StoryViewer({ start, onClose }: { start: number; onClose: () => void }) {
  const d = useData();
  const items = d.ig.storyItems;
  const [i, setI] = useState(start);
  const [t, setT] = useState(0);
  const [hold, setHold] = useState(false);
  const [dy, setDy] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const press = useRef<{ x: number; y: number; at: number; w: number; left: number } | null>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const { setStatusDark } = usePhoneCtx();
  const it = items[i];
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  useEffect(() => {
    if (!it) return;
    update((x) => {
      x.ig.seen = Array.from(new Set([...(x.ig.seen ?? []), it.id]));
    });
    setT(0);
  }, [i]); // eslint-disable-line
  useEffect(() => {
    if (hold || dy) return;
    const iv = setInterval(() => setT((x) => x + 1), 50);
    return () => clearInterval(iv);
  }, [i, hold, dy]);
  const go = (n: number) => {
    if (n < 0) return setT(0);
    if (n >= items.length) return onClose();
    setDir(n > i ? 1 : -1);
    setI(n);
  };
  useEffect(() => {
    if (t >= 100) go(i + 1);
  }, [t]); // eslint-disable-line
  if (!it) return null;
  const same = items.map((x, k) => ({ x, k })).filter((o) => o.x.user === it.user);
  const img = it.photo ? photoSrc(it.photo, d.photos) : "";
  const box = it.style === "box";
  return (
    <div className="fixed inset-0 z-40 bg-black text-white" style={{ perspective: 1200 }}>
      <div
        key={it.user}
        className="absolute inset-0 touch-none select-none"
        style={{
          transform: dy ? `translateY(${dy}px) scale(${1 - dy / 1600})` : undefined,
          transition: press.current ? "none" : "transform .25s",
          animation: `${dir > 0 ? "storyCubeIn" : "storyCubeBack"} .38s cubic-bezier(.3,.8,.3,1)`,
          transformOrigin: dir > 0 ? "left center" : "right center",
        }}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          press.current = { x: e.clientX, y: e.clientY, at: Date.now(), w: r.width, left: r.left };
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 터치 */ }
          holdTimer.current = window.setTimeout(() => setHold(true), 180);
        }}
        onPointerMove={(e) => {
          const g = press.current;
          if (g && e.clientY - g.y > 8) setDy(Math.max(0, e.clientY - g.y));
        }}
        onPointerUp={(e) => {
          const g = press.current;
          press.current = null;
          clearTimeout(holdTimer.current);
          const wasHold = hold;
          setHold(false);
          if (!g) return;
          if (dy > 110) return onClose();
          setDy(0);
          if (wasHold || Math.abs(e.clientY - g.y) > 10) return;
          const x = (e.clientX - g.left) / g.w;
          go(x < 0.33 ? i - 1 : i + 1);
        }}
      >
        {/* 스토리 카드 */}
        <div className="absolute left-0 right-0 overflow-hidden rounded-[10px] flex items-center justify-center" style={{ top: 47, bottom: 82, background: img ? "#000" : it.bg }}>
          {img ? (
            <img src={img} className="w-full h-full object-cover" alt="" draggable={false} />
          ) : box ? (
            <p className="text-center px-[28px] text-[22px] font-bold leading-[38px]" style={{ wordBreak: "keep-all" }}>
              {it.text.split("\n").map((l, k) => (
                <span key={k}>
                  <span className="bg-white text-black px-[8px] py-[3px] rounded-[6px]" style={{ boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
                    {l}
                  </span>
                  <br />
                </span>
              ))}
            </p>
          ) : (
            <p className="text-center text-[25px] font-bold leading-[34px] px-[30px] whitespace-pre-wrap tracking-[-0.01em]" style={{ wordBreak: "keep-all" }}>
              {it.text}
            </p>
          )}
          <div className="absolute inset-x-0 top-0 h-[110px] pointer-events-none" style={{ background: "linear-gradient(rgba(0,0,0,0.35), transparent)", opacity: hold ? 0 : 1, transition: "opacity .2s" }} />
        </div>
        {/* 진행 막대 + 머리 */}
        <div className="absolute left-0 right-0 transition-opacity" style={{ top: 47, opacity: hold ? 0 : 1 }}>
          <div className="flex gap-[4px] px-[8px] pt-[8px]">
            {same.map((o) => (
              <span key={o.k} className="flex-1 h-[2px] rounded-full bg-white/35 overflow-hidden">
                <span className="block h-full bg-white" style={{ width: o.k < i ? "100%" : o.k === i ? `${Math.min(100, t)}%` : "0%" }} />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-[8px] px-[12px] pt-[10px]">
            <IgAvatar handle={it.user} size={32} />
            <span className="text-[14px] font-semibold">{it.user}</span>
            <span className="text-[14px] text-white/70">{it.when}</span>
            <span className="flex-1" />
            <MoreHorizontal size={22} />
            <button onPointerDown={(e) => e.stopPropagation()} onClick={onClose} aria-label="닫기" className="ml-[10px]">
              <X size={27} strokeWidth={1.7} />
            </button>
          </div>
        </div>
        {sent && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[96px] px-[14px] py-[8px] rounded-full bg-black/70 text-[14px] fade">메시지를 보냈습니다</div>
        )}
        {/* 답장 줄 */}
        <div className="absolute left-[12px] right-[12px] bottom-[28px] flex items-center gap-[16px] transition-opacity" style={{ opacity: hold ? 0 : 1 }}>
          <input
            value={reply}
            onPointerDown={(e) => e.stopPropagation()}
            onFocus={() => setHold(true)}
            onBlur={() => setHold(false)}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || !reply.trim()) return;
              const text = reply.trim();
              update((x) => {
                let th = x.threads.find((y) => y.app === "insta" && y.name === it.user);
                if (!th) {
                  th = { id: uid(), app: "insta", name: it.user, unread: 0, last: "방금", messages: [] };
                  x.threads.unshift(th);
                }
                th.messages.push({ id: uid(), from: "system", text: `${it.user}님의 스토리에 답장했습니다 · "${it.text.split("\n")[0]}"` });
                th.messages.push({ id: uid(), from: "me", text });
                th.last = "방금";
              });
              setReply("");
              setSent(true);
              setTimeout(() => setSent(false), 1400);
              (e.target as HTMLInputElement).blur();
            }}
            placeholder="메시지 보내기"
            className="flex-1 h-[44px] rounded-full border border-white/50 bg-transparent px-[18px] text-[15px] text-white placeholder:text-white/85 outline-none min-w-0"
          />
          <Heart size={27} strokeWidth={1.8} />
          <Send size={25} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function Feed() {
  const d = useData();
  const [view, setView] = useState<number | null>(null);
  const seen = d.ig.seen ?? [];
  const order = d.ig.stories.filter((h) => d.ig.storyItems.some((x) => x.user === h));
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <Plus size={27} strokeWidth={1.7} />
        <div className="flex items-center gap-[2px]">
          <span style={logo}>Instagram</span>
          <ChevronDown size={16} className="mt-[4px]" />
        </div>
        <Heart size={25} strokeWidth={1.8} />
      </div>
      <div className="flex gap-[14px] px-[12px] py-[8px] overflow-x-auto no-scrollbar">
        <div className="flex flex-col items-center gap-[5px] shrink-0 w-[70px]">
          <div className="relative">
            <IgAvatar handle={d.ig.me.handle} size={66} me />
            <span className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full bg-[#0095F6] border-[2.5px] border-white flex items-center justify-center">
              <Plus size={13} color="#fff" strokeWidth={3.5} />
            </span>
          </div>
          <span className="text-[12px] text-black/60">내 스토리</span>
        </div>
        {order.map((h) => {
          const done = d.ig.storyItems.filter((x) => x.user === h).every((x) => seen.includes(x.id));
          return (
            <button key={h} onClick={() => setView(d.ig.storyItems.findIndex((x) => x.user === h))} className="flex flex-col items-center gap-[5px] shrink-0 w-[74px]">
              {done ? (
                <div className="rounded-full p-[2px] bg-[#DBDBDB]">
                  <div className="rounded-full p-[2.5px] bg-white">
                    <IgAvatar handle={h} size={60} />
                  </div>
                </div>
              ) : (
                <IgAvatar handle={h} size={60} ring />
              )}
              <span className={`text-[12px] truncate w-full text-center ${done ? "text-black/50" : ""}`}>{h}</span>
            </button>
          );
        })}
      </div>
      {view !== null && <StoryViewer start={view} onClose={() => setView(null)} />}
      <div className="h-[0.5px] bg-black/10" />
      {d.ig.feed
        .filter((p) => photoSrc(p.photo, d.photos))
        .map((p) => (
          <PostView key={p.id} p={p} />
        ))}
      <div className="px-[14px] pt-[18px]">
        <div className="text-[15px] font-semibold">회원님을 위한 추천</div>
        {d.ig.users.map((u) => (
          <div key={u.handle} className="flex items-center gap-[12px] py-[9px]">
            <IgAvatar handle={u.handle} size={44} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate">{u.handle}</div>
              <div className="text-[13px] text-black/50 truncate">{[u.name, u.bio].filter(Boolean).join(" · ") || "회원님을 위한 추천"}</div>
            </div>
            <span className="h-[32px] px-[16px] rounded-[8px] bg-[#0095F6] text-white text-[14px] font-semibold flex items-center">팔로우</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Reels() {
  const d = useData();
  const p = d.ig.feed[1] ?? d.ig.feed[0];
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  if (!p || !photoSrc(p.photo, d.photos))
    return (
      <div className="absolute inset-0 bg-black text-white flex flex-col items-center justify-center gap-[10px] text-center px-10">
        <div className="w-[34px] h-[34px] rounded-full border-[3px] border-white/20 border-t-white/80 animate-spin" />
        <div className="text-[15px] font-semibold mt-2">릴스를 불러올 수 없습니다</div>
        <div className="text-[13px] text-white/55">네트워크 연결 상태를 확인하고 다시 시도하세요.</div>
      </div>
    );
  return (
    <div className="absolute inset-0 bg-black text-white">
      <Img src={photoSrc(p.photo, d.photos)} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 60%, rgba(0,0,0,0.55))" }} />
      <div className="absolute left-0 right-0 flex justify-between items-center px-[16px]" style={{ top: "calc(var(--sat) + 6px)" }}>
        <span className="text-[22px] font-bold flex items-center gap-1">
          릴스 <ChevronDown size={18} />
        </span>
        <Camera size={26} strokeWidth={1.8} />
      </div>
      <div className="absolute right-[12px] bottom-[118px] flex flex-col items-center gap-[20px] text-[13px] font-semibold">
        <div className="flex flex-col items-center gap-1">
          <Heart size={28} strokeWidth={1.8} />
          {won(p.likes)}
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle size={27} strokeWidth={1.8} style={{ transform: "scaleX(-1)" }} />
          {p.comments}
        </div>
        <Send size={26} strokeWidth={1.8} />
        <MoreHorizontal size={24} />
        <div className="w-[28px] h-[28px] rounded-[7px] border-2 border-white overflow-hidden">
          <IgAvatar handle={p.user} size={24} />
        </div>
      </div>
      <div className="absolute left-[14px] right-[70px] bottom-[110px]">
        <div className="flex items-center gap-[8px]">
          <IgAvatar handle={p.user} size={32} />
          <span className="text-[14px] font-semibold">{p.user}</span>
          <span className="text-[13px] font-semibold border border-white/70 rounded-[8px] px-[9px] py-[3px]">팔로우</span>
        </div>
        <div className="text-[14px] mt-[8px] leading-[19px] line-clamp-2">{p.caption}</div>
        <div className="flex items-center gap-[6px] text-[13px] mt-[8px] opacity-90">
          <Music2 size={13} />
          {p.user} · 원본 오디오
        </div>
      </div>
    </div>
  );
}

function DMChat({ t, onBack }: { t: Thread; onBack: () => void }) {
  const c = useComposer(t);
  const ref = useAutoBottom(t.messages.length);
  const lastMine = t.messages.map((m) => m.from).lastIndexOf("me");
  return (
    <div className="fixed inset-0 bg-white flex flex-col push z-30">
      <div className="hair-b" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[50px] flex items-center px-[8px] gap-[10px]">
          <button data-back onClick={onBack}>
            <ChevronLeft size={30} strokeWidth={1.8} />
          </button>
          <IgAvatar handle={t.name} size={30} />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold truncate leading-[18px]">{t.name}</div>
            <div className="text-[12px] text-black/50 leading-[15px]">활동: {t.last || "최근"}</div>
          </div>
          <Phone size={23} strokeWidth={1.7} />
          <Video size={26} strokeWidth={1.7} className="mr-[6px]" />
        </div>
      </div>
      <div ref={ref} className="flex-1 scroll px-[12px] pt-[16px] pb-[10px]">
        <div className="flex flex-col items-center pb-[24px]">
          <IgAvatar handle={t.name} size={90} />
          <div className="text-[18px] font-semibold mt-[10px]">{t.name}</div>
          <div className="text-[13px] text-black/50">{t.name} · Instagram</div>
          <span className="mt-[12px] text-[13px] font-semibold bg-[#EFEFEF] rounded-[8px] px-[14px] py-[6px]">프로필 보기</span>
        </div>
        {t.messages.map((m, i) => {
          if (m.kind === "date")
            return (
              <div key={m.id} className="text-center text-[12px] text-black/45 font-semibold mt-[18px] mb-[6px]">
                {m.text}
              </div>
            );
          if (m.from === "system")
            return (
              <div key={m.id} className="text-center text-[12px] text-black/45 mt-[14px] mb-[2px] px-[30px] truncate">
                {m.text}
              </div>
            );
          const mine = m.from === "me";
          const next = t.messages[i + 1];
          const prev = t.messages[i - 1];
          const last = !next || next.from !== m.from;
          return (
            <div key={m.id} className={`flex items-end gap-[8px] ${mine ? "justify-end" : ""}`} style={{ marginTop: prev && prev.from === m.from ? 2 : 10 }}>
              {!mine && <div className="w-[28px]">{last && <IgAvatar handle={t.name} size={28} />}</div>}
              <div
                className="max-w-[70%] px-[13px] py-[8px] text-[15px] leading-[20px] rounded-[22px] whitespace-pre-wrap"
                style={mine ? { background: "linear-gradient(135deg,#5B51F5,#8A3CF0)", color: "#fff", wordBreak: "keep-all" } : { background: "#EFEFEF", wordBreak: "keep-all" }}
              >
                {m.text}
              </div>
              {mine && i === lastMine && <span className="sr-only">읽음</span>}
            </div>
          );
        })}
        {lastMine >= 0 && lastMine === t.messages.length - 1 && <div className="text-right text-[12px] text-black/45 mt-[4px] mr-[4px]">읽음</div>}
      </div>
      <div className="px-[10px] pt-[6px]" style={{ paddingBottom: "calc(var(--kbsab) + 4px)" }}>
        <div className="h-[46px] rounded-full bg-[#EFEFEF] flex items-center pl-[5px] pr-[14px] gap-[10px]">
          <span className="w-[36px] h-[36px] rounded-full bg-[#3797F0] flex items-center justify-center shrink-0">
            <Camera size={19} color="#fff" />
          </span>
          <input
            value={c.text}
            readOnly={!c.editable}
            onChange={(e) => c.setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && c.send()}
            placeholder="메시지 보내기..."
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-black/45 min-w-0"
          />
          {!c.text && (
            <div className="flex items-center gap-[14px] text-black shrink-0">
              <Mic size={22} strokeWidth={1.7} />
              <ImageIcon size={22} strokeWidth={1.7} />
              <Sticker size={22} strokeWidth={1.7} />
            </div>
          )}
          <button
            onClick={() => c.send()}
            aria-label="보내기"
            className="w-[34px] h-[34px] -mr-[8px] rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ background: c.canSend ? "#3797F0" : "rgba(55,151,240,0.35)" }}
          >
            <Send size={17} color="#fff" strokeWidth={2.2} className="-ml-[1px] mt-[1px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DMs() {
  const d = useData();
  const { appArg } = usePhoneCtx();
  const list = d.threads.filter((t) => t.app === "insta");
  const [openId, setOpenId] = useState<string | null>((appArg as string) || null);
  useEffect(() => {
    if (openId) markRead(openId);
  }, [openId]);
  const cur = list.find((t) => t.id === openId);
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <span className="text-[22px] font-bold flex items-center gap-[4px]">
          {d.ig.me.handle} <ChevronDown size={18} />
        </span>
        <SquarePen size={24} strokeWidth={1.7} />
      </div>
      <div className="px-[14px] py-[6px]">
        <div className="h-[36px] rounded-[10px] bg-[#EFEFEF] flex items-center gap-[8px] px-[12px] text-black/45 text-[15px]">
          <Search size={16} />
          검색
        </div>
      </div>
      <div className="flex gap-[14px] px-[14px] pt-[30px] pb-[8px] overflow-x-auto no-scrollbar">
        <div className="flex flex-col items-center shrink-0 w-[76px] relative">
          <span className="absolute -top-[26px] max-w-[90px] px-[10px] py-[6px] rounded-[16px] bg-white text-[11px] text-black/45 shadow-[0_1px_6px_rgba(0,0,0,0.12)] truncate">노트 남기기...</span>
          <IgAvatar handle={d.ig.me.handle} size={64} me />
          <span className="text-[12px] text-black/50 mt-[5px]">내 노트</span>
        </div>
        {d.ig.notes.map((n) => (
          <div key={n.user} className="flex flex-col items-center shrink-0 w-[76px] relative">
            <span className="absolute -top-[26px] max-w-[96px] px-[10px] py-[6px] rounded-[16px] bg-white text-[11px] shadow-[0_1px_6px_rgba(0,0,0,0.12)] truncate z-10">{n.text}</span>
            <IgAvatar handle={n.user} size={64} />
            <span className="text-[12px] mt-[5px] truncate w-full text-center">{n.user}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-[14px] pt-[12px] pb-[6px]">
        <span className="text-[16px] font-bold">메시지</span>
        <span className="text-[14px] text-black/50">요청</span>
      </div>
      {list.map((t) => {
        const last = t.messages[t.messages.length - 1];
        return (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full flex items-center gap-[12px] px-[14px] py-[8px] text-left active:bg-black/[0.03]">
            <IgAvatar handle={t.name} size={56} />
            <div className="flex-1 min-w-0">
              <div className={`text-[14px] truncate ${t.unread ? "font-bold" : ""}`}>{t.name}</div>
              <div className={`text-[14px] truncate ${t.unread ? "font-semibold text-black" : "text-black/50"}`}>
                {last?.from === "me" ? "회원님: " : ""}
                {last?.text} · {t.last}
              </div>
            </div>
            {t.unread > 0 && <span className="w-[8px] h-[8px] rounded-full bg-[#0095F6]" />}
            <Camera size={24} strokeWidth={1.5} className="text-black/50" />
          </button>
        );
      })}
      {cur && <DMChat t={cur} onBack={() => setOpenId(null)} />}
    </>
  );
}

function Explore() {
  const d = useData();
  return (
    <>
      <div className="px-[12px] pt-[4px] pb-[8px] flex items-center gap-[10px]">
        <div className="flex-1 h-[36px] rounded-[10px] bg-[#EFEFEF] flex items-center gap-[8px] px-[12px] text-black/45 text-[15px]">
          <Search size={16} />
          검색
        </div>
      </div>
      <div className="flex justify-between px-[14px] pt-[6px] pb-[4px]">
        <span className="text-[16px] font-bold">최근 검색 항목</span>
        <span className="text-[14px] text-[#0095F6]">모두 보기</span>
      </div>
      {[...d.ig.users].reverse().map((u) => (
        <div key={u.handle} className="flex items-center gap-[12px] px-[14px] py-[8px]">
          <IgAvatar handle={u.handle} size={50} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{u.handle}</div>
            <div className="text-[13px] text-black/50 truncate">{u.name} · 팔로워 {u.followers.toLocaleString()}명</div>
          </div>
          <span className="text-black/40 text-[20px] leading-none">×</span>
        </div>
      ))}
    </>
  );
}

function Profile() {
  const d = useData();
  const me = d.ig.me;
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <Plus size={26} strokeWidth={1.7} />
        <span className="text-[18px] font-bold flex items-center gap-[5px]">
          {me.private && <Lock size={14} strokeWidth={2.6} />}
          {me.handle}
          <ChevronDown size={16} />
        </span>
        <Menu size={26} strokeWidth={1.7} />
      </div>
      <div className="flex items-center px-[16px] pt-[10px] gap-[24px]">
        <IgAvatar handle={me.handle} size={86} me />
        <div className="flex-1">
          {me.name && <div className="text-[14px] font-semibold mb-[6px]">{me.name}</div>}
          <div className="flex justify-between pr-[8px]">
            {[
              [me.posts, "게시물"],
              [me.followers, "팔로워"],
              [me.following, "팔로잉"],
            ].map(([n, l]) => (
              <div key={l as string} className="text-left">
                <div className="text-[16px] font-semibold leading-[20px]">{n as number}</div>
                <div className="text-[13px] leading-[17px]">{l as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {me.bio && <div className="px-[16px] pt-[8px] text-[14px] whitespace-pre-wrap">{me.bio}</div>}
      <div className="flex gap-[6px] px-[16px] pt-[14px]">
        <span className="flex-1 h-[34px] rounded-[8px] bg-[#EFEFEF] text-[14px] font-semibold flex items-center justify-center">프로필 편집</span>
        <span className="flex-1 h-[34px] rounded-[8px] bg-[#EFEFEF] text-[14px] font-semibold flex items-center justify-center">프로필 공유</span>
      </div>
      <div className="flex mt-[16px] hair-b">
        <span className="flex-1 flex justify-center py-[10px] border-b border-black">
          <Grid3x3 size={22} />
        </span>
        <span className="flex-1 flex justify-center py-[10px] text-black/40">
          <Clapperboard size={22} />
        </span>
        <span className="flex-1 flex justify-center py-[10px] text-black/40">
          <UserSquare2 size={22} />
        </span>
      </div>
      <div className="flex flex-col items-center pt-[56px]">
        <div className="w-[84px] h-[84px] rounded-full border-2 border-black flex items-center justify-center">
          <Camera size={40} strokeWidth={1.3} />
        </div>
        <div className="text-[26px] font-extrabold mt-[14px]">게시물 없음</div>
      </div>
    </>
  );
}

export default function Insta() {
  const d = useData();
  const { appArg } = usePhoneCtx();
  const [tab, setTab] = useState(appArg ? "dm" : "home");
  const unread = d.threads.filter((t) => t.app === "insta").reduce((a, t) => a + t.unread, 0);
  const dark = tab === "reels";
  const items = [
    { id: "home", icon: <HomeI size={27} strokeWidth={tab === "home" ? 2.4 : 1.7} fill={tab === "home" ? "currentColor" : "none"} /> },
    { id: "reels", icon: <Clapperboard size={26} strokeWidth={tab === "reels" ? 2.4 : 1.7} /> },
    { id: "dm", icon: <Send size={25} strokeWidth={tab === "dm" ? 2.4 : 1.7} />, badge: unread },
    { id: "search", icon: <Search size={26} strokeWidth={tab === "search" ? 2.8 : 1.8} /> },
    { id: "profile", icon: <div className={`rounded-full ${tab === "profile" ? "ring-2 ring-offset-1 ring-black" : ""}`}><IgAvatar handle={d.ig.me.handle} size={26} me /></div> },
  ];
  return (
    <div className="absolute inset-0 bg-white">
      {tab === "reels" ? (
        <Reels />
      ) : (
        <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 100 }}>
          {tab === "home" && <Feed />}
          {tab === "dm" && <DMs />}
          {tab === "search" && <Explore />}
          {tab === "profile" && <Profile />}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-around pt-[10px]" style={{ paddingBottom: "calc(var(--sab) - 4px)", background: dark ? "#000" : "#fff", color: dark ? "#fff" : "#000", boxShadow: dark ? "none" : "inset 0 0.5px 0 rgba(0,0,0,0.1)" }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)} className="relative w-[48px] h-[34px] flex items-center justify-center">
            {it.icon}
            {!!it.badge && <span className="absolute top-[-2px] right-[4px] min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#FF3040] text-white text-[11px] font-bold flex items-center justify-center border-2" style={{ borderColor: dark ? "#000" : "#fff" }}>{it.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

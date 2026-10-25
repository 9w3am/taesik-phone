/* iOS 메시지 (iMessage / 문자) */
import { useEffect, useRef, useState } from "react";
import { ChevronRight, SquarePen, Video, Plus, Mic, ArrowUp, ChevronLeft, Heart, ThumbsUp, ThumbsDown, Reply, Copy, Undo2 } from "lucide-react";
import { useData, update, uid, type Thread, type Msg } from "../store";
import { photoSrc } from "../photos";
import { Avatar, LargeTitle, NavBar, SearchField, useScrolled, usePhoneCtx, Img } from "../ui";

export function markRead(id: string) {
  update((d) => {
    const t = d.threads.find((x) => x.id === id);
    if (t) t.unread = 0;
  });
}
export function sendMsg(id: string, text: string, replyTo?: string) {
  if (!text.trim()) return;
  update((d) => {
    const t = d.threads.find((x) => x.id === id);
    if (!t) return;
    t.messages.push({ id: uid(), from: "me", text: text.trim(), ...(replyTo ? { replyTo } : {}) });
    t.draft = "";
  });
}
export const preview = (m?: Msg) => (!m || m.kind === "date" ? "" : m.kind === "deleted" ? "삭제된 메시지입니다." : m.kind === "photo" ? "사진" : m.kind === "pay" ? `송금 ${m.amount?.toLocaleString()}원` : m.text.replace(/\n/g, " "));

/** 공용 입력창 훅: 초안(draft)이 있으면 그대로 표시 → 전송 버튼으로 보냄 */
export function useComposer(t: Thread) {
  const d = useData();
  const [text, setText] = useState(t.draft ?? "");
  useEffect(() => setText(t.draft ?? ""), [t.id, t.draft]);
  const editable = d.allowSend;
  const canSend = text.trim().length > 0 && (editable || !!t.draft);
  return { text, setText, editable, canSend, send: (replyTo?: string) => canSend && (sendMsg(t.id, text, replyTo), setText("")) };
}

export function useAutoBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);
  return ref;
}

/* 아이메시지 반응(탭백) 모양 */
export const TAPS: [string, React.ReactNode][] = [
  ["heart", <Heart key="h" size={17} fill="currentColor" strokeWidth={0} />],
  ["like", <ThumbsUp key="l" size={17} fill="currentColor" strokeWidth={0} />],
  ["dislike", <ThumbsDown key="d" size={17} fill="currentColor" strokeWidth={0} />],
  ["haha", <span key="a" className="text-[11px] font-black leading-[11px] text-center">HA<br />HA</span>],
  ["emph", <span key="e" className="text-[17px] font-black">!!</span>],
  ["q", <span key="q" className="text-[18px] font-black">?</span>],
];

function Bubble({ m, tail, sms, onHold }: { m: Msg; tail: boolean; sms?: boolean; onHold?: (id: string) => void }) {
  const holdT = useRef<number | undefined>(undefined);
  const hold = {
    onPointerDown: () => (holdT.current = window.setTimeout(() => onHold?.(m.id), 450)),
    onPointerUp: () => clearTimeout(holdT.current),
    onPointerLeave: () => clearTimeout(holdT.current),
    onContextMenu: (e: React.MouseEvent) => (e.preventDefault(), onHold?.(m.id)),
  };
  const d = useData();
  const mine = m.from === "me";
  const bg = mine ? "#007AFF" : "#E9E9EB";
  void sms;
  if (m.kind === "photo") {
    const src = photoSrc(m.photo || "", d.photos);
    if (!src) return null;
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <Img src={src} className="w-[200px] h-[260px] rounded-[18px]" />
      </div>
    );
  }
  const tap = TAPS.find((x) => x[0] === m.tap);
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {m.replyTo && (
        <div className={`max-w-[60%] text-[13px] text-black/45 px-[12px] py-[5px] rounded-[14px] border border-black/10 mb-[3px] truncate ${mine ? "mr-[6px]" : "ml-[6px]"}`}>{m.replyTo}</div>
      )}
      <div className="relative max-w-[72%]" style={{ marginTop: tap ? 14 : 0 }} {...hold}>
        <div
          className={`imsg ${mine ? "me" : "them"} ${tail ? "tail" : ""} px-[12px] py-[7px] text-[17px] leading-[22px] rounded-[18px] whitespace-pre-wrap break-words select-none`}
          style={{ background: bg, color: mine ? "#fff" : "#000", wordBreak: "keep-all", overflowWrap: "anywhere", ["--bub" as string]: bg } as React.CSSProperties}
        >
          {m.text}
        </div>
        {tap && (
          <span
            className="absolute -top-[16px] w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 border-white"
            style={{ [mine ? "left" : "right"]: -14, background: mine ? "#E9E9EB" : "#007AFF", color: mine ? "#8e8e93" : "#fff" } as React.CSSProperties}
          >
            {tap[1]}
          </span>
        )}
      </div>
    </div>
  );
}

function Conversation({ t, onBack, unreadOthers }: { t: Thread; onBack: () => void; unreadOthers: number }) {
  const c = useComposer(t);
  const scrollRef = useAutoBottom(t.messages.length);
  const lastMine = [...t.messages].map((m, i) => [m, i] as const).filter(([m]) => m.from === "me").pop()?.[1];
  // 다 읽으면 몇 초 뒤 상대가 하나씩 전송 취소 (아이메시지 '전송 취소' 고증)
  useEffect(() => {
    if (!t.unsendAfterRead) return;
    const ids = t.messages.filter((m) => m.from === "them").map((m) => m.id);
    if (!ids.length) return;
    const timers = ids.map((mid, k) =>
      window.setTimeout(() => {
        update((x) => {
          const th = x.threads.find((y) => y.id === t.id);
          const m = th?.messages.find((y) => y.id === mid);
          if (m) {
            m.from = "system";
            m.text = `${t.name}님이 메시지 전송을 취소했습니다.`;
          }
        });
      }, 7000 + k * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [t.id]); // eslint-disable-line
  const [menu, setMenu] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const mm = t.messages.find((x) => x.id === menu);
  const setMsg = (fn: (m: Msg, list: Msg[]) => void) =>
    update((x) => {
      const th = x.threads.find((y) => y.id === t.id);
      const m = th?.messages.find((y) => y.id === menu);
      if (th && m) fn(m, th.messages);
    });
  return (
    <div className="absolute inset-0 z-40 bg-white flex flex-col push">
      {/* 헤더 */}
      <div className="relative z-20 blur-bar hair-b" style={{ paddingTop: "var(--sat)", background: "rgba(249,249,249,0.9)" }}>
        <div className="relative h-[78px] flex items-start justify-between px-2 pt-1">
          <button data-back onClick={onBack} className="flex items-center text-[#007AFF] h-[44px]">
            <ChevronLeft size={32} strokeWidth={2.3} />
            {unreadOthers > 0 && <span className="min-w-[22px] h-[22px] px-[7px] rounded-full bg-[#007AFF] text-white text-[14px] font-medium flex items-center justify-center -ml-1">{unreadOthers}</span>}
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 top-[4px] flex flex-col items-center">
            <Avatar name={t.name} size={50} />
            <div className="flex items-center text-[11px] mt-[4px] text-black max-w-[180px]">
              <span className="truncate">{t.name}</span>
              <ChevronRight size={11} className="text-black/40 shrink-0" strokeWidth={3} />
            </div>
          </div>
          <button className="h-[44px] px-2 text-[#007AFF]">{<Video size={26} strokeWidth={1.8} />}</button>
        </div>
      </div>
      {/* 말풍선 */}
      <div ref={scrollRef} className="flex-1 scroll px-[16px] pt-[10px] pb-[10px]">
        <div className="text-center text-[11px] text-[#8e8e93] font-medium mb-[10px]">iMessage</div>
        {t.messages.map((m, i) => {
          if (m.kind === "date")
            return (
              <div key={m.id} className="text-center text-[11px] text-[#8e8e93] font-semibold mt-[16px] mb-[6px]">
                {m.text}
              </div>
            );
          if (m.from === "system")
            return (
              <div key={m.id} className="text-center text-[11px] text-[#8e8e93] my-[12px] px-6 leading-[15px]">
                {m.text}
              </div>
            );
          const next = t.messages[i + 1];
          const prev = t.messages[i - 1];
          const tail = !next || next.from !== m.from;
          const gap = prev && prev.from === m.from ? 2 : 10;
          return (
            <div key={m.id} style={{ marginTop: gap }}>
              <Bubble m={m} tail={tail} sms={t.sms} onHold={setMenu} />
              {i === lastMine && <div className="text-right text-[11px] text-[#8e8e93] font-medium mt-[3px] mr-1">읽음</div>}
            </div>
          );
        })}
      </div>
      {replyTo && (
        <div className="flex items-center gap-[8px] px-[14px] py-[6px] bg-[#F7F7F7] text-[13px] text-black/55">
          <span className="truncate flex-1">답장: {replyTo}</span>
          <button onClick={() => setReplyTo(null)} className="text-[#007AFF]">취소</button>
        </div>
      )}
      {/* 길게 누르기 메뉴 */}
      {mm && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-[10px] px-[20px] fade" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }} onClick={() => setMenu(null)}>
          <div className="flex gap-[6px] bg-white rounded-full px-[10px] py-[8px] shadow-[0_8px_30px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
            {TAPS.map(([k, icon]) => (
              <button
                key={k}
                onClick={() => {
                  setMsg((m) => void (m.tap = m.tap === k ? undefined : k));
                  setMenu(null);
                }}
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                style={{ background: mm.tap === k ? "#007AFF" : "transparent", color: mm.tap === k ? "#fff" : "#8e8e93" }}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="max-w-[80%] px-[12px] py-[7px] rounded-[18px] text-[17px] leading-[22px] whitespace-pre-wrap" style={{ background: mm.from === "me" ? "#007AFF" : "#E9E9EB", color: mm.from === "me" ? "#fff" : "#000", wordBreak: "keep-all" }}>
            {mm.text}
          </div>
          <div className="w-[230px] rounded-[14px] overflow-hidden bg-white/95 text-[17px] shadow-[0_8px_30px_rgba(0,0,0,0.2)]" onClick={(e) => e.stopPropagation()}>
            <button className="w-full flex justify-between items-center px-[16px] h-[44px] hair-b" onClick={() => (setReplyTo(mm.text), setMenu(null))}>
              답장 <Reply size={18} />
            </button>
            <button
              className="w-full flex justify-between items-center px-[16px] h-[44px] hair-b"
              onClick={() => {
                navigator.clipboard?.writeText(mm.text).catch(() => {});
                setMenu(null);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              복사 <Copy size={18} />
            </button>
            {mm.from === "me" && (
              <button
                className="w-full flex justify-between items-center px-[16px] h-[44px] text-[#FF3B30]"
                onClick={() => {
                  setMsg((m) => {
                    m.from = "system";
                    m.text = "메시지 전송을 취소했습니다.";
                    m.tap = undefined;
                  });
                  setMenu(null);
                }}
              >
                전송 취소 <Undo2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}
      {copied && <div className="absolute left-1/2 -translate-x-1/2 top-[45%] z-50 px-[16px] py-[10px] rounded-[12px] bg-black/75 text-white text-[14px] fade">복사됨</div>}
      {/* 입력창 */}
      <div className="flex items-end gap-[8px] px-[10px] pt-[6px] bg-white" style={{ paddingBottom: "calc(var(--kbsab) + 4px)" }}>
        <span className="w-[34px] h-[34px] rounded-full bg-[#E9E9EB] flex items-center justify-center shrink-0 text-[#7c7c80]">
          <Plus size={22} strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-h-[34px] rounded-[18px] border border-[#c7c7cc] flex items-end pl-[12px] pr-[4px] py-[3px]">
          <textarea
            rows={1}
            value={c.text}
            readOnly={!c.editable}
            onChange={(e) => c.setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                c.send(replyTo ?? undefined);
                setReplyTo(null);
              }
            }}
            placeholder="iMessage"
            className="flex-1 resize-none outline-none bg-transparent text-[17px] leading-[22px] py-[2px] max-h-[88px] placeholder:text-[#c4c4c6]"
          />
          {c.canSend ? (
            <button onClick={() => (c.send(replyTo ?? undefined), setReplyTo(null))} className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-white shrink-0" style={{ background: "#007AFF" }}>
              <ArrowUp size={19} strokeWidth={3} />
            </button>
          ) : (
            <span className="w-[28px] h-[28px] flex items-center justify-center text-[#c4c4c6]">
              <Mic size={20} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const d = useData();
  const { appArg } = usePhoneCtx();
  const [openId, setOpenId] = useState<string | null>((appArg as string) || null);
  const [q, setQ] = useState("");
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const list = d.threads.filter((t) => t.app === "messages");
  useEffect(() => {
    if (openId) markRead(openId);
  }, [openId]);
  const pinned = list.filter((t) => t.pinned);
  const rest = list.filter((t) => !t.pinned && (!q || t.name.includes(q) || t.messages.some((m) => m.text.includes(q))));
  const cur = list.find((t) => t.id === openId);
  const unreadOthers = list.filter((t) => t.id !== openId).reduce((a, t) => a + t.unread, 0);

  return (
    <div className="absolute inset-0 bg-white">
      <NavBar
        title="메시지"
        scrolled={scrolled}
        right={<SquarePen size={23} strokeWidth={1.9} />}
        onBack={undefined}
      />
      <div className="absolute top-[var(--sat)] left-0 h-[44px] flex items-center px-4 text-[17px] text-[#007AFF] z-30">편집</div>
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 40 }}>
        <LargeTitle>메시지</LargeTitle>
        <SearchField value={q} onChange={setQ} />
        {/* 고정된 대화 */}
        {pinned.length > 0 && !q && (
          <div className="grid grid-cols-3 gap-y-4 px-4 pt-3 pb-4">
            {pinned.map((t) => (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="flex flex-col items-center gap-[6px] relative">
                {t.unread > 0 && <span className="absolute left-[14px] top-[30px] w-[11px] h-[11px] rounded-full bg-[#007AFF]" />}
                <Avatar name={t.name} size={78} />
                <span className="text-[12px] text-black/80 truncate max-w-[100px]">{t.name}</span>
              </button>
            ))}
          </div>
        )}
        <div>
          {rest.map((t) => {
            const last = [...t.messages].reverse().find((m) => m.from !== "system");
            return (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full flex items-start text-left active:bg-[#e5e5ea]">
                <span className="w-[20px] flex justify-center pt-[33px] shrink-0">{t.unread > 0 && <span className="w-[10px] h-[10px] rounded-full bg-[#007AFF]" />}</span>
                <div className="pt-[11px] pr-[10px]">
                  <Avatar name={t.name} size={45} />
                </div>
                <div className="flex-1 min-w-0 hair-b pt-[9px] pb-[10px] pr-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[17px] font-semibold truncate">{t.name}</span>
                    <span className="flex items-center text-[15px] text-[#8e8e93] shrink-0 ml-2">
                      {t.last}
                      <ChevronRight size={16} strokeWidth={2.4} className="text-[#c4c4c6] ml-1" />
                    </span>
                  </div>
                  <div className="text-[15px] leading-[20px] text-[#8e8e93] line-clamp-2 mt-[1px]">{preview(last)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {cur && <Conversation t={cur} onBack={() => setOpenId(null)} unreadOthers={unreadOthers} />}
    </div>
  );
}

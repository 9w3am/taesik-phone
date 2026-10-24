/* Signal — 보안 메신저 (다크 / 블루) */
import { useEffect, useState } from "react";
import { ChevronLeft, Video, Phone, Plus, Camera, Mic, ArrowUp, Timer, SquarePen, Lock, ShieldCheck } from "lucide-react";
import { useData, type Thread } from "../store";
import { photoSrc } from "../photos";
import { useStatusBar, usePhoneCtx, Img } from "../ui";
import { markRead, preview, useAutoBottom, useComposer } from "./Messages";

const BLUE = "#2C6BED";
function hue(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
function SAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const h = hue(name);
  const ch = name.replace(/[^A-Za-z가-힣ㄱ-ㅎ]/g, "").slice(0, 1).toUpperCase() || "#";
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-semibold" style={{ width: size, height: size, background: `hsl(${h} 32% 26%)`, color: `hsl(${h} 70% 82%)`, fontSize: size * 0.42 }}>
      {ch}
    </div>
  );
}

function Chat({ t, onBack, unread }: { t: Thread; onBack: () => void; unread: number }) {
  const d = useData();
  const c = useComposer(t);
  const ref = useAutoBottom(t.messages.length);
  const { call } = usePhoneCtx();
  return (
    <div className="absolute inset-0 z-30 bg-black text-white flex flex-col push">
      <div className="z-10 blur-bar" style={{ paddingTop: "var(--sat)", background: "rgba(18,18,18,0.92)" }}>
        <div className="h-[52px] flex items-center px-[4px]">
          <button onClick={onBack} className="flex items-center h-full">
            <ChevronLeft size={30} strokeWidth={2.2} />
            {unread > 0 && <span className="text-[15px] -ml-1 mr-1">{unread}</span>}
          </button>
          <SAvatar name={t.name} size={34} />
          <div className="ml-[10px] flex-1 min-w-0">
            <div className="text-[17px] font-semibold truncate leading-[20px]">{t.name}</div>
            {t.timer && (
              <div className="flex items-center gap-[3px] text-[12px] text-white/60 leading-[15px]">
                <Timer size={11} strokeWidth={2.4} />
                {t.timer}
              </div>
            )}
          </div>
          <div className="flex items-center gap-[20px] pr-[12px]">
            <Video size={24} strokeWidth={1.8} />
            <button onClick={() => call(t.name, ["……", "(Signal 통화 — 상대가 응답하지 않습니다)"], "out")}>
              <Phone size={21} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} className="flex-1 scroll px-[12px] pt-[14px] pb-[10px]">
        <div className="flex flex-col items-center pt-[10px] pb-[22px]">
          <SAvatar name={t.name} size={80} />
          <div className="text-[22px] font-semibold mt-[12px]">{t.name}</div>
          <div className="mt-[10px] flex items-center gap-[6px] text-[12px] text-white/55 px-[12px] py-[6px] rounded-[10px]" style={{ background: "#1B1B1D" }}>
            <Lock size={12} />
            메시지는 종단간 암호화되어 있습니다
          </div>
        </div>
        {t.messages.map((m, i) => {
          if (m.from === "system")
            return (
              <div key={m.id} className="flex items-center justify-center gap-[6px] text-[12px] text-white/55 my-[14px] px-6 text-center">
                <Timer size={13} className="shrink-0" />
                {m.text}
              </div>
            );
          const mine = m.from === "me";
          const next = t.messages[i + 1];
          const prev = t.messages[i - 1];
          const last = !next || next.from !== m.from;
          const firstG = !prev || prev.from !== m.from;
          const r = 18,
            s = 4;
          const radius = mine ? `${r}px ${firstG ? r : s}px ${last ? r : s}px ${r}px` : `${firstG ? r : s}px ${r}px ${r}px ${last ? r : s}px`;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} style={{ marginTop: firstG ? 10 : 2 }}>
              <div className="max-w-[76%]">
                {m.kind === "photo" ? (
                  <Img src={photoSrc(m.photo || "", d.photos, 480, 640)} className="w-[210px] h-[270px]" style={{ borderRadius: radius }} />
                ) : (
                  <div className="px-[12px] pt-[7px] pb-[6px] text-[16px] leading-[21px] whitespace-pre-wrap" style={{ background: mine ? BLUE : "#3B3B3D", borderRadius: radius, wordBreak: "keep-all", overflowWrap: "anywhere" }}>
                    {m.text}
                    {last && t.timer && (
                      <span className="inline-flex items-center ml-[8px] translate-y-[2px] opacity-70">
                        <Timer size={11} strokeWidth={2.4} />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-end gap-[8px] px-[10px] pt-[8px]" style={{ paddingBottom: "calc(var(--sab) + 2px)", background: "#121212" }}>
        <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0" style={{ background: "#2C2C2E" }}>
          <Plus size={22} />
        </span>
        <div className="flex-1 min-h-[36px] rounded-[18px] flex items-center pl-[14px] pr-[8px]" style={{ background: "#2C2C2E" }}>
          <textarea
            rows={1}
            value={c.text}
            readOnly={!c.editable}
            onChange={(e) => c.setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                c.send();
              }
            }}
            placeholder="Signal 메시지"
            className="flex-1 resize-none outline-none bg-transparent text-[16px] leading-[21px] py-[7px] max-h-[84px] text-white placeholder:text-white/40"
          />
        </div>
        {c.canSend ? (
          <button onClick={c.send} className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: BLUE }}>
            <ArrowUp size={20} strokeWidth={2.6} />
          </button>
        ) : (
          <div className="flex items-center gap-[14px] h-[36px] px-[4px] text-white/90 shrink-0">
            <Camera size={23} strokeWidth={1.7} />
            <Mic size={23} strokeWidth={1.7} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Signal() {
  useStatusBar(false);
  const d = useData();
  const { appArg } = usePhoneCtx();
  const [openId, setOpenId] = useState<string | null>((appArg as string) || null);
  const list = d.threads.filter((t) => t.app === "signal");
  useEffect(() => {
    if (openId) markRead(openId);
  }, [openId]);
  const cur = list.find((t) => t.id === openId);
  return (
    <div className="absolute inset-0 bg-black text-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 40 }}>
        <div className="h-[48px] flex items-center justify-between px-[14px]">
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ background: "hsl(210 30% 28%)", color: "hsl(210 70% 85%)" }}>
            T
          </div>
          <span className="text-[17px] font-semibold">채팅</span>
          <div className="flex items-center gap-[18px]">
            <Camera size={23} strokeWidth={1.7} />
            <SquarePen size={22} strokeWidth={1.7} />
          </div>
        </div>
        <div className="px-[14px] pb-[8px]">
          <div className="h-[36px] rounded-[10px] flex items-center px-[10px] text-white/40 text-[16px]" style={{ background: "#1C1C1E" }}>
            검색
          </div>
        </div>
        {list.map((t) => {
          const last = [...t.messages].reverse().find((m) => m.from !== "system");
          return (
            <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full flex items-center gap-[12px] px-[14px] py-[9px] text-left active:bg-white/5">
              <SAvatar name={t.name} size={52} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px] font-semibold truncate">{t.name}</span>
                  <span className="text-[13px] shrink-0 ml-2" style={{ color: t.unread ? BLUE : "rgba(255,255,255,0.5)" }}>
                    {t.last}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-[2px]">
                  <span className="text-[15px] text-white/55 truncate flex items-center gap-1">
                    {t.timer && <Timer size={13} className="shrink-0" />}
                    {preview(last)}
                  </span>
                  {t.unread > 0 && (
                    <span className="min-w-[20px] h-[20px] px-[6px] rounded-full text-[12px] font-semibold flex items-center justify-center ml-2" style={{ background: BLUE }}>
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        <div className="flex items-center justify-center gap-[6px] text-[12px] text-white/35 pt-[24px]">
          <ShieldCheck size={13} />
          Signal은 종단간 암호화를 사용합니다
        </div>
      </div>
      {cur && <Chat t={cur} onBack={() => setOpenId(null)} unread={list.filter((x) => x.id !== cur.id).reduce((a, x) => a + x.unread, 0)} />}
    </div>
  );
}

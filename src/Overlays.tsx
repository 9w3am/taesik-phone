/* 제어 센터(오른쪽 위에서 끌어내리기) · 알림 센터(왼쪽 위에서 끌어내리기) */
import { useState } from "react";
import { Plane, Antenna, Wifi, Bluetooth, Moon, Flashlight, Timer, Calculator, Camera, Sun, Volume2, Lock, Play, Pause, FastForward, Rewind, Radio, X, BellOff, Bell } from "lucide-react";
import { DAYS, update, type PhoneData, type Song } from "./store";
import { AppIcon } from "./icons";
import { hm, useNow } from "./ui";
import { Wallpaper } from "./Phone";

function Tile({ on, onClick, children, color = "#007AFF", round = false, size = 60 }: { on?: boolean; onClick?: () => void; children: React.ReactNode; color?: string; round?: boolean; size?: number }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="flex items-center justify-center transition-colors active:scale-95"
      style={{ width: size, height: size, borderRadius: round ? 999 : 18, background: on ? color : "rgba(84,84,90,0.55)", color: "#fff" }}
    >
      {children}
    </button>
  );
}

function Slider({ value, onChange, icon }: { value: number; onChange: (v: number) => void; icon: React.ReactNode }) {
  return (
    <div
      className="relative w-[70px] h-[150px] rounded-[22px] overflow-hidden touch-none cursor-pointer"
      style={{ background: "rgba(84,84,90,0.55)" }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        const el = e.currentTarget;
        try { el.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 터치 */ }
        const set = (y: number) => {
          const r = el.getBoundingClientRect();
          onChange(Math.max(0.05, Math.min(1, 1 - (y - r.top) / r.height)));
        };
        set(e.clientY);
        el.onpointermove = (ev) => set(ev.clientY);
        el.onpointerup = () => (el.onpointermove = null);
      }}
    >
      <div className="absolute bottom-0 left-0 right-0 bg-white" style={{ height: `${value * 100}%` }} />
      <div className="absolute bottom-[14px] left-0 right-0 flex justify-center" style={{ color: value > 0.18 ? "#8e8e93" : "#fff" }}>
        {icon}
      </div>
    </div>
  );
}

export function ControlCenter({
  d,
  close,
  open,
  playing,
  brightness,
  setBrightness,
  torch,
  setTorch,
}: {
  d: PhoneData;
  close: () => void;
  open: (id: string) => void;
  playing: Song | null;
  brightness: number;
  setBrightness: (v: number) => void;
  torch: boolean;
  setTorch: (v: boolean) => void;
}) {
  const [t, setT] = useState({ air: false, cell: true, wifi: false, bt: false, dnd: true, lock: true });
  const [vol, setVol] = useState(0.55);
  const tg = (k: keyof typeof t) => setT((x) => ({ ...x, [k]: !x[k] }));
  const go = (id: string) => {
    close();
    open(id);
  };
  return (
    <div className="absolute inset-0 z-[92] fade" onClick={close}>
      <div className="absolute inset-0 blur-bar" style={{ background: "rgba(18,18,20,0.82)", backdropFilter: "blur(30px) saturate(140%)", WebkitBackdropFilter: "blur(30px) saturate(140%)" }} />
      <div className="relative pt-[64px] px-[26px] text-white sheet" style={{ animationName: "fadeIn" }}>
        <div className="flex justify-between text-[13px] font-semibold px-[4px] mb-[14px] text-white/90">
          <span>{d.carrier} 5G</span>
          <span>{d.battery}%</span>
        </div>
        <div className="grid grid-cols-2 gap-[14px]">
          {/* 연결 */}
          <div className="rounded-[26px] p-[14px] grid grid-cols-2 gap-[12px] justify-items-center" style={{ background: "rgba(84,84,90,0.55)" }}>
            <Tile round on={t.air} color="#FF9500" onClick={() => tg("air")}>
              <Plane size={24} fill="#fff" strokeWidth={0} />
            </Tile>
            <Tile round on={t.cell && !t.air} color="#34C759" onClick={() => tg("cell")}>
              <Antenna size={24} />
            </Tile>
            <Tile round on={t.wifi && !t.air} onClick={() => tg("wifi")}>
              <Wifi size={24} strokeWidth={2.4} />
            </Tile>
            <Tile round on={t.bt} onClick={() => tg("bt")}>
              <Bluetooth size={24} strokeWidth={2.2} />
            </Tile>
          </div>
          {/* 음악 */}
          <div className="rounded-[26px] p-[14px] flex flex-col" style={{ background: "rgba(84,84,90,0.55)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-[8px]">
              {playing ? (
                <span className="w-[34px] h-[34px] rounded-[8px] shrink-0" style={{ background: `linear-gradient(135deg,hsl(${playing.hue} 50% 50%),hsl(${playing.hue + 30} 40% 20%))` }} />
              ) : (
                <Radio size={20} className="text-white/60" />
              )}
              <div className="min-w-0">
                <div className="text-[14px] font-semibold truncate">{playing ? playing.title : "재생 안 함"}</div>
                {playing && <div className="text-[12px] text-white/60 truncate">{playing.artist}</div>}
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex justify-around items-center">
              <Rewind size={22} fill="#fff" strokeWidth={0} />
              <button onClick={() => go("music")}>{playing ? <Pause size={28} fill="#fff" strokeWidth={0} /> : <Play size={28} fill="#fff" strokeWidth={0} />}</button>
              <FastForward size={22} fill="#fff" strokeWidth={0} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[14px] mt-[14px] items-start">
          <div className="col-span-2 grid grid-cols-2 gap-[14px] justify-items-center">
            <Tile on={t.lock} color="#fff" onClick={() => tg("lock")}>
              <Lock size={22} color={t.lock ? "#FF3B30" : "#fff"} strokeWidth={2.4} />
            </Tile>
            <Tile on={!!d.sounds?.muted} color="#FF3B30" onClick={() => update((x) => void (x.sounds = { ...(x.sounds ?? {}), muted: !x.sounds?.muted }))}>
              {d.sounds?.muted ? <BellOff size={22} strokeWidth={2.2} /> : <Bell size={22} strokeWidth={2.2} />}
            </Tile>
            <button
              onClick={(e) => {
                e.stopPropagation();
                tg("dnd");
              }}
              className="col-span-2 w-full h-[60px] rounded-[18px] flex items-center gap-[10px] px-[14px]"
              style={{ background: t.dnd ? "#fff" : "rgba(84,84,90,0.55)", color: t.dnd ? "#000" : "#fff" }}
            >
              <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: t.dnd ? "#5856D6" : "rgba(255,255,255,0.15)" }}>
                <Moon size={18} fill="#fff" color="#fff" />
              </span>
              <span className="text-[15px] font-semibold">방해금지 모드</span>
            </button>
          </div>
          <Slider value={brightness} onChange={setBrightness} icon={<Sun size={24} strokeWidth={2.4} />} />
          <Slider value={vol} onChange={setVol} icon={<Volume2 size={24} strokeWidth={2.4} />} />
        </div>
        <div className="grid grid-cols-4 gap-[14px] mt-[14px] justify-items-center">
          <Tile on={torch} color="#fff" onClick={() => setTorch(!torch)}>
            <Flashlight size={24} color={torch ? "#000" : "#fff"} fill={torch ? "#000" : "none"} />
          </Tile>
          <Tile onClick={() => go("clock")}>
            <Timer size={24} />
          </Tile>
          <Tile onClick={() => go("calculator")}>
            <Calculator size={24} />
          </Tile>
          <Tile onClick={() => go("camera")}>
            <Camera size={24} />
          </Tile>
        </div>
      </div>
    </div>
  );
}

export function NotifCenter({ d, close, open }: { d: PhoneData; close: () => void; open: (id: string, arg?: unknown) => void }) {
  const now = useNow();
  const unread = d.threads.filter((t) => t.unread > 0 && t.app !== "insta"); // 인스타는 지금 폰에서 숨김
  return (
    <div className="absolute inset-0 z-[92] sheet scroll" style={{ animationDuration: "0.32s" }} onClick={close}>
      <Wallpaper blur={24} dim={0.25} />
      <div className="relative flex flex-col items-center text-white pt-[62px]">
        <div className="text-[21px] font-semibold opacity-90">
          {now.getMonth() + 1}월 {now.getDate()}일 {DAYS[now.getDay()]}요일
        </div>
        <div className="text-[96px] leading-[96px] font-semibold tracking-[-0.035em] tabular">{hm(now)}</div>
      </div>
      <div className="relative px-[8px] mt-[22px] pb-[60px]">
        <div className="flex justify-between items-center px-[10px] pb-[8px] text-white">
          <span className="text-[20px] font-bold">알림 센터</span>
          <span className="w-[26px] h-[26px] rounded-full bg-white/20 flex items-center justify-center"><X size={14} strokeWidth={3} /></span>
        </div>
        <div className="flex flex-col gap-[8px]">
          {unread.map((t) => {
            const last = [...t.messages].reverse().find((m) => m.from !== "system");
            return (
              <button
                key={t.id}
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  open(t.app, t.id);
                }}
                className="rounded-[22px] px-[14px] py-[12px] flex gap-[10px] items-center text-left blur-bar"
                style={{ background: "rgba(245,245,245,0.62)" }}
              >
                <AppIcon id={t.app} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-semibold truncate">{t.name}</span>
                    <span className="text-[13px] text-black/45 ml-2 shrink-0">{t.last}</span>
                  </div>
                  <div className="text-[15px] leading-[20px] truncate">{last?.kind === "pay" ? `송금 ${last.amount?.toLocaleString()}원` : last?.text.replace(/\n/g, " ")}</div>
                </div>
                {t.unread > 1 && <span className="text-[12px] text-black/45 shrink-0">+{t.unread - 1}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

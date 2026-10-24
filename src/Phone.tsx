import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flashlight, Camera, Lock, MapPin, Cloud, Search, Phone as PhoneIcon, PhoneOff, MessageCircle, AlarmClock } from "lucide-react";
import { useData, update, DAYS, type PhoneData, type Song } from "./store";
import { AppIcon } from "./icons";
import { Ctx, hm, useNow, type PhoneCtx } from "./ui";
import { APPS } from "./apps";
import { CallScreen } from "./apps/Call";

/* ───────── 배경화면: 단순한 다크 모노톤 추상 (CSS로만 생성) ───────── */
const WALL =
  "radial-gradient(70% 45% at 18% 22%, rgba(120,120,126,0.55) 0%, rgba(120,120,126,0) 70%)," +
  "radial-gradient(60% 50% at 88% 70%, rgba(92,92,98,0.5) 0%, rgba(92,92,98,0) 70%)," +
  "radial-gradient(90% 60% at 50% 110%, rgba(60,60,64,0.9) 0%, rgba(60,60,64,0) 70%)," +
  "linear-gradient(170deg, #2a2a2d 0%, #151517 55%, #0b0b0c 100%)";
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.09'/%3E%3C/svg%3E\")";
export function Wallpaper({ blur = 0, dim = 0 }: { blur?: number; dim?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-[-40px]" style={{ background: WALL, filter: blur ? `blur(${blur}px)` : undefined }} />
      <div className="absolute inset-0" style={{ backgroundImage: NOISE }} />
      {dim > 0 && <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim})` }} />}
    </div>
  );
}

/* ───────── 상태바 ───────── */
function StatusBar({ dark, battery, lowPower, onLongPress, hideTime, carrier }: { dark: boolean; battery: number; lowPower: boolean; onLongPress: () => void; hideTime?: boolean; carrier: string }) {
  const now = useNow();
  const c = dark ? "#000" : "#fff";
  const timer = useRef<number | undefined>(undefined);
  const lvl = Math.max(0, Math.min(100, battery));
  const fillC = lowPower ? "#FFD60A" : lvl <= 20 ? "#FF3B30" : c;
  return (
    <div className="absolute top-0 left-0 right-0 h-[54px] z-[60] pointer-events-none flex items-center justify-between" style={{ color: c }}>
      <div
        className="w-[150px] flex justify-center pt-[6px] pointer-events-auto select-none"
        onPointerDown={() => (timer.current = window.setTimeout(onLongPress, 1600))}
        onPointerUp={() => clearTimeout(timer.current)}
        onPointerLeave={() => clearTimeout(timer.current)}
      >
        {!hideTime && <span className="text-[17px] font-semibold tracking-[-0.02em] tabular">{hm(now)}</span>}
      </div>
      <div className="w-[150px] flex items-center justify-center gap-[6px] pt-[6px]" title={carrier}>
        {/* 셀룰러 */}
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.8} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.9" fill={c} opacity={i === 3 ? 0.35 : 1} />
          ))}
        </svg>
        {/* 와이파이 */}
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 2.3c2.5 0 4.8.9 6.6 2.5l1.2-1.3C14.2 1.6 11.5.5 8.5.5S2.8 1.6.7 3.5l1.2 1.3C3.7 3.2 6 2.3 8.5 2.3z" fill={c} />
          <path d="M8.5 5.6c1.6 0 3 .6 4.2 1.6l1.2-1.3C12.4 4.6 10.5 3.8 8.5 3.8s-3.9.8-5.4 2.1l1.2 1.3c1.2-1 2.6-1.6 4.2-1.6z" fill={c} />
          <path d="M8.5 8.8c.8 0 1.4.3 1.9.7L8.5 11.6 6.6 9.5c.5-.4 1.1-.7 1.9-.7z" fill={c} />
        </svg>
        {/* 배터리 */}
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke={c} opacity="0.4" />
          <rect x="2" y="2" width={Math.max(1.5, (20 * lvl) / 100)} height="9" rx="2.3" fill={fillC} />
          <path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1z" fill={c} opacity="0.45" />
        </svg>
      </div>
    </div>
  );
}

/* ───────── 다이내믹 아일랜드 ───────── */
function Island({ playing, calling }: { playing: Song | null; calling: boolean }) {
  const wide = !!playing || calling;
  return (
    <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-[70] bg-black rounded-full flex items-center justify-between px-[7px] transition-all duration-500" style={{ width: wide ? 200 : 125, height: 37 }}>
      {wide && playing && !calling && (
        <>
          <div className="w-[22px] h-[22px] rounded-[6px]" style={{ background: `linear-gradient(135deg,hsl(${playing.hue} 60% 55%),hsl(${playing.hue + 40} 50% 25%))` }} />
          <div className="flex items-end gap-[2px] h-[14px] mr-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-[3px] h-full rounded-full origin-bottom" style={{ background: `hsl(${playing.hue} 70% 65%)`, animation: `eq ${0.7 + i * 0.15}s ease-in-out ${i * 0.1}s infinite` }} />
            ))}
          </div>
        </>
      )}
      {calling && (
        <>
          <PhoneIcon size={15} className="text-[#34C759] ml-1.5" fill="#34C759" />
          <span className="w-2 h-2 rounded-full bg-[#34C759] mr-2" />
        </>
      )}
    </div>
  );
}

/* ───────── 잠금화면 ───────── */
function LockScreen({ d, onUnlock, onCamera }: { d: PhoneData; onUnlock: () => void; onCamera: () => void }) {
  const now = useNow();
  const [dy, setDy] = useState(0);
  const [torch, setTorch] = useState(false);
  const start = useRef<number | null>(null);
  const date = `${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;
  const end = () => {
    if (start.current === null) return;
    start.current = null;
    if (dy < -90) onUnlock();
    setDy(0);
  };
  return (
    <div
      className="absolute inset-0 select-none touch-none"
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerMove={(e) => start.current !== null && setDy(Math.min(0, e.clientY - start.current))}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={end}
    >
      <Wallpaper />
      {torch && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 40% at 50% 100%, rgba(255,255,255,0.12), transparent)" }} />}
      <div className="absolute inset-0 flex flex-col items-center text-white" style={{ transform: `translateY(${dy * 0.6}px)`, opacity: 1 + dy / 400, transition: start.current === null ? "all .3s" : "none" }}>
        <Lock size={17} strokeWidth={2.6} className="mt-[62px] opacity-90" />
        <div className="mt-[10px] text-[21px] font-semibold tracking-[-0.01em] opacity-90">{date}</div>
        <div className="text-[96px] leading-[96px] font-semibold tracking-[-0.035em] tabular mt-[2px]" style={{ fontFamily: "-apple-system,'SF Pro Rounded','SF Pro Display','Pretendard Variable',sans-serif", textShadow: "0 1px 30px rgba(0,0,0,0.15)" }}>
          {hm(now)}
        </div>
        <div className="flex-1" />
        {/* 알림 스택 */}
        <div className="w-full px-[8px] flex flex-col gap-[8px] mb-[118px]">
          {d.lockNotifs.map((n, i) => (
            <div key={i} className="rounded-[22px] px-[14px] py-[12px] flex gap-[10px] items-center blur-bar" style={{ background: "rgba(245,245,245,0.62)", color: "#000" }}>
              <AppIcon id={n.app === "phone" ? "phone" : n.app === "bank" ? "bank" : n.app} size={38} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-[15px] font-semibold truncate">{n.title}</span>
                  <span className="text-[13px] text-black/45 ml-2 shrink-0">{n.when}</span>
                </div>
                <div className="text-[15px] leading-[20px] truncate">{n.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 손전등 / 카메라 */}
      <div className="absolute left-0 right-0 bottom-[46px] flex justify-between px-[46px]">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setTorch((t) => !t)}
          className="w-[50px] h-[50px] rounded-full flex items-center justify-center blur-bar transition-colors"
          style={{ background: torch ? "#fff" : "rgba(0,0,0,0.32)", color: torch ? "#000" : "#fff" }}
        >
          <Flashlight size={22} fill={torch ? "#000" : "none"} />
        </button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={onCamera} className="w-[50px] h-[50px] rounded-full flex items-center justify-center blur-bar text-white" style={{ background: "rgba(0,0,0,0.32)" }}>
          <Camera size={22} />
        </button>
      </div>
      <button onClick={onUnlock} className="absolute bottom-[22px] left-1/2 -translate-x-1/2 text-white/80 text-[13px] font-medium">
        위로 쓸어올려 열기
      </button>
    </div>
  );
}

/* ───────── 암호 입력 ───────── */
function Passcode({ code, hint, onOk, onCancel }: { code: string; hint: string; onOk: () => void; onCancel: () => void }) {
  const [v, setV] = useState("");
  const [bad, setBad] = useState(false);
  const press = (k: string) => {
    const nv = (v + k).slice(0, code.length);
    setV(nv);
    if (nv.length === code.length) {
      if (nv === code) setTimeout(onOk, 120);
      else {
        setBad(true);
        setTimeout(() => {
          setBad(false);
          setV("");
        }, 450);
      }
    }
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      if (e.key === "Backspace") setV((x) => x.slice(0, -1));
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  const keys: [string, string][] = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"]];
  return (
    <div className="absolute inset-0 text-white fade">
      <Wallpaper blur={30} dim={0.35} />
      <div className="relative flex flex-col items-center pt-[110px]">
        <div className="text-[20px] font-normal">암호 입력</div>
        <div className={`flex gap-[22px] mt-[18px] ${bad ? "shake" : ""}`}>
          {Array.from({ length: code.length }).map((_, i) => (
            <span key={i} className="w-[13px] h-[13px] rounded-full border-[1.5px] border-white" style={{ background: i < v.length ? "#fff" : "transparent" }} />
          ))}
        </div>
        <div className="h-[22px] mt-[10px] text-[13px] text-white/70">{hint}</div>
        <div className="grid grid-cols-3 gap-x-[26px] gap-y-[16px] mt-[30px]">
          {keys.map(([k, s]) => (
            <button key={k} onClick={() => press(k)} className="w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center active:bg-white/50 transition-colors" style={{ background: "rgba(255,255,255,0.18)" }}>
              <span className="text-[36px] leading-[38px] font-light">{k}</span>
              <span className="text-[10px] font-bold tracking-[0.18em] h-[12px]">{s}</span>
            </button>
          ))}
          <span />
          <button onClick={() => press("0")} className="w-[78px] h-[78px] rounded-full flex items-center justify-center active:bg-white/50" style={{ background: "rgba(255,255,255,0.18)" }}>
            <span className="text-[36px] font-light">0</span>
          </button>
        </div>
      </div>
      <div className="absolute bottom-[50px] left-0 right-0 flex justify-between px-[50px] text-[17px]">
        <span>긴급 구조</span>
        <button onClick={() => (v ? setV(v.slice(0, -1)) : onCancel())}>{v ? "삭제" : "취소"}</button>
      </div>
    </div>
  );
}

/* ───────── 홈 화면 ───────── */
type HomeItem = string;
const GRID: HomeItem[] = ["kakao", "signal", "insta", "photos", "calendar", "notes", "contacts", "bank", "maps", "clock", "weather", "calculator", "camera", "settings"];
const DOCK: HomeItem[] = ["phone", "messages", "safari", "music"];

function Home({ d, open }: { d: PhoneData; open: (id: string) => void }) {
  const now = useNow(30000);
  const badge = (id: string) => {
    const t = (app: string) => d.threads.filter((x) => x.app === app).reduce((a, x) => a + (x.unread || 0), 0);
    if (id === "messages") return t("messages");
    if (id === "kakao") return t("kakao");
    if (id === "signal") return t("signal");
    if (id === "insta") return t("insta");
    if (id === "phone") return d.calls.filter((c) => c.kind === "missed").reduce((a, c) => a + (c.count || 1), 0);
    return 0;
  };
  const today = d.calendar.filter((e) => e.days.includes(now.getDay())).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const Icon = ({ id, dock }: { id: string; dock?: boolean }) => {
    const b = badge(id);
    return (
      <button onClick={() => open(id)} className="flex flex-col items-center gap-[5px] active:opacity-70 transition-opacity">
        <div className="relative">
          <AppIcon id={id} size={62} />
          {b > 0 && (
            <span className="absolute -top-[6px] -right-[7px] min-w-[23px] h-[23px] px-[6px] rounded-full bg-[#FF3B30] text-white text-[14px] font-medium flex items-center justify-center tabular">
              {b > 999 ? "999+" : b}
            </span>
          )}
        </div>
        {!dock && <span className="text-[12px] text-white font-medium leading-none tracking-[-0.01em] whitespace-nowrap" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{APPS[id]?.label}</span>}
      </button>
    );
  };
  return (
    <div className="absolute inset-0 fade">
      <Wallpaper />
      <div className="relative pt-[66px] px-[22px]">
        {/* 위젯 */}
        <div className="grid grid-cols-2 gap-x-[22px]">
          <button onClick={() => open("weather")} className="flex flex-col items-center gap-[6px]">
            <div className="w-full aspect-square rounded-[22px] p-[15px] text-white text-left flex flex-col blur-bar" style={{ background: "rgba(28,28,30,0.72)" }}>
              <div className="flex items-center gap-1 text-[15px] font-semibold">
                {d.weather.city}
                <MapPin size={11} fill="#fff" />
              </div>
              <div className="text-[44px] leading-[48px] font-light tracking-[-0.02em]">{d.weather.temp}°</div>
              <div className="flex-1" />
              <Cloud size={17} fill="#fff" strokeWidth={0} />
              <div className="text-[13px] font-semibold mt-0.5">{d.weather.cond}</div>
              <div className="text-[13px] font-medium">
                최고:{d.weather.hi}° 최저:{d.weather.lo}°
              </div>
            </div>
            <span className="text-[12px] text-white font-medium">날씨</span>
          </button>
          <button onClick={() => open("calendar")} className="flex flex-col items-center gap-[6px]">
            <div className="w-full aspect-square rounded-[22px] p-[15px] text-left flex flex-col bg-white">
              <div className="text-[12px] font-semibold text-[#FF3B30] uppercase">{DAYS[now.getDay()]}요일</div>
              <div className="text-[34px] leading-[38px] font-light text-black tracking-[-0.02em]">{now.getDate()}</div>
              <div className="flex-1 flex flex-col gap-[5px] mt-[6px] overflow-hidden">
                {today.length === 0 && <div className="text-[13px] text-black/45 font-medium">오늘 일정 없음</div>}
                {today.slice(0, 2).map((e) => (
                  <div key={e.id} className="flex gap-[6px]">
                    <span className="w-[3.5px] rounded-full shrink-0" style={{ background: e.color }} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-black truncate leading-[16px]">{e.title}</div>
                      <div className="text-[12px] text-black/50 leading-[15px]">{e.time ? `${e.time}${e.end ? `–${e.end}` : ""}` : "하루 종일"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[12px] text-white font-medium">캘린더</span>
          </button>
        </div>
        {/* 아이콘 그리드 */}
        <div className="grid grid-cols-4 gap-y-[26px] mt-[22px] justify-items-center">
          {GRID.map((id) => (
            <Icon key={id} id={id} />
          ))}
        </div>
      </div>
      {/* 검색 */}
      <div className="absolute bottom-[128px] left-0 right-0 flex justify-center">
        <div className="h-[30px] px-[12px] rounded-full flex items-center gap-[5px] text-white text-[13px] font-semibold blur-bar" style={{ background: "rgba(255,255,255,0.18)" }}>
          <Search size={12} strokeWidth={3} />
          검색
        </div>
      </div>
      {/* 독 */}
      <div className="absolute bottom-[12px] left-[12px] right-[12px] h-[96px] rounded-[34px] flex items-center justify-around px-[8px] blur-bar" style={{ background: "rgba(255,255,255,0.2)" }}>
        {DOCK.map((id) => (
          <Icon key={id} id={id} dock />
        ))}
      </div>
    </div>
  );
}

/* ───────── 수신 전화 ───────── */
function Incoming({ name, onAccept, onDecline }: { name: string; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="absolute inset-0 z-[80] text-white fade bg-[#111]">
      <Wallpaper blur={40} dim={0.45} />
      <div className="relative flex flex-col items-center pt-[86px]">
        <div className="text-[15px] text-white/70">휴대전화</div>
        <div className="text-[34px] font-normal mt-1 px-6 text-center leading-[40px]">{name}</div>
      </div>
      <div className="absolute bottom-[150px] left-0 right-0 flex justify-between px-[54px] text-[13px]">
        <div className="flex flex-col items-center gap-2 opacity-90">
          <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.18)" }}>
            <AlarmClock size={20} />
          </div>
          알림
        </div>
        <div className="flex flex-col items-center gap-2 opacity-90">
          <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.18)" }}>
            <MessageCircle size={20} />
          </div>
          메시지
        </div>
      </div>
      <div className="absolute bottom-[56px] left-0 right-0 flex justify-between px-[46px] text-[15px]">
        <button onClick={onDecline} className="flex flex-col items-center gap-2">
          <span className="w-[76px] h-[76px] rounded-full bg-[#FF3B30] flex items-center justify-center">
            <PhoneOff size={32} fill="#fff" strokeWidth={0} />
          </span>
          거절
        </button>
        <button onClick={onAccept} className="flex flex-col items-center gap-2">
          <span className="w-[76px] h-[76px] rounded-full bg-[#34C759] flex items-center justify-center ring">
            <PhoneIcon size={32} fill="#fff" strokeWidth={0} />
          </span>
          수락
        </button>
      </div>
    </div>
  );
}

/* ───────── 폰 본체 ───────── */
type CallState = { name: string; lines: string[]; mode: "out" | "in"; ringing: boolean } | null;
type Banner = { app: string; title: string; text: string; target?: string } | null;

export default function Phone() {
  const d = useData();
  const [phase, setPhase] = useState<"lock" | "code" | "home">("lock");
  const [app, setApp] = useState<string | null>(null);
  const [appArg, setAppArg] = useState<unknown>(null);
  const [appKey, setAppKey] = useState(0);
  const [statusDark, setStatusDark] = useState(false);
  const [call, setCall] = useState<CallState>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [alert, setAlert] = useState<null | "battery">(null);
  const [lowPower, setLowPower] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [playing, setPlaying] = useState<Song | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const fired = useRef<Set<string>>(new Set());

  // 레이아웃: 모바일은 전체화면, PC는 기기 목업 중앙
  useEffect(() => {
    const f = () => {
      const m = window.innerWidth <= 500 || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 820 && window.innerHeight > window.innerWidth);
      setMobile(m);
      setScale(Math.min(1, (window.innerHeight - 32) / 892, (window.innerWidth - 24) / 433));
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const open = useCallback((id: string, arg?: unknown) => {
    setAppArg(arg ?? null);
    setApp(id);
    setAppKey((k) => k + 1);
    setStatusDark(!!APPS[id]?.light);
  }, []);
  const home = useCallback(() => {
    setApp(null);
    setStatusDark(false);
  }, []);
  const toast = useCallback((t: string) => {
    setToastMsg(t);
    setTimeout(() => setToastMsg(""), 1800);
  }, []);
  const startCall = useCallback((name: string, lines: string[], mode: "out" | "in" = "out") => setCall({ name, lines, mode, ringing: mode === "in" }), []);

  const ctx: PhoneCtx & { setPlaying: (s: Song | null) => void; playing: Song | null } = useMemo(
    () => ({ open, home, setStatusDark, call: startCall, toast, appArg, setPlaying, playing }),
    [open, home, startCall, toast, appArg, playing],
  );

  // 체류 시간 이벤트 (배너 · 수신 전화 · 배터리)
  useEffect(() => {
    if (phase !== "home") return;
    const ts: number[] = [];
    const ev = d.events;
    if (ev.banner.enabled && !fired.current.has("banner"))
      ts.push(
        window.setTimeout(() => {
          fired.current.add("banner");
          const t = d.threads.find((x) => x.app === ev.banner.app && x.name === ev.banner.title);
          setBanner({ app: ev.banner.app, title: ev.banner.title, text: ev.banner.text, target: t?.id });
          setTimeout(() => setBanner(null), 5500);
        }, ev.banner.afterSec * 1000),
      );
    if (ev.incomingCall.enabled && !fired.current.has("call"))
      ts.push(
        window.setTimeout(() => {
          fired.current.add("call");
          setCall((c) => c ?? { name: ev.incomingCall.name, lines: ev.incomingCall.lines, mode: "in", ringing: true });
        }, ev.incomingCall.afterSec * 1000),
      );
    if (ev.lowBattery.enabled && !fired.current.has("bat"))
      ts.push(
        window.setTimeout(() => {
          fired.current.add("bat");
          setAlert("battery");
        }, ev.lowBattery.afterSec * 1000),
      );
    return () => ts.forEach(clearTimeout);
  }, [phase, d.events, d.threads]);

  const unlock = () => (d.passcode ? setPhase("code") : setPhase("home"));
  const goEditor = () => {
    location.hash = "#/editor";
  };

  const AppComp = app ? APPS[app]?.C : null;
  const onDarkSurface = phase !== "home" || !app ? false : statusDark;
  const indicatorDark = phase === "home" && !!app && statusDark && !call;

  const screen = (
    <div className="screen" style={mobile ? undefined : undefined}>
      <Ctx.Provider value={ctx}>
        {phase === "lock" && (
          <LockScreen
            d={d}
            onUnlock={unlock}
            onCamera={() => {
              setPhase("home");
              open("camera");
            }}
          />
        )}
        {phase === "code" && <Passcode code={d.passcode} hint={d.passcodeHint} onOk={() => setPhase("home")} onCancel={() => setPhase("lock")} />}
        {phase === "home" && (
          <>
            <Home d={d} open={open} />
            {AppComp && (
              <div key={appKey} className="absolute inset-0 z-10 app-open overflow-hidden" style={{ background: APPS[app!]?.light ? "#fff" : "#000" }}>
                <AppComp />
              </div>
            )}
          </>
        )}

        {/* 배너 알림 */}
        {banner && (
          <button
            className="absolute top-[52px] left-[8px] right-[8px] z-[75] rounded-[22px] px-[14px] py-[12px] flex gap-[10px] items-center text-left banner blur-bar"
            style={{ background: "rgba(245,245,245,0.82)", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}
            onClick={() => {
              setBanner(null);
              if (phase === "home") open(banner.app, banner.target);
            }}
          >
            <AppIcon id={banner.app} size={38} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <span className="text-[15px] font-semibold truncate">{banner.title}</span>
                <span className="text-[13px] text-black/45">지금</span>
              </div>
              <div className="text-[15px] truncate">{banner.text}</div>
            </div>
          </button>
        )}

        {/* 수신/통화 */}
        {call && call.ringing && (
          <Incoming
            name={call.name}
            onAccept={() => setCall({ ...call, ringing: false })}
            onDecline={() => {
              setCall(null);
              update((x) => {
                x.calls.unshift({ id: Math.random().toString(36).slice(2), name: call.name, kind: "missed", label: "휴대전화", when: hm(new Date()), lines: call.lines });
              });
            }}
          />
        )}
        {call && !call.ringing && (
          <CallScreen
            name={call.name}
            lines={call.lines}
            mode={call.mode}
            onEnd={() => {
              if (call.mode === "in")
                update((x) => {
                  x.calls.unshift({ id: Math.random().toString(36).slice(2), name: call.name, kind: "in", label: "휴대전화", when: hm(new Date()), lines: call.lines });
                });
              setCall(null);
            }}
          />
        )}

        {/* 배터리 경고 */}
        {alert === "battery" && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center fade" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="w-[270px] rounded-[14px] overflow-hidden blur-bar text-center" style={{ background: "rgba(242,242,242,0.86)" }}>
              <div className="px-4 pt-[19px] pb-[17px]">
                <div className="text-[17px] font-semibold">배터리 부족</div>
                <div className="text-[13px] mt-[3px] leading-[17px]">배터리 잔량 {Math.min(d.battery, 20)}%</div>
              </div>
              <div className="grid grid-cols-2 hair-t text-[17px] text-[#007AFF]">
                <button className="h-[44px]" onClick={() => setAlert(null)}>
                  닫기
                </button>
                <button
                  className="h-[44px] font-semibold"
                  style={{ boxShadow: "inset 0.5px 0 0 var(--sep)" }}
                  onClick={() => {
                    setLowPower(true);
                    setAlert(null);
                  }}
                >
                  저전력 모드
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMsg && (
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 z-[95] px-5 py-3 rounded-[14px] text-white text-[15px] font-medium fade blur-bar" style={{ background: "rgba(40,40,40,0.82)" }}>
            {toastMsg}
          </div>
        )}

        <StatusBar dark={onDarkSurface && !(call && true)} battery={d.battery} lowPower={lowPower} onLongPress={goEditor} hideTime={phase === "lock"} carrier={d.carrier} />
        <Island playing={playing} calling={false} />

        {/* 홈 인디케이터 */}
        {phase === "home" && (
          <button
            aria-label="홈으로"
            onClick={() => app && !call && home()}
            onPointerUp={() => app && !call && home()}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[85] w-[180px] h-[26px] flex items-end justify-center pb-[8px]"
          >
            <span className="block w-[134px] h-[5px] rounded-full" style={{ background: indicatorDark ? "#000" : "#fff" }} />
          </button>
        )}
        {phase === "lock" && <span className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-[85] w-[134px] h-[5px] rounded-full bg-white pointer-events-none" />}
      </Ctx.Provider>
    </div>
  );

  if (mobile) return <div className="mobile">{screen}</div>;
  return (
    <div className="stage">
      <div className="device" style={{ transform: `scale(${scale})` }}>
        <span className="btn" style={{ left: -3, top: 170, height: 32 }} />
        <span className="btn" style={{ left: -3, top: 230, height: 62 }} />
        <span className="btn" style={{ left: -3, top: 305, height: 62 }} />
        <span className="btn" style={{ right: -3, top: 260, height: 100 }} />
        {screen}
      </div>
      <a href="#/editor" className="fixed bottom-4 right-5 text-[12px] text-white/25 hover:text-white/60 transition-colors no-underline">
        편집
      </a>
    </div>
  );
}

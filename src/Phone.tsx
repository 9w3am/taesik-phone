import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flashlight, Camera, Lock, MapPin, Cloud, Search, Phone as PhoneIcon, PhoneOff, MessageCircle, AlarmClock, Play, Pause, FastForward, Rewind, Airplay, Volume2, Volume1, VolumeX } from "lucide-react";
import { useData, update, DAYS, type PhoneData, type Song } from "./store";
import { AppIcon } from "./icons";
import { Avatar, Ctx, hm, useNow, type PhoneCtx } from "./ui";
import { APPS, syncCustomApps } from "./apps";
import { CallScreen } from "./apps/Call";
import { soundSrc } from "./sounds";
import { ControlCenter, NotifCenter } from "./Overlays";
import { Handset, HandsetDown } from "./phoneIcons";
import { MusicProvider, MusicHosts, useMusic, useMusicTime } from "./music";
import { Cover } from "./apps/Music";

/** 수신 화면 보조 문구: 연락처에 있으면 라벨(휴대전화 등), 번호면 대한민국, 모르면 비움 */
function callerSub(d: PhoneData, name: string) {
  const c = d.contacts.find((x) => x.name === name);
  if (c) return c.label;
  if (/^[+0-9]/.test(name)) return "대한민국";
  return "";
}

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
        className="w-[150px] flex justify-center pt-[6px] select-none"
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
function Island({ calling, onOpenMusic }: { calling: boolean; onOpenMusic: () => void }) {
  const m = useMusic();
  const playing = m.playing ? m.song : null;
  const wide = !!playing || calling;
  return (
    <div
      onClick={() => playing && !calling && onOpenMusic()}
      className="absolute top-[11px] left-1/2 -translate-x-1/2 z-[70] bg-black rounded-full flex items-center justify-between px-[7px] transition-all duration-500"
      style={{ width: wide ? 200 : 125, height: 37, cursor: playing ? "pointer" : undefined }}
    >
      {wide && playing && !calling && (
        <>
          <Cover s={playing} size={22} radius={6} />
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

/* ───────── 잠금화면 '지금 재생 중' (실제 아이폰 잠금화면 음악 카드) ───────── */
function NowPlaying() {
  const m = useMusic();
  const t = useMusicTime();
  const s = m.song;
  if (!m.started || !s) return null;
  const f = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  return (
    <div className="rounded-[24px] px-[16px] pt-[14px] pb-[10px] blur-bar text-white" style={{ background: "rgba(30,30,32,0.45)" }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-[12px]">
        <Cover s={s} size={52} radius={8} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{s.title}</div>
          <div className="text-[15px] text-white/60 truncate">{s.artist}</div>
        </div>
        <Airplay size={20} className="text-white/70" />
      </div>
      <div className="mt-[12px] h-[5px] rounded-full bg-white/25 overflow-hidden">
        <div className="h-full bg-white/85" style={{ width: `${Math.min(100, (t / m.dur) * 100)}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-white/55 mt-[4px] tabular font-medium">
        <span>{f(t)}</span>
        <span>-{f(Math.max(0, m.dur - t))}</span>
      </div>
      <div className="flex items-center justify-center gap-[46px] mt-[2px] mb-[2px]">
        <button onClick={m.prev} aria-label="이전" className="active:opacity-50">
          <Rewind size={30} fill="#fff" strokeWidth={0} />
        </button>
        <button onClick={() => m.setPlay(!m.playing)} aria-label={m.playing ? "일시 정지" : "재생"} className="active:opacity-50">
          {m.playing ? <Pause size={38} fill="#fff" strokeWidth={0} /> : <Play size={38} fill="#fff" strokeWidth={0} />}
        </button>
        <button onClick={m.next} aria-label="다음" className="active:opacity-50">
          <FastForward size={30} fill="#fff" strokeWidth={0} />
        </button>
      </div>
    </div>
  );
}

/* ───────── 아이폰 볼륨 표시 (옆 버튼 · 제어 센터 볼륨 바꾸면 왼쪽 위에 잠깐 뜸) ───────── */
function VolumeHud() {
  const m = useMusic();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!m.volAt) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [m.volAt]);
  const Icon = m.volume === 0 ? VolumeX : m.volume < 0.5 ? Volume1 : Volume2;
  return (
    <div
      className="absolute left-[10px] top-[150px] z-[96] w-[46px] h-[150px] rounded-[23px] overflow-hidden blur-bar pointer-events-none flex flex-col justify-end"
      style={{ background: "rgba(60,60,64,0.55)", opacity: show ? 1 : 0, transform: show ? "translateX(0) scale(1)" : "translateX(-20px) scale(0.92)", transition: "opacity .25s, transform .3s cubic-bezier(.2,1,.3,1)" }}
    >
      <div className="absolute left-0 right-0 bottom-0 bg-white" style={{ height: `${m.volume * 100}%`, transition: "height .15s" }} />
      <Icon size={20} className="relative mx-auto mb-[12px]" style={{ color: m.volume > 0.12 ? "#555" : "#fff" }} />
    </div>
  );
}

/* ───────── 잠금화면 ───────── */
/** 잠금화면 알림이 아직 남아 있어야 하는지: 연결된 대화를 읽었으면 사라짐 */
export function notifAlive(d: PhoneData, n: PhoneData["lockNotifs"][number]) {
  if (n.app === "phone") return !d.phoneSeen;
  const t = d.threads.find((x) => x.app === n.app && x.name === n.title);
  return t ? t.unread > 0 : true;
}

function LockScreen({ d, onUnlock, onCamera, onOpen }: { d: PhoneData; onUnlock: () => void; onCamera: () => void; onOpen: (app: string, arg?: string) => void }) {
  const now = useNow();
  const [dy, setDy] = useState(0);
  const [torch, setTorch] = useState(false);
  const start = useRef<number | null>(null);
  const date = `${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS[now.getDay()]}요일`;
  const [expanded, setExpanded] = useState<string | null>(null);
  const groups: [string, PhoneData["lockNotifs"]][] = [];
  d.lockNotifs.filter((n) => notifAlive(d, n)).forEach((n) => {
    const g = groups.find((x) => x[0] === n.app);
    if (g) g[1].push(n);
    else groups.push([n.app, [n]]);
  });
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
        {/* 같은 앱 알림은 겹쳐 쌓이고, 누르면 펼쳐짐 */}
        <div className="w-full px-[8px] flex flex-col gap-[8px] mb-[118px]" onPointerDown={(e) => e.stopPropagation()}>
          <NowPlaying />
          {groups.map(([app, list]) => {
            const open = list.length === 1 || expanded === app;
            const card = (n: (typeof list)[number], k: number) => (
              <div
                key={k}
                onClick={(e) => {
                  if (!open) return;
                  e.stopPropagation();
                  onOpen(n.app, d.threads.find((x) => x.app === n.app && x.name === n.title)?.id);
                }}
                className="rounded-[22px] px-[14px] py-[12px] flex gap-[10px] items-center blur-bar cursor-pointer"
                style={{ background: "rgba(245,245,245,0.66)", color: "#000" }}
              >
                <AppIcon id={n.app} size={38} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[15px] font-semibold truncate">{n.title}</span>
                    <span className="text-[13px] text-black/45 ml-2 shrink-0">{n.when}</span>
                  </div>
                  <div className="text-[15px] leading-[20px] truncate">{n.text}</div>
                  {!open && <div className="text-[13px] text-black/45 mt-[1px]">{list.length - 1}개의 알림 더 보기</div>}
                </div>
              </div>
            );
            if (open)
              return (
                <div key={app} className="flex flex-col gap-[8px]">
                  {list.length > 1 && (
                    <div className="flex justify-between items-center px-[6px] text-white">
                      <span className="text-[17px] font-semibold">{APPS[app]?.label ?? app}</span>
                      <button onClick={() => setExpanded(null)} className="text-[13px] font-semibold px-[10px] h-[26px] rounded-full blur-bar" style={{ background: "rgba(255,255,255,0.25)" }}>
                        간단히 보기
                      </button>
                    </div>
                  )}
                  {list.map(card)}
                </div>
              );
            return (
              <button key={app} onClick={() => setExpanded(app)} className="relative text-left" style={{ paddingBottom: Math.min(2, list.length - 1) * 8 }}>
                {list.length > 2 && <div className="absolute left-[16px] right-[16px] bottom-0 h-[30px] rounded-b-[20px] blur-bar" style={{ background: "rgba(245,245,245,0.38)" }} />}
                <div className="absolute left-[8px] right-[8px] h-[30px] rounded-b-[21px] blur-bar" style={{ bottom: list.length > 2 ? 8 : 0, background: "rgba(245,245,245,0.5)" }} />
                <div className="relative">{card(list[0], 0)}</div>
              </button>
            );
          })}
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
/* Face ID 모양 아이콘 */
function FaceIdGlyph({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
      <path d="M4 16V10a6 6 0 0 1 6-6h6M40 4h6a6 6 0 0 1 6 6v6M52 40v6a6 6 0 0 1-6 6h-6M16 52h-6a6 6 0 0 1-6-6v-6" />
      <path d="M19 20v4M37 20v4M28 20v10h-3M20 38c4.5 4 11.5 4 16 0" />
    </svg>
  );
}

function Passcode({ code, hint, name, onOk, onCancel, decoy, onDecoy }: { code: string; hint: string; name: string; onOk: () => void; onCancel: () => void; decoy?: string; onDecoy?: () => void }) {
  const [v, setV] = useState("");
  const [bad, setBad] = useState(false);
  const [face, setFace] = useState<"scan" | "fail" | null>("scan"); // 들어오면 Face ID 먼저 시도 → 실패
  const [fails, setFails] = useState(() => Number(sessionStorage.getItem("pc-fails") || 0));
  const [lockUntil, setLockUntil] = useState(() => Number(sessionStorage.getItem("pc-lock") || 0));
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const a = setTimeout(() => setFace("fail"), 700);
    const b = setTimeout(() => setFace(null), 1500);
    return () => (clearTimeout(a), clearTimeout(b));
  }, []);
  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [lockUntil]);
  const locked = lockUntil > now;
  const press = (k: string) => {
    if (locked || face) return;
    const nv = (v + k).slice(0, code.length);
    setV(nv);
    if (nv.length === code.length) {
      if (nv === code) {
        sessionStorage.removeItem("pc-fails");
        setTimeout(onOk, 120);
      } else if (decoy && nv === decoy && onDecoy) {
        setTimeout(onDecoy, 120);
      } else {
        const f = fails + 1;
        setFails(f);
        sessionStorage.setItem("pc-fails", String(f));
        if (f % 5 === 0) {
          // 5번 틀릴 때마다 사용 불가 (1분 → 5분 → 15분)
          const mins = f === 5 ? 1 : f === 10 ? 5 : 15;
          const until = Date.now() + mins * 60000;
          setLockUntil(until);
          setNow(Date.now());
          sessionStorage.setItem("pc-lock", String(until));
        }
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
  if (locked) {
    const left = Math.ceil((lockUntil - now) / 60000);
    return (
      <div className="absolute inset-0 text-white fade">
        <Wallpaper blur={30} dim={0.55} />
        <div className="relative flex flex-col items-center pt-[230px] text-center">
          <Lock size={26} strokeWidth={2.4} />
          <div className="text-[26px] font-semibold mt-[14px]">iPhone 사용 불가</div>
          <div className="text-[17px] text-white/80 mt-[6px]">{left}분 후에 다시 시도하십시오</div>
        </div>
        <div className="absolute bottom-[50px] left-0 right-0 text-center text-[17px]">긴급 구조</div>
      </div>
    );
  }
  if (face)
    return (
      <div className="absolute inset-0 text-white fade">
        <Wallpaper blur={10} dim={0.2} />
        <div className="relative flex flex-col items-center pt-[250px]">
          <div className={face === "fail" ? "shake" : "animate-pulse"}>
            <FaceIdGlyph />
          </div>
          <div className="text-[15px] mt-[14px] text-white/85">{face === "fail" ? "얼굴을 인식할 수 없음" : "Face ID"}</div>
        </div>
      </div>
    );
  const keys: [string, string][] = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"]];
  return (
    <div className="absolute inset-0 text-white fade">
      <Wallpaper blur={30} dim={0.35} />
      <div className="relative flex flex-col items-center pt-[110px]">
        {name && <div className="text-[15px] font-semibold text-white/75 mb-[4px]">{name}</div>}
        <div className="text-[20px] font-normal">{fails >= 3 ? `암호 입력 · ${fails}회 실패` : "암호 입력"}</div>
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

function Home({ d, open }: { d: PhoneData; open: (id: string) => void }) {
  const now = useNow(30000);
  // 홈 화면 배치는 편집 화면에서 정함 (없는 앱 · 빈 폴더는 안 보이게)
  const FOLDERS = Object.fromEntries(Object.entries(d.home.folders).map(([k, v]) => [k, v.filter((a) => APPS[a])]));
  const okItem = (id: string) => (id.startsWith("folder:") ? (FOLDERS[id.slice(7)]?.length ?? 0) > 0 : !!APPS[id]);
  const GRID = d.home.grid.filter(okItem);
  const DOCK = d.home.dock.filter(okItem).slice(0, 4);
  const badge = (id: string) => {
    const t = (app: string) => d.threads.filter((x) => x.app === app).reduce((a, x) => a + (x.unread || 0), 0);
    if (id === "messages") return t("messages");
    if (id === "kakao") return t("kakao");
    if (id === "insta") return t("insta");
    if (id === "phone") return d.calls.filter((c) => c.kind === "missed").reduce((a, c) => a + (c.count || 1), 0);
    if (id === "jobs") return d.jobs.filter((j) => j.status === "new").length;
    if (id === "mail") return d.mail.filter((m) => m.box === "inbox" && m.unread).length;
    return 0;
  };
  const today = d.calendar.filter((e) => e.days.includes(now.getDay())).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const [folder, setFolder] = useState<string | null>(null);
  const Icon = ({ id, dock }: { id: string; dock?: boolean }) => {
    if (id.startsWith("folder:")) {
      const name = id.slice(7);
      return (
        <button onClick={() => setFolder(name)} className="flex flex-col items-center gap-[5px] active:opacity-70">
          <div className="w-[62px] h-[62px] rounded-[14px] p-[7px] grid grid-cols-3 gap-[4px] content-start blur-bar" style={{ background: "rgba(255,255,255,0.22)" }}>
            {FOLDERS[name].map((a) => (
              <AppIcon key={a} id={a} size={13} />
            ))}
          </div>
          <span className="text-[12px] text-white font-medium leading-none" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            {name}
          </span>
        </button>
      );
    }
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
      {/* 열린 폴더 */}
      {folder && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center fade" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }} onClick={() => setFolder(null)}>
          <div className="text-[30px] font-semibold text-white mb-[18px]">{folder}</div>
          <div className="w-[300px] rounded-[38px] p-[22px] grid grid-cols-3 gap-y-[22px] justify-items-center blur-bar" style={{ background: "rgba(255,255,255,0.22)" }} onClick={(e) => e.stopPropagation()}>
            {FOLDERS[folder].map((a) => (
              <button
                key={a}
                onClick={() => {
                  setFolder(null);
                  open(a);
                }}
                className="flex flex-col items-center gap-[5px]"
              >
                <AppIcon id={a} size={62} />
                <span className="text-[12px] text-white font-medium">{APPS[a]?.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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

/* ───────── 수신 전화 ─────────
   iOS 기본값처럼: 폰을 쓰는 중이면 위에 작은 배너로 뜨고, 배너를 누르면 전체 화면으로 커진다. */
function Incoming({ name, sub, onAccept, onDecline }: { name: string; sub: string; onAccept: () => void; onDecline: () => void }) {
  const [full, setFull] = useState(false);
  if (!full)
    return (
      <div className="absolute top-[10px] left-[8px] right-[8px] z-[88] banner">
        <div className="rounded-[26px] pl-[14px] pr-[10px] py-[10px] flex items-center gap-[12px] blur-bar cursor-pointer" style={{ background: "rgba(30,30,32,0.92)", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" }} onClick={() => setFull(true)}>
          <Avatar name={name} size={44} />
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[13px] text-white/55 leading-[16px]">{sub || "수신 전화"}</div>
            <div className="text-[17px] font-semibold truncate leading-[22px]">{name}</div>
          </div>
          <button
            aria-label="거절"
            onClick={(e) => {
              e.stopPropagation();
              onDecline();
            }}
            className="w-[44px] h-[44px] rounded-full bg-[#FF3B30] flex items-center justify-center shrink-0 active:brightness-90"
          >
            <HandsetDown size={24} />
          </button>
          <button
            aria-label="수락"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="w-[44px] h-[44px] rounded-full bg-[#34C759] flex items-center justify-center shrink-0 active:brightness-90"
          >
            <Handset size={22} />
          </button>
        </div>
      </div>
    );
  return (
    <div className="absolute inset-0 z-[88] text-white fade bg-[#111]">
      <Wallpaper blur={40} dim={0.5} />
      <div className="relative flex flex-col items-center pt-[96px] px-6 text-center">
        <div className="text-[34px] leading-[40px] font-normal tracking-[-0.01em]">{name}</div>
        {sub && <div className="text-[17px] text-white/60 mt-[6px]">{sub}</div>}
      </div>
      <div className="absolute bottom-[196px] left-0 right-0 flex justify-between px-[58px] text-[13px] text-white/90">
        <div className="flex flex-col items-center gap-[8px]">
          <AlarmClock size={22} strokeWidth={1.8} />
          알림
        </div>
        <div className="flex flex-col items-center gap-[8px]">
          <MessageCircle size={22} strokeWidth={1.8} fill="#fff" />
          메시지
        </div>
      </div>
      <div className="absolute bottom-[54px] left-0 right-0 flex justify-between px-[44px] text-[15px]">
        <button onClick={onDecline} className="flex flex-col items-center gap-[10px]">
          <span className="w-[78px] h-[78px] rounded-full bg-[#FF3B30] flex items-center justify-center active:brightness-90">
            <HandsetDown size={36} />
          </span>
          거절
        </button>
        <button onClick={onAccept} className="flex flex-col items-center gap-[10px]">
          <span className="w-[78px] h-[78px] rounded-full bg-[#34C759] flex items-center justify-center active:brightness-90">
            <Handset size={34} />
          </span>
          수락
        </button>
      </div>
    </div>
  );
}

/* 위장 암호로 열리는 가짜 폰: 기본 앱만 있고 전부 텅 비어 있음 */
function DecoyPhone({ onLock }: { onLock: () => void }) {
  const [app, setApp] = useState<string | null>(null);
  const icons = ["calendar", "photos", "camera", "clock", "weather", "calculator", "settings", "notes"];
  const dock = ["phone", "messages", "safari", "music"];
  const empty: Record<string, [string, string]> = {
    phone: ["최근 기록", "최근 통화 없음"],
    messages: ["메시지", "메시지 없음"],
    safari: ["", "즐겨찾기 없음"],
    music: ["보관함", "음악 없음"],
    photos: ["보관함", "사진 없음"],
    notes: ["메모", "메모 없음"],
    calendar: ["", "일정 없음"],
    camera: ["", ""],
    clock: ["알람", "알람 없음"],
    weather: ["", "서울 · 흐림"],
    calculator: ["", "0"],
    settings: ["설정", ""],
  };
  return (
    <div className="absolute inset-0 fade">
      <Wallpaper />
      <div className="relative pt-[70px] px-[22px] grid grid-cols-4 gap-y-[26px] justify-items-center">
        {icons.map((id) => (
          <button key={id} onClick={() => setApp(id)} className="flex flex-col items-center gap-[5px]">
            <AppIcon id={id} size={62} />
            <span className="text-[12px] text-white font-medium">{APPS[id]?.label}</span>
          </button>
        ))}
      </div>
      <div className="absolute bottom-[12px] left-[12px] right-[12px] h-[96px] rounded-[34px] flex items-center justify-around px-[8px] blur-bar" style={{ background: "rgba(255,255,255,0.2)" }}>
        {dock.map((id) => (
          <button key={id} onClick={() => setApp(id)}>
            <AppIcon id={id} size={62} />
          </button>
        ))}
      </div>
      {app && (
        <div className="absolute inset-0 z-10 app-open flex flex-col" style={{ background: ["camera", "clock", "weather", "calculator"].includes(app) ? "#000" : "#fff" }}>
          <div className="px-4 text-[34px] font-bold" style={{ paddingTop: "calc(var(--sat) + 44px)", color: ["camera", "clock", "weather", "calculator"].includes(app) ? "#fff" : "#000" }}>
            {empty[app]?.[0]}
          </div>
          <div className="flex-1 flex items-center justify-center text-[17px]" style={{ color: ["camera", "clock", "weather", "calculator"].includes(app) ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}>
            {empty[app]?.[1]}
          </div>
        </div>
      )}
      <button aria-label="홈으로" onClick={() => (app ? setApp(null) : onLock())} className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[85] w-[180px] h-[30px] flex items-end justify-center pb-[8px]">
        <span className="block w-[134px] h-[5px] rounded-full" style={{ background: app && !["camera", "clock", "weather", "calculator"].includes(app) ? "#000" : "#fff" }} />
      </button>
    </div>
  );
}

/* 앱 전환기 카드 */
function SwitchCard({ id, onOpen, onKill, children }: { id: string; onOpen: () => void; onKill: () => void; children: React.ReactNode }) {
  const [dy, setDy] = useState(0);
  const start = useRef<number | null>(null);
  const k = 0.66;
  return (
    <div
      className="shrink-0 snap-center flex flex-col items-start gap-[8px] touch-pan-x"
      style={{ transform: `translateY(${dy}px)`, opacity: 1 + dy / 500, transition: start.current === null ? "all .25s" : "none" }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerMove={(e) => start.current !== null && setDy(Math.min(0, e.clientY - start.current))}
      onPointerUp={() => {
        const moved = dy;
        start.current = null;
        if (moved < -120) {
          setDy(-900);
          setTimeout(onKill, 200);
        } else {
          setDy(0);
          if (moved > -6) onOpen();
        }
      }}
    >
      <div className="flex items-center gap-[8px] text-white text-[14px] font-semibold ml-[4px]">
        <AppIcon id={id} size={28} />
        {APPS[id]?.label}
      </div>
      <div className="relative overflow-hidden rounded-[34px] shadow-[0_10px_40px_rgba(0,0,0,0.45)]" style={{ width: 393 * k, height: 852 * k, background: APPS[id]?.light ? "#fff" : "#000" }}>
        <div className="absolute left-0 top-0 pointer-events-none" style={{ width: 393, height: 852, transform: `scale(${k})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───────── 폰 본체 ───────── */
type CallState = { name: string; lines: string[]; mode: "out" | "in"; ringing: boolean } | null;
type Banner = { app: string; title: string; text: string; target?: string } | null;

/** embedded: 에디터 옆 실시간 미리보기용 (잠금 건너뜀, 체류 이벤트 끔) */
export default function Phone(props: { embedded?: boolean; previewScale?: number } = {}) {
  return (
    <MusicProvider>
      <PhoneInner {...props} />
    </MusicProvider>
  );
}

function PhoneInner({ embedded = false, previewScale = 0.78 }: { embedded?: boolean; previewScale?: number }) {
  const music = useMusic();
  const d = useData();
  const [phase, setPhase] = useState<"lock" | "code" | "home" | "decoy">(embedded ? "home" : "lock");
  const [app, setApp] = useState<string | null>(null);
  const [appArg, setAppArg] = useState<unknown>(null);
  const [appKey, setAppKey] = useState(0);
  const [statusDark, setStatusDark] = useState(false);
  const [call, setCall] = useState<CallState>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [alert, setAlert] = useState<null | "battery">(null);
  const [watch, setWatch] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [cc, setCc] = useState(false); // 제어 센터
  const [nc, setNc] = useState(false); // 알림 센터
  const [bright, setBright] = useState(1);
  const [torch, setTorch] = useState(false);
  const appRoot = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef({ x: 0, y: 0, at: 0 });
  const [fly, setFly] = useState({ tx: 0, ty: 0 }); // 앱이 튀어나온 아이콘 위치 (화면 가운데 기준)
  const [closing, setClosing] = useState(false);
  const closeT = useRef(0);
  const top = useRef<{ x: number; y: number; w: number; moved: boolean; t?: number } | null>(null);
  const edge = useRef<{ x: number; y: number } | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [mScale, setMScale] = useState(1); // 모바일 화면 배율 (디자인은 항상 393x852 그대로)
  const [kb, setKb] = useState(0); // 키보드 높이 (폰 화면 기준 px)
  const [vvTop, setVvTop] = useState(0);
  const fired = useRef<Set<string>>(new Set());
  const ring = useRef<HTMLAudioElement | null>(null);
  const pendingOpen = useRef<{ app: string; arg?: string } | null>(null);
  // 자동 잠금: 안 만지면 어두워졌다가(8초) 화면 꺼짐 → 누르면 잠금화면
  const [idle, setIdle] = useState<null | "dim" | "off">(null);
  const lastTouch = useRef(Date.now());
  useEffect(() => {
    if (embedded) return;
    const touch = () => {
      lastTouch.current = Date.now();
      setIdle((x) => (x === "dim" ? null : x));
    };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    const iv = setInterval(() => {
      const sec = d.autoLockSec ?? 120;
      if (!sec || call || phase !== "home") return;
      const gone = (Date.now() - lastTouch.current) / 1000;
      if (gone > sec + 8) {
        setIdle("off");
        setApp(null);
        setPhase("lock");
      } else if (gone > sec) setIdle((x) => x ?? "dim");
    }, 1000);
    return () => {
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      clearInterval(iv);
    };
  }, [embedded, d.autoLockSec, call, phase]);

  // 벨소리: 전화가 울리는 동안 반복 재생
  useEffect(() => {
    const src = soundSrc(d.sounds?.ringtone);
    if (call?.ringing && src && !d.sounds?.muted) {
      const a = new Audio(src);
      a.loop = true;
      a.play().catch(() => {});
      ring.current = a;
      return () => {
        a.pause();
        ring.current = null;
      };
    }
  }, [call?.ringing, d.sounds?.ringtone, d.sounds?.muted]); // eslint-disable-line
  // 알림음: 배너가 뜰 때 한 번
  useEffect(() => {
    const src = soundSrc(d.sounds?.notify);
    if (banner && src && !d.sounds?.muted) new Audio(src).play().catch(() => {});
  }, [banner]); // eslint-disable-line

  // 레이아웃: 모바일은 전체화면, PC는 기기 목업 중앙
  useEffect(() => {
    const f = () => {
      const m = window.innerWidth <= 500 || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 820 && window.innerHeight > window.innerWidth);
      setMobile(m);
      setScale(Math.min(1, (window.innerHeight - 32) / 892, (window.innerWidth - 24) / 433));
      // 키보드가 열려 있을 땐 배율을 바꾸지 않는다 (화면이 줄어드는 것 방지)
      const typing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      if (!typing) setMScale(Math.min(window.innerWidth / 393, window.innerHeight / 852));
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !mobile) return;
    const f = () => {
      const typing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      const phoneTop = (window.innerHeight - 852 * mScale) / 2; // 폰 화면이 화면 가운데에 놓인 위치
      const phoneBottomGap = phoneTop; // 폰 아래 검은 여백
      const kbOnPhone = typing && covered > 120 ? Math.max(0, covered - phoneBottomGap) / mScale : 0;
      setKb(kbOnPhone);
      setVvTop(vv.offsetTop);
    };
    vv.addEventListener("resize", f);
    vv.addEventListener("scroll", f);
    window.addEventListener("focusin", f);
    window.addEventListener("focusout", () => setTimeout(f, 50));
    return () => {
      vv.removeEventListener("resize", f);
      vv.removeEventListener("scroll", f);
      window.removeEventListener("focusin", f);
    };
  }, [mobile, mScale]);

  useEffect(() => {
    if (!embedded) return;
    const f = (e: Event) => {
      const { app: a, arg, phase: ph } = (e as CustomEvent).detail || {};
      if (ph === "lock") {
        setApp(null);
        setPhase("lock");
        return;
      }
      setPhase("home");
      setCall(null);
      if (a) {
        setAppArg(arg ?? null);
        setApp(a);
        setAppKey((k) => k + 1);
        setStatusDark(!!APPS[a]?.light);
      } else setApp(null);
    };
    window.addEventListener("phone:open", f);
    const last = (window as unknown as { __lastPreview?: unknown }).__lastPreview;
    if (last) f(new CustomEvent("phone:open", { detail: last }));
    return () => window.removeEventListener("phone:open", f);
  }, [embedded]);

  const [recents, setRecents] = useState<string[]>([]); // 최근 연 앱 (앱 전환기용)
  const [switcher, setSwitcher] = useState(false);
  const bar = useRef<{ y: number } | null>(null);
  const open = useCallback((id: string, arg?: unknown) => {
    // 방금 누른 아이콘 자리에서 앱이 커지며 열림 (실제 아이폰처럼)
    const t = lastTap.current;
    setFly(Date.now() - t.at < 600 ? { tx: t.x - 196.5, ty: t.y - 426 } : { tx: 0, ty: 0 });
    clearTimeout(closeT.current);
    setClosing(false);
    setAppArg(arg ?? null);
    setApp(id);
    setAppKey((k) => k + 1);
    setStatusDark(!!APPS[id]?.light);
    setRecents((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8));
    setSwitcher(false);
  }, []);
  const home = useCallback(() => {
    // 앱이 아이콘 자리로 작아지며 닫힘
    setStatusDark(false);
    setClosing(true);
    clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => {
      setApp(null);
      setClosing(false);
    }, 320);
  }, []);
  const toast = useCallback((t: string) => {
    setToastMsg(t);
    setTimeout(() => setToastMsg(""), 1800);
  }, []);
  const startCall = useCallback((name: string, lines: string[], mode: "out" | "in" = "out") => setCall({ name, lines, mode, ringing: mode === "in" }), []);

  const ctx: PhoneCtx = useMemo(
    () => ({ open, home, setStatusDark, call: startCall, toast, appArg }),
    [open, home, startCall, toast, appArg],
  );

  // 체류 시간 이벤트 (배너 · 수신 전화 · 배터리)
  useEffect(() => {
    if (phase !== "home" || embedded) return;
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
    // '누가 폰을 보고 있다': 한 번만, 알림 없이 — Face ID가 얼굴을 못 알아보고 잠김
    if (ev.watcher?.enabled && !fired.current.has("watch"))
      ts.push(
        window.setTimeout(() => {
          fired.current.add("watch");
          setWatch(true);
          setTimeout(() => {
            setWatch(false);
            setApp(null);
            setCall(null);
            setPhase("lock");
          }, 2300);
        }, ev.watcher.afterSec * 1000),
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

  syncCustomApps(d.customApps);
  const AppComp = app ? APPS[app]?.C : null;
  const onDarkSurface = phase !== "home" || !app ? false : statusDark;
  const indicatorDark = phase === "home" && !!app && statusDark && !call;

  const screen = (
    <div
      ref={screenRef}
      className="screen"
      style={{ ["--kb" as string]: `${kb}px` } as React.CSSProperties}
      onPointerDownCapture={(e) => {
        const r = screenRef.current?.getBoundingClientRect();
        if (!r || !r.width) return;
        const k = 393 / r.width;
        lastTap.current = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, at: Date.now() };
      }}
    >
      <Ctx.Provider value={ctx}>
        {phase === "lock" && (
          <LockScreen
            d={d}
            onUnlock={unlock}
            onOpen={(a, arg) => {
              if (d.passcode) {
                pendingOpen.current = { app: a, arg };
                setPhase("code");
              } else {
                setPhase("home");
                open(a, arg);
              }
            }}
            onCamera={() => {
              setPhase("home");
              open("camera");
            }}
          />
        )}
        {phase === "decoy" && <DecoyPhone onLock={() => setPhase("lock")} />}
        {phase === "code" && (
          <Passcode
            code={d.passcode}
            hint={d.passcodeHint}
            name={d.deviceName}
            decoy={d.decoyCode}
            onDecoy={() => {
              pendingOpen.current = null;
              setPhase("decoy");
            }}
            onOk={() => {
              setPhase("home");
              const p = pendingOpen.current;
              pendingOpen.current = null;
              if (p) open(p.app, p.arg);
            }}
            onCancel={() => setPhase("lock")}
          />
        )}
        {phase === "home" && (
          <>
            {/* 앱이 열려 있으면 홈 화면은 살짝 뒤로 물러나 있다가, 닫히면 다시 다가옴 */}
            <div className="absolute inset-0 home-in">
              <div className="absolute inset-0" style={{ transform: AppComp && !closing ? "scale(0.9)" : "scale(1)", opacity: AppComp && !closing ? 0.6 : 1, transition: "transform .42s cubic-bezier(.2,.9,.25,1), opacity .42s" }}>
                <Home d={d} open={open} />
              </div>
            </div>
            {AppComp && (
              <div
                ref={appRoot}
                key={appKey}
                className={`absolute inset-0 z-10 overflow-hidden ${closing ? "app-close pointer-events-none" : "app-open"}`}
                style={{ background: APPS[app!]?.light ? "#fff" : "#000", ["--tx" as string]: `${fly.tx}px`, ["--ty" as string]: `${fly.ty}px` } as React.CSSProperties}
              >
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
            sub={callerSub(d, call.name)}
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

        {/* 제어 센터 · 알림 센터 */}
        {cc && <ControlCenter d={d} close={() => setCc(false)} open={open} brightness={bright} setBrightness={setBright} torch={torch} setTorch={setTorch} />}
        {nc && <NotifCenter d={d} close={() => setNc(false)} open={open} />}

        <StatusBar dark={onDarkSurface && !(call && true)} battery={d.battery} lowPower={lowPower} onLongPress={goEditor} hideTime={phase === "lock"} carrier={d.carrier} />
        <Island calling={false} onOpenMusic={() => phase === "home" && open("music")} />
        <MusicHosts />
        <VolumeHud />

        {/* 화면 맨 위: 왼쪽에서 끌어내리면 알림 센터, 오른쪽이면 제어 센터 (오른쪽 위 탭도 됨) · 시계 길게 누르면 에디터 */}
        {phase !== "code" && !(call && call.ringing) && !cc && !nc && (
          <div
            className="absolute top-0 left-0 right-0 h-[46px] z-[66] touch-none"
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - r.left) / r.width;
              top.current = { x, y: e.clientY, w: r.width, moved: false, t: x < 0.38 ? window.setTimeout(goEditor, 1600) : undefined };
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 터치 */ }
            }}
            onPointerMove={(e) => {
              const g = top.current;
              if (!g || g.moved) return;
              if (e.clientY - g.y > 26) {
                g.moved = true;
                clearTimeout(g.t);
                if (g.x > 0.62) setCc(true);
                else if (phase === "home") setNc(true);
              }
            }}
            onPointerUp={() => {
              const g = top.current;
              top.current = null;
              if (!g) return;
              clearTimeout(g.t);
              if (!g.moved && g.x > 0.66) setCc(true);
              // 실제 아이폰: 맨 위 시계 쪽을 톡 누르면 보던 목록이 맨 위로
              else if (!g.moved && app && appRoot.current)
                appRoot.current.querySelectorAll<HTMLElement>(".scroll").forEach((el) => el.scrollTop > 0 && el.scrollTo({ top: 0, behavior: "smooth" }));
            }}
            onPointerLeave={() => top.current && clearTimeout(top.current.t)}
          />
        )}

        {/* 앱 화면 왼쪽 끝에서 오른쪽으로 밀면 뒤로 가기 (뒤로 갈 곳이 없으면 홈) */}
        {phase === "home" && app && !call && !cc && !nc && (
          <div
            className="absolute left-0 top-[46px] bottom-[30px] w-[12px] z-[66] touch-none"
            onPointerDown={(e) => {
              edge.current = { x: e.clientX, y: e.clientY };
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 터치 */ }
            }}
            onPointerUp={(e) => {
              const g = edge.current;
              edge.current = null;
              if (!g) return;
              if (Math.abs(e.clientX - g.x) < 8 && Math.abs(e.clientY - g.y) < 8) {
                // 그냥 탭이면 아래에 있는 버튼으로 전달
                const el = e.currentTarget;
                el.style.pointerEvents = "none";
                (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.click();
                el.style.pointerEvents = "";
                return;
              }
              if (e.clientX - g.x < 60 || Math.abs(e.clientY - g.y) > 80) return;
              const backs = appRoot.current?.querySelectorAll<HTMLElement>("[data-back]");
              const b = backs && backs[backs.length - 1];
              if (b) b.click();
              else home();
            }}
          />
        )}

        {/* Face ID가 얼굴을 못 알아봄 → 잠김 */}
        {watch && (
          <div className="absolute inset-0 z-[96] flex flex-col items-center justify-center fade" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <div className="shake">
              <FaceIdGlyph size={64} />
            </div>
            <div className="text-white text-[16px] mt-[16px] font-medium">얼굴을 인식할 수 없음</div>
          </div>
        )}

        {/* 자동 잠금 */}
        {idle === "dim" && <div className="absolute inset-0 z-[100] pointer-events-none bg-black transition-opacity duration-1000" style={{ opacity: 0.55 }} />}
        {idle === "off" && (
          <button
            aria-label="화면 켜기"
            className="absolute inset-0 z-[101] bg-black"
            onClick={() => {
              lastTouch.current = Date.now();
              setIdle(null);
            }}
          />
        )}

        {/* 밝기 */}
        {bright < 1 && <div className="absolute inset-0 z-[99] pointer-events-none bg-black" style={{ opacity: (1 - bright) * 0.72 }} />}
        {torch && phase === "home" && <div className="absolute inset-0 z-[97] pointer-events-none" style={{ boxShadow: "inset 0 0 120px rgba(255,255,255,0.05)" }} />}

        {/* 앱 전환기: 최근 앱 카드 (누르면 열기 · 위로 밀면 닫기) */}
        {switcher && phase === "home" && (
          <div className="absolute inset-0 z-[84] fade" onClick={() => setSwitcher(false)}>
            <Wallpaper blur={24} dim={0.35} />
            <div className="absolute inset-0 flex items-center gap-[18px] overflow-x-auto no-scrollbar px-[60px] snap-x snap-mandatory" onClick={(e) => e.target === e.currentTarget && setSwitcher(false)}>
              {recents.map((id) => {
                const C = APPS[id]?.C;
                if (!C) return null;
                return (
                  <SwitchCard
                    key={id}
                    id={id}
                    onOpen={() => open(id)}
                    onKill={() => {
                      setRecents((r) => r.filter((x) => x !== id));
                      if (app === id) setApp(null);
                      if (recents.length <= 1) setSwitcher(false);
                    }}
                  >
                    <Ctx.Provider value={{ ...ctx, setStatusDark: () => {}, open: () => {}, home: () => {}, call: () => {}, toast: () => {} }}>
                      <C />
                    </Ctx.Provider>
                  </SwitchCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 홈 인디케이터 */}
        {phase === "home" && (
          <button
            aria-label="홈으로 · 위로 밀면 앱 전환기"
            onPointerDown={(e) => {
              bar.current = { y: e.clientY };
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 터치 */ }
            }}
            onPointerMove={(e) => {
              const g = bar.current;
              const el = appRoot.current;
              if (!g || !el || !app || closing) return;
              const r = screenRef.current?.getBoundingClientRect();
              const dy = Math.max(0, (g.y - e.clientY) * (r?.width ? 393 / r.width : 1));
              el.style.animation = "none";
              el.style.transform = `translateY(${-dy * 0.45}px) scale(${Math.max(0.42, 1 - dy / 650)})`;
              el.style.borderRadius = `${Math.min(46, dy / 2)}px`;
            }}
            onPointerUp={(e) => {
              const g = bar.current;
              bar.current = null;
              const el = appRoot.current;
              const reset = () => el && Object.assign(el.style, { animation: "", transform: "", borderRadius: "" });
              if (!g || call) return reset();
              const r = screenRef.current?.getBoundingClientRect();
              const dy = (g.y - e.clientY) * (r?.width ? 393 / r.width : 1);
              if (app) {
                if (dy > 230 && recents.length) {
                  reset();
                  setSwitcher(true);
                } else {
                  // 지금 작아진 모습에서 이어서 아이콘으로 쏙 들어감
                  if (el) el.style.animation = "";
                  home();
                }
              } else if (dy > 50 && recents.length) setSwitcher(true);
              else if (switcher) setSwitcher(false);
            }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[85] w-[180px] h-[30px] flex items-end justify-center pb-[8px] touch-none"
          >
            <span className="block w-[134px] h-[5px] rounded-full" style={{ background: indicatorDark ? "#000" : "#fff" }} />
          </button>
        )}
        {phase === "lock" && <span className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-[85] w-[134px] h-[5px] rounded-full bg-white pointer-events-none" />}
      </Ctx.Provider>
    </div>
  );

  if (embedded)
    return (
      <div className="relative" style={{ width: 433 * previewScale, height: 892 * previewScale }}>
        <div className="device absolute left-0 top-0" style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
          {screen}
        </div>
      </div>
    );
  if (mobile)
    return (
      <div className="mobile">
        <div className="stage" style={{ transform: vvTop ? `translateY(${vvTop}px)` : undefined }}>
          {/* 줄어든 크기 그대로 자리를 잡아야 화면 가운데에 딱 맞음 (393보다 좁은 폰에서 옆·아래 잘림 방지) */}
          <div style={{ width: 393 * mScale, height: 852 * mScale, position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: 393, height: 852, transform: `scale(${mScale})`, transformOrigin: "top left" }}>{screen}</div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="stage">
      <div className="device" style={{ transform: `scale(${scale})` }}>
        <span className="btn" style={{ left: -3, top: 170, height: 32 }} />
        <button className="btn cursor-pointer active:brightness-75" aria-label="볼륨 크게" style={{ left: -3, top: 230, height: 62 }} onClick={() => music.setVolume(Math.round((music.volume + 1 / 16) * 16) / 16)} />
        <button className="btn cursor-pointer active:brightness-75" aria-label="볼륨 작게" style={{ left: -3, top: 305, height: 62 }} onClick={() => music.setVolume(Math.round((music.volume - 1 / 16) * 16) / 16)} />
        {/* 오른쪽 옆 버튼 = 잠금(전원) 버튼: 누르면 화면이 잠김 */}
        <button className="btn cursor-pointer active:brightness-75" aria-label="잠금 버튼" style={{ right: -3, top: 260, height: 100 }} onClick={() => !call && (phase === "home" || phase === "decoy") && setPhase("lock")} />
        {screen}
      </div>
      <a href="#/editor" className="fixed bottom-4 right-5 text-[12px] text-white/25 hover:text-white/60 transition-colors no-underline">
        편집
      </a>
    </div>
  );
}

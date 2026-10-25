/* 캘린더 · 시계 · 날씨 · 계산기 · 지도 · 카메라 · 설정 */
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Search, Plus, Inbox, Globe, AlarmClock, Timer, Hourglass, Cloud, CloudRain, CloudSun, Moon, MapPin, Navigation, Star, Zap, RefreshCw,
  Plane, Wifi, Bluetooth, Antenna, Link2, Bell, Volume2, MoonStar, Hourglass as ScreenTime, Settings as Gear, SlidersHorizontal, Sun, Image, ScanFace, Hand, BatteryMedium, Layers, X,
} from "lucide-react";
import { useData, update, DAYS } from "../store";
import { photoSrc } from "../photos";
import { Avatar, LargeTitle, NavBar, TabBar, Toggle, useNow, useScrolled, useStatusBar, Img } from "../ui";

/* ───────── 캘린더 ───────── */
export function Calendar() {
  useStatusBar(true);
  const d = useData();
  const now = new Date();
  const [sel, setSel] = useState(now.getDate());
  const y = now.getFullYear(),
    m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  const evOf = (day: number) => d.calendar.filter((e) => e.days.includes(new Date(y, m, day).getDay())).sort((a, b) => (a.time || "00").localeCompare(b.time || "00"));
  const RED = "#FF3B30";
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 100 }}>
        <div className="h-[44px] flex items-center justify-between px-2" style={{ color: RED }}>
          <span className="flex items-center text-[17px]">
            <ChevronLeft size={30} strokeWidth={2.2} />
            {y}년
          </span>
          <div className="flex gap-[18px] pr-2">
            <Search size={22} />
            <Plus size={26} />
          </div>
        </div>
        <div className="px-4 text-[34px] font-bold">{m + 1}월</div>
        <div className="grid grid-cols-7 text-center text-[11px] text-black/45 mt-[8px] pb-[6px] hair-b">
          {DAYS.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center">
          {cells.map((c, i) => {
            const isToday = c === now.getDate();
            const isSel = c === sel;
            const has = c > 0 && evOf(c).length > 0;
            return (
              <button key={i} disabled={!c} onClick={() => setSel(c)} className="h-[58px] flex flex-col items-center pt-[6px] hair-b">
                {c > 0 && (
                  <>
                    <span
                      className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[19px]"
                      style={{ background: isSel ? (isToday ? RED : "#000") : "transparent", color: isSel ? "#fff" : isToday ? RED : i % 7 === 0 || i % 7 === 6 ? "rgba(0,0,0,0.45)" : "#000", fontWeight: isToday || isSel ? 600 : 400 }}
                    >
                      {c}
                    </span>
                    {has && <span className="w-[5px] h-[5px] rounded-full bg-black/25 mt-[3px]" />}
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className="px-4 pt-[16px]">
          <div className="text-[15px] font-semibold text-black/50 pb-[6px]">
            {m + 1}월 {sel}일 {DAYS[new Date(y, m, sel).getDay()]}요일
          </div>
          {evOf(sel).length === 0 && <div className="text-[15px] text-black/40 py-[18px] text-center">일정 없음</div>}
          {evOf(sel).map((e) => (
            <div key={e.id} className="flex gap-[10px] py-[9px] hair-b">
              <div className="w-[52px] text-right shrink-0">
                <div className="text-[13px] font-semibold">{e.time || "하루 종일"}</div>
                {e.end && <div className="text-[13px] text-black/45">{e.end}</div>}
              </div>
              <span className="w-[4px] rounded-full shrink-0" style={{ background: e.color }} />
              <div>
                <div className="text-[16px] font-semibold">{e.title}</div>
                {e.place && <div className="text-[13px] text-black/45">{e.place}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-[20px] pt-[10px] text-[17px] blur-bar hair-t" style={{ paddingBottom: "var(--sab)", color: RED, background: "rgba(249,249,249,0.9)" }}>
        <button onClick={() => setSel(now.getDate())}>오늘</button>
        <span>캘린더</span>
        <Inbox size={23} />
      </div>
    </div>
  );
}

/* ───────── 시계 ───────── */
export function Clock() {
  useStatusBar(false);
  const d = useData();
  const now = useNow();
  const [tab, setTab] = useState("alarm");
  const [sw, setSw] = useState(0);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const t0 = Date.now() - sw;
    const i = setInterval(() => setSw(Date.now() - t0), 31);
    return () => clearInterval(i);
  }, [run]); // eslint-disable-line
  const fmt = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")},${String(Math.floor(ms / 10) % 100).padStart(2, "0")}`;
  const cities = [
    ["서울", 9],
    ["도쿄", 9],
    ["방콕", 7],
    ["로스앤젤레스", -8],
  ] as const;
  return (
    <div className="absolute inset-0 bg-black text-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 110 }}>
        {tab === "alarm" && (
          <>
            <div className="absolute left-4 right-4 flex justify-between text-[17px] text-[#FF9F0A]" style={{ top: "calc(var(--sat) + 10px)" }}>
              <span>편집</span>
              <Plus size={26} />
            </div>
            <LargeTitle dark>알람</LargeTitle>
            <div className="px-4 pt-[6px] text-[20px] font-bold">기타</div>
            {d.alarms.map((a) => {
              const [h, mi] = a.time.split(":").map(Number);
              return (
                <div key={a.id} className="flex items-center mx-4 py-[10px]" style={{ boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.15)", opacity: a.on ? 1 : 0.55 }}>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-[4px]">
                      <span className="text-[20px] font-light">{h < 12 ? "오전" : "오후"}</span>
                      <span className="text-[56px] font-extralight leading-[62px] tabular tracking-[-0.02em]">
                        {h % 12 || 12}:{String(mi).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="text-[15px]">{a.label}</div>
                  </div>
                  <Toggle
                    on={a.on}
                    onChange={(v) =>
                      update((x) => {
                        const y = x.alarms.find((z) => z.id === a.id);
                        if (y) y.on = v;
                      })
                    }
                  />
                </div>
              );
            })}
          </>
        )}
        {tab === "world" && (
          <>
            <LargeTitle dark>세계 시계</LargeTitle>
            {cities.map(([c, off]) => {
              const t = new Date(now.getTime() + (off - 9) * 3600000);
              return (
                <div key={c} className="flex items-center mx-4 py-[12px]" style={{ boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.15)" }}>
                  <div className="flex-1">
                    <div className="text-[13px] text-white/50">{off === 9 ? "오늘, +0시간" : `오늘, ${off - 9}시간`}</div>
                    <div className="text-[24px]">{c}</div>
                  </div>
                  <span className="text-[54px] font-extralight tabular">
                    {t.getHours() % 12 || 12}:{String(t.getMinutes()).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </>
        )}
        {tab === "sw" && (
          <div className="flex flex-col items-center pt-[110px]">
            <div className="text-[78px] font-extralight tabular tracking-[-0.02em]">{fmt(sw)}</div>
            <div className="flex justify-between w-full px-[24px] mt-[120px]">
              <button onClick={() => (run ? null : setSw(0))} className="w-[80px] h-[80px] rounded-full bg-[#333] text-[16px] ring-2 ring-black ring-offset-2 ring-offset-[#333]">
                {run ? "랩" : "재설정"}
              </button>
              <button onClick={() => setRun(!run)} className="w-[80px] h-[80px] rounded-full text-[16px]" style={{ background: run ? "#3A1512" : "#0C3517", color: run ? "#FF453A" : "#30D158" }}>
                {run ? "중단" : "시작"}
              </button>
            </div>
          </div>
        )}
        {tab === "timer" && (
          <div className="flex flex-col items-center pt-[160px] text-white/50 text-[17px]">
            <div className="text-[64px] font-extralight text-white tabular">00:15:00</div>
            레이블 · 타이머
          </div>
        )}
      </div>
      <TabBar
        dark
        active={tab}
        onChange={setTab}
        tint="#FF9F0A"
        inactive="#8e8e93"
        items={[
          { id: "world", label: "세계 시계", icon: <Globe size={25} /> },
          { id: "alarm", label: "알람", icon: <AlarmClock size={25} /> },
          { id: "sw", label: "스톱워치", icon: <Timer size={25} /> },
          { id: "timer", label: "타이머", icon: <Hourglass size={25} /> },
        ]}
      />
    </div>
  );
}

/* ───────── 날씨 ───────── */
export function Weather() {
  useStatusBar(false);
  const d = useData();
  const w = d.weather;
  const now = new Date();
  const hours = Array.from({ length: 10 }, (_, i) => {
    const h = (now.getHours() + i) % 24;
    const t = Math.round(w.temp + Math.sin(((h - 15) / 24) * Math.PI * 2) * ((w.hi - w.lo) / 2));
    return { h, t, night: h < 6 || h >= 18 };
  });
  return (
    <div className="absolute inset-0 text-white" style={{ background: "linear-gradient(180deg,#3E4651 0%,#2A3038 45%,#1B1F25 100%)" }}>
      <div className="absolute inset-0 scroll px-[16px]" style={{ paddingTop: "calc(var(--sat) + 30px)", paddingBottom: 90 }}>
        <div className="text-center">
          <div className="text-[13px] font-semibold opacity-80">나의 위치</div>
          <div className="text-[32px] leading-[38px]">{w.city}</div>
          <div className="text-[96px] font-extralight leading-[100px] tracking-[-0.03em] pl-[24px]">{w.temp}°</div>
          <div className="text-[20px] font-medium opacity-80">{w.cond}</div>
          <div className="text-[20px] font-medium">
            최고:{w.hi}° 최저:{w.lo}°
          </div>
        </div>
        <div className="mt-[40px] rounded-[16px] p-[14px] blur-bar" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="text-[13px] opacity-75 pb-[10px]" style={{ boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.2)" }}>
            오늘 밤까지 흐린 상태가 지속되겠습니다. 바람은 최대 3m/s입니다.
          </div>
          <div className="flex justify-between pt-[12px]">
            {hours.slice(0, 6).map((x, i) => (
              <div key={i} className="flex flex-col items-center gap-[10px] text-[15px] font-semibold">
                <span>{i === 0 ? "지금" : `${x.h < 12 ? "오전" : "오후"} ${x.h % 12 || 12}시`.replace("오전 ", "").replace("오후 ", "")}</span>
                {x.night ? <Moon size={22} fill="#fff" strokeWidth={0} /> : i % 3 === 2 ? <CloudSun size={22} /> : <Cloud size={22} fill="#fff" strokeWidth={0} />}
                <span>{x.t}°</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-[10px] rounded-[16px] p-[14px] blur-bar" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="text-[13px] opacity-60 pb-[6px] font-semibold">10일간의 일기예보</div>
          {Array.from({ length: 10 }, (_, i) => {
            const day = new Date(now.getTime() + i * 86400000);
            const lo = w.lo + ((i * 3) % 4) - 1,
              hi = w.hi + ((i * 5) % 5) - 2;
            return (
              <div key={i} className="flex items-center gap-[10px] py-[10px] text-[18px] font-medium" style={{ boxShadow: "inset 0 0.5px 0 rgba(255,255,255,0.15)" }}>
                <span className="w-[50px]">{i === 0 ? "오늘" : DAYS[day.getDay()]}</span>
                <span className="w-[30px]">{i === 2 || i === 5 ? <CloudRain size={22} /> : <Cloud size={22} fill="#fff" strokeWidth={0} />}</span>
                <span className="w-[38px] text-right opacity-55">{lo}°</span>
                <span className="flex-1 h-[5px] rounded-full bg-black/25 relative overflow-hidden">
                  <span className="absolute top-0 bottom-0 rounded-full" style={{ left: `${(lo - w.lo + 2) * 8}%`, right: `${100 - (hi - w.lo + 4) * 8}%`, background: "linear-gradient(90deg,#9BD1E5,#E8C66A)" }} />
                </span>
                <span className="w-[38px]">{hi}°</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── 계산기 ───────── */
export function Calculator() {
  useStatusBar(false);
  const dd = useData();
  const [vault, setVault] = useState(false);
  const [disp, setDisp] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const calc = (a: number, b: number, o: string) => (o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : b === 0 ? NaN : a / b);
  const show = (n: number) => (isNaN(n) ? "오류" : String(Math.round(n * 1e9) / 1e9));
  const press = (k: string) => {
    if (/[0-9]/.test(k)) {
      setDisp(fresh || disp === "0" ? k : (disp + k).slice(0, 9));
      setFresh(false);
    } else if (k === ".") {
      if (fresh) setDisp("0.");
      else if (!disp.includes(".")) setDisp(disp + ".");
      setFresh(false);
    } else if (k === "AC") {
      setDisp("0");
      setAcc(null);
      setOp(null);
      setFresh(true);
    } else if (k === "±") setDisp(show(-parseFloat(disp)));
    else if (k === "%") setDisp(show(parseFloat(disp) / 100));
    else if (k === "=") {
      // 금고 숫자를 치고 = 누르면 숨긴 보관함이 열림
      if (!op && dd.vault?.code && disp === dd.vault.code) {
        setVault(true);
        setDisp("0");
        return;
      }
      if (op && acc !== null) setDisp(show(calc(acc, parseFloat(disp), op)));
      setAcc(null);
      setOp(null);
      setFresh(true);
    } else {
      const cur = parseFloat(disp);
      const r = op && acc !== null && !fresh ? calc(acc, cur, op) : cur;
      setAcc(r);
      setDisp(show(r));
      setOp(k);
      setFresh(true);
    }
  };
  const rows = [
    ["AC", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];
  const fmt = disp.includes(".") || disp === "오류" ? disp : Number(disp).toLocaleString("en-US");
  return (
    <div className="absolute inset-0 bg-black text-white flex flex-col justify-end px-[16px]" style={{ paddingBottom: 46 }}>
      {vault && <Vault onClose={() => setVault(false)} />}
      <div className="text-right font-light tabular pr-[8px] mb-[12px] truncate" style={{ fontSize: fmt.length > 7 ? 64 : 88, lineHeight: 1.1 }}>
        {fmt}
      </div>
      <div className="grid grid-cols-4 gap-[14px]">
        {rows.flat().map((k) => {
          const isOp = ["÷", "×", "−", "+", "="].includes(k);
          const isFn = ["AC", "±", "%"].includes(k);
          const active = op === k && fresh;
          return (
            <button
              key={k}
              onClick={() => press(k)}
              className={`h-[80px] rounded-full text-[34px] active:brightness-125 ${k === "0" ? "col-span-2 text-left pl-[30px]" : ""}`}
              style={{ background: active ? "#fff" : isOp ? "#FF9F0A" : isFn ? "#A5A5A5" : "#333333", color: active ? "#FF9F0A" : isFn ? "#000" : "#fff", fontWeight: isFn ? 500 : 400 }}
            >
              {k === "AC" && disp !== "0" ? "C" : k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 계산기 금고: 숨긴 사진 · 메모 */
function Vault({ onClose }: { onClose: () => void }) {
  const d = useData();
  const [tab, setTab] = useState<"photo" | "note">("photo");
  const pics = d.photos.filter((p) => p.vault);
  return (
    <div className="absolute inset-0 z-20 bg-[#111] text-white flex flex-col fade">
      <div className="flex items-center justify-between px-[16px]" style={{ paddingTop: "calc(var(--sat) + 8px)" }}>
        <span className="text-[22px] font-bold">보관함</span>
        <button onClick={onClose} className="text-[16px] text-[#FF9F0A]">
          닫기
        </button>
      </div>
      <div className="flex gap-[8px] px-[16px] pt-[14px]">
        {(["photo", "note"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className="px-[14px] h-[32px] rounded-full text-[14px] font-semibold" style={{ background: tab === k ? "#FF9F0A" : "#2c2c2e", color: tab === k ? "#000" : "#fff" }}>
            {k === "photo" ? `사진 ${pics.length}` : `메모 ${d.vault?.notes.length ?? 0}`}
          </button>
        ))}
      </div>
      <div className="flex-1 scroll px-[16px] pt-[16px] pb-[40px]">
        {tab === "photo" ? (
          pics.length ? (
            <div className="grid grid-cols-3 gap-[2px]">
              {pics.map((p) => (
                <Img key={p.id} src={photoSrc(p.id, d.photos)} className="w-full aspect-square" />
              ))}
            </div>
          ) : (
            <div className="text-center text-white/40 pt-[120px]">비어 있음</div>
          )
        ) : (
          <div className="flex flex-col gap-[10px]">
            {(d.vault?.notes ?? []).map((n, i) => (
              <div key={i} className="rounded-[12px] bg-[#1c1c1e] p-[14px] text-[15px] leading-[22px] whitespace-pre-wrap">
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── 지도 ───────── */
export function Maps() {
  useStatusBar(true);
  const d = useData();
  const [sel, setSel] = useState<string | null>(null);
  const roads = useMemo(
    () => [
      "M-20 220 C 120 200, 220 260, 420 230",
      "M-20 520 C 140 540, 260 470, 420 500",
      "M120 -20 C 140 200, 90 500, 150 900",
      "M300 -20 C 280 300, 330 600, 290 900",
      "M-20 700 L 420 640",
      "M40 -20 L 380 900",
    ],
    [],
  );
  const p = d.places.find((x) => x.id === sel);
  return (
    <div className="absolute inset-0 bg-[#F5F2EB] overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice">
        <rect x="190" y="300" width="120" height="110" rx="14" fill="#CDE8B5" />
        <rect x="20" y="590" width="90" height="90" rx="12" fill="#CDE8B5" />
        <path d="M-20 380 C 100 360, 200 430, 420 390 L 420 440 C 200 480, 100 410, -20 430 Z" fill="#AAD3F5" />
        {roads.map((r, i) => (
          <g key={i}>
            <path d={r} stroke="#E2DCCF" strokeWidth={i < 2 ? 18 : 12} fill="none" />
            <path d={r} stroke={i < 2 ? "#FFE08A" : "#fff"} strokeWidth={i < 2 ? 13 : 8} fill="none" />
          </g>
        ))}
        {Array.from({ length: 30 }).map((_, i) => (
          <rect key={i} x={(i * 97) % 380} y={(i * 151) % 820} width={20 + (i % 3) * 8} height={16 + (i % 4) * 6} rx="3" fill="#ECE7DC" />
        ))}
      </svg>
      {d.places.map((pl) => (
        <button key={pl.id} onClick={() => setSel(pl.id)} className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style={{ left: `${pl.x * 100}%`, top: `${pl.y * 100}%` }}>
          <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 border-white" style={{ background: sel === pl.id ? "#FF3B30" : "#FF6B5E", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
            <Star size={14} fill="#fff" color="#fff" />
          </span>
          <span className="text-[11px] font-semibold mt-[2px] px-[3px]" style={{ textShadow: "0 0 3px #fff, 0 0 3px #fff" }}>
            {pl.name}
          </span>
        </button>
      ))}
      <span className="absolute w-[18px] h-[18px] rounded-full bg-[#007AFF] border-[3px] border-white" style={{ left: "52%", top: "46%", boxShadow: "0 0 0 14px rgba(0,122,255,0.15)" }} />
      <div className="absolute right-[12px] flex flex-col rounded-[10px] bg-white/95 overflow-hidden" style={{ top: "calc(var(--sat) + 10px)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <span className="w-[44px] h-[44px] flex items-center justify-center text-black/60 hair-b">
          <Layers size={20} />
        </span>
        <span className="w-[44px] h-[44px] flex items-center justify-center text-[#007AFF]">
          <Navigation size={19} fill="#007AFF" />
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 rounded-t-[14px] bg-white/95 blur-bar px-[16px] pt-[8px] sheet" style={{ paddingBottom: "calc(var(--sab) + 10px)", boxShadow: "0 -2px 16px rgba(0,0,0,0.1)" }}>
        <div className="w-[36px] h-[5px] rounded-full bg-black/15 mx-auto mb-[10px]" />
        {p ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[24px] font-bold">{p.name}</div>
                <div className="text-[15px] text-black/50">{p.note || "즐겨찾기"}</div>
              </div>
              <button onClick={() => setSel(null)} className="w-[30px] h-[30px] rounded-full bg-black/5 text-black/50 flex items-center justify-center">
                <X size={16} strokeWidth={2.6} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[8px] mt-[14px]">
              <span className="h-[52px] rounded-[10px] bg-[#007AFF] text-white text-[13px] font-semibold flex flex-col items-center justify-center">
                <Navigation size={17} fill="#fff" />
                경로
              </span>
              <span className="h-[52px] rounded-[10px] bg-black/5 text-[#007AFF] text-[13px] font-semibold flex flex-col items-center justify-center">
                <Star size={17} />
                즐겨찾기
              </span>
              <span className="h-[52px] rounded-[10px] bg-black/5 text-[#007AFF] text-[13px] font-semibold flex flex-col items-center justify-center">
                <MapPin size={17} />
                공유
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="h-[38px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
              <Search size={17} />
              지도 검색
            </div>
            <div className="text-[13px] font-semibold text-black/50 mt-[14px] mb-[8px]">즐겨찾기</div>
            <div className="flex gap-[16px] overflow-x-auto no-scrollbar pb-1">
              {d.places.map((pl) => (
                <button key={pl.id} onClick={() => setSel(pl.id)} className="flex flex-col items-center gap-[4px] shrink-0 w-[64px]">
                  <span className="w-[54px] h-[54px] rounded-full bg-[#FF9500]/15 flex items-center justify-center">
                    <Star size={22} fill="#FF9500" color="#FF9500" />
                  </span>
                  <span className="text-[12px] truncate w-full text-center">{pl.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── 카메라 ───────── */
export function CameraApp() {
  useStatusBar(false);
  const d = useData();
  const [flash, setFlash] = useState(false);
  const [mode, setMode] = useState(2);
  const modes = ["시네마틱", "비디오", "사진", "인물", "파노라마"];
  const last = d.photos[0];
  return (
    <div className="absolute inset-0 bg-black text-white">
      <div className="absolute left-0 right-0 flex justify-between items-center px-[20px]" style={{ top: "calc(var(--sat) + 4px)" }}>
        <Zap size={22} />
        <span className="w-[26px] h-[26px] rounded-full border-2 border-white/80" />
      </div>
      <div className="absolute left-0 right-0 overflow-hidden" style={{ top: 110, height: 524 }}>
        <div className="w-full h-full" style={{ background: "radial-gradient(70% 50% at 50% 55%, #2a2a2c 0%, #121213 60%, #050505 100%)" }} />
        <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 3px)" }} />
        <div className="absolute left-1/3 top-0 bottom-0 w-[0.5px] bg-white/25" />
        <div className="absolute left-2/3 top-0 bottom-0 w-[0.5px] bg-white/25" />
        <div className="absolute top-1/3 left-0 right-0 h-[0.5px] bg-white/25" />
        <div className="absolute top-2/3 left-0 right-0 h-[0.5px] bg-white/25" />
        <div className="absolute bottom-[12px] left-1/2 -translate-x-1/2 flex gap-[8px] text-[12px] font-semibold">
          {[".5", "1×", "2", "3"].map((z, i) => (
            <span key={z} className="w-[34px] h-[34px] rounded-full bg-black/40 flex items-center justify-center" style={{ color: i === 1 ? "#FFD60A" : "#fff" }}>
              {z}
            </span>
          ))}
        </div>
      </div>
      {flash && <div className="absolute inset-0 bg-white fade z-10" />}
      <div className="absolute left-0 right-0 flex justify-center gap-[22px] text-[13px] font-semibold tracking-[0.04em]" style={{ top: 650 }}>
        {modes.map((m, i) => (
          <button key={m} onClick={() => setMode(i)} style={{ color: i === mode ? "#FFD60A" : "#fff" }}>
            {m}
          </button>
        ))}
      </div>
      <div className="absolute left-0 right-0 flex justify-between items-center px-[34px]" style={{ bottom: 58 }}>
        <Img src={last ? photoSrc(last.id, d.photos) : ""} className="w-[46px] h-[46px] rounded-[8px]" />
        <button
          onClick={() => {
            setFlash(true);
            setTimeout(() => setFlash(false), 120);
          }}
          className="w-[76px] h-[76px] rounded-full border-[4px] border-white flex items-center justify-center"
        >
          <span className="w-[62px] h-[62px] rounded-full" style={{ background: mode === 1 ? "#FF3B30" : "#fff" }} />
        </button>
        <span className="w-[46px] h-[46px] rounded-full bg-white/15 flex items-center justify-center">
          <RefreshCw size={22} />
        </span>
      </div>
    </div>
  );
}

/* ───────── 설정 ───────── */
export function Settings() {
  useStatusBar(true);
  const d = useData();
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const [air, setAir] = useState(false);
  const [page, setPage] = useState<null | "general" | "about" | "focus" | "screen">(null);
  const Ico = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
    <span className="w-[29px] h-[29px] rounded-[7px] flex items-center justify-center text-white shrink-0" style={{ background: bg }}>
      {children}
    </span>
  );
  const groups: { icon: React.ReactNode; label: string; value?: string; toggle?: boolean }[][] = [
    [
      { icon: <Ico bg="#FF9500"><Plane size={17} fill="#fff" strokeWidth={0} /></Ico>, label: "에어플레인 모드", toggle: true },
      { icon: <Ico bg="#007AFF"><Wifi size={17} strokeWidth={2.6} /></Ico>, label: "Wi-Fi", value: "끔" },
      { icon: <Ico bg="#007AFF"><Bluetooth size={17} strokeWidth={2.4} /></Ico>, label: "Bluetooth", value: "끔" },
      { icon: <Ico bg="#34C759"><Antenna size={17} strokeWidth={2.4} /></Ico>, label: "셀룰러", value: d.carrier },
      { icon: <Ico bg="#34C759"><Link2 size={17} strokeWidth={2.6} /></Ico>, label: "개인용 핫스팟", value: "끔" },
    ],
    [
      { icon: <Ico bg="#FF3B30"><Bell size={17} fill="#fff" strokeWidth={0} /></Ico>, label: "알림" },
      { icon: <Ico bg="#FF2D55"><Volume2 size={17} fill="#fff" strokeWidth={2} /></Ico>, label: "사운드 및 햅틱" },
      { icon: <Ico bg="#5856D6"><MoonStar size={17} fill="#fff" strokeWidth={0} /></Ico>, label: "집중 모드", value: "방해금지 모드" },
      { icon: <Ico bg="#5856D6"><ScreenTime size={17} strokeWidth={2.4} /></Ico>, label: "스크린 타임" },
    ],
    [
      { icon: <Ico bg="#8E8E93"><Gear size={18} strokeWidth={2.2} /></Ico>, label: "일반" },
      { icon: <Ico bg="#8E8E93"><SlidersHorizontal size={17} strokeWidth={2.4} /></Ico>, label: "제어 센터" },
      { icon: <Ico bg="#007AFF"><Sun size={18} strokeWidth={2.4} /></Ico>, label: "디스플레이 및 밝기" },
      { icon: <Ico bg="#34AADC"><Image size={17} strokeWidth={2.4} /></Ico>, label: "배경화면" },
      { icon: <Ico bg="#34C759"><ScanFace size={18} strokeWidth={2.2} /></Ico>, label: "Face ID 및 암호" },
      { icon: <Ico bg="#34C759"><BatteryMedium size={18} strokeWidth={2.2} /></Ico>, label: "배터리", value: `${d.battery}%` },
      { icon: <Ico bg="#007AFF"><Hand size={17} fill="#fff" strokeWidth={0} /></Ico>, label: "개인정보 보호 및 보안", value: "위치 서비스 끔" },
    ],
  ];
  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      <NavBar title="설정" scrolled={scrolled} bg="rgba(242,242,247,0.9)" />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 60 }}>
        <LargeTitle>설정</LargeTitle>
        <div className="px-4 pb-[10px]">
          <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
            <Search size={16} />
            검색
          </div>
        </div>
        <div className="mx-4 rounded-[12px] bg-white flex items-center gap-[14px] px-[14px] py-[12px]">
          <Avatar name={d.owner} size={60} />
          <div className="flex-1">
            <div className="text-[21px]">{d.owner}</div>
            <div className="text-[13px] text-black/60">Apple 계정, iCloud 등</div>
          </div>
          <ChevronRight size={18} className="text-[#c4c4c6]" strokeWidth={2.4} />
        </div>
        {groups.map((g, gi) => (
          <div key={gi} className="mx-4 mt-[24px] rounded-[12px] bg-white overflow-hidden">
            {g.map((it, i) => (
              <div key={it.label} onClick={() => (it.label === "일반" ? setPage("general") : it.label === "집중 모드" ? setPage("focus") : it.label === "스크린 타임" ? setPage("screen") : undefined)} className="flex items-center pl-[14px] gap-[14px] cursor-pointer active:bg-black/[0.03]">
                {it.icon}
                <div className={`flex-1 flex items-center min-h-[46px] pr-[14px] ${i < g.length - 1 ? "hair-b" : ""}`}>
                  <span className="flex-1 text-[17px]">{it.label}</span>
                  {it.toggle ? (
                    <Toggle on={air} onChange={setAir} />
                  ) : (
                    <>
                      {it.value && <span className="text-[17px] text-black/45 mr-[6px]">{it.value}</span>}
                      <ChevronRight size={18} className="text-[#c4c4c6]" strokeWidth={2.4} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="text-center text-[13px] text-black/40 pt-[24px]">{d.deviceName} · iOS 18</div>
      </div>
      {page && <SettingsSub page={page} setPage={setPage} />}
    </div>
  );
}

/* 설정 > 일반 / 정보 — 유심 두 개, 최근 유심 변경 흔적 */
function SettingsSub({ page, setPage }: { page: "general" | "about" | "focus" | "screen"; setPage: (p: null | "general" | "about" | "focus" | "screen") => void }) {
  const d = useData();
  const Group = ({ rows, title, foot }: { rows: [string, string?, boolean?][]; title?: string; foot?: string }) => (
    <div className="mt-[24px]">
      {title && <div className="px-[32px] pb-[6px] text-[13px] text-black/45 uppercase">{title}</div>}
      <div className="mx-4 rounded-[12px] bg-white overflow-hidden">
        {rows.map(([k, v, link], i) => (
          <div key={k + i} onClick={() => k === "정보" && setPage("about")} className={`flex items-center pl-[16px] ${link ? "cursor-pointer active:bg-black/[0.03]" : ""}`}>
            <div className={`flex-1 flex items-center min-h-[44px] pr-[14px] ${i < rows.length - 1 ? "hair-b" : ""}`}>
              <span className="flex-1 text-[17px]">{k}</span>
              {v && <span className="text-[17px] text-black/45 mr-[6px] text-right">{v}</span>}
              {link && <ChevronRight size={18} className="text-[#c4c4c6]" strokeWidth={2.4} />}
            </div>
          </div>
        ))}
      </div>
      {foot && <div className="px-[32px] pt-[6px] text-[13px] text-black/45 leading-[18px]">{foot}</div>}
    </div>
  );
  return (
    <div className="absolute inset-0 bg-[#F2F2F7] z-20 push">
      <NavBar title={page === "general" ? "일반" : page === "focus" ? "방해금지 모드" : page === "screen" ? "스크린 타임" : "정보"} back={page === "about" ? "일반" : "설정"} onBack={() => setPage(page === "about" ? "general" : null)} scrolled />
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 60 }}>
        {page === "screen" ? (
          <>
            <div className="mx-4 mt-[10px] rounded-[12px] bg-white px-[16px] py-[14px]">
              <div className="text-[13px] text-black/45">일일 평균</div>
              <div className="text-[28px] font-bold">{d.screenTime.total}</div>
              <div className="flex items-end gap-[3px] h-[90px] mt-[12px]">
                {d.screenTime.hours.map((v, i) => (
                  <span key={i} className="flex-1 rounded-t-[2px]" style={{ height: `${(v / 60) * 100}%`, background: i < 5 ? "#5856D6" : "#B7B6EC" }} />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-black/40 mt-[4px]">
                <span>0시</span>
                <span>6시</span>
                <span>12시</span>
                <span>18시</span>
              </div>
            </div>
            <Group title="가장 많이 사용함" rows={d.screenTime.apps.map(([a, t]) => [a, t] as [string, string])} />
            <Group title="픽업" rows={[["하루 평균", `${d.screenTime.pickups}회`], ["첫 번째 픽업", d.screenTime.firstPickup]]} />
          </>
        ) : page === "focus" ? (
          <>
            <div className="flex flex-col items-center pt-[10px]">
              <span className="w-[56px] h-[56px] rounded-full bg-[#5856D6] flex items-center justify-center">
                <MoonStar size={28} fill="#fff" strokeWidth={0} color="#fff" />
              </span>
              <div className="text-[13px] text-black/50 mt-[10px]">켜짐 · 매일</div>
            </div>
            <Group
              title="알림 허용"
              rows={[
                ["사람", "번호변경_이유노", true],
                ["앱", "없음", true],
              ]}
              foot="방해금지 모드가 켜져 있어도 이 사람의 전화와 메시지는 울립니다."
            />
            <Group rows={[["반복 전화 허용", "끔"], ["다른 사람의 전화", "꺼짐"]]} />
            <Group title="일정" rows={[["매일", "켜짐", true]]} />
          </>
        ) : page === "general" ? (
          <>
            <Group rows={[["정보", undefined, true], ["소프트웨어 업데이트", undefined, true]]} />
            <Group rows={[["AirDrop", undefined, true], ["AirPlay 및 연속성", undefined, true]]} />
            <Group rows={[["iPhone 저장 공간", undefined, true], ["백그라운드 앱 새로 고침", undefined, true]]} />
            <Group rows={[["날짜 및 시간", undefined, true], ["키보드", undefined, true], ["언어 및 지역", undefined, true]]} />
            <Group rows={[["VPN 및 기기 관리", "연결 안 됨", true]]} />
            <Group rows={[["전송 또는 iPhone 재설정", undefined, true]]} />
          </>
        ) : (
          <>
            <Group rows={[["이름", d.deviceName, true], ["iOS 버전", "18.1", true], ["모델 이름", "iPhone 15 Pro"], ["모델 번호", "MTUV3KH/A"], ["일련 번호", "F2L*******Q7"]]} />
            <Group rows={[["노래", String(d.songs.length)], ["사진", String(d.photos.filter((x) => !x.deleted).length)], ["응용 프로그램", "24"], ["용량", "256GB"], ["사용 가능", "171.4GB"]]} />
            <Group
              title="물리적 SIM"
              rows={[["네트워크", d.carrier], ["통신사", `${d.carrier} 54.0`], ["번호", "010-****-****"], ["상태", "사용 중"]]}
            />
            <Group
              title="eSIM"
              rows={[["네트워크", "알뜰폰"], ["번호", "번호 없음"], ["상태", "꺼짐"], ["추가된 날짜", "10. 18."]]}
              foot="최근 SIM 변경: 10. 18. · 이전 eSIM 2개가 삭제됨"
            />
            <Group rows={[["Wi-Fi 주소", "꺼짐"], ["Bluetooth", "꺼짐"], ["IMEI", "35 *** ******* 4"], ["IMEI2", "35 *** ******* 1"]]} />
          </>
        )}
      </div>
    </div>
  );
}

/* iOS 앱 아이콘 — 전부 SVG로 직접 그림 (이모지/외부 이미지 없음) */
import { useEffect, useState } from "react";
import { DAYS } from "./store";

const S = ({ children, bg }: { children: React.ReactNode; bg: React.ReactNode }) => (
  <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ display: "block" }}>
    {bg}
    {children}
  </svg>
);
const lin = (id: string, a: string, b: string, x2 = 0, y2 = 1) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
      <stop offset="0" stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  </defs>
);
const fill = (c: string) => <rect width="60" height="60" fill={c} />;

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  const h = ((t.getHours() % 12) + t.getMinutes() / 60) * 30;
  const m = (t.getMinutes() + t.getSeconds() / 60) * 6;
  const s = t.getSeconds() * 6;
  return (
    <S bg={fill("#000")}>
      <circle cx="30" cy="30" r="25" fill="#fff" />
      {Array.from({ length: 12 }).map((_, i) => (
        <text key={i} x={30 + 19.5 * Math.sin((i + 1) * (Math.PI / 6))} y={30 - 19.5 * Math.cos((i + 1) * (Math.PI / 6)) + 2.2} fontSize="6.2" textAnchor="middle" fill="#111" fontFamily="-apple-system,'SF Pro Text',sans-serif" fontWeight="500">
          {i + 1}
        </text>
      ))}
      <line x1="30" y1="30" x2="30" y2="17.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${h} 30 30)`} />
      <line x1="30" y1="30" x2="30" y2="11" stroke="#111" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${m} 30 30)`} />
      <line x1="30" y1="34" x2="30" y2="10" stroke="#FF9500" strokeWidth="0.8" transform={`rotate(${s} 30 30)`} />
      <circle cx="30" cy="30" r="1.6" fill="#FF9500" />
    </S>
  );
}

function Cal() {
  const d = new Date();
  return (
    <S bg={fill("#fff")}>
      <text x="30" y="17" fontSize="8.4" textAnchor="middle" fill="#FF3B30" fontWeight="600" fontFamily="'Pretendard Variable',sans-serif">
        {DAYS[d.getDay()]}요일
      </text>
      <text x="30" y="47" fontSize="30" textAnchor="middle" fill="#111" fontWeight="300" fontFamily="-apple-system,'SF Pro Display','Pretendard Variable',sans-serif" letterSpacing="-1">
        {d.getDate()}
      </text>
    </S>
  );
}

export const ICONS: Record<string, () => React.ReactElement> = {
  messages: () => (
    <S bg={<>{lin("gm", "#65F57F", "#0BBD2A")}<rect width="60" height="60" fill="url(#gm)" /></>}>
      <path d="M30 13c-10.5 0-19 6.9-19 15.4 0 4.9 2.8 9.2 7.1 12-0.3 2.5-1.6 4.7-3.6 6.3 3.6 0 6.8-1.4 9-3.3 2 .5 4.2.8 6.5.8 10.5 0 19-6.9 19-15.4S40.5 13 30 13z" fill="#fff" />
    </S>
  ),
  phone: () => (
    <S bg={<>{lin("gp", "#65F57F", "#0BBD2A")}<rect width="60" height="60" fill="url(#gp)" /></>}>
      <path d="M21.6 14.5c1-.6 2.3-.4 3 .5l3.6 5c.7 1 .6 2.3-.2 3.1l-2.3 2.3c1.6 3.6 4.4 6.6 8.2 8.6l2.4-2.3c.9-.8 2.2-.9 3.1-.2l5 3.5c1 .7 1.2 2 .6 3l-1.8 2.9c-1 1.6-3 2.4-4.9 1.8-10-3-17.4-10.6-20.2-20.5-.5-1.8.2-3.8 1.8-4.8z" fill="#fff" />
    </S>
  ),
  safari: () => (
    <S bg={<>{lin("gs", "#fff", "#E6E6EA")}<rect width="60" height="60" fill="url(#gs)" /></>}>
      <defs>
        <linearGradient id="gs2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1FC5FF" />
          <stop offset="1" stopColor="#1A5DF2" />
        </linearGradient>
      </defs>
      <circle cx="30" cy="30" r="22" fill="url(#gs2)" />
      {Array.from({ length: 48 }).map((_, i) => (
        <line key={i} x1="30" y1="10" x2="30" y2={i % 4 === 0 ? 13.5 : 12} stroke="#fff" strokeWidth={i % 4 === 0 ? 0.9 : 0.5} transform={`rotate(${i * 7.5} 30 30)`} opacity="0.9" />
      ))}
      <g transform="rotate(45 30 30)">
        <path d="M30 13 L33.2 30 L26.8 30 Z" fill="#FF3B30" />
        <path d="M30 47 L33.2 30 L26.8 30 Z" fill="#fff" />
      </g>
    </S>
  ),
  music: () => (
    <S bg={<>{lin("gmu", "#FB5C74", "#FA233B")}<rect width="60" height="60" fill="url(#gmu)" /></>}>
      <path d="M38.5 13.5v21.8a5.2 5.2 0 1 1-2.6-4.5V20.6l-12 2.6v15.4a5.2 5.2 0 1 1-2.6-4.5V18.4z" fill="#fff" />
    </S>
  ),
  kakao: () => (
    <S bg={fill("#FEE500")}>
      <path d="M30 14c-10.5 0-19 6.7-19 15 0 5.3 3.5 10 8.8 12.6l-2 7.3c-.2.6.5 1.1 1 .7l8.7-5.8c.8.1 1.6.1 2.5.1 10.5 0 19-6.7 19-15S40.5 14 30 14z" fill="#3A1D1D" />
      <text x="30" y="32.6" fontSize="8.6" textAnchor="middle" fill="#FEE500" fontWeight="800" fontFamily="Arial,Helvetica,sans-serif" letterSpacing="0.2">
        TALK
      </text>
    </S>
  ),
  signal: () => (
    <S bg={fill("#3A76F0")}>
      <circle cx="30" cy="29" r="17" fill="none" stroke="#fff" strokeWidth="2.4" strokeDasharray="5.2 2.6" />
      <path d="M30 17c-6.6 0-12 5.1-12 11.6 0 2.4.8 4.6 2.1 6.4l-1.6 5.3 5.6-1.5c1.7.9 3.7 1.4 5.9 1.4 6.6 0 12-5.2 12-11.6S36.6 17 30 17z" fill="#fff" />
    </S>
  ),
  insta: () => (
    <S
      bg={
        <>
          <defs>
            <radialGradient id="gi" cx="0.3" cy="1.07" r="1.3">
              <stop offset="0" stopColor="#FFDD55" />
              <stop offset="0.12" stopColor="#FFDD55" />
              <stop offset="0.45" stopColor="#FF543E" />
              <stop offset="0.7" stopColor="#C837AB" />
              <stop offset="1" stopColor="#4F5BD5" />
            </radialGradient>
          </defs>
          <rect width="60" height="60" fill="url(#gi)" />
        </>
      }
    >
      <rect x="15" y="15" width="30" height="30" rx="9" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="30" cy="30" r="7" fill="none" stroke="#fff" strokeWidth="3.2" />
      <circle cx="38.6" cy="21.4" r="2" fill="#fff" />
    </S>
  ),
  photos: () => (
    <S bg={fill("#fff")}>
      {["#FBBC05", "#F98E1D", "#F04B4B", "#C964D9", "#7B6CF6", "#3DA5F4", "#3BCB8E", "#A6D84B"].map((c, i) => (
        <ellipse key={i} cx="30" cy="20" rx="5.6" ry="10" fill={c} opacity="0.86" transform={`rotate(${i * 45} 30 30)`} style={{ mixBlendMode: "multiply" }} />
      ))}
    </S>
  ),
  camera: () => (
    <S bg={<>{lin("gc", "#E9E9EC", "#B9B9BE")}<rect width="60" height="60" fill="url(#gc)" /></>}>
      <rect x="10" y="19" width="40" height="27" rx="5" fill="#2C2C2E" />
      <path d="M23 19l2.4-4h9.2l2.4 4z" fill="#2C2C2E" />
      <circle cx="30" cy="32.5" r="9" fill="#48484A" />
      <circle cx="30" cy="32.5" r="6.4" fill="#1C1C1E" />
      <circle cx="28" cy="30.5" r="1.6" fill="#5E5E62" />
      <circle cx="43.5" cy="24" r="1.5" fill="#FFD60A" />
    </S>
  ),
  calendar: Cal,
  notes: () => (
    <S bg={fill("#fff")}>
      <rect width="60" height="17" fill="#FFD02F" />
      <line x1="0" y1="17" x2="60" y2="17" stroke="#E5B400" strokeWidth="0.6" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <circle key={i} cx={4 + i * 5.8} cy="20" r="0.9" fill="#C7C7CC" />
      ))}
      {[28, 37, 46, 55].map((y) => (
        <line key={y} x1="7" y1={y} x2="60" y2={y} stroke="#D8D8DC" strokeWidth="0.9" />
      ))}
    </S>
  ),
  contacts: () => (
    <S bg={<>{lin("gct", "#D4D4D9", "#B0B0B6")}<rect width="60" height="60" fill="url(#gct)" /></>}>
      <rect x="50" y="10" width="5" height="9" rx="1.5" fill="#FF9500" />
      <rect x="50" y="21" width="5" height="9" rx="1.5" fill="#34C759" />
      <rect x="50" y="32" width="5" height="9" rx="1.5" fill="#007AFF" />
      <circle cx="28" cy="24" r="8.5" fill="#F2F2F7" />
      <path d="M12 47c1.5-8.6 8-13 16-13s14.5 4.4 16 13z" fill="#F2F2F7" />
    </S>
  ),
  bank: () => (
    <S bg={<>{lin("gb", "#2F80FF", "#1452D6")}<rect width="60" height="60" fill="url(#gb)" /></>}>
      <path d="M30 12 L48 21 L12 21 Z" fill="#fff" />
      <rect x="14" y="23" width="32" height="2.6" fill="#fff" />
      {[16.5, 24.5, 32.5, 40.5].map((x) => (
        <rect key={x} x={x} y="27.5" width="3.4" height="13" rx="0.6" fill="#fff" />
      ))}
      <rect x="12" y="42.5" width="36" height="3.4" rx="0.8" fill="#fff" />
    </S>
  ),
  maps: () => (
    <S bg={fill("#E8F1DE")}>
      <path d="M0 40 L60 18 L60 30 L0 52Z" fill="#fff" />
      <path d="M22 0 L34 0 L42 60 L30 60Z" fill="#FFD84D" opacity="0.95" />
      <rect x="0" y="0" width="16" height="18" fill="#C9E4A9" />
      <rect x="44" y="38" width="16" height="22" fill="#A8D5F7" />
      <path d="M40 24 l-6 14 l2.2-5.6 l5.6-2.2 z" fill="#007AFF" />
      <circle cx="38" cy="30" r="9" fill="#007AFF" opacity="0.16" />
      <path d="M38 22 L44 37 L38 33.5 L32 37 Z" fill="#007AFF" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </S>
  ),
  settings: () => (
    <S bg={<>{lin("gst", "#D7D7DC", "#9C9CA2")}<rect width="60" height="60" fill="url(#gst)" /></>}>
      <g fill="#3A3A3C">
        {Array.from({ length: 30 }).map((_, i) => (
          <path key={i} d="M28.7 7.6h2.6l.7 3.6h-4z" transform={`rotate(${i * 12} 30 30)`} />
        ))}
      </g>
      <circle cx="30" cy="30" r="19.2" fill="#3A3A3C" />
      <circle cx="30" cy="30" r="16.6" fill="#8E8E93" />
      <circle cx="30" cy="30" r="15.4" fill="#D1D1D6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="29" y="15.6" width="2" height="14.4" rx="1" fill="#7C7C82" transform={`rotate(${i * 60 + 30} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="10.2" fill="none" stroke="#9A9AA0" strokeWidth="1.3" />
      <circle cx="30" cy="30" r="5.2" fill="#D1D1D6" stroke="#7C7C82" strokeWidth="1.2" />
      <circle cx="30" cy="30" r="2.2" fill="#3A3A3C" />
    </S>
  ),
  clock: Clock,
  calculator: () => (
    <S bg={fill("#1C1C1E")}>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={14 + c * 11} cy={16 + r * 11.5} r="4.4" fill={r === 0 ? "#A5A5AA" : "#4A4A4E"} />),
      )}
      {[0, 1, 2].map((r) => (
        <circle key={r} cx="47" cy={16 + r * 11.5} r="4.4" fill="#FF9F0A" />
      ))}
      <rect x="9.6" y="46" width="26.4" height="8.8" rx="4.4" fill="#4A4A4E" />
      <circle cx="47" cy="50.4" r="4.4" fill="#FF9F0A" />
    </S>
  ),
  weather: () => (
    <S bg={<>{lin("gw", "#2A8CF7", "#69C2FF")}<rect width="60" height="60" fill="url(#gw)" /></>}>
      <circle cx="23" cy="22" r="9" fill="#FFD60A" />
      <path d="M20 44h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.6 6.6 0 0 0-1 13z" fill="#fff" />
    </S>
  ),
};

export function AppIcon({ id, size = 60 }: { id: string; size?: number }) {
  const I = ICONS[id] ?? (() => <S bg={fill("#8E8E93")}>{null}</S>);
  return (
    <div className="app-icon" style={{ width: size, height: size }}>
      <I />
    </div>
  );
}

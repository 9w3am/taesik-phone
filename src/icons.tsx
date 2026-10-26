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
  jobs: () => (
    <S bg={fill("#111")}>
      <rect x="15" y="15" width="30" height="30" rx="8" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M22 30.5l5.5 5.5L39 24" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </S>
  ),
  mail: () => (
    <S bg={<>{lin("gml", "#1E9BFF", "#0868F6")}<rect width="60" height="60" fill="url(#gml)" /></>}>
      <rect x="11" y="17" width="38" height="27" rx="4" fill="#fff" />
      <path d="M12 19l18 14 18-14" fill="none" stroke="#1C7CF9" strokeWidth="2.6" strokeLinejoin="round" />
    </S>
  ),
  reminders: () => (
    <S bg={fill("#fff")}>
      {[["#007AFF", 17], ["#FF3B30", 30], ["#FF9500", 43]].map(([c, y]) => (
        <g key={y as number}>
          <circle cx="16" cy={y as number} r="4.6" fill="none" stroke={c as string} strokeWidth="2.4" />
          <circle cx="16" cy={y as number} r="2.2" fill={c as string} />
          <rect x="25" y={(y as number) - 1.2} width="22" height="2.4" rx="1.2" fill="#D1D1D6" />
        </g>
      ))}
    </S>
  ),
  wallet: () => (
    <S bg={fill("#000")}>
      <rect x="10" y="14" width="40" height="30" rx="5" fill="#1E90FF" />
      <rect x="10" y="19" width="40" height="30" rx="5" fill="#FF9F0A" />
      <rect x="10" y="24" width="40" height="30" rx="5" fill="#34C759" />
      <path d="M10 32h14c2 0 3 4 6 4s4-4 6-4h14v17a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5z" fill="#D1D1D6" />
    </S>
  ),
  youtube: () => (
    <S bg={fill("#fff")}>
      <rect x="9" y="16" width="42" height="29" rx="9" fill="#FF0000" />
      <path d="M25.5 23.5v14l12-7z" fill="#fff" />
    </S>
  ),
  netflix: () => (
    <S bg={fill("#000")}>
      <path d="M20 12h7l6 20V12h7v36c-2.4-.2-4.8-.3-7-.4l-6-19v19c-2.4.1-4.7.3-7 .6z" fill="#E50914" />
    </S>
  ),
  x: () => (
    <S bg={fill("#000")}>
      <path d="M38.6 15h4.6l-10 11.5L45 45h-9.3l-7.3-9.5L20 45h-4.6l10.7-12.3L15 15h9.5l6.6 8.7zm-1.6 27.2h2.5L23.1 17.6h-2.7z" fill="#fff" />
    </S>
  ),
  coupang: () => (
    <S bg={fill("#fff")}>
      <text x="30" y="35" fontSize="12.4" textAnchor="middle" fontWeight="800" fontFamily="Arial, sans-serif" letterSpacing="-0.6">
        <tspan fill="#9B4A1E">c</tspan>
        <tspan fill="#E2312C">o</tspan>
        <tspan fill="#F4A51C">u</tspan>
        <tspan fill="#76B82A">p</tspan>
        <tspan fill="#4DA9E0">a</tspan>
        <tspan fill="#E2312C">n</tspan>
        <tspan fill="#76B82A">g</tspan>
      </text>
    </S>
  ),
  baemin: () => (
    <S bg={<>{lin("gbm", "#3DD3CD", "#1FB3AD")}<rect width="60" height="60" fill="url(#gbm)" /></>}>
      {/* 배달의민족: 민트 바탕 · 큰 '배민' 글자 · 스쿠터 탄 배달원 */}
      <text x="57" y="20" fontSize="17" textAnchor="end" fontWeight="900" fill="#fff" opacity="0.95" fontFamily="'BM Hanna','Pretendard Variable',sans-serif" letterSpacing="-1">
        배민
      </text>
      <rect x="11" y="27" width="13" height="11" rx="2" fill="#fff" />
      <rect x="11" y="31" width="13" height="2.2" fill="#2AC1BC" />
      <path d="M14 39.5h24.5c3 0 5.4-2 6.1-4.8l1.1-4.3h3.4" stroke="#0E8C87" strokeWidth="4.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="27" y="29" width="10" height="10" rx="4" fill="#127C78" />
      <circle cx="32.5" cy="26" r="5.4" fill="#178F8A" />
      <path d="M33 24.3h4.8a1.2 1.2 0 0 1 0 2.4H33z" fill="#E9FFFE" />
      <circle cx="18.5" cy="45" r="4.6" fill="#0B4D4A" />
      <circle cx="18.5" cy="45" r="1.8" fill="#9FE7E3" />
      <circle cx="42.5" cy="45" r="4.6" fill="#0B4D4A" />
      <circle cx="42.5" cy="45" r="1.8" fill="#9FE7E3" />
    </S>
  ),

  kakaot: () => (
    <S bg={<>{lin("gkt", "#2B2F57", "#191B37")}<rect width="60" height="60" fill="url(#gkt)" /></>}>
      {/* 카카오 T: 남색 바탕에 노란 T */}
      <path d="M16.5 17.5a3.5 3.5 0 0 1 3.5-3.5h20a3.5 3.5 0 0 1 3.5 3.5v2.6a3.5 3.5 0 0 1-3.5 3.5h-5.6v18.9a3 3 0 0 1-3 3h-3.8a3 3 0 0 1-3-3V23.6H20a3.5 3.5 0 0 1-3.5-3.5z" fill="#FFD84A" />
    </S>
  ),

  voicememos: () => (
    <S bg={fill("#1C1C1E")}>
      {[6, 14, 24, 34, 22, 40, 28, 16, 30, 18, 10].map((h, i) => (
        <rect key={i} x={8 + i * 4.2} y={30 - h / 2} width="2.4" height={h} rx="1.2" fill="#FF3B30" />
      ))}
    </S>
  ),
  health: () => (
    <S bg={fill("#fff")}>
      <path d="M45 13.5c-3.6 0-6.2 2.1-7.2 4.4-1-2.3-3.6-4.4-7.2-4.4-4.4 0-7.6 3.4-7.6 7.7 0 6.6 9.3 12.1 14.8 16.2 5.5-4.1 14.8-9.6 14.8-16.2 0-4.3-3.2-7.7-7.6-7.7z" fill="#FF2D55" transform="translate(-7.8 6)" />
    </S>
  ),
  cashwalk: () => (
    <S bg={<>{lin("gcw", "#FFD52A", "#FFBE00")}<rect width="60" height="60" fill="url(#gcw)" /></>}>
      {/* 캐시워크: 노란 바탕에 검은 운동화 */}
      <path d="M9.5 40.5c0-3.3 1.2-6.4 3.3-8.8l4.4-9.6c.9-2 3.2-2.6 4.9-1.4l3.3 2.4c1.8 1.3 4.3 1.1 5.8-.5l1.3-1.4c1-1.1 2.8-1 3.7.2l10.4 13.6c1.4 1.9 3.7 2.9 6 2.9 1.8 0 3.1 1.4 3.1 3.2v2.1c0 1.5-1.2 2.7-2.7 2.7H12.8c-1.8 0-3.3-1.5-3.3-3.3z" fill="#1A1A1A" />
      <path d="M10.5 42.4h44" stroke="#FFC400" strokeWidth="1.7" />
      <g stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <path d="M26 27.6l3.2 2.3" />
        <path d="M29 25.2l3 2.6" />
        <path d="M32.2 23.2l2.6 2.8" />
      </g>
    </S>
  ),

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
    <S bg={<>{lin("gst", "#EDEDF2", "#A9A9B0")}<rect width="60" height="60" fill="url(#gst)" /></>}>
      {/* 바깥 큰 톱니 */}
      <g fill="#7D7D83">
        {Array.from({ length: 32 }).map((_, i) => (
          <rect key={i} x="28.6" y="6.2" width="2.8" height="5" rx="0.6" transform={`rotate(${i * 11.25} 30 30)`} />
        ))}
      </g>
      <circle cx="30" cy="30" r="20" fill="#7D7D83" />
      <circle cx="30" cy="30" r="17.6" fill="#4E4E53" />
      <circle cx="30" cy="30" r="16.2" fill="#D4D4D9" />
      {/* 안쪽 작은 톱니 */}
      <g fill="#8E8E93">
        {Array.from({ length: 18 }).map((_, i) => (
          <rect key={i} x="29.2" y="18.6" width="1.6" height="2.6" transform={`rotate(${i * 20} 30 30)`} />
        ))}
      </g>
      <circle cx="30" cy="30" r="9.6" fill="#8E8E93" />
      <circle cx="30" cy="30" r="8.2" fill="#C7C7CC" />
      {/* 세 갈래 살 */}
      {[0, 120, 240].map((r) => (
        <rect key={r} x="27.9" y="13.8" width="4.2" height="16" rx="1.4" fill="#6E6E73" transform={`rotate(${r} 30 30)`} />
      ))}
      <circle cx="30" cy="30" r="4.4" fill="#E5E5EA" stroke="#6E6E73" strokeWidth="1.4" />
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

/** 직접 만든 앱 아이콘 정보 (apps/index.ts의 syncCustomApps가 채움) */
export const CUSTOM_ICONS: Record<string, { name: string; iconBg: string; iconText: string; iconImg?: string }> = {};
export function AppIcon({ id, size = 60 }: { id: string; size?: number }) {
  const c = CUSTOM_ICONS[id];
  if (c)
    return (
      <div className="app-icon flex items-center justify-center font-bold text-white" style={{ width: size, height: size, background: c.iconBg, fontSize: size * ((c.iconText || c.name.slice(0, 1)).length > 1 ? 0.36 : 0.48) }}>
        {c.iconImg?.startsWith("data:image/") ? <img src={c.iconImg} alt="" className="w-full h-full object-cover" /> : c.iconText || c.name.slice(0, 1)}
      </div>
    );
  const I = ICONS[id] ?? (() => <S bg={fill("#8E8E93")}>{null}</S>);
  return (
    <div className="app-icon" style={{ width: size, height: size }}>
      <I />
    </div>
  );
}

/* 공용 iOS UI 조각 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, User } from "lucide-react";

/* 현재 시각 (1초마다 갱신) */
export function useNow(ms = 1000) {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), ms);
    return () => clearInterval(i);
  }, [ms]);
  return t;
}
export const hm = (d: Date) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
export const ampm = (d: Date) => (d.getHours() < 12 ? "오전" : "오후");

/* 폰 전역 컨텍스트: 앱 열기/닫기, 상태바 색, 전화 걸기, 토스트 */
export type PhoneCtx = {
  open: (app: string, arg?: unknown) => void;
  home: () => void;
  setStatusDark: (dark: boolean) => void;
  call: (name: string, lines: string[], mode?: "out" | "in") => void;
  toast: (t: string) => void;
  appArg: unknown;
  /** 휴대폰 편집 모드: 폰 안에서 바로 고치기 */
  edit?: boolean;
};
export const Ctx = createContext<PhoneCtx>(null as unknown as PhoneCtx);
export const usePhoneCtx = () => useContext(Ctx);

/** 앱이 마운트될 때 상태바 글자색 지정 (dark=true → 검정 글자) */
export function useStatusBar(dark: boolean) {
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(dark);
  }, [dark, setStatusDark]);
}

/* 스크롤 여부 (큰 제목 → 작은 제목 전환) */
export function useScrolled<T extends HTMLElement>(threshold = 36) {
  const ref = useRef<T>(null);
  const [s, setS] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const f = () => setS(el.scrollTop > threshold);
    el.addEventListener("scroll", f, { passive: true });
    return () => el.removeEventListener("scroll", f);
  }, [threshold]);
  return [ref, s] as const;
}

/* iOS 내비게이션 바 */
export function NavBar({
  title,
  back,
  onBack,
  right,
  scrolled = true,
  dark = false,
  bg,
  tint = "var(--blue)",
}: {
  title?: React.ReactNode;
  back?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  scrolled?: boolean;
  dark?: boolean;
  bg?: string;
  tint?: string;
}) {
  return (
    <div
      className={`absolute top-0 left-0 right-0 z-20 ${scrolled ? "blur-bar" : ""}`}
      style={{
        paddingTop: "var(--sat)",
        background: scrolled ? bg ?? (dark ? "rgba(22,22,24,0.82)" : "rgba(249,249,249,0.86)") : "transparent",
        boxShadow: scrolled ? `inset 0 -0.5px 0 ${dark ? "rgba(255,255,255,0.12)" : "var(--sep)"}` : "none",
      }}
    >
      <div className="relative h-[44px] flex items-center justify-between px-2">
        <div className="flex items-center min-w-[70px] z-10">
          {onBack && (
            <button data-back onClick={onBack} className="flex items-center -ml-0.5 h-[44px] pr-2" style={{ color: tint }}>
              <ChevronLeft size={30} strokeWidth={2.4} className="-mr-1" />
              <span className="text-[17px] truncate max-w-[110px]">{back}</span>
            </button>
          )}
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold truncate max-w-[56%] text-center transition-opacity"
          style={{ opacity: scrolled ? 1 : 0, color: dark ? "#fff" : "#000" }}
        >
          {title}
        </div>
        <div className="flex items-center gap-4 pr-2 z-10" style={{ color: tint }}>
          {right}
        </div>
      </div>
    </div>
  );
}

export function LargeTitle({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <h1 className="px-4 pt-1 pb-2 text-[34px] font-bold tracking-[-0.02em] leading-[41px]" style={{ color: dark ? "#fff" : "#000" }}>
      {children}
    </h1>
  );
}

export function SearchField({ placeholder = "검색", dark = false, value, onChange }: { placeholder?: string; dark?: boolean; value?: string; onChange?: (v: string) => void }) {
  return (
    <div className="px-4 pb-2">
      <div className="h-[36px] rounded-[10px] flex items-center gap-1.5 px-2" style={{ background: dark ? "rgba(118,118,128,0.24)" : "rgba(118,118,128,0.12)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={dark ? "#8e8e93" : "#8e8e93"} strokeWidth="2.6" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        <input
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!onChange}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-[17px] placeholder:text-[#8e8e93]"
          style={{ color: dark ? "#fff" : "#000" }}
        />
      </div>
    </div>
  );
}

/* 연락처 아바타 (iOS 회색 그라디언트 + 이니셜/실루엣) */
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const clean = name.replace(/[\[\]\(\)_#+\-0-9*\s]/g, "");
  const latin = /^[A-Za-z]/.test(clean);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold"
      style={{ width: size, height: size, background: "linear-gradient(180deg,#A5ABB8,#858994)", fontSize: size * 0.4 }}
    >
      {latin ? (
        clean.slice(0, 2).toUpperCase()
      ) : (
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <circle cx="20" cy="15.5" r="7.2" fill="#fff" opacity="0.92" />
          <path d="M6.5 35c1.6-7.5 7-11 13.5-11s11.9 3.5 13.5 11z" fill="#fff" opacity="0.92" />
        </svg>
      )}
    </div>
  );
}

/* 카카오톡 기본 프로필 (연하늘 스쿼클 + 흰 실루엣) */
export function KakaoAvatar({ size = 48, group = false, seed }: { size?: number; group?: boolean; seed?: string }) {
  void seed;
  return (
    <div className="shrink-0 overflow-hidden flex items-center justify-center" style={{ width: size, height: size, borderRadius: size * 0.39, background: "#A9BBCE" }}>
      {group ? (
        <svg viewBox="0 0 48 48" width={size} height={size}>
          <circle cx="18" cy="19" r="5.5" fill="#fff" opacity="0.95" />
          <path d="M8 35c1-6 5-8.6 10-8.6s9 2.6 10 8.6z" fill="#fff" opacity="0.95" />
          <circle cx="31" cy="19" r="5.5" fill="#fff" />
          <path d="M21 35c1-6 5-8.6 10-8.6s9 2.6 10 8.6z" fill="#fff" />
        </svg>
      ) : (
        <svg viewBox="0 0 48 48" width={size} height={size}>
          <circle cx="24" cy="19" r="7" fill="#fff" />
          <path d="M11 38c1.4-7.4 6.6-11 13-11s11.6 3.6 13 11z" fill="#fff" />
        </svg>
      )}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!on);
      }}
      className="relative w-[51px] h-[31px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? "#34C759" : "rgba(120,120,128,0.16)" }}
    >
      <span
        className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white transition-all duration-200"
        style={{ left: on ? 22 : 2, boxShadow: "0 3px 8px rgba(0,0,0,0.15), 0 1px 1px rgba(0,0,0,0.16)" }}
      />
    </button>
  );
}

/* 하단 탭바 */
export function TabBar({
  items,
  active,
  onChange,
  tint = "var(--blue)",
  dark = false,
  inactive = "#999",
  bg,
}: {
  items: { id: string; label: string; icon: React.ReactNode; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
  tint?: string;
  dark?: boolean;
  inactive?: string;
  bg?: string;
}) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 blur-bar flex"
      style={{
        paddingBottom: "var(--sab)",
        background: bg ?? (dark ? "rgba(22,22,24,0.9)" : "rgba(249,249,249,0.92)"),
        boxShadow: `inset 0 0.5px 0 ${dark ? "rgba(255,255,255,0.12)" : "var(--sep)"}`,
      }}
    >
      {items.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)} className="flex-1 flex flex-col items-center pt-[7px] gap-[2px] relative" style={{ color: active === it.id ? tint : inactive }}>
          <div className="relative h-[26px] flex items-center">
            {it.icon}
            {!!it.badge && (
              <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] text-white text-[12px] font-medium flex items-center justify-center">{it.badge}</span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-[0.01em]">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* 사진 이미지 (지연 생성) */
export function Img({ src, className, style, onClick }: { src: string; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return src ? (
    <img src={src} className={className} style={{ objectFit: "cover", ...style }} onClick={onClick} draggable={false} alt="" />
  ) : (
    <div className={className} style={{ background: "#2c2c2e", ...style }} onClick={onClick} />
  );
}

export { User };

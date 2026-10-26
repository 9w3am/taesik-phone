/* 흔히 쓰는 앱들이 같이 쓰는 작은 부품 (프로필 동그라미 · 썸네일 · 밀려 들어오는 화면 · 아래에서 올라오는 시트) */
import { useData } from "../store";
import { photoSrc } from "../photos";
import { Img } from "../ui";

export const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

export const Avatar = ({ name, size = 40, hue }: { name: string; size?: number; hue?: number }) => (
  <span className="rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(160deg, hsl(${hue ?? hueOf(name)} 25% 62%), hsl(${hue ?? hueOf(name)} 22% 44%))` }}>
    {name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 1).toUpperCase() || "?"}
  </span>
);

/** 썸네일: 올린 사진이 있으면 사진, 없으면 색 그라데이션 + 큰 제목 글씨 (실제 썸네일처럼) */
export function Thumb({ photo, hue, className, style, children, text }: { photo: string; hue: number; className?: string; style?: React.CSSProperties; children?: React.ReactNode; text?: string }) {
  const d = useData();
  const src = photoSrc(photo, d.photos);
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 40% 38%), hsl(${(hue + 40) % 360} 35% 18%))`, containerType: "inline-size", ...style }}>
      {src && <Img src={src} className="absolute inset-0 w-full h-full" />}
      {!src && text && (
        <span className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 text-white font-black leading-[1.15] tracking-[-0.03em] line-clamp-3" style={{ fontSize: "clamp(11px, 7cqw, 26px)", textShadow: "0 2px 0 rgba(0,0,0,0.35), 0 0 12px rgba(0,0,0,0.3)" }}>
          {text}
        </span>
      )}
      {children}
    </div>
  );
}

/** 오른쪽에서 밀려 들어오는 화면 (뒤로 가기 버튼 포함) */
export function Push({ children, bg = "#fff", z = 30 }: { children: React.ReactNode; bg?: string; z?: number }) {
  return (
    <div className="absolute inset-0 push flex flex-col" style={{ background: bg, zIndex: z }}>
      {children}
    </div>
  );
}

/** 아래에서 올라오는 시트 (새 메일 쓰기 · 글쓰기 등) */
export function Sheet({ children, onClose, bg = "#fff" }: { children: React.ReactNode; onClose: () => void; bg?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end fade" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="sheet rounded-t-[14px] flex flex-col overflow-hidden" style={{ background: bg, height: "calc(100% - var(--sat) - 10px)" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/** 위쪽 막대 (뒤로 · 제목 · 오른쪽) */
export function Bar({ onBack, back, title, right, tint = "#007AFF", dark, border = true }: { onBack: () => void; back?: string; title?: React.ReactNode; right?: React.ReactNode; tint?: string; dark?: boolean; border?: boolean }) {
  return (
    <div style={{ paddingTop: "var(--sat)" }} className={border ? (dark ? "border-b border-white/10" : "border-b border-black/[0.06]") : ""}>
      <div className="h-[44px] flex items-center px-[6px] relative">
        <button data-back onClick={onBack} className="flex items-center text-[17px] z-10" style={{ color: tint }} aria-label="뒤로">
          <svg width="13" height="21" viewBox="0 0 13 21" className="mx-[6px]">
            <path d="M11 2L2.5 10.5 11 19" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back}
        </button>
        {title && <div className="absolute left-[70px] right-[70px] text-center text-[17px] font-semibold truncate" style={{ color: dark ? "#fff" : "#000" }}>{title}</div>}
        <span className="flex-1" />
        <div className="z-10 pr-[8px]" style={{ color: tint }}>
          {right}
        </div>
      </div>
    </div>
  );
}

/* 음악 (Apple Music 스타일) — 재생은 폰 전체 재생기(music.tsx)가 맡음: 앱을 나가도 계속 나옴 */
import { useEffect, useRef, useState } from "react";
import { Star, Play, Pause, FastForward, Rewind, House, LayoutGrid, Radio, Library, Search, MoreHorizontal, Airplay, ListMusic, ChevronRight, Check, ExternalLink, Quote, X, Smartphone, Music2, Mic2, Disc3, ListOrdered } from "lucide-react";
import { type Song } from "../store";
import { type LyricLine } from "../songMeta";
import { useMusic } from "../music";
import { LargeTitle, NavBar, TabBar, useScrolled, usePhoneCtx, useStatusBar } from "../ui";

const RED = "#FA2D48";
export function Cover({ s, size, radius = 8 }: { s: Song; size: number | string; radius?: number }) {
  const h = s.hue;
  // 앨범 사진: 에디터에서 올린 사진이 있으면 그걸로
  const img = s.cover && s.cover.startsWith("data:image/") ? s.cover : "";
  if (img) return <img src={img} alt="" className="shrink-0 object-cover" style={{ width: size, height: size, aspectRatio: "1", borderRadius: radius, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08)" }} />;
  return (
    <div
      className="shrink-0 relative overflow-hidden"
      style={{
        width: size,
        height: size === "100%" ? undefined : size,
        aspectRatio: "1",
        borderRadius: radius,
        background: `radial-gradient(80% 60% at 30% 25%, hsl(${h} 55% 62% / .9), transparent 60%), radial-gradient(70% 70% at 80% 85%, hsl(${(h + 40) % 360} 45% 30%), transparent 70%), linear-gradient(160deg, hsl(${h} 35% 30%), hsl(${(h + 20) % 360} 30% 12%))`,
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08)",
      }}
    >
      <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(${h}deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 6px)` }} />
    </div>
  );
}
/** 보안: http/https 주소만 허용 (javascript: 같은 위험한 주소는 무시하고 유튜브 검색으로) */
const safeUrl = (u: string) => {
  try {
    const x = new URL(u);
    return x.protocol === "https:" || x.protocol === "http:" ? x.href : "";
  } catch {
    return "";
  }
};
export const ytUrl = (s: Song) => safeUrl(s.url) || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.artist} ${s.title}`)}`;

/** 애플뮤직 가사 버튼 (말풍선 안 따옴표) */
function LyricsGlyph({ on }: { on: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 3.5c-5 0-9 3.3-9 7.5 0 2.4 1.3 4.5 3.4 5.9-.2 1.3-.8 2.6-1.8 3.6 2 0 3.8-.8 5-1.9.8.2 1.6.3 2.4.3 5 0 9-3.4 9-7.9s-4-7.5-9-7.5z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.6 12.6c0-1.5.8-2.6 2-3.1l.3.6c-.6.4-.9.9-.9 1.5h.9v2h-2.3v-1zm4.6 0c0-1.5.8-2.6 2-3.1l.3.6c-.6.4-.9.9-.9 1.5h.9v2h-2.3v-1z" fill={on ? "#000" : "currentColor"} opacity={on ? 0.75 : 1} />
    </svg>
  );
}

/** 아래에서 올라오는 메뉴 (곡 ··· / 에어플레이 / 다음 재생) */
function Sheet({ onClose, dark, children }: { onClose: () => void; dark?: boolean; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[60] flex flex-col justify-end fade" style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div className="sheet rounded-t-[14px] px-[16px] pt-[8px]" style={{ background: dark ? "#2c2c2e" : "#f2f2f7", color: dark ? "#fff" : "#000", paddingBottom: "calc(var(--sab) + 12px)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-[36px] h-[5px] rounded-full mb-[10px]" style={{ background: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)" }} />
        {children}
      </div>
    </div>
  );
}
function MenuRow({ icon, label, onClick, dark }: { icon: React.ReactNode; label: string; onClick: () => void; dark?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between h-[50px] px-[16px] text-[17px] text-left" style={{ borderBottom: `0.5px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}` }}>
      {label}
      <span style={{ color: dark ? "#fff" : RED }}>{icon}</span>
    </button>
  );
}
function SongMenu({ s, onClose, onPlay, onLyrics, dark }: { s: Song; onClose: () => void; onPlay?: () => void; onLyrics?: () => void; dark?: boolean }) {
  return (
    <Sheet onClose={onClose} dark={dark}>
      <div className="flex items-center gap-[12px] pb-[12px]">
        <Cover s={s} size={52} radius={6} />
        <div className="min-w-0">
          <div className="text-[16px] font-semibold truncate">{s.title || "제목 없음"}</div>
          <div className="text-[14px] opacity-60 truncate">{s.artist}</div>
        </div>
      </div>
      <div className="rounded-[12px] overflow-hidden" style={{ background: dark ? "#3a3a3c" : "#fff" }}>
        {onPlay && <MenuRow dark={dark} icon={<Play size={20} />} label="재생" onClick={() => (onPlay(), onClose())} />}
        {onLyrics && <MenuRow dark={dark} icon={<Quote size={20} />} label="가사 보기" onClick={() => (onLyrics(), onClose())} />}
        <a href={ytUrl(s)} target="_blank" rel="noopener noreferrer" onClick={onClose} className="w-full flex items-center justify-between h-[50px] px-[16px] text-[17px] no-underline" style={{ color: "inherit" }}>
          원래 곡 페이지에서 열기
          <ExternalLink size={19} style={{ color: dark ? "#fff" : RED }} />
        </a>
      </div>
    </Sheet>
  );
}

/** 가사 화면 (애플뮤직처럼): 싱크 가사면 지금 줄이 밝아지며 자동으로 내려감, 줄을 누르면 그 부분으로 이동 */
function Lyrics({ lines, t, onSeek, loading }: { lines: LyricLine[]; t: number; onSeek: (x: number) => void; loading: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const touched = useRef(0);
  const synced = lines.some((l) => l.t !== null);
  let cur = -1;
  if (synced) lines.forEach((l, i) => l.t !== null && l.t <= t + 0.15 && (cur = i));
  useEffect(() => {
    const el = box.current;
    if (!el || Date.now() - touched.current < 2500) return;
    const row = el.querySelector<HTMLElement>(`[data-i="${Math.max(0, cur)}"]`);
    if (row) el.scrollTo({ top: Math.max(0, row.offsetTop - el.clientHeight * 0.2), behavior: "smooth" });
  }, [cur]);
  const hold = () => (touched.current = Date.now());
  if (!lines.length) return <div className="flex-1 min-h-0 flex items-center justify-center text-[20px] font-bold text-white/50">{loading ? "가사 찾는 중…" : "가사 없음"}</div>;
  return (
    <div
      ref={box}
      onWheel={hold}
      onTouchMove={hold}
      className="flex-1 min-h-0 scroll no-scrollbar -mx-[30px] px-[30px] mt-[8px]"
      style={{ maskImage: "linear-gradient(transparent, #000 7%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 7%, #000 82%, transparent)" }}
    >
      <div className="relative pt-[24px] pb-[60%]">
        {synced && (lines[0]?.t ?? 0) > 3 && (
          <div data-i={-1} className="py-[14px] flex gap-[8px]" style={{ opacity: cur === -1 ? 1 : 0.3, transition: "opacity .4s" }}>
            {[0, 1, 2].map((k) => (
              <span key={k} className="w-[11px] h-[11px] rounded-full bg-white" style={{ animation: cur === -1 ? `eq 1.4s ease-in-out ${k * 0.2}s infinite` : "none", opacity: Math.min(1, Math.max(0.35, (t / Math.max(1, lines[0].t ?? 1)) * 3 - k)) }} />
            ))}
          </div>
        )}
        {lines.map((l, i) => {
          const on = !synced || i === cur;
          const past = synced && i < cur;
          return (
            <button
              key={i}
              data-i={i}
              disabled={l.t === null}
              onClick={() => l.t !== null && onSeek(l.t)}
              className="block w-full text-left text-[28px] leading-[35px] font-bold tracking-[-0.4px] py-[8px] origin-left"
              style={{
                color: on ? "#fff" : past ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.36)",
                filter: synced && !on ? `blur(${Math.min(1.6, Math.abs(i - cur) * 0.45)}px)` : "none",
                transform: synced && on ? "scale(1.015)" : "scale(1)",
                transition: "color .4s, filter .4s, transform .4s",
              }}
            >
              {l.text || <span className="tracking-[6px]">•••</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Player({ onClose, startLyrics }: { onClose: () => void; startLyrics: boolean }) {
  const m = useMusic();
  const s = m.song!;
  const [showLy, setShowLy] = useState(startLyrics);
  const [sheet, setSheet] = useState<null | "menu" | "air" | "queue">(null);
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  const f = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  // 재생 막대: 누르고 끌면 굵어지며 따라옴, 놓으면 그 위치로 (실제 애플뮤직처럼)
  const [drag, setDrag] = useState<number | null>(null);
  const [fav, setFav] = useState(false);
  const frac = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  };
  const shown = drag !== null ? drag * m.dur : m.t;
  const img = s.cover && s.cover.startsWith("data:image/") ? s.cover : "";
  const ly = showLy;
  const hint = m.tapHint && "소리가 안 나오면 재생 버튼을 한 번 더 눌러 주세요";
  const upNext = [...m.songs.map((x, i) => [x, i] as const).filter(([, i]) => i > m.idx), ...m.songs.map((x, i) => [x, i] as const).filter(([, i]) => i < m.idx)];
  return (
    <div className="absolute inset-0 z-40 text-white sheet" style={{ overflow: "clip" }}>
      {/* 배경: 앨범 사진을 크게 흐리게 (실제 애플뮤직처럼) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(${s.hue} 30% 32%), hsl(${(s.hue + 20) % 360} 25% 14%))` }} />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.6]" style={{ filter: "blur(60px) saturate(1.6)", opacity: 0.85 }} />}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <div className="relative h-full flex flex-col px-[30px]" style={{ paddingTop: "calc(var(--sat) + 4px)" }}>
        <button data-back onClick={onClose} className="self-center w-[60px] h-[16px] flex items-start justify-center mb-[11px] shrink-0" aria-label="닫기">
          <span className="w-[38px] h-[5px] rounded-full bg-white/40" />
        </button>
        {ly ? (
          <div className="flex items-center gap-[12px] shrink-0">
            <Cover s={s} size={60} radius={6} />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold truncate">{s.title}</div>
              <div className="text-[16px] text-white/60 truncate">{s.artist}</div>
            </div>
            <button onClick={() => setSheet("menu")} aria-label="더 보기" className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* 앨범 커버는 남는 공간 가운데에 (소리 막대가 빠져서 생긴 빈 공간을 고르게 나눔) */}
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div className="relative rounded-[12px]" style={{ transform: m.playing ? "scale(1)" : "scale(0.82)", transition: "transform .45s cubic-bezier(.3,1.4,.5,1)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
                <Cover s={s} size={330} radius={12} />
              </div>
            </div>
            {hint && <div className="text-center text-[13px] text-white/75 mt-[10px] shrink-0">{hint}</div>}
            <div className={`flex items-center ${hint ? "mt-[10px]" : "mt-[20px]"} shrink-0`}>
              <div className="flex-1 min-w-0">
                <div className="text-[21px] font-semibold truncate">{s.title}</div>
                <div className="text-[19px] text-white/60 truncate">{s.artist}</div>
                {m.preview && <div className="text-[12px] text-white/50 mt-[2px]">미리듣기 30초</div>}
              </div>
              <button onClick={() => setFav(!fav)} aria-label="즐겨찾기" className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center mr-[10px]">
                <Star size={16} fill={fav ? "#fff" : "none"} strokeWidth={2} />
              </button>
              <button onClick={() => setSheet("menu")} aria-label="더 보기" className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </>
        )}
        {ly && <Lyrics lines={m.lyrics} t={m.t} loading={m.lyricsLoading} onSeek={(x) => (m.seek(x), m.setPlay(true))} />}
        <div className={ly ? "mt-[6px] shrink-0" : "mt-[22px] shrink-0"}>
          <div
            className="py-[10px] -my-[10px] cursor-pointer touch-none"
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* 이미 끝난 터치 */
              }
              setDrag(frac(e));
            }}
            onPointerMove={(e) => drag !== null && setDrag(frac(e))}
            onPointerUp={(e) => {
              if (drag === null) return;
              m.seek(frac(e) * m.dur);
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <div className="rounded-full bg-white/20 overflow-hidden transition-[height] duration-200" style={{ height: drag !== null ? 11 : 7 }}>
              <div className="h-full" style={{ width: `${Math.min(100, (shown / m.dur) * 100)}%`, background: drag !== null ? "#fff" : "rgba(255,255,255,0.75)" }} />
            </div>
          </div>
          <div className="flex justify-between text-[12px] mt-[6px] tabular font-medium" style={{ color: drag !== null ? "#fff" : "rgba(255,255,255,0.5)" }}>
            <span>{f(shown)}</span>
            <span>-{f(Math.max(0, m.dur - shown))}</span>
          </div>
        </div>
        <div className={`flex items-center justify-between px-[24px] ${ly ? "mt-[14px]" : "mt-[24px]"} shrink-0`}>
          <button onClick={m.prev} aria-label="이전" className="active:opacity-50">
            <Rewind size={38} fill="#fff" strokeWidth={0} />
          </button>
          <button onClick={() => m.setPlay(!m.playing)} aria-label={m.playing ? "일시 정지" : "재생"} className="active:opacity-50">
            {m.playing ? <Pause size={50} fill="#fff" strokeWidth={0} /> : <Play size={50} fill="#fff" strokeWidth={0} />}
          </button>
          <button onClick={m.next} aria-label="다음" className="active:opacity-50">
            <FastForward size={38} fill="#fff" strokeWidth={0} />
          </button>
        </div>
        <div className={`flex justify-around items-center ${ly ? "mt-[18px]" : "mt-[40px]"} mb-[40px] text-white/65 shrink-0`}>
          <button onClick={() => setShowLy(!showLy)} aria-label="가사" className="w-[40px] h-[40px] flex items-center justify-center" style={ly ? { color: "#fff" } : undefined}>
            <LyricsGlyph on={ly} />
          </button>
          <button onClick={() => setSheet("air")} aria-label="에어플레이" className="w-[40px] h-[40px] flex items-center justify-center">
            <Airplay size={22} />
          </button>
          <button onClick={() => setSheet("queue")} aria-label="다음 재생" className="w-[40px] h-[40px] flex items-center justify-center">
            <ListMusic size={22} />
          </button>
        </div>
      </div>
      {sheet === "menu" && <SongMenu dark s={s} onClose={() => setSheet(null)} onLyrics={() => setShowLy(true)} />}
      {sheet === "air" && (
        <Sheet dark onClose={() => setSheet(null)}>
          <div className="text-center text-[15px] font-semibold pb-[12px]">AirPlay</div>
          <div className="rounded-[12px] overflow-hidden bg-[#3a3a3c]">
            <button onClick={() => setSheet(null)} className="w-full flex items-center gap-[12px] h-[54px] px-[16px] text-[17px] text-left">
              <Smartphone size={22} />
              <span className="flex-1">iPhone</span>
              <Check size={20} />
            </button>
          </div>
          <div className="text-center text-[13px] text-white/45 pt-[12px] pb-[4px]">주변에 다른 기기 없음</div>
        </Sheet>
      )}
      {sheet === "queue" && (
        <Sheet dark onClose={() => setSheet(null)}>
          <div className="flex items-center justify-between pb-[10px]">
            <span className="text-[19px] font-bold">다음 재생</span>
            <button onClick={() => setSheet(null)} aria-label="닫기" className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {upNext.length === 0 && <div className="text-white/45 text-[15px] py-6 text-center">다음 곡 없음</div>}
            {upNext.map(([x, i]) => (
              <button key={x.id} onClick={() => (m.playAt(i), setSheet(null))} className="w-full flex items-center gap-[12px] py-[8px] text-left active:opacity-60">
                <Cover s={x} size={44} radius={5} />
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] truncate">{x.title}</div>
                  <div className="text-[14px] text-white/55 truncate">{x.artist}</div>
                </div>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function SongRow({ x, i, onPlay, onMore, active }: { x: Song; i: number; onPlay: (i: number) => void; onMore: (s: Song, i: number) => void; active: boolean }) {
  return (
    <div className="w-full flex items-center pl-4 active:bg-black/5">
      <button onClick={() => onPlay(i)} className="flex items-center gap-[12px] flex-1 min-w-0 text-left">
        <Cover s={x} size={48} radius={5} />
        <div className="flex-1 min-w-0 hair-b py-[13px]">
          <div className="text-[16px] truncate" style={{ color: active ? RED : "#000" }}>
            {x.title}
          </div>
          <div className="text-[14px] text-black/50 truncate">{x.artist}</div>
        </div>
      </button>
      <button onClick={() => onMore(x, i)} aria-label="더 보기" className="self-stretch pr-4 pl-3 flex items-center hair-b">
        <MoreHorizontal size={18} className="text-black/60" />
      </button>
    </div>
  );
}

const LIB_TITLE = { songs: "노래", albums: "앨범", artists: "아티스트" } as const;

export default function Music() {
  useStatusBar(true);
  const m = useMusic();
  const songs = m.songs;
  const [tab, setTab] = useState("home");
  const [full, setFull] = useState<null | "cover" | "lyrics">(null);
  const [menu, setMenu] = useState<null | { s: Song; i: number }>(null);
  const [libView, setLibView] = useState<null | keyof typeof LIB_TITLE>(null);
  const [q, setQ] = useState("");
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const s = m.song;
  const playAt = (i: number) => {
    m.playAt(i);
    setFull("cover");
  };
  const row = (x: Song, i: number) => <SongRow key={x.id} x={x} i={i} active={i === m.idx && m.playing} onPlay={playAt} onMore={(s2, i2) => setMenu({ s: s2, i: i2 })} />;
  const titles: Record<string, string> = { home: "홈", browse: "둘러보기", radio: "라디오", lib: "보관함", search: "검색" };
  const all = songs.map((x, i) => [x, i] as const);
  const found = q.trim() ? all.filter(([x]) => `${x.title} ${x.artist} ${x.album} ${x.lyrics ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const albums = [...new Map(all.map(([x, i]) => [x.album || x.title, [x, i] as const])).values()];
  const artists = [...new Map(all.map(([x, i]) => [x.artist || "알 수 없는 아티스트", [x, i] as const])).entries()];
  const title = libView ? LIB_TITLE[libView] : titles[tab];
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title={title} scrolled={scrolled} tint={RED} back={libView ? "보관함" : undefined} onBack={libView ? () => setLibView(null) : undefined} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 170 }}>
        <LargeTitle>{title}</LargeTitle>
        {libView ? (
          <>
            {libView === "songs" && all.map(([x, i]) => row(x, i))}
            {libView === "albums" && (
              <div className="grid grid-cols-2 gap-x-[14px] gap-y-[16px] px-4">
                {albums.map(([x, i]) => (
                  <button key={x.id} onClick={() => playAt(i)} className="text-left min-w-0">
                    <Cover s={x} size="100%" />
                    <div className="text-[14px] mt-[6px] truncate">{x.album || x.title}</div>
                    <div className="text-[13px] text-black/50 truncate">{x.artist}</div>
                  </button>
                ))}
              </div>
            )}
            {libView === "artists" &&
              artists.map(([name, [x, i]]) => (
                <button key={name} onClick={() => playAt(i)} className="w-full flex items-center gap-[12px] pl-4 text-left active:bg-black/5">
                  <Cover s={x} size={48} radius={24} />
                  <span className="flex-1 min-w-0 hair-b py-[14px] text-[17px] flex items-center pr-4">
                    <span className="flex-1 truncate">{name}</span>
                    <ChevronRight size={18} className="text-black/25" />
                  </span>
                </button>
              ))}
          </>
        ) : (
          <>
            {tab === "home" && (
              <>
                <div className="px-4 pt-[6px] pb-[10px] text-[22px] font-bold flex items-center">최근 재생한 항목</div>
                <div className="flex gap-[12px] px-4 overflow-x-auto no-scrollbar pb-2">
                  {songs.map((x, i) => (
                    <button key={x.id} onClick={() => playAt(i)} className="text-left shrink-0 w-[150px]">
                      <Cover s={x} size={150} />
                      <div className="text-[13px] mt-[6px] truncate">{x.album || x.title}</div>
                      <div className="text-[13px] text-black/50 truncate">{x.artist}</div>
                    </button>
                  ))}
                </div>
                <div className="px-4 pt-[22px] pb-[8px] text-[22px] font-bold">자주 듣는 노래</div>
                {all.map(([x, i]) => row(x, i))}
              </>
            )}
            {tab === "browse" && (
              <>
                <div className="px-4 pt-[6px] pb-[10px] text-[22px] font-bold">최신 발매</div>
                <div className="grid grid-cols-2 gap-x-[14px] gap-y-[16px] px-4">
                  {all.map(([x, i]) => (
                    <button key={x.id} onClick={() => playAt(i)} className="text-left min-w-0">
                      <Cover s={x} size="100%" />
                      <div className="text-[14px] mt-[6px] truncate">{x.title}</div>
                      <div className="text-[13px] text-black/50 truncate">{x.artist}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === "radio" && (
              <div className="px-4">
                <button onClick={() => songs.length && playAt(Math.floor(Math.random() * songs.length))} className="w-full h-[200px] rounded-[14px] p-[16px] text-left text-white flex flex-col justify-end active:opacity-80" style={{ background: `linear-gradient(140deg, ${RED}, #8a1530)` }}>
                  <span className="text-[13px] font-semibold opacity-80">나만의 스테이션</span>
                  <span className="text-[24px] font-bold leading-[28px]">최태식의 스테이션</span>
                  <span className="text-[14px] opacity-80 mt-[4px] flex items-center gap-[6px]">
                    <Play size={14} fill="#fff" strokeWidth={0} /> 눌러서 재생 (무작위)
                  </span>
                </button>
              </div>
            )}
            {tab === "lib" && (
              <>
                {(
                  [
                    ["songs", <Music2 key="s" size={22} />],
                    ["albums", <Disc3 key="a" size={22} />],
                    ["artists", <Mic2 key="r" size={22} />],
                  ] as const
                ).map(([k, icon]) => (
                  <button key={k} onClick={() => setLibView(k)} className="w-full flex items-center gap-[14px] pl-4 text-left active:bg-black/5">
                    <span style={{ color: RED }}>{icon}</span>
                    <span className="flex-1 hair-b py-[13px] text-[20px] flex items-center pr-4">
                      <span className="flex-1">{LIB_TITLE[k]}</span>
                      <ChevronRight size={18} className="text-black/25" />
                    </span>
                  </button>
                ))}
                <div className="px-4 pt-[24px] pb-[8px] text-[22px] font-bold flex items-center gap-[6px]">
                  <ListOrdered size={20} /> 최근 추가된 항목
                </div>
                {all
                  .slice()
                  .reverse()
                  .map(([x, i]) => row(x, i))}
              </>
            )}
            {tab === "search" && (
              <>
                <div className="px-4 mb-3">
                  <label className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
                    <Search size={16} className="shrink-0" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="아티스트, 노래, 가사 등" className="flex-1 min-w-0 bg-transparent outline-none text-black placeholder:text-[#8e8e93]" />
                    {q && (
                      <button onClick={() => setQ("")} aria-label="지우기" className="w-[18px] h-[18px] rounded-full bg-[#8e8e93] text-white flex items-center justify-center shrink-0">
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </label>
                </div>
                {q.trim() ? (
                  found.length ? (
                    found.map(([x, i]) => row(x, i))
                  ) : (
                    <div className="text-center text-black/40 pt-[60px] text-[15px]">'{q}'에 대한 결과 없음</div>
                  )
                ) : (
                  <div className="text-center text-black/35 pt-[60px] text-[15px]">보관함에서 찾기</div>
                )}
              </>
            )}
          </>
        )}
      </div>
      {/* 미니 플레이어 */}
      {s && (
        <div className="absolute left-[8px] right-[8px] z-20 h-[56px] rounded-[14px] flex items-center gap-[10px] pl-[8px] pr-[14px] blur-bar" style={{ bottom: "calc(var(--sab) + 58px)", background: "rgba(245,245,245,0.92)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setFull("cover")} className="flex items-center gap-[10px] flex-1 min-w-0 text-left">
            <Cover s={s} size={40} radius={6} />
            <span className="text-[15px] truncate">{m.started ? s.title : "재생 안 함"}</span>
          </button>
          <button onClick={() => m.setPlay(!m.playing)} aria-label={m.playing ? "일시 정지" : "재생"}>
            {m.playing ? <Pause size={24} fill="#000" strokeWidth={0} /> : <Play size={24} fill="#000" strokeWidth={0} />}
          </button>
          <button onClick={m.next} aria-label="다음">
            <FastForward size={26} fill="#000" strokeWidth={0} />
          </button>
        </div>
      )}
      <TabBar
        active={tab}
        onChange={(v) => {
          setTab(v);
          setLibView(null);
        }}
        tint={RED}
        items={[
          { id: "home", label: "홈", icon: <House size={24} fill={tab === "home" ? RED : "none"} strokeWidth={1.8} /> },
          { id: "browse", label: "둘러보기", icon: <LayoutGrid size={24} strokeWidth={1.8} /> },
          { id: "radio", label: "라디오", icon: <Radio size={24} strokeWidth={1.8} /> },
          { id: "lib", label: "보관함", icon: <Library size={24} strokeWidth={1.8} /> },
          { id: "search", label: "검색", icon: <Search size={24} strokeWidth={2} /> },
        ]}
      />
      {menu && <SongMenu s={menu.s} onClose={() => setMenu(null)} onPlay={() => playAt(menu.i)} onLyrics={() => (m.playAt(menu.i), setFull("lyrics"))} />}
      {full && s && <Player onClose={() => setFull(null)} startLyrics={full === "lyrics"} />}
    </div>
  );
}

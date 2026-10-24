/* 음악 (Apple Music 스타일) — 재생은 연출, 곡은 유튜브/스포티파이로 링크 아웃 */
import { useEffect, useState } from "react";
import { Play, Pause, FastForward, Rewind, House, LayoutGrid, Radio, Library, Search, MoreHorizontal, Quote, Airplay, ListMusic, Volume1, Volume2, ExternalLink } from "lucide-react";
import { useData, type Song } from "../store";
import { LargeTitle, NavBar, TabBar, useScrolled, usePhoneCtx, useStatusBar } from "../ui";

const RED = "#FA2D48";
export function Cover({ s, size, radius = 8 }: { s: Song; size: number | string; radius?: number }) {
  const h = s.hue;
  return (
    <div
      className="shrink-0 relative overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `radial-gradient(80% 60% at 30% 25%, hsl(${h} 55% 62% / .9), transparent 60%), radial-gradient(70% 70% at 80% 85%, hsl(${(h + 40) % 360} 45% 30%), transparent 70%), linear-gradient(160deg, hsl(${h} 35% 30%), hsl(${(h + 20) % 360} 30% 12%))`,
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08)",
      }}
    >
      <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(${h}deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 6px)` }} />
    </div>
  );
}
export const ytUrl = (s: Song) => s.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.artist} ${s.title}`)}`;
const spUrl = (s: Song) => `https://open.spotify.com/search/${encodeURIComponent(`${s.artist} ${s.title}`)}`;

function Player({ s, playing, setPlay, onClose, next, prev }: { s: Song; playing: boolean; setPlay: (b: boolean) => void; onClose: () => void; next: () => void; prev: () => void }) {
  const [t, setT] = useState(0);
  const dur = 180 + (s.title.length * 7) % 90;
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  useEffect(() => setT(0), [s.id]);
  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setT((x) => (x + 1 >= dur ? (next(), 0) : x + 1)), 1000);
    return () => clearInterval(i);
  }, [playing, dur, next]);
  const f = (x: number) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;
  return (
    <div className="absolute inset-0 z-40 text-white sheet overflow-hidden">
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(${s.hue} 30% 32%), hsl(${(s.hue + 20) % 360} 25% 14%))` }} />
      <div className="relative h-full flex flex-col px-[30px]" style={{ paddingTop: "calc(var(--sat) + 4px)" }}>
        <button onClick={onClose} className="self-center w-[38px] h-[5px] rounded-full bg-white/40 mb-[26px]" aria-label="닫기" />
        <div className="flex justify-center">
          <div style={{ transform: playing ? "scale(1)" : "scale(0.82)", transition: "transform .45s cubic-bezier(.3,1.4,.5,1)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", borderRadius: 12 }}>
            <Cover s={s} size={330} radius={12} />
          </div>
        </div>
        <div className="flex items-center mt-[34px]">
          <div className="flex-1 min-w-0">
            <div className="text-[21px] font-semibold truncate">{s.title}</div>
            <div className="text-[19px] text-white/60 truncate">{s.artist}</div>
          </div>
          <span className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
            <MoreHorizontal size={18} />
          </span>
        </div>
        <div className="mt-[22px]">
          <div className="h-[6px] rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white/80" style={{ width: `${(t / dur) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[12px] text-white/50 mt-[6px] tabular font-medium">
            <span>{f(t)}</span>
            <span>-{f(dur - t)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-[24px] mt-[14px]">
          <button onClick={prev}>
            <Rewind size={38} fill="#fff" strokeWidth={0} />
          </button>
          <button onClick={() => setPlay(!playing)}>{playing ? <Pause size={50} fill="#fff" strokeWidth={0} /> : <Play size={50} fill="#fff" strokeWidth={0} />}</button>
          <button onClick={next}>
            <FastForward size={38} fill="#fff" strokeWidth={0} />
          </button>
        </div>
        <div className="flex items-center gap-[10px] mt-[30px] text-white/60">
          <Volume1 size={16} />
          <div className="flex-1 h-[6px] rounded-full bg-white/20">
            <div className="h-full w-[62%] rounded-full bg-white/80" />
          </div>
          <Volume2 size={16} />
        </div>
        {/* 링크 아웃 */}
        <div className="grid grid-cols-2 gap-[10px] mt-[24px]">
          <a href={ytUrl(s)} target="_blank" rel="noopener noreferrer" className="h-[42px] rounded-[12px] bg-white/15 flex items-center justify-center gap-[6px] text-[14px] font-semibold no-underline text-white">
            YouTube에서 듣기 <ExternalLink size={13} />
          </a>
          <a href={spUrl(s)} target="_blank" rel="noopener noreferrer" className="h-[42px] rounded-[12px] bg-white/15 flex items-center justify-center gap-[6px] text-[14px] font-semibold no-underline text-white">
            Spotify에서 열기 <ExternalLink size={13} />
          </a>
        </div>
        <div className="flex justify-around mt-auto mb-[46px] text-white/60">
          <Quote size={22} />
          <Airplay size={22} />
          <ListMusic size={22} />
        </div>
      </div>
    </div>
  );
}

export default function Music() {
  useStatusBar(true);
  const d = useData();
  const { setPlaying, playing: nowP } = usePhoneCtx() as ReturnType<typeof usePhoneCtx> & { setPlaying: (s: Song | null) => void; playing: Song | null };
  const [tab, setTab] = useState("home");
  const [idx, setIdx] = useState(() => Math.max(0, d.songs.findIndex((s) => s.id === nowP?.id)));
  const [playing, setPlay] = useState(!!nowP);
  const [full, setFull] = useState(false);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const s = d.songs[idx] ?? d.songs[0];
  useEffect(() => {
    setPlaying(playing && s ? s : null);
  }, [playing, s, setPlaying]);
  const playAt = (i: number) => {
    setIdx(i);
    setPlay(true);
    setFull(true);
  };
  const next = () => setIdx((i) => (i + 1) % d.songs.length);
  const prev = () => setIdx((i) => (i - 1 + d.songs.length) % d.songs.length);
  const titles: Record<string, string> = { home: "홈", browse: "둘러보기", radio: "라디오", lib: "보관함", search: "검색" };
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title={titles[tab]} scrolled={scrolled} tint={RED} right={<span className="w-[30px] h-[30px] rounded-full bg-[#e5e5ea] flex items-center justify-center text-[13px] font-semibold text-black/60">T</span>} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 170 }}>
        <LargeTitle>{titles[tab]}</LargeTitle>
        {tab === "home" || tab === "lib" ? (
          <>
            <div className="px-4 pt-[6px] pb-[10px] text-[22px] font-bold flex items-center">최근 재생한 항목</div>
            <div className="flex gap-[12px] px-4 overflow-x-auto no-scrollbar pb-2">
              {d.songs.map((x, i) => (
                <button key={x.id} onClick={() => playAt(i)} className="text-left shrink-0 w-[150px]">
                  <Cover s={x} size={150} />
                  <div className="text-[13px] mt-[6px] truncate">{x.album}</div>
                  <div className="text-[13px] text-black/50 truncate">{x.artist}</div>
                </button>
              ))}
            </div>
            <div className="px-4 pt-[22px] pb-[8px] text-[22px] font-bold">자주 듣는 노래</div>
            {d.songs.map((x, i) => (
              <button key={x.id} onClick={() => playAt(i)} className="w-full flex items-center gap-[12px] pl-4 text-left active:bg-black/5">
                <Cover s={x} size={48} radius={5} />
                <div className="flex-1 min-w-0 hair-b py-[10px] pr-4 flex items-center">
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] truncate" style={{ color: i === idx && playing ? RED : "#000" }}>
                      {x.title}
                    </div>
                    <div className="text-[14px] text-black/50 truncate">{x.artist}</div>
                  </div>
                  <MoreHorizontal size={18} className="text-black/60" />
                </div>
              </button>
            ))}
          </>
        ) : (
          <div className="px-4">
            {tab === "search" && (
              <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px] mb-4">
                <Search size={16} /> 아티스트, 노래, 가사 등
              </div>
            )}
            <div className="grid grid-cols-2 gap-[10px]">
              {["새벽", "드라이브", "집중", "R&B", "인디", "80년대"].map((g, i) => (
                <div key={g} className="h-[100px] rounded-[10px] p-[10px] text-white text-[16px] font-bold flex items-end" style={{ background: `linear-gradient(140deg,hsl(${i * 55} 45% 45%),hsl(${i * 55 + 30} 40% 25%))` }}>
                  {g}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* 미니 플레이어 */}
      {s && (
        <div className="absolute left-[8px] right-[8px] z-20 h-[56px] rounded-[14px] flex items-center gap-[10px] pl-[8px] pr-[14px] blur-bar" style={{ bottom: "calc(var(--sab) + 58px)", background: "rgba(245,245,245,0.92)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
          <button onClick={() => setFull(true)} className="flex items-center gap-[10px] flex-1 min-w-0 text-left">
            <Cover s={s} size={40} radius={6} />
            <span className="text-[15px] truncate">{playing ? s.title : "재생 안 함"}</span>
          </button>
          <button onClick={() => setPlay(!playing)}>{playing ? <Pause size={24} fill="#000" strokeWidth={0} /> : <Play size={24} fill="#000" strokeWidth={0} />}</button>
          <button onClick={next}>
            <FastForward size={26} fill="#000" strokeWidth={0} />
          </button>
        </div>
      )}
      <TabBar
        active={tab}
        onChange={setTab}
        tint={RED}
        items={[
          { id: "home", label: "홈", icon: <House size={24} fill={tab === "home" ? RED : "none"} strokeWidth={1.8} /> },
          { id: "browse", label: "둘러보기", icon: <LayoutGrid size={24} strokeWidth={1.8} /> },
          { id: "radio", label: "라디오", icon: <Radio size={24} strokeWidth={1.8} /> },
          { id: "lib", label: "보관함", icon: <Library size={24} strokeWidth={1.8} /> },
          { id: "search", label: "검색", icon: <Search size={24} strokeWidth={2} /> },
        ]}
      />
      {full && s && <Player s={s} playing={playing} setPlay={setPlay} onClose={() => setFull(false)} next={next} prev={prev} />}
    </div>
  );
}

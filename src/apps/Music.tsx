/* 음악 (Apple Music 스타일) — 유튜브 링크가 있는 곡은 실제로 소리가 나고, 가사는 실제 재생 시간에 맞춰 내려감 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, FastForward, Rewind, House, LayoutGrid, Radio, Library, Search, MoreHorizontal, Airplay, ListMusic, Volume1, Volume2, ExternalLink } from "lucide-react";
import { useData, type Song } from "../store";
import { parseLyrics, songYtId, type LyricLine } from "../songMeta";
import { LargeTitle, NavBar, TabBar, useScrolled, usePhoneCtx, useStatusBar } from "../ui";

const RED = "#FA2D48";
export function Cover({ s, size, radius = 8 }: { s: Song; size: number | string; radius?: number }) {
  const h = s.hue;
  // 앨범 사진: 에디터에서 올린 사진이 있으면 그걸로
  const img = s.cover && s.cover.startsWith("data:image/") ? s.cover : "";
  if (img) return <img src={img} alt="" className="shrink-0 object-cover" style={{ width: size, height: size, borderRadius: radius, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08)" }} />;
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
const spUrl = (s: Song) => `https://open.spotify.com/search/${encodeURIComponent(`${s.artist} ${s.title}`)}`;

/** 애플뮤직 가사 버튼 (말풍선 안 따옴표) */
function LyricsGlyph({ on }: { on: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 3.5c-5 0-9 3.3-9 7.5 0 2.4 1.3 4.5 3.4 5.9-.2 1.3-.8 2.6-1.8 3.6 2 0 3.8-.8 5-1.9.8.2 1.6.3 2.4.3 5 0 9-3.4 9-7.9s-4-7.5-9-7.5z" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.6 12.6c0-1.5.8-2.6 2-3.1l.3.6c-.6.4-.9.9-.9 1.5h.9v2h-2.3v-1zm4.6 0c0-1.5.8-2.6 2-3.1l.3.6c-.6.4-.9.9-.9 1.5h.9v2h-2.3v-1z" fill={on ? "#000" : "currentColor"} opacity={on ? 0.75 : 1} />
    </svg>
  );
}

/* ───────── 유튜브 재생기 (화면에는 앨범 자리에 영상으로 보임) ───────── */
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  destroy(): void;
};
type YTNs = { Player: new (el: HTMLElement, o: object) => YTPlayer };
let ytApi: Promise<YTNs> | null = null;
function loadYT(): Promise<YTNs> {
  if (ytApi) return ytApi;
  ytApi = new Promise((res) => {
    const w = window as unknown as { YT?: YTNs; onYouTubeIframeAPIReady?: () => void };
    if (w.YT?.Player) return res(w.YT);
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      res(w.YT!);
    };
    const sc = document.createElement("script");
    sc.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(sc);
  });
  return ytApi;
}

/** 가사 화면 (애플뮤직처럼): 싱크 가사면 지금 줄이 밝아지며 자동으로 내려감, 줄을 누르면 그 부분으로 이동 */
function Lyrics({ lines, t, onSeek }: { lines: LyricLine[]; t: number; onSeek: (x: number) => void }) {
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
  return (
    <div
      ref={box}
      onWheel={hold}
      onTouchMove={hold}
      className="flex-1 min-h-0 scroll no-scrollbar -mx-[30px] px-[30px] mt-[8px]"
      style={{ maskImage: "linear-gradient(transparent, #000 7%, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(transparent, #000 7%, #000 82%, transparent)" }}
    >
      <div className="relative pt-[24px] pb-[60%]">
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

type PlayerProps = {
  s: Song;
  playing: boolean;
  setPlay: (b: boolean) => void;
  onClose: () => void;
  next: () => void;
  prev: () => void;
  t: number;
  dur: number;
  seek: (x: number) => void;
  coverRef: React.RefObject<HTMLDivElement>;
  tapHint: boolean;
};
function Player({ s, playing, setPlay, onClose, next, prev, t, dur, seek, coverRef, tapHint }: PlayerProps) {
  const lines = useMemo(() => parseLyrics(s.lyrics), [s.lyrics]);
  const [showLy, setShowLy] = useState(false);
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  const f = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  const seekBar = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur);
  };
  const img = s.cover && s.cover.startsWith("data:image/") ? s.cover : "";
  const ly = showLy && lines.length > 0;
  return (
    <div className="absolute inset-0 z-40 text-white sheet" style={{ overflow: "clip" }}>
      {/* 배경: 앨범 사진을 크게 흐리게 (실제 애플뮤직처럼) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(${s.hue} 30% 32%), hsl(${(s.hue + 20) % 360} 25% 14%))` }} />
        {img && <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover scale-[1.6]" style={{ filter: "blur(60px) saturate(1.6)", opacity: 0.85 }} />}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <div className="relative h-full flex flex-col px-[30px]" style={{ paddingTop: "calc(var(--sat) + 4px)" }}>
        <button data-back onClick={onClose} className="self-center w-[38px] h-[5px] rounded-full bg-white/40 mb-[22px] shrink-0" aria-label="닫기" />
        {ly ? (
          <div className="flex items-center gap-[12px] shrink-0">
            <div ref={coverRef} className="shrink-0">
              <Cover s={s} size={60} radius={6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold truncate">{s.title}</div>
              <div className="text-[16px] text-white/60 truncate">{s.artist}</div>
            </div>
            <span className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
              <MoreHorizontal size={18} />
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-center shrink-0">
              <div ref={coverRef} className="relative" style={{ transform: playing ? "scale(1)" : "scale(0.82)", transition: "transform .45s cubic-bezier(.3,1.4,.5,1)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", borderRadius: 12 }}>
                <Cover s={s} size={330} radius={12} />
              </div>
            </div>
            {tapHint && <div className="text-center text-[13px] text-white/70 mt-[10px] shrink-0">영상을 한 번 눌러 주세요 (휴대폰은 처음 한 번 필요)</div>}
            <div className={`flex items-center ${tapHint ? "mt-[14px]" : "mt-[34px]"} shrink-0`}>
              <div className="flex-1 min-w-0">
                <div className="text-[21px] font-semibold truncate">{s.title}</div>
                <div className="text-[19px] text-white/60 truncate">{s.artist}</div>
              </div>
              <span className="w-[30px] h-[30px] rounded-full bg-white/15 flex items-center justify-center">
                <MoreHorizontal size={18} />
              </span>
            </div>
          </>
        )}
        {ly && <Lyrics lines={lines} t={t} onSeek={(x) => (seek(x), setPlay(true))} />}
        <div className={ly ? "mt-[6px] shrink-0" : "mt-[22px] shrink-0"}>
          <div className="py-[8px] -my-[8px] cursor-pointer" onPointerDown={seekBar}>
            <div className="h-[6px] rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white/80" style={{ width: `${Math.min(100, (t / dur) * 100)}%` }} />
            </div>
          </div>
          <div className="flex justify-between text-[12px] text-white/50 mt-[6px] tabular font-medium">
            <span>{f(t)}</span>
            <span>-{f(Math.max(0, dur - t))}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-[24px] mt-[14px] shrink-0">
          <button onClick={prev} aria-label="이전">
            <Rewind size={38} fill="#fff" strokeWidth={0} />
          </button>
          <button onClick={() => setPlay(!playing)} aria-label={playing ? "일시 정지" : "재생"}>
            {playing ? <Pause size={50} fill="#fff" strokeWidth={0} /> : <Play size={50} fill="#fff" strokeWidth={0} />}
          </button>
          <button onClick={next} aria-label="다음">
            <FastForward size={38} fill="#fff" strokeWidth={0} />
          </button>
        </div>
        {!ly && (
          <>
            <div className="flex items-center gap-[10px] mt-[30px] text-white/60 shrink-0">
              <Volume1 size={16} />
              <div className="flex-1 h-[6px] rounded-full bg-white/20">
                <div className="h-full w-[62%] rounded-full bg-white/80" />
              </div>
              <Volume2 size={16} />
            </div>
            {/* 링크 아웃 */}
            <div className="grid grid-cols-2 gap-[10px] mt-[24px] shrink-0">
              <a href={ytUrl(s)} target="_blank" rel="noopener noreferrer" className="h-[42px] rounded-[12px] bg-white/15 flex items-center justify-center gap-[6px] text-[14px] font-semibold no-underline text-white">
                YouTube에서 듣기 <ExternalLink size={13} />
              </a>
              <a href={spUrl(s)} target="_blank" rel="noopener noreferrer" className="h-[42px] rounded-[12px] bg-white/15 flex items-center justify-center gap-[6px] text-[14px] font-semibold no-underline text-white">
                Spotify에서 열기 <ExternalLink size={13} />
              </a>
            </div>
          </>
        )}
        <div className={`flex justify-around items-center ${ly ? "mt-[18px]" : "mt-auto"} mb-[40px] text-white/65 shrink-0`}>
          {/* 가사 버튼: 가사가 있을 때만 */}
          <button onClick={() => setShowLy(!showLy)} disabled={!lines.length} aria-label="가사" className="w-[40px] h-[40px] flex items-center justify-center disabled:opacity-30" style={ly ? { color: "#fff" } : undefined}>
            <LyricsGlyph on={ly} />
          </button>
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
  const [t, setT] = useState(0);
  const [ytDur, setYtDur] = useState(0);
  const [tapHint, setTapHint] = useState(false);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const s = d.songs[idx] ?? d.songs[0];
  const vid = s ? songYtId(s.url) : "";
  const lines = useMemo(() => parseLyrics(s?.lyrics), [s?.lyrics]);
  const lastT = lines.reduce((m, l) => Math.max(m, l.t ?? 0), 0);
  const dur = (vid && ytDur) || s?.dur || (lastT ? Math.ceil(lastT + 20) : 180 + (((s?.title.length ?? 0) * 7) % 90));

  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const loaded = useRef("");
  const [ytReady, setYtReady] = useState(false);

  useEffect(() => {
    setPlaying(playing && s ? s : null);
  }, [playing, s, setPlaying]);
  const next = () => setIdx((i) => (i + 1) % d.songs.length);
  const prev = () => (t > 3 ? seek(0) : setIdx((i) => (i - 1 + d.songs.length) % d.songs.length));
  const playAt = (i: number) => {
    setIdx(i);
    setPlay(true);
    setFull(true);
  };
  const seek = (x: number) => {
    setT(x);
    if (vid && yt.current) yt.current.seekTo(x, true);
  };
  useEffect(() => {
    setT(0);
    setYtDur(0);
    setTapHint(false);
  }, [s?.id]);

  // 유튜브 재생기 만들기 (유튜브 곡이 처음 필요할 때 한 번)
  useEffect(() => {
    if (!vid || yt.current || !hostRef.current) return;
    let dead = false;
    loadYT().then((YT) => {
      if (dead || !hostRef.current) return;
      const el = document.createElement("div");
      hostRef.current.appendChild(el);
      const p = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onReady: () => {
            if (dead) return;
            yt.current = p;
            setYtReady(true);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) setTapHint(false);
          },
        },
      });
    });
    return () => {
      dead = true;
    };
  }, [vid]);
  useEffect(
    () => () => {
      try {
        yt.current?.destroy();
      } catch {
        /* 이미 사라짐 */
      }
      yt.current = null;
    },
    [],
  );
  // 곡 바꾸기 · 재생/정지
  useEffect(() => {
    const p = yt.current;
    if (!ytReady || !p) return;
    if (!vid) {
      p.pauseVideo();
      loaded.current = "";
      return;
    }
    if (loaded.current !== vid) {
      loaded.current = vid;
      if (playing) p.loadVideoById(vid);
      else p.cueVideoById(vid);
    } else if (playing) p.playVideo();
    else p.pauseVideo();
  }, [ytReady, vid, playing]);
  // 시간 흐름: 유튜브면 실제 재생 시간, 아니면 화면 연출
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let stuck = 0;
    const i = setInterval(() => {
      const n = performance.now();
      const dt = (n - last) / 1000;
      last = n;
      const p = yt.current;
      if (vid && p && ytReady && loaded.current === vid) {
        const st = p.getPlayerState();
        if (st === 0) return next();
        const ct = p.getCurrentTime() || 0;
        const du = p.getDuration() || 0;
        if (du) setYtDur(du);
        setT(ct);
        // 휴대폰에서 자동 재생이 막히면: 영상을 한 번 눌러 달라고 안내
        stuck = st === 1 || st === 3 ? 0 : stuck + dt;
        if (stuck > 2.5) setTapHint(true);
        return;
      }
      if (vid) return; // 재생기 준비 중
      setT((x) => (x + dt >= dur ? (next(), 0) : x + dt));
    }, 150);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, dur, vid, ytReady]);

  // 영상 위치: 큰 화면이면 앨범 자리, 아니면 미니 플레이어 앨범 자리에 겹쳐 보이게
  useEffect(() => {
    let r = 0;
    const loop = () => {
      const h = hostRef.current;
      const root = rootRef.current;
      const tgt = full ? coverRef.current : miniRef.current;
      if (h && root) {
        if (!vid || !tgt) {
          Object.assign(h.style, { opacity: "0", width: "2px", height: "2px", left: "0px", top: "0px", pointerEvents: "none" });
        } else {
          const R = root.getBoundingClientRect();
          const T = tgt.getBoundingClientRect();
          const k = root.offsetWidth / (R.width || 1);
          const w = T.width * k;
          const hh = T.height * k;
          Object.assign(h.style, {
            opacity: "1",
            left: `${(T.left - R.left) * k}px`,
            top: `${(T.top - R.top) * k}px`,
            width: `${w}px`,
            height: `${hh}px`,
            borderRadius: `${w > 200 ? 12 : 6}px`,
            pointerEvents: tapHint && full ? "auto" : "none",
          });
          const f = h.firstElementChild as HTMLElement | null;
          if (f) Object.assign(f.style, { flex: "none", width: `${Math.max(w, (hh * 16) / 9)}px`, height: `${Math.max(hh, (w * 9) / 16)}px` });
        }
      }
      r = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(r);
  }, [full, vid, tapHint]);

  const titles: Record<string, string> = { home: "홈", browse: "둘러보기", radio: "라디오", lib: "보관함", search: "검색" };
  return (
    <div ref={rootRef} className="absolute inset-0 bg-white">
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
            <div ref={miniRef} className="shrink-0">
              <Cover s={s} size={40} radius={6} />
            </div>
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
      {full && s && <Player s={s} playing={playing} setPlay={setPlay} onClose={() => setFull(false)} next={next} prev={prev} t={t} dur={dur} seek={seek} coverRef={coverRef} tapHint={tapHint} />}
      {/* 유튜브 영상 (소리 재생). 앨범 사진 자리에 겹쳐서 보임 */}
      <div ref={hostRef} className="absolute z-[45] overflow-hidden bg-black flex items-center justify-center" style={{ opacity: 0, width: 2, height: 2, pointerEvents: "none" }} />
    </div>
  );
}

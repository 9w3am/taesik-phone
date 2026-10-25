/* 폰 전체 음악 재생기 — 음악 앱을 나가도 · 잠가도 계속 재생 (실제 아이폰처럼)
   소리: 유튜브 링크(곡 링크 또는 '소리용 유튜브 링크')면 전곡 / 아니면 애플 30초 미리듣기 / 둘 다 없으면 화면 연출만
   화면에는 항상 앨범 커버가 보이고, 유튜브 재생기는 뒤에 숨어서 소리만 냄 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useData, type Song } from "./store";
import { fetchLyrics, parseLyrics, songYtId, type LyricLine } from "./songMeta";

type Kind = "yt" | "pv" | "none";
/** 소리 낼 유튜브 영상 ID (소리용 링크 우선, 없으면 곡 링크가 유튜브일 때) */
export const soundYtId = (s?: Song | null) => (s ? songYtId(s.yt || "") || songYtId(s.url) : "");
export const songKind = (s?: Song | null): Kind => (!s ? "none" : soundYtId(s) ? "yt" : safePreview(s.preview) ? "pv" : "none");
/** 보안: 애플 미리듣기 주소만 허용 */
export const safePreview = (u?: string) => {
  try {
    const x = new URL(u || "");
    return x.protocol === "https:" && /(^|\.)apple\.com$/.test(x.hostname) ? x.href : "";
  } catch {
    return "";
  }
};

/* ───────── 유튜브 재생기 불러오기 ───────── */
export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  setVolume(v: number): void;
};
type YTNs = { Player: new (el: HTMLElement, o: object) => YTPlayer };
let ytApi: Promise<YTNs> | null = null;
export function loadYT(): Promise<YTNs> {
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

export type MusicApi = {
  songs: Song[];
  song: Song | null;
  idx: number;
  playing: boolean;
  /** 이번에 한 번이라도 재생했는지 (잠금화면 카드 표시용) */
  started: boolean;
  t: number;
  dur: number;
  kind: Kind;
  /** 휴대폰에서 자동 재생이 막혔을 때: 재생 버튼을 한 번 더 눌러 달라는 안내 */
  tapHint: boolean;
  lyrics: LyricLine[];
  lyricsLoading: boolean;
  /** 30초 미리듣기 중 — 이땐 가사 싱크가 안 맞으니 줄글로 */
  preview: boolean;
  volume: number;
  setVolume: (v: number) => void;
  /** 볼륨을 마지막으로 바꾼 시각 (아이폰 볼륨 표시용) */
  volAt: number;
  playAt: (i: number) => void;
  setPlay: (b: boolean) => void;
  next: () => void;
  prev: () => void;
  seek: (x: number) => void;
  hosts: { yt: React.RefObject<HTMLDivElement> };
};
const Ctx = createContext<MusicApi | null>(null);
export const useMusic = () => useContext(Ctx)!;

const lyricCache = new Map<string, LyricLine[]>();

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const d = useData();
  const songs = d.songs;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  const [realDur, setRealDur] = useState(0);
  const [tapHint, setTapHint] = useState(false);
  const [volume, setVol] = useState(0.7);
  const [volAt, setVolAt] = useState(0);
  const song = songs[idx] ?? songs[0] ?? null;
  const kind = songKind(song);
  const ytId = soundYtId(song);
  const pv = song ? safePreview(song.preview) : "";

  const ytHost = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const loaded = useRef({ yt: "", pv: "" });
  const [ytReady, setYtReady] = useState(false);

  /** 누른 그 순간 바로 재생 (휴대폰은 누른 순간이 아니면 소리를 막음) */
  const startNow = useCallback(
    (s: Song | null) => {
      if (!s) return;
      const id = soundYtId(s);
      const y = yt.current;
      if (id && y && ytReady) {
        if (loaded.current.yt !== id) {
          loaded.current.yt = id;
          y.loadVideoById(id);
        } else y.playVideo();
        return;
      }
      const p = safePreview(s.preview);
      if (!id && p) {
        if (!audio.current) audio.current = new Audio();
        const a = audio.current;
        if (loaded.current.pv !== p) {
          loaded.current.pv = p;
          a.src = p;
        }
        a.volume = volume;
        a.play().catch(() => setTapHint(true));
      }
    },
    [ytReady, volume],
  );

  // 가사: 직접 넣은 가사 → 없으면 자동으로 찾아옴 (실제 곡 길이가 나오면 그 길이에 맞는 싱크로)
  const own = useMemo(() => parseLyrics(song?.lyrics), [song?.lyrics]);
  const [auto, setAuto] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const preview = kind === "pv";
  const lyricDur = Math.round((kind === "yt" ? realDur : 0) || Number(song?.dur) || 0);
  useEffect(() => {
    setAuto([]);
    if (!song || own.length || !song.title.trim() || !started) return;
    // 유튜브는 실제 길이를 알고 나서 (그 길이에 맞는 싱크 가사를 고르려고)
    if (kind === "yt" && !realDur) return;
    const key = `${song.title}|${song.artist}|${lyricDur}`;
    const hit = lyricCache.get(key);
    if (hit) return setAuto(hit);
    let dead = false;
    setLyricsLoading(true);
    fetchLyrics(song.title, song.artist, lyricDur || undefined)
      .then((txt) => {
        const lines = parseLyrics(txt);
        if (lines.length) lyricCache.set(key, lines);
        if (!dead) setAuto(lines);
      })
      .catch(() => {})
      .finally(() => !dead && setLyricsLoading(false));
    return () => {
      dead = true;
    };
  }, [song?.id, song?.title, song?.artist, own.length, lyricDur, started, kind, realDur > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const lyrics = useMemo(() => {
    const base0 = own.length ? own : auto;
    // 미리듣기는 곡 중간 30초라 시간이 안 맞음 → 싱크 없이 보여 줌
    const base = preview ? base0.map((l) => ({ ...l, t: null })) : base0;
    const off = Math.max(-30, Math.min(30, Number(song?.lyricsOffset) || 0));
    return off ? base.map((l) => (l.t === null ? l : { ...l, t: Math.max(0, l.t + off) })) : base;
  }, [own, auto, song?.lyricsOffset, preview]);

  const lastT = lyrics.reduce((m, l) => Math.max(m, l.t ?? 0), 0);
  const dur = realDur || Number(song?.dur) || (lastT ? Math.ceil(lastT + 20) : 180 + (((song?.title.length ?? 0) * 7) % 90));

  const next = useCallback(() => songs.length && setIdx((i) => (i + 1) % songs.length), [songs.length]);
  const seek = useCallback(
    (x: number) => {
      setT(x);
      if (kind === "yt") yt.current?.seekTo(x, true);
      if (kind === "pv" && audio.current) audio.current.currentTime = x;
    },
    [kind],
  );
  const tRef = useRef(0);
  tRef.current = t;
  const prev = useCallback(() => (tRef.current > 3 ? seek(0) : songs.length && setIdx((i) => (i - 1 + songs.length) % songs.length)), [seek, songs.length]);
  const setPlay = useCallback(
    (b: boolean) => {
      setPlaying(b);
      if (b) {
        setStarted(true);
        setTapHint(false);
        startNow(song);
      }
    },
    [song, startNow],
  );
  const playAt = useCallback(
    (i: number) => {
      setIdx(i);
      setPlaying(true);
      setStarted(true);
      setTapHint(false);
      startNow(songs[i] ?? null);
    },
    [songs, startNow],
  );
  useEffect(() => {
    setT(0);
    setRealDur(0);
    setTapHint(false);
  }, [song?.id, ytId, pv]);

  // 유튜브 재생기 만들기 (필요할 때 한 번)
  useEffect(() => {
    if (kind !== "yt" || yt.current || !ytHost.current) return;
    let dead = false;
    loadYT().then((YT) => {
      if (dead || !ytHost.current || yt.current) return;
      const el = document.createElement("div");
      ytHost.current.appendChild(el);
      const p = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "200",
        height: "200",
        playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3, modestbranding: 1 },
        events: {
          onReady: () => {
            yt.current = p;
            setYtReady(true);
          },
          onStateChange: (e: { data: number }) => e.data === 1 && setTapHint(false),
        },
      });
    });
    return () => {
      dead = true;
    };
  }, [kind]);

  // 곡 바꾸기 · 재생/정지 (지금 곡이 아닌 재생기는 멈춤)
  useEffect(() => {
    const y = yt.current;
    if (y && ytReady) {
      if (kind !== "yt") {
        if (loaded.current.yt) y.pauseVideo();
      } else if (loaded.current.yt !== ytId) {
        loaded.current.yt = ytId;
        if (playing) y.loadVideoById(ytId);
        else y.cueVideoById(ytId);
      } else if (playing) y.playVideo();
      else y.pauseVideo();
    }
    if (!audio.current && kind === "pv") audio.current = new Audio();
    const a = audio.current;
    if (a) {
      if (kind !== "pv") a.pause();
      else {
        if (loaded.current.pv !== pv) {
          loaded.current.pv = pv;
          a.src = pv;
        }
        if (playing) a.play().catch(() => setTapHint(true));
        else a.pause();
      }
    }
  }, [ytReady, kind, ytId, pv, playing]);

  // 볼륨 (실제 소리도 같이)
  useEffect(() => {
    yt.current?.setVolume(Math.round(volume * 100));
    if (audio.current) audio.current.volume = volume;
  }, [volume, ytReady, kind]);
  const setVolume = useCallback((v: number) => {
    setVol(Math.max(0, Math.min(1, v)));
    setVolAt(Date.now());
  }, []);

  // 시간 흐름
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let stuck = 0;
    const i = setInterval(() => {
      const n = performance.now();
      const dt = (n - last) / 1000;
      last = n;
      if (kind === "yt") {
        const p = yt.current;
        if (!p || !ytReady || loaded.current.yt !== ytId) return;
        const st = p.getPlayerState();
        if (st === 0) return next();
        const du = p.getDuration() || 0;
        if (du) setRealDur(du);
        setT(p.getCurrentTime() || 0);
        stuck = st === 1 || st === 3 ? 0 : stuck + dt;
        if (stuck > 2.5) setTapHint(true);
        return;
      }
      if (kind === "pv") {
        const a = audio.current;
        if (!a) return;
        if (a.duration) setRealDur(a.duration);
        setT(a.currentTime);
        if (a.ended) return next();
        return;
      }
      setT((x) => (x + dt >= dur ? (next(), 0) : x + dt));
    }, 150);
    return () => clearInterval(i);
  }, [playing, kind, ytReady, ytId, dur, next]);

  // 편집 화면의 "폰에서 들어 보기": 그 곡 바로 재생
  const playRef = useRef(playAt);
  playRef.current = playAt;
  useEffect(() => {
    const f = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      const i = songs.findIndex((x) => x.id === id);
      if (i >= 0) playRef.current(i);
    };
    window.addEventListener("music:play", f);
    return () => window.removeEventListener("music:play", f);
  }, [songs]);

  const api: MusicApi = {
    songs,
    song,
    idx,
    playing,
    started,
    t,
    dur,
    kind,
    tapHint,
    lyrics,
    lyricsLoading,
    preview,
    volume,
    setVolume,
    volAt,
    playAt,
    setPlay,
    next,
    prev,
    seek,
    hosts: { yt: ytHost },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** 유튜브 재생기 (화면 뒤에 숨어서 소리만 냄 — 화면엔 앨범 커버) */
export function MusicHosts() {
  const m = useMusic();
  return <div ref={m.hosts.yt} aria-hidden className="absolute left-0 top-0 overflow-hidden pointer-events-none" style={{ width: 200, height: 200, opacity: 0, zIndex: -1 }} />;
}

/* 노래 링크 → 표지 · 제목 · 가수 자동 채우기 (유튜브 / 스포티파이 / 애플뮤직), 제목으로 표지 찾기 (애플뮤직 검색) */
import { shrinkImage } from "./photos";

export type SongMeta = { title?: string; artist?: string; album?: string; cover?: string; dur?: number; preview?: string };

/** 가져오기: 상대 사이트가 잠깐 바쁘면(5xx · 429) 조금 기다렸다가 두 번 더 */
const getJson = async (u: string) => {
  for (let i = 0; ; i++) {
    const r = await fetch(u, { referrerPolicy: "no-referrer" }).catch(() => null);
    if (r?.ok) return r.json();
    if (i >= 2 || (r && r.status < 500 && r.status !== 429)) throw new Error(String(r?.status ?? "network"));
    await new Promise((res) => setTimeout(res, 700 * (i + 1)));
  }
};

/** 표지 사진을 받아 작게 줄여 저장 (사이트 밖 주소에 기대지 않게). square: 가운데를 정사각형으로 잘라냄 */
async function toCover(u: string, square = false) {
  const r = await fetch(u, { referrerPolicy: "no-referrer" });
  const b = await r.blob();
  if (!square) return shrinkImage(new File([b], "cover", { type: b.type || "image/jpeg" }), 500);
  const img = new Image();
  img.src = URL.createObjectURL(b);
  await img.decode();
  const n = Math.min(img.width, img.height, 500);
  const side = Math.min(img.width, img.height);
  const c = document.createElement("canvas");
  c.width = c.height = n;
  c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, n, n);
  URL.revokeObjectURL(img.src);
  return c.toDataURL("image/jpeg", 0.85);
}

export const ytId = (u: URL) => {
  let id = "";
  if (u.hostname === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (u.searchParams.get("v")) id = u.searchParams.get("v")!;
  else id = (u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/) || [])[2] || "";
  // 보안: 유튜브 영상 ID 모양(영문·숫자·-·_ 11자)만 통과
  return /^[\w-]{11}$/.test(id) ? id : "";
};

/** "가수 - 제목 (Official Video)" 같은 유튜브 제목 정리 */
function splitYt(title: string, author: string) {
  const clean = (s: string) =>
    s
      .replace(/[([【][^)\]】]*(official|mv|m\/v|video|audio|lyric|가사|visualizer|4k|hd|live)[^)\]】]*[)\]】]/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  const t = clean(title);
  const i = t.indexOf(" - ");
  if (i > 0) return { artist: t.slice(0, i).trim(), title: t.slice(i + 3).trim() };
  return { artist: author.replace(/ - Topic$/, "").replace(/VEVO$/i, "").trim(), title: t };
}

const big = (u: string) => u.replace(/\/\d+x\d+bb\./, "/600x600bb.");

export async function fromLink(link: string): Promise<SongMeta> {
  const u = new URL(link.trim());
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("주소");
  const h = u.hostname.replace(/^(www|m|music)\./, "");
  if (h === "youtube.com" || h === "youtu.be") {
    const id = ytId(u);
    if (!id) throw new Error("유튜브 주소");
    const meta: SongMeta = {};
    try {
      const j = await getJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`);
      Object.assign(meta, splitYt(String(j.title || ""), String(j.author_name || "")));
    } catch {
      /* 제목을 못 받아도 표지는 시도 */
    }
    // mqdefault: 위아래 검은 띠 없는 16:9 → 가운데 정사각형
    meta.cover = await toCover(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, true);
    return meta;
  }
  if (h === "open.spotify.com" || h === "spotify.link") {
    const j = await getJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(u.href)}`);
    const meta: SongMeta = { title: String(j.title || "") };
    if (j.thumbnail_url) meta.cover = await toCover(String(j.thumbnail_url));
    // 앨범 · 플레이리스트 링크는 이름만
    if (/\/(album|playlist)\//.test(u.pathname)) return { ...meta, album: meta.title };
    // 스포티파이는 가수 이름을 안 알려 줘서 애플뮤직에서 같은 제목으로 찾아 채움
    try {
      const m = await searchSong(meta.title || "", "", false);
      if (m.artist) meta.artist = m.artist;
      if (m.album) meta.album = m.album;
      if (m.dur) meta.dur = m.dur;
      if (m.preview) meta.preview = m.preview;
    } catch {
      /* 못 찾으면 제목만 */
    }
    return meta;
  }
  if (u.hostname === "music.apple.com" || h === "itunes.apple.com") {
    const id = u.searchParams.get("i") || (u.pathname.match(/(\d{5,})\/?$/) || [])[1];
    const country = (u.pathname.match(/^\/([a-z]{2})\//) || [])[1] || "kr";
    if (!id) throw new Error("애플뮤직 주소");
    let r = (await getJson(`https://itunes.apple.com/lookup?id=${id}&country=${country}`)).results?.[0];
    if (!r && country !== "us") r = (await getJson(`https://itunes.apple.com/lookup?id=${id}&country=us`)).results?.[0];
    if (!r) throw new Error("못 찾음");
    return fromItunes(r);
  }
  throw new Error("지원 안 함");
}

async function fromItunes(r: Record<string, unknown>, withCover = true): Promise<SongMeta> {
  const meta: SongMeta = { title: String(r.trackName || r.collectionName || ""), artist: String(r.artistName || ""), album: String(r.collectionName || "") };
  if (r.trackTimeMillis) meta.dur = Math.round(Number(r.trackTimeMillis) / 1000);
  if (typeof r.previewUrl === "string" && r.previewUrl.startsWith("https://")) meta.preview = r.previewUrl;
  if (withCover && r.artworkUrl100) meta.cover = await toCover(big(String(r.artworkUrl100)));
  return meta;
}

/** 제목 · 가수로 애플뮤직에서 찾아 표지 · 앨범 · 길이 채우기 (멜론 링크 등일 때) */
export async function searchSong(title: string, artist: string, withCover = true): Promise<SongMeta> {
  const q = `${artist} ${title}`.trim();
  if (!q) throw new Error("제목");
  // 한국 스토어 검색이 비면 미국 스토어로 다시 (한국 노래도 대부분 있음)
  let r;
  for (const c of ["kr", "us"]) {
    r = (await getJson(`https://itunes.apple.com/search?media=music&entity=song&limit=1&country=${c}&term=${encodeURIComponent(q)}`)).results?.[0];
    if (r) break;
  }
  if (!r) throw new Error("못 찾음");
  return fromItunes(r, withCover);
}

/* ───────── 가사 ───────── */
export type LyricLine = { t: number | null; text: string };

/** "[01:23.45] 가사" (싱크 가사) 또는 그냥 줄글. 시간 없는 줄은 t = null */
export function parseLyrics(src = ""): LyricLine[] {
  const out: LyricLine[] = [];
  for (const raw of src.replace(/\r/g, "").split("\n")) {
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    if (tags.length) for (const m of tags) out.push({ t: Number(m[1]) * 60 + Number(m[2].replace(":", ".")), text });
    else if (/^\[[a-z]+:/i.test(raw)) continue; // [ar:가수] 같은 정보 줄
    else out.push({ t: null, text });
  }
  // 싱크 가사면 시간 없는 줄(제목 · 크레딧 등)은 빼고 시간순으로
  if (out.some((l) => l.t !== null)) {
    for (let i = out.length - 1; i >= 0; i--) if (out[i].t === null) out.splice(i, 1);
    out.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
  }
  // 앞뒤 빈 줄 정리
  while (out.length && !out[0].text) out.shift();
  while (out.length && !out[out.length - 1].text) out.pop();
  return out;
}

export const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(2).padStart(5, "0")}`;
};

/** "3:25" → 205 */
export const parseDur = (v: string) => {
  const m = v.trim().match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};
export const showDur = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");

/** 곡 링크가 유튜브면 영상 ID (실제 소리 재생용) */
export const songYtId = (url: string) => {
  try {
    const u = new URL(url);
    return /(^|\.)youtube\.com$|^youtu\.be$/.test(u.hostname) ? ytId(u) : "";
  } catch {
    return "";
  }
};

/** 스포티파이 링크면 "track:ID" / "album:ID" / "playlist:ID" (스포티파이 재생기로 재생). 아니면 "" */
export const songSpId = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname !== "open.spotify.com") return "";
    const m = u.pathname.match(/^\/(?:intl-[a-z]{2}(?:-[a-z]{2})?\/)?(track|album|playlist)\/([A-Za-z0-9]{22})\/?$/);
    return m ? `${m[1]}:${m[2]}` : "";
  } catch {
    return "";
  }
};
/** 곡 하나가 아닌 링크(앨범 · 플레이리스트)인지 — 이런 링크는 가사를 붙일 수 없음 */
export const isSpCollection = (url: string) => /^(album|playlist):/.test(songSpId(url));

/* ───────── 가사 자동으로 가져오기 (LRCLIB: 무료 공개 가사 모음, 싱크 가사 포함) ───────── */
type LrcHit = { trackName?: string; artistName?: string; duration?: number; syncedLyrics?: string | null; plainLyrics?: string | null; instrumental?: boolean };
const cleanTitle = (s: string) => s.replace(/\s*[([].*?[)\]]\s*/g, " ").replace(/\s{2,}/g, " ").trim();

/** 비교용: 괄호 · 공백 · 기호 빼고 소문자 (단, 제목이 기호뿐이면 그대로) */
const norm = (s = "") => {
  const a = s.toLowerCase().replace(/[([（【].*?[)\]）】]/g, " ");
  const b = a.replace(/[^\p{L}\p{N}]+/gu, "");
  return b || a.replace(/\s+/g, "");
};
/** 가수 이름 후보: "LEON (딥상어)" → ["leon", "딥상어"], "A & B" → ["a", "b"] */
const artistNames = (s = "") =>
  s
    .split(/[()（）,&/·]|feat\.?|ft\.?/i)
    .map((x) => norm(x))
    .filter(Boolean);
/** 제목 후보: "Through the Night (밤편지)" → [전체, "throughthenight", "밤편지"] (괄호 안 이름도 같은 곡으로 봄) */
const titleNames = (s = "") => [norm(s), ...s.split(/[()（）[\]【】]/).map((x) => norm(x))].filter(Boolean);
const sameTitle = (a: string, b: string) => {
  const xs = titleNames(a);
  const ys = titleNames(b);
  return xs.some((x) => ys.some((y) => x === y || (Math.min(x.length, y.length) >= 3 && (x.includes(y) || y.includes(x)))));
};
const sameArtist = (hit: string, want: string) => {
  const hs = artistNames(hit);
  const ws = artistNames(want);
  return ws.some((w) => hs.some((h) => h === w || (Math.min(h.length, w.length) >= 2 && (h.includes(w) || w.includes(h)))));
};

/** 제목 · 가수(· 곡 길이)로 가사를 찾아 돌려줌. 싱크 가사가 있으면 그걸, 없으면 줄글 가사. 못 찾으면 ""
 *  엉뚱한 노래 가사가 오지 않게: 제목이 맞아야 하고, 가수를 적었으면 가수도 맞아야 함 */
export async function fetchLyrics(title: string, artist: string, dur?: number): Promise<string> {
  const t = cleanTitle(title) || title.trim();
  if (!t) return "";
  const a = artist.trim();
  const tries = [
    `https://lrclib.net/api/search?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(a)}`,
    `https://lrclib.net/api/search?q=${encodeURIComponent(`${a} ${t}`.trim())}`,
    ...a.split(/[()（）]/).map((x) => x.trim()).filter((x) => x && x !== a).map((x) => `https://lrclib.net/api/search?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(x)}`),
  ];
  for (const u of tries) {
    let list: LrcHit[] = [];
    try {
      const j = await getJson(u);
      list = Array.isArray(j) ? j : [];
    } catch {
      continue;
    }
    const good = list.filter((x) => !x.instrumental && (x.syncedLyrics || x.plainLyrics) && sameTitle(x.trackName || "", t) && (!a || sameArtist(x.artistName || "", a)));
    if (!good.length) continue;
    // 싱크 가사 우선, 곡 길이가 비슷한 것 우선 (길이가 10초 넘게 다르면 다른 버전일 가능성 → 뒤로)
    const gap = (x: LrcHit) => (dur ? Math.abs((x.duration ?? 0) - dur) : 0);
    good.sort((p, q) => Number(gap(p) > 10) - Number(gap(q) > 10) || Number(!!q.syncedLyrics) - Number(!!p.syncedLyrics) || gap(p) - gap(q));
    const best = good[0];
    return String(best.syncedLyrics || best.plainLyrics || "").slice(0, 20000);
  }
  return "";
}

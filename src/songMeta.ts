/* 노래 링크 → 표지 · 제목 · 가수 자동 채우기 (유튜브 / 스포티파이 / 애플뮤직), 제목으로 표지 찾기 (애플뮤직 검색) */
import { shrinkImage } from "./photos";

export type SongMeta = { title?: string; artist?: string; album?: string; cover?: string; dur?: number };

const getJson = async (u: string) => {
  const r = await fetch(u, { referrerPolicy: "no-referrer" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
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
  if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
  if (u.searchParams.get("v")) return u.searchParams.get("v")!;
  const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/);
  return m ? m[2] : "";
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

async function fromItunes(r: Record<string, unknown>): Promise<SongMeta> {
  const meta: SongMeta = { title: String(r.trackName || r.collectionName || ""), artist: String(r.artistName || ""), album: String(r.collectionName || "") };
  if (r.trackTimeMillis) meta.dur = Math.round(Number(r.trackTimeMillis) / 1000);
  if (r.artworkUrl100) meta.cover = await toCover(big(String(r.artworkUrl100)));
  return meta;
}

/** 제목 · 가수로 애플뮤직에서 찾아 표지 · 앨범 · 길이 채우기 (멜론 링크 등일 때) */
export async function searchSong(title: string, artist: string): Promise<SongMeta> {
  const q = `${artist} ${title}`.trim();
  if (!q) throw new Error("제목");
  // 한국 스토어 검색이 비면 미국 스토어로 다시 (한국 노래도 대부분 있음)
  let r;
  for (const c of ["kr", "us"]) {
    r = (await getJson(`https://itunes.apple.com/search?media=music&entity=song&limit=1&country=${c}&term=${encodeURIComponent(q)}`)).results?.[0];
    if (r) break;
  }
  if (!r) throw new Error("못 찾음");
  return fromItunes(r);
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
  if (out.some((l) => l.t !== null)) out.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
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

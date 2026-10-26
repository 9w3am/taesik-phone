/* 직접 올린 음원 파일 — 이 브라우저 안(IndexedDB)에만 저장. 노래 파일은 커서 일반 저장 칸(localStorage)에는 못 넣음
   곡마다 song.audio = "local" 이면 곡 id로 여기서 꺼내 씀 / "music/곡.mp3" 처럼 쓰면 사이트에 같이 올린 파일 */
import { useSyncExternalStore } from "react";
import type { Song } from "./store";

const DB = "taesik-phone-audio";
const ST = "files";
const urls = new Map<string, string>(); // 곡 id → 재생 주소 (blob:)
const names = new Map<string, { name: string; size: number }>();
const listeners = new Set<() => void>();
let ver = 0;
const notify = () => {
  ver++;
  listeners.forEach((l) => l());
};

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((res, rej) => {
        const req = fn(db.transaction(ST, mode).objectStore(ST));
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      }),
  );
}

type Rec = { blob: Blob; name: string };
const setUrl = (id: string, r: Rec) => {
  const old = urls.get(id);
  if (old) URL.revokeObjectURL(old);
  urls.set(id, URL.createObjectURL(r.blob));
  names.set(id, { name: r.name, size: r.blob.size });
};

/** 음원 파일 저장 (같은 곡이면 바꿔 끼움) */
export async function putAudio(id: string, file: File) {
  const r: Rec = { blob: file, name: file.name };
  await tx("readwrite", (s) => s.put(r, id));
  setUrl(id, r);
  notify();
}
export async function delAudio(id: string) {
  await tx("readwrite", (s) => s.delete(id)).catch(() => {});
  const old = urls.get(id);
  if (old) URL.revokeObjectURL(old);
  urls.delete(id);
  names.delete(id);
  notify();
}
/** 처음에 한 번: 저장된 음원들을 미리 꺼내 둠 (누르는 순간 바로 재생되게) */
let loading: Promise<void> | null = null;
export function loadAllAudio() {
  if (loading || typeof indexedDB === "undefined") return loading;
  loading = open()
    .then(
      (db) =>
        new Promise<void>((res) => {
          const s = db.transaction(ST, "readonly").objectStore(ST);
          const c = s.openCursor();
          c.onsuccess = () => {
            const cur = c.result;
            if (!cur) return res();
            const r = cur.value as Rec;
            if (r?.blob) setUrl(String(cur.key), r);
            cur.continue();
          };
          c.onerror = () => res();
        }),
    )
    .then(notify)
    .catch(() => {});
  return loading;
}
export const audioInfo = (id: string) => names.get(id);

/** 보안: 사이트 안 파일 이름만 허용 (예: music/곡.mp3) */
const safeRel = (p?: string) => (p && p !== "local" && /^[\w가-힣 ./()-]+\.(mp3|m4a|aac|ogg|wav|webm)$/i.test(p) && !p.includes("..") && !p.startsWith("/") ? p : "");
/** 이 곡의 음원 파일 주소 (없으면 "") */
export const fileSrc = (s?: Song | null) => (!s ? "" : s.audio === "local" ? urls.get(s.id) || "" : safeRel(s.audio));

/** 음원 목록이 바뀌면 다시 그림 */
export const useAudioVer = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => ver,
  );

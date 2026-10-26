/* 대화방 연출: 보는 사람이 그 방에 직접 들어가면 정해진 대로 저절로 흘러감 (보기 전용)
   예) 상대 말이 오다 끊김 → 입력창에 "받" 치다가 → 스팸이 와다닥 → 입력창이 "미친놈인가"로 바뀜
   - 강제로 방을 열지 않음: 알림을 누르거나 목록에서 직접 들어가야 시작
   - 저장하지 않음: 새로 열면(새로고침) 처음부터 다시 · 같은 방문 중 다시 들어오면 이어서/끝난 모습 그대로 */
import { useEffect, useSyncExternalStore } from "react";
import type { Msg, Thread, SceneStep } from "./store";

type St = { extra: Msg[]; typed: string; step: number; done: boolean };
const states = new Map<string, St>();
const listeners = new Set<() => void>();
const set = (id: string, v: Partial<St>) => {
  states.set(id, { ...(states.get(id) as St), ...v });
  listeners.forEach((l) => l());
};

/* 한글 한 글자씩 조합되는 모습 (ㅂ → 바 → 받) */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
export function typingFrames(text: string): string[] {
  const out: string[] = [];
  let done = "";
  for (const ch of text) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c >= 0 && c < 11172) {
      const cho = Math.floor(c / 588);
      const jung = Math.floor((c % 588) / 28);
      const jong = c % 28;
      out.push(done + CHO[cho]);
      const open = String.fromCharCode(0xac00 + cho * 588 + jung * 28);
      out.push(done + open);
      if (jong) out.push(done + ch);
    } else out.push(done + ch);
    done += ch;
  }
  return out;
}

function run(t: Thread) {
  const steps = t.scene ?? [];
  const id = t.id;
  let k = 0;
  const next = (i: number) => {
    if (i >= steps.length) return set(id, { done: true });
    const s = steps[i];
    set(id, { step: i });
    if (s.kind === "wait") return void setTimeout(() => next(i + 1), Math.max(0, s.sec) * 1000);
    if (s.kind === "msg") {
      const st = states.get(id)!;
      set(id, { extra: [...st.extra, { id: `scene-${id}-${k++}`, from: s.from ?? "them", text: s.text }] });
      return void setTimeout(() => next(i + 1), Math.max(0.05, s.sec ?? 0.35) * 1000);
    }
    // 입력창에 쓴 걸 보내기 (내 말풍선으로 올라가고 입력창은 비움)
    if (s.kind === "send") {
      const st = states.get(id)!;
      if (st.typed.trim()) set(id, { extra: [...st.extra, { id: `scene-${id}-${k++}`, from: "me", text: st.typed.trim() }], typed: "" });
      return void setTimeout(() => next(i + 1), Math.max(0.05, s.sec ?? 0.5) * 1000);
    }
    // 입력창에 치기: 지금 쓰여 있는 걸 한 글자씩 지우고 → 새 글을 한 글자씩
    const cur = states.get(id)!.typed;
    const frames: string[] = [];
    for (let n = [...cur].length - 1; n >= 0; n--) frames.push([...cur].slice(0, n).join(""));
    frames.push(...typingFrames(s.text));
    const del = [...cur].length;
    const ms = s.ms ?? 110;
    let f = 0;
    // 사람처럼: 지우기 전에 잠깐 멈칫 → 치는 속도 그대로 한 칸씩 지우고 → 살짝 쉬었다가 새로 침 / 다 치면 바로 다음
    const gap = (k: number) => (k === del && del ? ms * 2 : ms * (0.8 + Math.random() * 0.4));
    const tick = () => {
      if (f >= frames.length) return void next(i + 1);
      set(id, { typed: frames[f++] });
      setTimeout(tick, gap(f));
    };
    if (del) setTimeout(tick, 300);
    else tick();
  };
  next(0);
}

/** 그 방의 연출 상태. 방이 화면에 처음 열릴 때 시작 */
export function useScene(t: Thread, on = true): St | null {
  const has = on && !!t.scene?.length;
  useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => states.get(t.id),
  );
  useEffect(() => {
    if (!has || states.has(t.id)) return;
    states.set(t.id, { extra: [], typed: "", step: 0, done: false });
    run(t);
  }, [has, t.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return has ? (states.get(t.id) ?? { extra: [], typed: "", step: 0, done: false }) : null;
}

/** 연출이 끝난 뒤엔 보는 사람 마음대로: 입력창 고치기 */
export function setSceneTyped(id: string, v: string) {
  if (states.get(id)?.done) set(id, { typed: v });
}
/** 연출이 끝난 뒤 보내기: 그 방 말풍선으로 올라감 (연출처럼 저장은 안 됨 — 새로 열면 처음부터) */
export function sendScene(id: string) {
  const st = states.get(id);
  if (!st?.done || !st.typed.trim()) return;
  set(id, { extra: [...st.extra, { id: `scene-${id}-u${st.extra.length}`, from: "me", text: st.typed.trim() }], typed: "" });
}

/** 편집 화면에서 연출을 고친 뒤 다시 보기 */
export function resetScene(id?: string) {
  if (id) states.delete(id);
  else states.clear();
  listeners.forEach((l) => l());
}
export type { SceneStep };

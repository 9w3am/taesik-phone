/*
  벨소리 · 알림음
  · 기본 제공 소리는 Mixkit 무료 효과음 (Mixkit Sound Effects Free License — 무료, 출처 표기 불필요)
    https://mixkit.co/license/#sfxFree
  · 'A/B/C', '깔끔한 알림', '메시지 알림', '새 알림'은 Pixabay 무료 효과음 (Pixabay Content License, Universfield 등)
    https://pixabay.com/service/license-summary/
  · 아이폰 정품 벨소리는 애플 저작권이라 넣지 않음
  · 에디터에서 직접 올린 소리(data URL)도 사용 가능
*/
const files = import.meta.glob("./assets/sounds/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const url = (n: string) => files[`./assets/sounds/${n}.mp3`] ?? "";

export const RINGTONES: [string, string][] = [
  ["ring-marimba3", "마림바 (아이폰 느낌) A"],
  ["ring-marimba4", "마림바 (아이폰 느낌) B"],
  ["ring-marimba5", "마림바 (아이폰 느낌) C"],
  ["ring-marimba", "마림바"],
  ["ring-marimba2", "마림바 2"],
  ["ring-office", "사무실 전화"],
  ["ring-vintage", "옛날 전화"],
];
export const NOTIFY_SOUNDS: [string, string][] = [
  ["noti-clear", "깔끔한 알림 (아이폰 느낌)"],
  ["noti-message", "메시지 알림"],
  ["noti-new1", "새 알림 A"],
  ["noti-new2", "새 알림 B"],
  ["noti-pop", "팝"],
  ["noti-longpop", "긴 팝"],
  ["noti-bell", "벨"],
  ["noti-positive", "딩동"],
  ["noti-hint", "힌트"],
  ["noti-tones", "알림 톤"],
];

/** "preset:이름" 또는 data URL → 재생 주소 */
export function soundSrc(ref?: string) {
  if (!ref) return "";
  if (ref.startsWith("preset:")) return url(ref.slice(7));
  return ref;
}
/* 미리듣기: 한 번에 하나만 재생 (새로 누르면 이전 소리는 멈춤) */
let current: HTMLAudioElement | null = null;
let currentRef = "";
const listeners = new Set<(ref: string) => void>();
const emit = () => listeners.forEach((f) => f(currentRef));
export function stopSound() {
  if (current) {
    current.pause();
    current.currentTime = 0;
  }
  current = null;
  currentRef = "";
  emit();
}
export function playOnce(ref?: string) {
  stopSound();
  const s = soundSrc(ref);
  if (!s || !ref) return;
  const a = new Audio(s);
  current = a;
  currentRef = ref;
  a.onended = () => {
    if (current === a) stopSound();
  };
  a.play().catch(() => stopSound());
  emit();
}
/** 같은 소리를 다시 누르면 멈춤 */
export function toggleSound(ref: string) {
  if (currentRef === ref) stopSound();
  else playOnce(ref);
}
/** 지금 재생 중인 소리 (에디터 버튼 표시용) */
export function onSoundChange(f: (ref: string) => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

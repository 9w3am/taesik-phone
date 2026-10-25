/*
  벨소리 · 알림음
  · 기본 제공 소리는 Mixkit 무료 효과음 (Mixkit Sound Effects Free License — 무료, 출처 표기 불필요)
    https://mixkit.co/license/#sfxFree
  · 아이폰 정품 벨소리는 애플 저작권이라 넣지 않음
  · 에디터에서 직접 올린 소리(data URL)도 사용 가능
*/
const files = import.meta.glob("./assets/sounds/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const url = (n: string) => files[`./assets/sounds/${n}.mp3`] ?? "";

export const RINGTONES: [string, string][] = [
  ["ring-marimba", "마림바"],
  ["ring-marimba2", "마림바 2"],
  ["ring-office", "사무실 전화"],
  ["ring-vintage", "옛날 전화"],
];
export const NOTIFY_SOUNDS: [string, string][] = [
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
export function playOnce(ref?: string) {
  const s = soundSrc(ref);
  if (s) new Audio(s).play().catch(() => {});
}

/* iOS 통화 아이콘 (SF Symbols phone.fill / phone.down.fill 형태) */
const HANDSET = "M6.6 2.2c.7-.4 1.6-.3 2.1.4l2.4 3.3c.5.7.4 1.6-.2 2.2L9.4 9.6c1.1 2.4 3 4.4 5.5 5.7l1.6-1.5c.6-.6 1.5-.6 2.1-.1l3.3 2.4c.7.5.8 1.4.4 2.1l-1.2 1.9c-.7 1.1-2 1.6-3.3 1.2C11.1 19.3 6.1 14.3 4.2 7.6c-.4-1.2.1-2.5 1.2-3.2z";
export function Handset({ size = 30, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={HANDSET} fill={color} />
    </svg>
  );
}
/** 수화기 내려놓기 (거절/종료) — 수화기를 135° 돌린 모양 */
export function HandsetDown({ size = 30, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={HANDSET} fill={color} transform="rotate(135 12 12)" />
    </svg>
  );
}

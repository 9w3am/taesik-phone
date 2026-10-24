/* 통화 화면 — 음성 대신 상대방 대사가 화면 중앙에 하나의 텍스트 덩어리로 출력 (본인 대사 없음) */
import { useEffect, useState } from "react";
import { MicOff, Grid3x3, Volume2, Plus, Video, CircleUser } from "lucide-react";
import { HandsetDown } from "../phoneIcons";
import { Wallpaper } from "../Phone";

export function CallScreen({ name, lines, mode, onEnd }: { name: string; lines: string[]; mode: "out" | "in"; onEnd: () => void }) {
  const [connected, setConnected] = useState(mode === "in");
  const [sec, setSec] = useState(0);
  const [shown, setShown] = useState(0); // 다 나온 문장 수
  const [typed, setTyped] = useState(0); // 지금 문장에서 나온 글자 수
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [pad, setPad] = useState(false);
  const [digits, setDigits] = useState("");
  const [ended, setEnded] = useState(false);

  // 발신: 연결 중 → 연결됨
  useEffect(() => {
    if (connected) return;
    const t = setTimeout(() => setConnected(true), 2600);
    return () => clearTimeout(t);
  }, [connected]);
  // 통화 시간
  useEffect(() => {
    if (!connected || ended) return;
    const i = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [connected, ended]);
  // 대사 출력: 한 글자씩 타이핑되듯 → 문장 끝나면 잠깐 쉬고 다음 문장
  const cur = lines[shown] ?? "";
  const speaking = connected && !ended && shown < lines.length && typed < cur.length;
  useEffect(() => {
    if (!connected || ended) return;
    if (shown >= lines.length) {
      const t = setTimeout(() => setEnded(true), 2800);
      return () => clearTimeout(t);
    }
    if (typed < cur.length) {
      const t = setTimeout(() => setTyped((x) => x + 1), shown === 0 && typed === 0 ? 900 : /[.,?!…]/.test(cur[typed - 1] ?? "") ? 260 : 55);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setShown((x) => x + 1);
      setTyped(0);
    }, 700 + Math.min(1600, cur.length * 22));
    return () => clearTimeout(t);
  }, [connected, ended, shown, typed, cur, lines.length]);
  useEffect(() => {
    if (!ended) return;
    const t = setTimeout(onEnd, 1300);
    return () => clearTimeout(t);
  }, [ended, onEnd]);

  const mmss = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const status = ended ? "통화 종료" : connected ? mmss : "통화 연결 중…";
  const btns = [
    { id: "mute", label: "음소거", icon: <MicOff size={30} strokeWidth={1.8} /> },
    { id: "pad", label: "키패드", icon: <Grid3x3 size={30} strokeWidth={1.8} /> },
    { id: "spk", label: "스피커", icon: <Volume2 size={30} strokeWidth={1.8} /> },
    { id: "add", label: "통화 추가", icon: <Plus size={32} strokeWidth={1.8} />, disabled: true },
    { id: "ft", label: "FaceTime", icon: <Video size={30} strokeWidth={1.8} />, disabled: true },
    { id: "ct", label: "연락처", icon: <CircleUser size={30} strokeWidth={1.8} /> },
  ];
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  const subs: Record<string, string> = { "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO", "7": "PQRS", "8": "TUV", "9": "WXYZ", "0": "+" };

  return (
    <div className="absolute inset-0 z-[80] text-white fade bg-[#111]">
      <Wallpaper blur={46} dim={0.55} />
      <div className="relative h-full flex flex-col">
        {/* 상단: 이름 · 상태 */}
        <div className="pt-[78px] text-center px-6">
          <div className="text-[30px] leading-[36px] truncate">{pad && digits ? digits : name}</div>
          <div className="text-[17px] text-white/60 tabular h-[22px] mt-[4px]">{pad && digits ? "" : status}</div>
        </div>

        {/* 중앙: 상대 대사 — 하나의 텍스트 덩어리. 지난 문장은 흐리게, 지금 말하는 문장은 또렷하게 */}
        <div className="flex-1 flex flex-col items-center justify-center px-[30px]">
          {!pad && connected && (
            <>
              <div className="flex items-center gap-[4px] h-[22px] mb-[18px]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-[4px] rounded-full bg-white/70 origin-center transition-all"
                    style={{ height: speaking ? 18 : 4, animation: speaking ? `eq ${0.5 + (i % 3) * 0.17}s ease-in-out ${i * 0.08}s infinite` : "none", opacity: speaking ? 1 : 0.35 }}
                  />
                ))}
              </div>
              <p className="text-center text-[20px] leading-[32px] font-normal tracking-[-0.015em] max-w-[320px]" style={{ wordBreak: "keep-all" }}>
                {lines.slice(Math.max(0, shown - 2), shown).map((l, i) => (
                  <span key={shown - 2 + i} className="text-white/40 transition-colors duration-500">
                    {l}{" "}
                  </span>
                ))}
                {shown < lines.length && (
                  <span className="text-white">
                    {cur.slice(0, typed)}
                    {!ended && <span className="inline-block w-[2px] h-[20px] bg-white/70 align-[-3px] ml-[2px] animate-pulse" />}
                  </span>
                )}
              </p>
            </>
          )}
        </div>

        {/* 하단 컨트롤 */}
        {!pad ? (
          <div className="grid grid-cols-3 gap-y-[22px] px-[36px] justify-items-center">
            {btns.map((b) => {
              const active = !!on[b.id];
              return (
                <button
                  key={b.id}
                  disabled={b.disabled}
                  onClick={() => (b.id === "pad" ? setPad(true) : setOn((o) => ({ ...o, [b.id]: !o[b.id] })))}
                  className="flex flex-col items-center gap-[7px]"
                  style={{ opacity: b.disabled ? 0.4 : 1 }}
                >
                  <span className="w-[78px] h-[78px] rounded-full flex items-center justify-center transition-colors blur-bar" style={{ background: active ? "#fff" : "rgba(255,255,255,0.2)", color: active ? "#000" : "#fff" }}>
                    {b.icon}
                  </span>
                  <span className="text-[13px] font-medium">{b.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-[14px] px-[46px] justify-items-center">
            {keys.map((k) => (
              <button key={k} onClick={() => setDigits((x) => x + k)} className="w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center active:bg-white/50" style={{ background: "rgba(255,255,255,0.2)" }}>
                <span className="text-[34px] leading-[36px] font-light">{k}</span>
                {subs[k] && <span className="text-[10px] font-bold tracking-[0.16em]">{subs[k]}</span>}
              </button>
            ))}
          </div>
        )}
        <div className="relative flex justify-center mt-[30px] mb-[54px]">
          <button onClick={() => setEnded(true)} className="w-[78px] h-[78px] rounded-full bg-[#FF3B30] flex items-center justify-center active:brightness-90">
            <HandsetDown size={38} />
          </button>
          {pad && (
            <button onClick={() => setPad(false)} className="absolute right-[56px] top-1/2 -translate-y-1/2 text-[17px]">
              가리기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

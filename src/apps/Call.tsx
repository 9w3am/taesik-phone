/* 통화 화면 — 음성 대신 상대방 대사가 화면 중앙에 하나의 텍스트 덩어리로 출력 (본인 대사 없음) */
import { useEffect, useState } from "react";
import { MicOff, Grid3x3, Volume2, Plus, Video, CircleUser, PhoneOff } from "lucide-react";
import { Wallpaper } from "../Phone";

export function CallScreen({ name, lines, mode, onEnd }: { name: string; lines: string[]; mode: "out" | "in"; onEnd: () => void }) {
  const [connected, setConnected] = useState(mode === "in");
  const [sec, setSec] = useState(0);
  const [shown, setShown] = useState(0);
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
  // 대사 순차 출력
  useEffect(() => {
    if (!connected) return;
    if (shown >= lines.length) {
      const t = setTimeout(() => setEnded(true), 3200);
      return () => clearTimeout(t);
    }
    const prev = lines[shown - 1] ?? "";
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 900 : 900 + Math.min(2600, prev.length * 70));
    return () => clearTimeout(t);
  }, [connected, shown, lines]);
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
          <div className="text-[15px] text-white/60 tabular h-[20px]">{pad && digits ? "" : status}</div>
          <div className="text-[30px] leading-[36px] mt-[2px] truncate">{pad && digits ? digits : name}</div>
        </div>

        {/* 중앙: 상대 대사 텍스트 블록 */}
        <div className="flex-1 flex items-center justify-center px-[34px]">
          {!pad && (
            <p className="text-center text-[19px] leading-[31px] text-white/95 font-normal tracking-[-0.01em]" style={{ wordBreak: "keep-all" }}>
              {lines.slice(0, shown).map((l, i) => (
                <span key={i} className="line-in inline">
                  {l}
                  {i < shown - 1 ? " " : ""}
                </span>
              ))}
              {connected && shown < lines.length && !ended && <span className="inline-block w-[22px] text-white/40 tracking-[2px] animate-pulse">…</span>}
            </p>
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
            <PhoneOff size={34} fill="#fff" strokeWidth={0} />
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

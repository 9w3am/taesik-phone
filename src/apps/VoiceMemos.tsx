/* 음성 메모 — 재생하면 받아쓴 글자가 한 줄씩 나옴 (소리는 없음) */
import { useEffect, useState } from "react";
import { Play, Pause, Search, MoreHorizontal } from "lucide-react";
import { useData } from "../store";
import { LargeTitle, NavBar, useScrolled, useStatusBar } from "../ui";

function MemoRow({ m, open, onToggle }: { m: { id: string; title: string; when: string; lines: string[] }; open: boolean; onToggle: () => void }) {
  const total = Math.max(5, Math.round(m.lines.join("").length / 5));
  const [play, setPlay] = useState(false);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!play) return;
    const i = setInterval(() => setSec((x) => (x + 1 >= total ? (setPlay(false), total) : x + 1)), 1000);
    return () => clearInterval(i);
  }, [play, total]);
  useEffect(() => {
    if (!open) {
      setPlay(false);
      setSec(0);
    }
  }, [open]);
  const mm = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const shown = Math.ceil((sec / total) * m.lines.length);
  return (
    <div className="pl-[16px]" onClick={onToggle}>
      <div className="pr-[16px] py-[12px] hair-b">
        <div className="text-[17px] font-semibold">{m.title}</div>
        <div className="flex justify-between text-[15px] text-black/45 mt-[2px]">
          <span>{m.when}</span>
          <span className="tabular">{mm(total)}</span>
        </div>
        {open && (
          <div onClick={(e) => e.stopPropagation()} className="pt-[12px]">
            <div className="h-[4px] rounded-full bg-black/10 overflow-hidden">
              <div className="h-full bg-black/70 transition-all duration-1000 ease-linear" style={{ width: `${(sec / total) * 100}%` }} />
            </div>
            <div className="flex justify-between text-[12px] text-black/45 mt-[4px] tabular">
              <span>{mm(sec)}</span>
              <span>-{mm(total - sec)}</span>
            </div>
            <div className="flex items-center justify-center gap-[34px] py-[6px]">
              <MoreHorizontal size={22} className="text-[#007AFF]" />
              <button
                onClick={() => {
                  if (sec >= total) setSec(0);
                  setPlay(!play);
                }}
                className="w-[44px] h-[44px] flex items-center justify-center"
              >
                {play ? <Pause size={30} fill="#000" strokeWidth={0} /> : <Play size={30} fill="#000" strokeWidth={0} />}
              </button>
              <span className="w-[22px]" />
            </div>
            <div className="rounded-[10px] bg-[#F2F2F7] px-[12px] py-[10px] text-[15px] leading-[22px] min-h-[44px]">
              {sec === 0 && !play ? <span className="text-black/35">재생하면 받아쓴 내용이 나옵니다</span> : m.lines.slice(0, shown).join(" ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VoiceMemos() {
  useStatusBar(true);
  const d = useData();
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title="모든 녹음" scrolled={scrolled} right={<span className="text-[17px]">편집</span>} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 150 }}>
        <LargeTitle>모든 녹음</LargeTitle>
        <div className="px-4 pb-[8px]">
          <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
            <Search size={16} />
            검색
          </div>
        </div>
        {d.voiceMemos.map((m) => (
          <MemoRow key={m.id} m={m} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </div>
      {/* 녹음 버튼 (연출) */}
      <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-[#F7F7F7] flex items-start justify-center pt-[18px]" style={{ boxShadow: "inset 0 0.5px 0 var(--sep)" }}>
        <span className="w-[62px] h-[62px] rounded-full border-[3px] border-[#C7C7CC] flex items-center justify-center">
          <span className="w-[50px] h-[50px] rounded-full bg-[#FF3B30]" />
        </span>
      </div>
    </div>
  );
}

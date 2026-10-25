/* 건강 앱 (iOS 건강 '요약' 화면) — 걸음 · 활동 링 · 심박수 · 수면 */
import { Heart, Footprints, Flame, BedDouble, ChevronRight, Activity } from "lucide-react";
import { useData, won } from "../store";
import { LargeTitle, NavBar, TabBar, useScrolled, useStatusBar } from "../ui";

function Rings({ move, ex, stand }: { move: number; ex: number; stand: number }) {
  const ring = (r: number, v: number, c: string, bg: string) => {
    const C = 2 * Math.PI * r;
    return (
      <g key={r}>
        <circle cx="60" cy="60" r={r} fill="none" stroke={bg} strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={c} strokeWidth="11" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, v))} transform="rotate(-90 60 60)" />
      </g>
    );
  };
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {ring(52, move, "#FA114F", "#3A0A17")}
      {ring(39, ex, "#A6FF00", "#213300")}
      {ring(26, stand, "#00F0FF", "#00313A")}
    </svg>
  );
}

export default function Health() {
  useStatusBar(true);
  const d = useData();
  const h = d.health;
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const max = Math.max(...h.heart);
  const Card = ({ icon, color, title, value, unit, sub, children }: { icon: React.ReactNode; color: string; title: string; value: string; unit: string; sub?: string; children?: React.ReactNode }) => (
    <div className="mx-4 mt-[10px] rounded-[12px] bg-white px-[16px] py-[12px]">
      <div className="flex items-center justify-between text-[15px] font-semibold" style={{ color }}>
        <span className="flex items-center gap-[6px]">
          {icon}
          {title}
        </span>
        <span className="flex items-center text-[13px] text-black/40 font-normal">
          {sub}
          <ChevronRight size={16} className="ml-[2px]" />
        </span>
      </div>
      <div className="mt-[6px]">
        <span className="text-[28px] font-bold tabular tracking-[-0.02em]">{value}</span>
        <span className="text-[15px] text-black/45 ml-[3px]">{unit}</span>
      </div>
      {children}
    </div>
  );
  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      <NavBar title="요약" scrolled={scrolled} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 110 }}>
        <LargeTitle>요약</LargeTitle>
        <div className="px-[20px] pb-[4px] text-[20px] font-bold">고정된 항목</div>
        <div className="mx-4 mt-[10px] rounded-[12px] bg-black px-[16px] py-[14px] flex items-center gap-[16px]">
          <Rings move={h.move / h.moveGoal} ex={h.exercise / 30} stand={h.stand / 12} />
          <div className="text-[15px] font-semibold leading-[24px]">
            <div style={{ color: "#FA114F" }}>
              {h.move}/{h.moveGoal}
              <span className="text-[12px]">KCAL</span>
            </div>
            <div style={{ color: "#A6FF00" }}>
              {h.exercise}/30<span className="text-[12px]">분</span>
            </div>
            <div style={{ color: "#00F0FF" }}>
              {h.stand}/12<span className="text-[12px]">시간</span>
            </div>
          </div>
        </div>
        <Card icon={<Footprints size={17} />} color="#FF6B00" title="걸음" value={won(d.cashwalk.steps)} unit="걸음" sub="지금" />
        <Card icon={<Activity size={17} />} color="#FF6B00" title="걷기 + 달리기 거리" value={h.km.toFixed(1)} unit="km" sub="지금" />
        <Card icon={<Heart size={17} fill="#FF2D55" strokeWidth={0} />} color="#FF2D55" title="심박수" value={String(h.heart[h.heart.length - 1])} unit="BPM" sub="방금">
          <div className="flex items-end gap-[3px] h-[54px] mt-[8px]">
            {h.heart.map((v, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ height: `${(v / max) * 100}%`, background: v === max ? "#FF2D55" : "#FFB3C1" }} />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-black/40 mt-[4px]">
            <span>오전 0시</span>
            <span style={{ color: "#FF2D55" }}>최고 {max} BPM · {h.peakAt}</span>
            <span>지금</span>
          </div>
        </Card>
        <Card icon={<Flame size={17} />} color="#FF6B00" title="운동하기 시간" value={String(h.exercise)} unit="분" sub="지금" />
        <Card icon={<BedDouble size={17} />} color="#5AC8FA" title="수면" value={h.sleep} unit="" sub="어제" />
      </div>
      <TabBar
        active="sum"
        onChange={() => {}}
        tint="#007AFF"
        items={[
          { id: "sum", label: "요약", icon: <Heart size={24} fill="currentColor" strokeWidth={0} /> },
          { id: "share", label: "공유", icon: <Activity size={24} /> },
          { id: "browse", label: "둘러보기", icon: <Footprints size={24} /> },
        ]}
      />
    </div>
  );
}

/* '업무' 앱 — 겉보기엔 평범한 할 일 앱. 안에는 들어온 의뢰 · 진행 단계 · 보수 정산 */
import { useState } from "react";
import { ChevronLeft, Inbox, Loader, CheckCircle2, Wallet, Plus } from "lucide-react";
import { useData, update, type Job } from "../store";
import { TabBar, useStatusBar } from "../ui";

const STEPS = ["접수", "착수금", "진행", "보고", "잔금"];
const TINT = "#111";

function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-[4px] mt-[12px]">
      {STEPS.map((s, i) => (
        <div key={s} className="flex-1">
          <div className="h-[4px] rounded-full" style={{ background: i <= step ? TINT : "#E5E5EA" }} />
          <div className="text-[10px] mt-[4px] text-center" style={{ color: i <= step ? TINT : "#AEAEB2", fontWeight: i === step ? 700 : 400 }}>
            {s}
          </div>
        </div>
      ))}
    </div>
  );
}

function JobCard({ j, onOpen }: { j: Job; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left mx-0 rounded-[16px] bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold tabular text-black/45">#{j.code}</span>
        <span className="text-[12px] px-[8px] py-[3px] rounded-full bg-[#F2F2F7] text-black/60">{j.kind}</span>
      </div>
      <div className="text-[17px] font-semibold mt-[6px] leading-[23px]">{j.title}</div>
      <div className="text-[13px] text-black/50 mt-[4px]">
        {j.via} · {j.due}
      </div>
      {j.status !== "new" && <StepBar step={j.step} />}
    </button>
  );
}

function Detail({ j, onBack }: { j: Job; onBack: () => void }) {
  const set = (v: Partial<Job>) =>
    update((x) => {
      const y = x.jobs.find((z) => z.id === j.id);
      if (y) Object.assign(y, v);
    });
  return (
    <div className="absolute inset-0 z-30 bg-[#F2F2F7] push flex flex-col">
      <div style={{ paddingTop: "var(--sat)" }} className="bg-[#F2F2F7]">
        <div className="h-[44px] flex items-center px-2">
          <button data-back onClick={onBack} className="flex items-center text-[17px]" style={{ color: TINT }}>
            <ChevronLeft size={28} strokeWidth={2.2} /> 업무
          </button>
        </div>
      </div>
      <div className="flex-1 scroll px-[16px] pb-[40px]">
        <div className="text-[13px] font-bold tabular text-black/45">#{j.code}</div>
        <div className="text-[26px] font-bold leading-[32px] mt-[2px]">{j.title}</div>
        <div className="rounded-[14px] bg-white mt-[16px] overflow-hidden">
          {[
            ["경로", j.via],
            ["종류", j.kind],
            ["기한", j.due],
            ["보수", j.pay],
          ].map(([k, v], i) => (
            <div key={k} className={`flex px-[16px] py-[12px] text-[15px] ${i < 3 ? "border-b border-black/5" : ""}`}>
              <span className="w-[56px] text-black/45">{k}</span>
              <span className="flex-1">{v}</span>
            </div>
          ))}
        </div>
        <div className="rounded-[14px] bg-white mt-[12px] p-[16px] text-[15px] leading-[23px] whitespace-pre-wrap">{j.memo}</div>
        {j.status !== "new" && (
          <div className="rounded-[14px] bg-white mt-[12px] p-[16px]">
            <div className="text-[13px] font-semibold text-black/45">진행 단계</div>
            <StepBar step={j.step} />
          </div>
        )}
        {j.status === "new" ? (
          <div className="grid grid-cols-2 gap-[10px] mt-[18px]">
            <button onClick={() => (set({ status: "declined" }), onBack())} className="h-[50px] rounded-[14px] bg-white text-[16px] font-semibold text-[#FF3B30]">
              거절
            </button>
            <button onClick={() => set({ status: "doing", step: 0 })} className="h-[50px] rounded-[14px] text-white text-[16px] font-semibold" style={{ background: TINT }}>
              수락
            </button>
          </div>
        ) : j.status === "doing" ? (
          <button
            onClick={() => set(j.step >= STEPS.length - 1 ? { status: "done" } : { step: j.step + 1 })}
            className="w-full h-[50px] rounded-[14px] text-white text-[16px] font-semibold mt-[18px]"
            style={{ background: TINT }}
          >
            {j.step >= STEPS.length - 1 ? "완료 처리" : `다음 단계: ${STEPS[j.step + 1]}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Jobs() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = d.jobs.filter((j) => (tab === "new" ? j.status === "new" : tab === "doing" ? j.status === "doing" : tab === "done" ? j.status === "done" || j.status === "declined" : false));
  const cur = d.jobs.find((j) => j.id === openId);
  const titles: Record<string, string> = { new: "새 업무", doing: "진행 중", done: "끝난 업무", pay: "정산" };
  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      <div className="absolute inset-0 scroll px-[16px]" style={{ paddingTop: "calc(var(--sat) + 10px)", paddingBottom: 110 }}>
        <div className="flex items-center justify-between h-[44px]">
          <span className="text-[34px] font-bold">{titles[tab]}</span>
          <Plus size={26} style={{ color: TINT }} />
        </div>
        {tab === "pay" ? (
          <div className="rounded-[16px] bg-white overflow-hidden mt-[10px]">
            {d.jobs
              .filter((j) => j.status !== "declined")
              .map((j, i, arr) => (
                <div key={j.id} className={`flex items-center px-[16px] py-[13px] ${i < arr.length - 1 ? "border-b border-black/5" : ""}`}>
                  <span className="text-[13px] font-bold tabular text-black/45 w-[52px]">#{j.code}</span>
                  <span className="flex-1 text-[15px] truncate">{j.pay}</span>
                  <span className="text-[13px] font-semibold" style={{ color: j.status === "done" ? "#34C759" : j.step >= 1 ? "#FF9500" : "#AEAEB2" }}>
                    {j.status === "done" ? "정산 완료" : j.step >= 1 ? "착수금 받음" : "대기"}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-[10px] mt-[10px]">
            {list.length === 0 && <div className="text-center text-black/35 pt-[120px]">없음</div>}
            {list.map((j) => (
              <JobCard key={j.id} j={j} onOpen={() => setOpenId(j.id)} />
            ))}
          </div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint={TINT}
        items={[
          { id: "new", label: "새 업무", icon: <Inbox size={23} />, badge: d.jobs.filter((j) => j.status === "new").length || undefined },
          { id: "doing", label: "진행 중", icon: <Loader size={23} /> },
          { id: "done", label: "끝남", icon: <CheckCircle2 size={23} /> },
          { id: "pay", label: "정산", icon: <Wallet size={23} /> },
        ]}
      />
      {cur && <Detail j={cur} onBack={() => setOpenId(null)} />}
    </div>
  );
}

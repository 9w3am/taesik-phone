/* 뱅킹 — 가상의 은행 앱 (토스 계열 UI 문법). 이름은 부분 마스킹 */
import { useState } from "react";
import { Bell, Menu, ChevronRight, ChevronLeft, Search, Settings2, Home, LayoutGrid, Gift, Coins, Wallet } from "lucide-react";
import { useData, won } from "../store";
import { TabBar, useStatusBar } from "../ui";

const BLUE = "#3182F6";

function History({ onBack }: { onBack: () => void }) {
  const d = useData();
  const b = d.bank;
  let bal = b.balance;
  const rows = b.txs.map((t) => {
    const r = { ...t, after: bal };
    bal -= t.amount;
    return r;
  });
  const groups: [string, typeof rows][] = [];
  rows.forEach((r) => {
    const g = groups.find((x) => x[0] === r.when);
    if (g) g[1].push(r);
    else groups.push([r.when, [r]]);
  });
  return (
    <div className="absolute inset-0 bg-white z-20 push flex flex-col">
      <div style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[50px] flex items-center justify-between px-[10px]">
          <button onClick={onBack}>
            <ChevronLeft size={28} strokeWidth={2} className="text-[#4E5968]" />
          </button>
          <Settings2 size={22} className="text-[#4E5968] mr-[6px]" />
        </div>
      </div>
      <div className="flex-1 scroll pb-[60px]">
        <div className="px-[24px] pt-[6px]">
          <div className="text-[15px] text-[#6B7684] underline underline-offset-2">
            {b.name} {b.account}
          </div>
          <div className="text-[30px] font-bold tracking-[-0.02em] text-[#191F28] mt-[4px] tabular">{won(b.balance)}원</div>
          <div className="grid grid-cols-2 gap-[8px] mt-[18px]">
            <span className="h-[44px] rounded-[10px] bg-[#E8F3FF] text-[#1B64DA] text-[15px] font-semibold flex items-center justify-center">채우기</span>
            <span className="h-[44px] rounded-[10px] text-white text-[15px] font-semibold flex items-center justify-center" style={{ background: BLUE }}>
              보내기
            </span>
          </div>
        </div>
        <div className="h-[12px] bg-[#F2F4F6] mt-[24px]" />
        <div className="flex items-center justify-between px-[24px] py-[14px] text-[14px] text-[#6B7684]">
          <span>전체 · 최신순</span>
          <Search size={18} />
        </div>
        {groups.map(([when, list]) => (
          <div key={when}>
            <div className="px-[24px] pt-[14px] pb-[6px] text-[13px] text-[#8B95A1]">{when}</div>
            {list.map((t) => (
              <div key={t.id} className="flex items-center gap-[14px] px-[24px] py-[11px]">
                <span className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[15px] font-bold shrink-0" style={{ background: t.amount > 0 ? "#E8F3FF" : "#F2F4F6", color: t.amount > 0 ? "#1B64DA" : "#6B7684" }}>
                  {t.name.replace(/[^가-힣A-Za-z]/g, "")[0] ?? "·"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] text-[#191F28] truncate">{t.name}</div>
                  <div className="text-[13px] text-[#8B95A1]">{t.memo}</div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-semibold tabular" style={{ color: t.amount > 0 ? "#1B64DA" : "#191F28" }}>
                    {t.amount > 0 ? "" : "-"}
                    {won(Math.abs(t.amount))}원
                  </div>
                  <div className="text-[13px] text-[#8B95A1] tabular">{won(t.after)}원</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bank() {
  useStatusBar(true);
  const d = useData();
  const [hist, setHist] = useState(false);
  const [tab, setTab] = useState("home");
  const b = d.bank;
  const spent = b.txs.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0);
  return (
    <div className="absolute inset-0 bg-[#F2F4F6]">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 110 }}>
        <div className="h-[50px] flex items-center justify-between px-[20px]">
          <span className="text-[20px] font-extrabold tracking-[-0.04em] text-[#191F28]">뱅킹</span>
          <div className="flex gap-[18px] text-[#B0B8C1]">
            <Bell size={23} fill="#B0B8C1" strokeWidth={0} />
            <Menu size={24} />
          </div>
        </div>
        <div className="mx-[12px] mt-[6px] rounded-[22px] bg-white p-[22px] flex items-center">
          <span className="text-[17px] font-bold text-[#191F28] flex-1">내 계좌</span>
          <ChevronRight size={20} className="text-[#B0B8C1]" />
        </div>
        <button onClick={() => setHist(true)} className="mx-[12px] mt-[10px] rounded-[22px] bg-white p-[22px] w-[calc(100%-24px)] text-left">
          <div className="flex items-center gap-[14px]">
            <span className="w-[40px] h-[40px] rounded-full flex items-center justify-center" style={{ background: "#E8F3FF" }}>
              <Wallet size={21} color={BLUE} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#6B7684]">{b.name}</div>
              <div className="text-[20px] font-bold text-[#191F28] tabular tracking-[-0.02em]">{won(b.balance)}원</div>
            </div>
            <span className="h-[34px] px-[14px] rounded-[9px] bg-[#F2F4F6] text-[14px] font-semibold text-[#4E5968] flex items-center">송금</span>
          </div>
        </button>
        <div className="mx-[12px] mt-[10px] rounded-[22px] bg-white p-[22px]">
          <div className="flex items-center">
            <span className="text-[17px] font-bold text-[#191F28] flex-1">이번 달 쓴 금액</span>
            <ChevronRight size={20} className="text-[#B0B8C1]" />
          </div>
          <div className="text-[24px] font-bold text-[#191F28] mt-[6px] tabular">{won(spent)}원</div>
          <div className="flex h-[10px] rounded-full overflow-hidden mt-[14px] gap-[2px]">
            {[38, 22, 18, 12, 10].map((w, i) => (
              <span key={i} style={{ width: `${w}%`, background: ["#3182F6", "#6BA6FF", "#A7CBFF", "#D3E4FF", "#E5E8EB"][i] }} />
            ))}
          </div>
          <div className="text-[13px] text-[#8B95A1] mt-[10px]">현금 인출 · 고정지출 · 차량 · 주유 · 기타</div>
        </div>
        <div className="mx-[12px] mt-[10px] rounded-[22px] bg-white p-[22px]">
          <div className="text-[17px] font-bold text-[#191F28] mb-[12px]">자주 보내는 곳</div>
          {b.txs
            .filter((t) => t.amount < 0 && t.memo.includes("송금"))
            .slice(0, 3)
            .map((t) => (
              <div key={t.id} className="flex items-center py-[8px] text-[16px] text-[#333D4B]">
                <span className="flex-1">{t.name}</span>
                <span className="text-[14px] text-[#8B95A1]">{t.memo}</span>
              </div>
            ))}
        </div>
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#191F28"
        inactive="#B0B8C1"
        bg="rgba(255,255,255,0.96)"
        items={[
          { id: "home", label: "홈", icon: <Home size={24} fill={tab === "home" ? "#191F28" : "#B0B8C1"} strokeWidth={0} /> },
          { id: "benefit", label: "혜택", icon: <Gift size={24} /> },
          { id: "pay", label: "송금", icon: <Coins size={24} /> },
          { id: "all", label: "전체", icon: <LayoutGrid size={24} /> },
        ]}
      />
      {hist && <History onBack={() => setHist(false)} />}
    </div>
  );
}

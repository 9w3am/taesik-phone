/* 캐시워크 (개그용) — 걸으면 캐시 쌓이는 그 앱. 은행엔 수백만 원, 여기선 23원 */
import { useState } from "react";
import { Home, Gift, ShoppingBag, Users, MoreHorizontal, Bell, ChevronRight, Footprints, Flame, Check, Trophy } from "lucide-react";
import { useData, update, won } from "../store";
import { TabBar, useStatusBar } from "../ui";

const Y = "#FFD200";
const INK = "#1A1A1A";

function Coin({ size = 22 }: { size?: number }) {
  return (
    <span className="rounded-full flex items-center justify-center font-black shrink-0" style={{ width: size, height: size, background: Y, color: INK, fontSize: size * 0.55, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12)" }}>
      C
    </span>
  );
}

export default function CashWalk() {
  useStatusBar(true);
  const d = useData();
  const cw = d.cashwalk;
  const [tab, setTab] = useState("home");
  const [coins, setCoins] = useState(cw.bubbles);
  const [quizDone, setQuizDone] = useState<null | boolean>(null);
  const goal = 10000;
  const pct = Math.min(1, cw.steps / goal);
  const R = 92,
    C = 2 * Math.PI * R;
  const collect = () =>
    update((x) => {
      x.cashwalk.cash += 1;
    });

  return (
    <div className="absolute inset-0 bg-[#F6F6F6]">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 100 }}>
        {/* 상단 */}
        <div className="flex items-center justify-between px-[16px] h-[50px]">
          <span className="text-[20px] font-black tracking-[-0.04em]" style={{ color: INK }}>
            캐시워크
          </span>
          <div className="flex items-center gap-[12px]">
            <span className="h-[30px] pl-[4px] pr-[12px] rounded-full bg-white flex items-center gap-[6px] text-[14px] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <Coin size={22} />
              {won(cw.cash)}
            </span>
            <Bell size={22} />
          </div>
        </div>

        {tab === "home" && (
          <>
            {/* 걸음 원 + 동전 줍기 */}
            <div className="relative mx-[16px] rounded-[24px] bg-white pt-[26px] pb-[22px] flex flex-col items-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle cx="110" cy="110" r={R} fill="none" stroke="#F1F1F1" strokeWidth="14" />
                <circle cx="110" cy="110" r={R} fill="none" stroke={Y} strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 110 110)" />
              </svg>
              <div className="absolute top-[70px] flex flex-col items-center">
                <Footprints size={22} className="text-black/40" />
                <div className="text-[40px] font-black tracking-[-0.03em] tabular leading-[46px]">{won(cw.steps)}</div>
                <div className="text-[13px] text-black/45">목표 {won(goal)}걸음</div>
              </div>
              {/* 떠다니는 동전 */}
              {Array.from({ length: coins }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCoins((c) => c - 1);
                    collect();
                  }}
                  className="absolute flex flex-col items-center animate-bounce"
                  style={{ left: [22, 260, 40, 250, 150][i % 5], top: [40, 60, 170, 180, 14][i % 5], animationDelay: `${i * 0.2}s` }}
                >
                  <Coin size={34} />
                  <span className="text-[10px] font-bold mt-[2px]">+1</span>
                </button>
              ))}
              <div className="text-[13px] text-black/55 mt-[8px]">100걸음마다 1캐시 · 오늘 {Math.floor(cw.steps / 100) > 100 ? 100 : Math.floor(cw.steps / 100)}캐시 적립 가능</div>
            </div>

            {/* 오늘 번 돈 */}
            <div className="mx-[16px] mt-[12px] rounded-[20px] bg-white p-[18px] flex items-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex-1">
                <div className="text-[13px] text-black/50">오늘 걸어서 번 돈</div>
                <div className="text-[22px] font-black mt-[2px]">{cw.todayWon}원</div>
              </div>
              <span className="text-[13px] text-black/40">통장 잔액은 따로 있음</span>
            </div>

            {/* 출석 */}
            <div className="mx-[16px] mt-[12px] rounded-[20px] bg-white p-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold">출석 체크</span>
                <span className="text-[13px] font-bold" style={{ color: "#E8A400" }}>
                  {won(cw.streak)}일 연속
                </span>
              </div>
              <div className="grid grid-cols-7 gap-[6px] mt-[12px]">
                {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
                  <div key={w} className="flex flex-col items-center gap-[4px]">
                    <span className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: Y }}>
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <span className="text-[11px] text-black/45">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 업적 */}
            <div className="mx-[16px] mt-[12px] rounded-[20px] bg-white p-[18px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[16px] font-bold mb-[10px]">내 배지</div>
              {cw.badges.map((b) => (
                <div key={b} className="flex items-center gap-[10px] py-[7px]">
                  <span className="w-[32px] h-[32px] rounded-full bg-[#FFF4C2] flex items-center justify-center">
                    <Trophy size={16} className="text-[#C98F00]" />
                  </span>
                  <span className="text-[15px]">{b}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "benefit" && (
          <div className="mx-[16px] mt-[4px] rounded-[20px] bg-white p-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="text-[13px] font-bold" style={{ color: "#E8A400" }}>
              돈버는 퀴즈 · +10캐시
            </div>
            <div className="text-[18px] font-bold mt-[8px] leading-[26px]">{cw.quiz.q}</div>
            <div className="flex flex-col gap-[8px] mt-[16px]">
              {cw.quiz.options.map((o, i) => (
                <button
                  key={o}
                  disabled={quizDone !== null}
                  onClick={() => {
                    const ok = i === cw.quiz.answer;
                    setQuizDone(ok);
                    if (ok) update((x) => void (x.cashwalk.cash += 10));
                  }}
                  className="h-[48px] rounded-[12px] border text-[15px] text-left px-[14px]"
                  style={{ borderColor: quizDone !== null && i === cw.quiz.answer ? Y : "rgba(0,0,0,0.1)", background: quizDone !== null && i === cw.quiz.answer ? "#FFF8D6" : "#fff" }}
                >
                  {o}
                </button>
              ))}
            </div>
            {quizDone !== null && <div className="text-[14px] mt-[12px] text-center font-semibold">{quizDone ? "정답! 10캐시 적립" : "아쉬워요. 내일 다시 도전!"}</div>}
          </div>
        )}

        {tab === "shop" && (
          <>
            <div className="px-[18px] pb-[8px] text-[16px] font-bold">캐시로 교환</div>
            <div className="grid grid-cols-2 gap-[10px] px-[16px]">
              {cw.shop.map((it) => (
                <div key={it.name} className="rounded-[16px] bg-white p-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]" style={{ opacity: it.note ? 0.55 : 1 }}>
                  <div className="text-[14px] font-semibold leading-[19px] min-h-[38px]">{it.name}</div>
                  <div className="flex items-center gap-[4px] mt-[8px] text-[15px] font-black">
                    <Coin size={18} />
                    {won(it.price)}
                  </div>
                  {it.note && <div className="text-[12px] text-black/50 mt-[4px]">{it.note}</div>}
                </div>
              ))}
            </div>
            <div className="px-[18px] pt-[18px] pb-[6px] text-[16px] font-bold">교환 내역</div>
            <div className="mx-[16px] rounded-[16px] bg-white overflow-hidden">
              {cw.history.map((h, i) => (
                <div key={i} className="flex items-center px-[16px] py-[12px] border-b border-black/5 last:border-0 text-[14px]">
                  <span className="flex-1">{h.name}</span>
                  <span className="text-black/45">{h.when}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "friends" && (
          <>
            <div className="px-[18px] pb-[8px] text-[16px] font-bold flex items-center gap-[6px]">
              <Flame size={18} className="text-[#FF6B00]" /> 친구 걸음 랭킹
            </div>
            <div className="mx-[16px] rounded-[16px] bg-white overflow-hidden">
              {[{ name: "나", steps: cw.steps }, ...cw.friends]
                .sort((a, b) => b.steps - a.steps)
                .map((f, i) => (
                  <div key={f.name} className="flex items-center gap-[12px] px-[16px] py-[12px] border-b border-black/5 last:border-0">
                    <span className="w-[22px] text-[15px] font-black" style={{ color: i === 0 ? "#E8A400" : "rgba(0,0,0,0.35)" }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[15px]" style={{ fontWeight: f.name === "나" ? 700 : 400 }}>
                      {f.name}
                    </span>
                    <span className="text-[14px] tabular">{won(f.steps)}걸음</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {tab === "more" && (
          <div className="mx-[16px] rounded-[16px] bg-white overflow-hidden">
            {["걸음 수 기록", "캐시 내역", "공지사항", "자주 묻는 질문", "설정"].map((x) => (
              <div key={x} className="flex items-center px-[16px] py-[14px] border-b border-black/5 last:border-0 text-[15px]">
                <span className="flex-1">{x}</span>
                <ChevronRight size={18} className="text-black/30" />
              </div>
            ))}
          </div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint={INK}
        inactive="#B5B5B5"
        bg="rgba(255,255,255,0.97)"
        items={[
          { id: "home", label: "홈", icon: <Home size={23} /> },
          { id: "benefit", label: "혜택", icon: <Gift size={23} /> },
          { id: "shop", label: "쇼핑", icon: <ShoppingBag size={23} /> },
          { id: "friends", label: "친구", icon: <Users size={23} /> },
          { id: "more", label: "더보기", icon: <MoreHorizontal size={23} /> },
        ]}
      />
    </div>
  );
}

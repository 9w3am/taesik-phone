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
  const [pending, setPending] = useState(cw.bubbles);
  const [quizDone, setQuizDone] = useState<null | boolean>(null);
  const goal = 10000;
  const pct = Math.min(1, cw.steps / goal);

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
            {/* 오늘 걸음 + 적립 버튼 (실제 앱 메인처럼) */}
            <div className="mx-[16px] rounded-[24px] px-[20px] pt-[20px] pb-[22px]" style={{ background: Y }}>
              <div className="flex items-center gap-[6px] text-[14px] font-semibold" style={{ color: INK }}>
                <Footprints size={16} /> 오늘 걸음
              </div>
              <div className="flex items-end justify-between mt-[2px]">
                <div className="text-[44px] font-black tracking-[-0.04em] tabular leading-[50px]" style={{ color: INK }}>
                  {won(cw.steps)}
                </div>
                <button
                  onClick={() => {
                    if (!pending) return;
                    update((x) => void (x.cashwalk.cash += pending));
                    setPending(0);
                  }}
                  className="w-[86px] h-[86px] rounded-full flex flex-col items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.18)] active:scale-95 transition-transform"
                  style={{ background: INK, color: Y }}
                >
                  <span className="text-[22px] font-black leading-[24px]">{pending ? `+${pending}` : "0"}</span>
                  <span className="text-[13px] font-bold">{pending ? "받기" : "완료"}</span>
                </button>
              </div>
              <div className="h-[8px] rounded-full bg-black/10 mt-[14px] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: INK }} />
              </div>
              <div className="flex justify-between text-[12px] font-semibold mt-[6px]" style={{ color: "rgba(26,26,26,0.6)" }}>
                <span>100걸음 = 1캐시</span>
                <span>하루 최대 100캐시</span>
              </div>
            </div>

            {/* 메뉴 */}
            <div className="mx-[16px] mt-[12px] rounded-[20px] bg-white py-[16px] grid grid-cols-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              {[
                ["출석체크", "home", <Check key="c" size={20} strokeWidth={2.6} />],
                ["돈버는 퀴즈", "benefit", <Gift key="g" size={20} />],
                ["캐시딜", "shop", <ShoppingBag key="s" size={20} />],
                ["친구", "friends", <Users key="u" size={20} />],
              ].map(([label, to, icon]) => (
                <button key={label as string} onClick={() => setTab(to as string)} className="flex flex-col items-center gap-[6px]">
                  <span className="w-[44px] h-[44px] rounded-[14px] bg-[#FFF6CC] flex items-center justify-center" style={{ color: INK }}>
                    {icon}
                  </span>
                  <span className="text-[12px] font-medium">{label as string}</span>
                </button>
              ))}
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

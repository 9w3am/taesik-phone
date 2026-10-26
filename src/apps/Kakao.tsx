/* 카카오톡 */
import { useEffect, useState } from "react";
import { Megaphone, ChevronDown, ChevronRight, Info, Search, MessageCirclePlus, Settings, UserPlus, ChevronLeft, Menu, Plus, Smile, Hash, BellOff, User, MessageCircle, ShoppingBag, MoreHorizontal, Music, Mail, CalendarDays, Wallet, FolderClosed, Gift, Ticket } from "lucide-react";
import { useData, won, type Thread, type Msg } from "../store";
import { photoSrc } from "../photos";
import { KakaoAvatar, TabBar, useStatusBar, usePhoneCtx, Img } from "../ui";
import { markRead, preview, useAutoBottom, useComposer, useFresh } from "./Messages";

const BADGE = "#FA5338";
const EXPLORE = [
  { name: "야간 탁송·대리 기사방", desc: "당일 현금 정산 · 신원 묻지 않음", members: 412, lock: true },
  { name: "현금 매입 · 중고차 급매", desc: "명의 이전 상담은 갠톡으로", members: 188, lock: false },
  { name: "OO동 새벽 동네방", desc: "새벽에 깨어 있는 사람들", members: 96, lock: false },
  { name: "철거·용역 인력 (일당)", desc: "현장 투입 가능하신 분만", members: 263, lock: true },
];
const KBG = "#BACEE0";

function OpenChatIcon({ size = 25 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3.5c-4.8 0-8.5 3.1-8.5 7 0 2.4 1.5 4.6 3.8 5.8l-.8 3.2 3.6-2.2c.6.1 1.2.2 1.9.2 4.8 0 8.5-3.1 8.5-7s-3.7-7-8.5-7z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </svg>
  );
}

function PayCard({ m, mine }: { m: Msg; mine: boolean }) {
  return (
    <div className="w-[210px] rounded-[12px] overflow-hidden bg-white" style={{ boxShadow: "0 0.5px 0 rgba(0,0,0,0.06)" }}>
      <div className="px-[14px] pt-[12px] pb-[13px]" style={{ background: "#FEE500" }}>
        <div className="flex items-center gap-[6px] text-[12px] font-semibold text-[#3A1D1D]/80">
          <span className="w-[18px] h-[18px] rounded-full bg-[#3A1D1D] text-[#FEE500] text-[11px] font-bold flex items-center justify-center">₩</span>
          {mine ? "송금" : "카카오페이"}
        </div>
        <div className="text-[19px] font-bold text-[#191919] mt-[6px] tracking-[-0.02em]">{won(m.amount || 0)}원</div>
        {m.text && <div className="text-[13px] text-[#191919]/70 mt-[2px]">{m.text}</div>}
      </div>
      <div className="px-[14px] py-[9px] text-[12px] text-[#888]">{mine ? "받는 분이 받았어요" : "카카오페이"}</div>
    </div>
  );
}

function Room({ t, onBack, unread }: { t: Thread; onBack: () => void; unread: number }) {
  const d = useData();
  const c = useComposer(t);
  const ref = useAutoBottom(t.messages.length);
  const fresh = useFresh(t.messages);
  const lastIdx = t.messages.length - 1;
  // 내가 보낸 마지막 말풍선 옆 노란 1 → 몇 초 뒤 상대가 읽으면 사라짐
  const [readGone, setReadGone] = useState(false);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    setReadGone(false);
    const tm = setTimeout(() => setReadGone(true), 4000);
    return () => clearTimeout(tm);
  }, [t.messages.length]);
  return (
    <div className="absolute inset-0 z-30 flex flex-col push" style={{ background: KBG }}>
      <div className="relative z-10" style={{ paddingTop: "var(--sat)", background: KBG }}>
        <div className="h-[48px] flex items-center px-[6px]">
          <button data-back onClick={onBack} className="flex items-center h-full pr-1">
            <ChevronLeft size={30} strokeWidth={2} />
            {unread > 0 && <span className="text-[15px] font-medium -ml-1">{unread > 999 ? "999+" : unread}</span>}
          </button>
          <div className="flex-1 min-w-0 flex items-baseline gap-[5px] ml-1">
            <span className="text-[17px] font-semibold truncate">{t.name}</span>
            {t.members && <span className="text-[15px] text-black/45 shrink-0">{t.members}</span>}
          </div>
          <div className="flex items-center gap-[16px] pr-[10px]">
            <Search size={23} strokeWidth={1.9} />
            <Menu size={24} strokeWidth={1.9} />
          </div>
        </div>
      </div>
      {t.notice && (
        <div className="relative z-10 mx-[10px] mt-[2px] mb-[4px] rounded-[10px] bg-white/95 px-[12px] py-[9px] flex items-center gap-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <Megaphone size={17} className="text-[#3A1D1D] shrink-0" />
          <span className="text-[13px] text-[#191919] truncate flex-1">{t.notice}</span>
          <ChevronDown size={16} className="text-black/40 shrink-0" />
        </div>
      )}
      <div ref={ref} className="flex-1 scroll px-[10px] pt-[8px] pb-[12px]">
        {t.messages.map((m, i) => {
          if (m.kind === "date")
            return (
              <div key={m.id} className="flex justify-center my-[12px]">
                <span className="text-[12px] px-[12px] py-[5px] rounded-full text-white/95 flex items-center gap-[5px]" style={{ background: "rgba(0,0,0,0.15)" }}>
                  <CalendarDays size={12} />
                  {m.text}
                  <ChevronRight size={11} />
                </span>
              </div>
            );
          if (m.from === "system")
            return (
              <div key={m.id} className="flex justify-center my-[10px]">
                <span className="text-[12px] px-[12px] py-[5px] rounded-full text-white/95 text-center leading-[16px] max-w-[88%]" style={{ background: "rgba(0,0,0,0.15)" }}>
                  {m.text}
                </span>
              </div>
            );
          const prev = t.messages[i - 1];
          const mine = m.from === "me";
          const first = !prev || prev.from !== m.from || (prev.who || "") !== (m.who || "") || prev.from === ("system" as string);
          const body =
            m.kind === "deleted" ? (
              <div className="px-[10px] py-[7px] text-[14px] rounded-[12px] flex items-center gap-[5px]" style={{ background: mine ? "#FEE500" : "#fff", color: "rgba(0,0,0,0.4)" }}>
                <Info size={14} />
                삭제된 메시지입니다.
              </div>
            ) : m.kind === "pay" ? (
              <PayCard m={m} mine={mine} />
            ) : m.kind === "photo" ? (
              <Img src={photoSrc(m.photo || "", d.photos)} className="w-[190px] h-[250px] rounded-[12px]" />
            ) : (
              <div className="relative px-[10px] py-[7px] text-[15px] leading-[20px] rounded-[12px] whitespace-pre-wrap" style={{ background: mine ? "#FEE500" : "#fff", color: "#191919", wordBreak: "keep-all", overflowWrap: "anywhere", ...(first ? (mine ? { borderTopRightRadius: 3 } : { borderTopLeftRadius: 3 }) : {}) }}>
                {first && (
                  <span
                    className="absolute top-0 w-[9px] h-[11px]"
                    style={{ background: mine ? "#FEE500" : "#fff", ...(mine ? { right: -6, clipPath: "polygon(0 0, 100% 0, 0 100%)" } : { left: -6, clipPath: "polygon(0 0, 100% 0, 100% 100%)" }) }}
                  />
                )}
                {m.text}
              </div>
            );
          if (mine)
            return (
              <div key={m.id} className={`flex justify-end items-end gap-[5px] pr-[4px] ${fresh(m.id) ? "bubble-in" : ""}`} style={{ marginTop: first ? 10 : 4, transformOrigin: "100% 100%" }}>
                {i === lastIdx && !readGone && t.name !== "나와의 채팅" && <span className="text-[11px] font-bold text-[#FEE500] mb-[2px]" style={{ textShadow: "0 0 1px rgba(0,0,0,0.15)" }}>1</span>}
                <div className="max-w-[72%]">{body}</div>
              </div>
            );
          return (
            <div key={m.id} className={`flex gap-[8px] pl-[2px] ${fresh(m.id) ? "bubble-in" : ""}`} style={{ marginTop: first ? 12 : 4, transformOrigin: "0 100%" }}>
              <div className="w-[40px] shrink-0">{first && <KakaoAvatar size={40} seed={m.who || t.name} />}</div>
              <div className="max-w-[70%] min-w-0">
                {first && <div className="text-[12px] text-black/70 mb-[5px] ml-[2px]">{m.who || t.name}</div>}
                <div className="pl-[4px]">{body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white flex items-end gap-[6px] px-[8px] pt-[7px]" style={{ paddingBottom: "calc(var(--kbsab) + 2px)" }}>
        <span className="w-[34px] h-[34px] flex items-center justify-center text-[#555] shrink-0">
          <Plus size={26} strokeWidth={1.6} />
        </span>
        <div className="flex-1 min-h-[36px] rounded-[18px] bg-[#F3F3F3] flex items-center pl-[12px] pr-[6px]">
          <textarea
            rows={1}
            value={c.text}
            readOnly={!c.editable}
            onChange={(e) => c.setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                c.send();
              }
            }}
            placeholder="메시지 입력"
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className="flex-1 resize-none outline-none bg-transparent text-[15px] leading-[20px] py-[8px] max-h-[80px] placeholder:text-[#aaa]"
          />
          <Smile size={23} strokeWidth={1.6} className="text-[#555] shrink-0" />
        </div>
        {c.canSend ? (
          <button onClick={() => c.send()} className="h-[36px] px-[12px] rounded-[18px] text-[15px] font-semibold shrink-0" style={{ background: "#FEE500", color: "#191919" }}>
            전송
          </button>
        ) : (
          <span className="w-[34px] h-[36px] flex items-center justify-center text-[#555] shrink-0">
            <Hash size={22} strokeWidth={1.7} />
          </span>
        )}
      </div>
    </div>
  );
}

function ChatRow({ t, onClick }: { t: Thread; onClick: () => void }) {
  const last = [...t.messages].reverse().find((m) => m.from !== "system") ?? t.messages[t.messages.length - 1];
  return (
    <button onClick={onClick} className="w-full flex items-center gap-[12px] px-[16px] py-[8px] text-left active:bg-black/[0.04]">
      <KakaoAvatar size={48} group={!!t.members} seed={t.name === "카카오페이" || t.name === "나와의 채팅" ? undefined : t.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[5px]">
          <span className="text-[16px] font-semibold truncate text-[#191919]">{t.name}</span>
          {t.members && <span className="text-[14px] text-black/35 shrink-0">{t.members}</span>}
          {t.muted && <BellOff size={13} className="text-black/30 shrink-0" />}
        </div>
        <div className="text-[14px] text-black/50 truncate mt-[2px] leading-[18px]">{last ? (last.who ? `${preview(last)}` : preview(last)) : ""}</div>
      </div>
      <div className="flex flex-col items-end gap-[6px] self-start pt-[3px] shrink-0">
        <span className="text-[12px] text-black/35">{t.last}</span>
        {t.unread > 0 && (
          <span className="min-w-[20px] h-[20px] px-[6px] rounded-full text-white text-[12px] font-semibold flex items-center justify-center" style={{ background: BADGE }}>
            {t.unread > 300 ? "300+" : t.unread}
          </span>
        )}
      </div>
    </button>
  );
}

export default function Kakao() {
  useStatusBar(true);
  const d = useData();
  const { appArg } = usePhoneCtx();
  const [tab, setTab] = useState("chats");
  const [openSeg, setOpenSeg] = useState<"joined" | "explore">("joined");
  const [join, setJoin] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pwBad, setPwBad] = useState(false);
  const [openId, setOpenId] = useState<string | null>((appArg as string) || null);
  useEffect(() => void ((window as unknown as { __phoneThread?: string | null }).__phoneThread = openId), [openId]);
  const list = d.threads.filter((t) => t.app === "kakao");
  useEffect(() => {
    if (openId) markRead(openId);
  }, [openId]);
  const cur = list.find((t) => t.id === openId);
  const totalUnread = list.reduce((a, t) => a + t.unread, 0);
  const friends = list.filter((t) => !t.members && !["카카오페이", "나와의 채팅"].includes(t.name));

  const Header = ({ title, icons }: { title: string; icons: React.ReactNode }) => (
    <div className="flex items-center justify-between px-[16px] h-[52px]" style={{ marginTop: "var(--sat)" }}>
      <span className="text-[22px] font-bold text-[#191919] tracking-[-0.02em]">{title}</span>
      <div className="flex items-center gap-[18px] text-[#191919]">{icons}</div>
    </div>
  );

  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll" style={{ paddingBottom: 100 }}>
        {tab === "friends" && (
          <>
            <Header
              title="친구"
              icons={
                <>
                  <Search size={23} strokeWidth={1.8} />
                  <UserPlus size={23} strokeWidth={1.8} />
                  <Music size={22} strokeWidth={1.8} />
                  <Settings size={23} strokeWidth={1.8} />
                </>
              }
            />
            <div className="flex items-center gap-[14px] px-[16px] py-[10px]">
              <KakaoAvatar size={60} />
              <div>
                <div className="text-[17px] font-semibold">{d.owner}</div>
                {d.kakaoProfile.status && <div className="text-[13px] text-black/45 mt-[2px]">{d.kakaoProfile.status}</div>}
              </div>
            </div>
            <div className="h-[0.5px] bg-black/10 mx-[16px] my-[6px]" />
            <div className="px-[16px] pt-[10px] pb-[6px] text-[12px] text-black/45">친구 {friends.length}</div>
            {friends.map((t) => (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full flex items-center gap-[12px] px-[16px] py-[7px] text-left active:bg-black/[0.04]">
                <KakaoAvatar size={44} seed={t.name} />
                <span className="text-[16px] text-[#191919]">{t.name}</span>
              </button>
            ))}
          </>
        )}
        {tab === "chats" && (
          <>
            <Header
              title="채팅"
              icons={
                <>
                  <Search size={23} strokeWidth={1.8} />
                  <MessageCirclePlus size={23} strokeWidth={1.8} />
                  <Settings size={23} strokeWidth={1.8} />
                </>
              }
            />
            {list.map((t) => (
              <ChatRow key={t.id} t={t} onClick={() => setOpenId(t.id)} />
            ))}
          </>
        )}
        {tab === "open" && (
          <>
            <Header
              title="오픈채팅"
              icons={
                <>
                  <Search size={23} strokeWidth={1.8} />
                  <Plus size={24} strokeWidth={1.8} />
                </>
              }
            />
            <div className="flex gap-[8px] px-[16px] pb-[10px]">
              {(["joined", "explore"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setOpenSeg(k)}
                  className={`px-[14px] h-[32px] rounded-full text-[14px] flex items-center ${openSeg === k ? "bg-[#191919] text-white font-semibold" : "border border-black/10"}`}
                >
                  {k === "joined" ? "참여중" : "탐색"}
                </button>
              ))}
            </div>
            {openSeg === "joined" &&
              (list.some((t) => t.members) ? (
                list.filter((t) => t.members).map((t) => <ChatRow key={t.id} t={t} onClick={() => setOpenId(t.id)} />)
              ) : (
                <div className="flex flex-col items-center text-center pt-[140px] px-10">
                  <div className="text-[16px] font-semibold">참여 중인 오픈채팅이 없어요</div>
                  <div className="text-[13px] text-black/45 mt-[6px]">관심사가 같은 사람들과 대화해 보세요</div>
                </div>
              ))}
            {openSeg === "explore" && (
              <div className="flex flex-col items-center text-center pt-[140px] px-10">
                <div className="text-[16px] font-semibold">검색어를 입력해 오픈채팅을 찾아보세요</div>
              </div>
            )}
          </>
        )}
        {tab === "shop" && (
          <>
            <Header title="쇼핑" icons={<Search size={23} strokeWidth={1.8} />} />
            <div className="flex gap-[8px] px-[16px] pb-[14px] overflow-x-auto no-scrollbar">
              {["선물하기", "쇼핑하기", "메이커스", "쇼핑라이브"].map((x, i) => (
                <span key={x} className={`px-[14px] h-[32px] rounded-full text-[14px] flex items-center shrink-0 ${i === 0 ? "bg-[#191919] text-white font-semibold" : "border border-black/10"}`}>
                  {x}
                </span>
              ))}
            </div>
            <div className="flex flex-col items-center text-center pt-[120px] px-10">
              <div className="text-[16px] font-semibold">최근 본 상품이 없어요</div>
              <div className="text-[13px] text-black/45 mt-[6px]">관심 있는 상품을 둘러보세요</div>
            </div>
          </>
        )}
        {tab === "more" && (
          <>
            <Header
              title="더보기"
              icons={
                <>
                  <Search size={23} strokeWidth={1.8} />
                  <Settings size={23} strokeWidth={1.8} />
                </>
              }
            />
            <div className="mx-[16px] rounded-[14px] p-[16px] bg-[#F7F7F7]">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-black/50">페이머니</span>
                <span className="text-[13px] text-black/50">송금 · 결제</span>
              </div>
              <div className="text-[22px] font-bold mt-[4px]">412,300원</div>
            </div>
            <div className="grid grid-cols-4 gap-y-[22px] px-[10px] pt-[24px]">
              {[
                [Mail, "메일"],
                [CalendarDays, "캘린더"],
                [FolderClosed, "톡서랍"],
                [Wallet, "지갑"],
                [Gift, "선물하기"],
                [Ticket, "이모티콘"],
              ].map(([I, l]) => {
                const C = I as typeof Mail;
                return (
                  <div key={l as string} className="flex flex-col items-center gap-[6px] text-[12px] text-black/70">
                    <C size={25} strokeWidth={1.6} />
                    {l as string}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#191919"
        inactive="#9A9A9A"
        bg="rgba(255,255,255,0.96)"
        items={[
          { id: "friends", label: "친구", icon: <User size={25} strokeWidth={tab === "friends" ? 2.3 : 1.6} /> },
          { id: "chats", label: "채팅", icon: <MessageCircle size={25} strokeWidth={tab === "chats" ? 2.3 : 1.6} />, badge: totalUnread > 0 ? Math.min(totalUnread, 999) : undefined },
          { id: "open", label: "오픈채팅", icon: <OpenChatIcon /> },
          { id: "shop", label: "쇼핑", icon: <ShoppingBag size={24} strokeWidth={tab === "shop" ? 2.3 : 1.6} /> },
          { id: "more", label: "더보기", icon: <MoreHorizontal size={25} strokeWidth={tab === "more" ? 2.3 : 1.6} /> },
        ]}
      />
      {join && (
        <div className="absolute inset-0 z-40 flex items-end fade" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => (setJoin(null), setPw(""))}>
          <div className="w-full bg-white rounded-t-[18px] px-[20px] pt-[22px] sheet" style={{ paddingBottom: "calc(var(--kbsab) + 16px)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <KakaoAvatar size={64} group />
              <div className="text-[18px] font-bold mt-[10px] text-center">{join}</div>
              <div className="text-[13px] text-black/45 mt-[4px]">{EXPLORE.find((r) => r.name === join)?.desc}</div>
            </div>
            {EXPLORE.find((r) => r.name === join)?.lock && (
              <input
                value={pw}
                onChange={(e) => (setPw(e.target.value), setPwBad(false))}
                placeholder="참여 코드 입력"
                className={`w-full h-[46px] mt-[18px] rounded-[10px] bg-[#F3F3F3] px-[14px] text-[15px] outline-none ${pwBad ? "shake" : ""}`}
              />
            )}
            {pwBad && <div className="text-[13px] text-[#FA5338] mt-[6px] text-center">{EXPLORE.find((r) => r.name === join)?.lock ? "참여 코드가 올바르지 않습니다." : "방장 승인 대기 중입니다. 승인되면 알려드릴게요."}</div>}
            <button
              onClick={() => setPwBad(true)}
              className="w-full h-[50px] mt-[14px] rounded-[10px] text-[16px] font-semibold"
              style={{ background: "#FEE500", color: "#191919" }}
            >
              참여하기
            </button>
          </div>
        </div>
      )}
      {cur && <Room t={cur} onBack={() => setOpenId(null)} unread={list.filter((x) => x.id !== cur.id).reduce((a, x) => a + x.unread, 0)} />}
    </div>
  );
}

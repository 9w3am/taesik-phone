/* 아이폰 기본 앱: 메일 · 미리 알림 · 지갑 — 실제 iOS 화면 · 동작 그대로 (내용은 편집 화면에서) */
import { useState } from "react";
import { ChevronRight, SquarePen, Inbox, Send as SendIcon, ShieldAlert, Trash2, Reply, Flag, FolderInput, Plus, Calendar as CalIcon, CalendarClock, List, CheckCircle2, Circle, MoreHorizontal, Search, Info, ArrowUp, Eye, EyeOff, Wifi } from "lucide-react";
import { useData, update, uid, type Mail, type Reminder } from "../store";
import { LargeTitle, NavBar, useScrolled, useStatusBar } from "../ui";
import { Avatar, Bar, Push, Sheet } from "./moreKit";

/* ═════════════ 메일 ═════════════ */
const BOX: Record<Mail["box"], [string, React.ReactNode]> = {
  inbox: ["받은 편지함", <Inbox key="i" size={24} />],
  sent: ["보낸 편지함", <SendIcon key="s" size={22} />],
  junk: ["정크", <ShieldAlert key="j" size={23} />],
  trash: ["휴지통", <Trash2 key="t" size={22} />],
};
const nowLabel = () => {
  const d = new Date();
  const h = d.getHours();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const Toolbar = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute bottom-0 left-0 right-0 blur-bar flex items-center justify-between px-[18px] pt-[10px] text-[#007AFF] z-10" style={{ paddingBottom: "calc(var(--sab) + 4px)", background: "rgba(249,249,249,0.92)", boxShadow: "inset 0 0.5px 0 var(--sep)" }}>
    {children}
  </div>
);
function Compose({ init, onClose }: { init: { to: string; subject: string; body: string }; onClose: () => void }) {
  const d = useData();
  const [f, setF] = useState(init);
  const send = () => {
    update((x) => void x.mail.unshift({ id: uid(), from: "나", addr: f.to, subject: f.subject || "(제목 없음)", body: f.body, when: nowLabel(), unread: false, box: "sent" }));
    onClose();
  };
  const row = "flex items-center gap-[6px] px-[16px] py-[11px] border-b border-black/10 text-[16px]";
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-center justify-between px-[16px] h-[52px]">
        <button onClick={onClose} className="text-[17px] text-[#007AFF]">
          취소
        </button>
        <span className="text-[17px] font-semibold">{f.subject || "새로운 메시지"}</span>
        <button onClick={send} disabled={!d.allowSend || !f.to.trim()} aria-label="보내기" className="w-[32px] h-[32px] rounded-full bg-[#007AFF] text-white flex items-center justify-center disabled:opacity-30">
          <ArrowUp size={20} strokeWidth={2.6} />
        </button>
      </div>
      <label className={row}>
        <span className="text-black/45">받는 사람:</span>
        <input value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className="flex-1 outline-none bg-transparent" />
      </label>
      <div className={row}>
        <span className="text-black/45">참조/숨은 참조, 보낸 사람:</span>
      </div>
      <label className={row}>
        <span className="text-black/45">제목:</span>
        <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="flex-1 outline-none bg-transparent" />
      </label>
      <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} className="flex-1 px-[16px] py-[12px] text-[16px] outline-none resize-none" placeholder={"\n\niPhone에서 보냄"} />
    </Sheet>
  );
}
export function MailApp() {
  useStatusBar(true);
  const d = useData();
  const [box, setBox] = useState<Mail["box"] | null>("inbox");
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [compose, setCompose] = useState<null | { to: string; subject: string; body: string }>(null);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const list = d.mail.filter((m) => m.box === box && (!q.trim() || `${m.from} ${m.subject} ${m.body}`.toLowerCase().includes(q.trim().toLowerCase())));
  const cur = d.mail.find((m) => m.id === openId);
  const set = (id: string, v: Partial<Mail>) =>
    update((x) => {
      const y = x.mail.find((z) => z.id === id);
      if (y) Object.assign(y, v);
    });
  const open = (m: Mail) => {
    setOpenId(m.id);
    if (m.unread) set(m.id, { unread: false });
  };
  return (
    <div className="absolute inset-0 bg-white">
      {box === null ? (
        <>
          <NavBar title="메일상자" scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} />
          <div ref={ref} className="absolute inset-0 scroll bg-[#F2F2F7]" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
            <LargeTitle>메일상자</LargeTitle>
            <div className="mx-4 rounded-[12px] bg-white overflow-hidden">
              {(Object.keys(BOX) as Mail["box"][]).map((b, i, arr) => {
                const n = d.mail.filter((m) => m.box === b && (b === "inbox" ? m.unread : true)).length;
                return (
                  <button key={b} onClick={() => setBox(b)} className="w-full flex items-center gap-[14px] pl-[14px] text-left active:bg-black/5">
                    <span className="text-[#007AFF] w-[26px] flex justify-center">{BOX[b][1]}</span>
                    <span className={`flex-1 flex items-center py-[12px] pr-[12px] ${i < arr.length - 1 ? "hair-b" : ""}`}>
                      <span className="flex-1 text-[17px]">{BOX[b][0]}</span>
                      {n > 0 && <span className="text-[17px] text-black/45 mr-1">{n}</span>}
                      <ChevronRight size={18} className="text-black/25" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <NavBar title={BOX[box][0]} back="메일상자" onBack={() => (setBox(null), setQ(""))} scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} />
          <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
            <LargeTitle>{BOX[box][0]}</LargeTitle>
            <div className="px-4 pb-2">
              <label className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
                <Search size={16} className="shrink-0" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="flex-1 min-w-0 bg-transparent outline-none text-black placeholder:text-[#8e8e93]" />
              </label>
            </div>
            {list.length === 0 && <div className="text-center text-black/35 pt-[100px]">{q ? "결과 없음" : "메일 없음"}</div>}
            {list.map((m) => (
              <button key={m.id} onClick={() => open(m)} className="w-full flex text-left active:bg-black/5">
                <span className="w-[26px] flex flex-col items-center gap-[4px] pt-[16px] shrink-0">
                  {m.unread && <span className="w-[10px] h-[10px] rounded-full bg-[#007AFF]" />}
                  {m.flag && <Flag size={11} fill="#FF9500" color="#FF9500" />}
                </span>
                <div className="flex-1 min-w-0 py-[10px] pr-4 hair-b">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 text-[17px] font-semibold truncate">{box === "sent" ? m.addr || "받는 사람 없음" : m.from}</span>
                    <span className="text-[15px] text-black/45 shrink-0 flex items-center">
                      {m.when}
                      <ChevronRight size={15} className="text-black/25 ml-1" />
                    </span>
                  </div>
                  <div className="text-[15px] truncate">{m.subject}</div>
                  <div className="text-[15px] text-black/45 leading-[20px] line-clamp-2">{m.body.replace(/\n+/g, " ") || "본문 없음"}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      <Toolbar>
        <span className="w-[24px]" />
        <span className="text-[11px] text-black/70">방금 업데이트됨</span>
        <button onClick={() => setCompose({ to: "", subject: "", body: "" })} aria-label="새로운 메시지">
          <SquarePen size={24} />
        </button>
      </Toolbar>
      {cur && (
        <Push>
          <Bar onBack={() => setOpenId(null)} back={BOX[cur.box][0]} border={false} />
          <div className="flex-1 scroll px-4 pb-[90px]">
            <div className="flex items-center gap-[12px] py-[10px] hair-b">
              <Avatar name={cur.from} size={42} hue={210} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline">
                  <span className="flex-1 text-[17px] font-semibold truncate">{cur.from}</span>
                  <span className="text-[14px] text-black/45">{cur.when}</span>
                </div>
                <div className="text-[14px] text-black/45 truncate">{cur.box === "sent" ? `받는 사람: ${cur.addr}` : "받는 사람: 나"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-[14px]">
              <div className="flex-1 text-[22px] font-bold leading-[28px]">{cur.subject}</div>
              {cur.flag && <Flag size={18} fill="#FF9500" color="#FF9500" className="mt-[5px]" />}
            </div>
            {cur.box !== "sent" && <div className="text-[13px] text-black/40 mt-[2px]">{cur.addr}</div>}
            <div className="text-[16px] leading-[24px] mt-[18px] whitespace-pre-wrap">{cur.body}</div>
          </div>
          <Toolbar>
            <button onClick={() => set(cur.id, { flag: !cur.flag })} aria-label="깃발">
              <Flag size={22} fill={cur.flag ? "#FF9500" : "none"} color={cur.flag ? "#FF9500" : undefined} />
            </button>
            <button onClick={() => (set(cur.id, { box: cur.box === "junk" ? "inbox" : "junk" }), setOpenId(null))} aria-label="정크로 이동">
              <FolderInput size={23} />
            </button>
            <button onClick={() => (set(cur.id, { box: "trash" }), setOpenId(null))} aria-label="휴지통">
              <Trash2 size={22} />
            </button>
            <button onClick={() => setCompose({ to: cur.addr, subject: `Re: ${cur.subject}`, body: `\n\n${cur.when}, ${cur.from} 작성:\n> ${cur.body.split("\n").join("\n> ")}` })} aria-label="답장">
              <Reply size={24} />
            </button>
            <button onClick={() => setCompose({ to: "", subject: "", body: "" })} aria-label="새로운 메시지">
              <SquarePen size={22} />
            </button>
          </Toolbar>
        </Push>
      )}
      {compose && <Compose init={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}

/* ═════════════ 미리 알림 ═════════════ */
const LIST_COLOR = ["#007AFF", "#FF9500", "#34C759", "#AF52DE", "#FF2D55", "#5AC8FA"];
type View = { title: string; color: string; list?: string; filter: (r: Reminder) => boolean };
function RemDetail({ r, onClose }: { r: Reminder; onClose: () => void }) {
  const [f, setF] = useState(r);
  const save = () => {
    update((x) => {
      const y = x.reminders.find((z) => z.id === r.id);
      if (y) Object.assign(y, f);
    });
    onClose();
  };
  const cell = "bg-white px-[16px] py-[11px] text-[17px] flex items-center gap-2";
  return (
    <Sheet onClose={onClose} bg="#F2F2F7">
      <div className="flex items-center justify-between px-[16px] h-[52px]">
        <button onClick={onClose} className="text-[17px] text-[#007AFF]">
          취소
        </button>
        <span className="text-[17px] font-semibold">세부사항</span>
        <button onClick={save} className="text-[17px] text-[#007AFF] font-semibold">
          완료
        </button>
      </div>
      <div className="mx-4 rounded-[12px] overflow-hidden divide-y divide-black/10">
        <input value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} className={`${cell} w-full outline-none`} placeholder="제목" />
        <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={`${cell} w-full outline-none resize-none h-[80px] text-black/70`} placeholder="메모" />
      </div>
      <div className="mx-4 rounded-[12px] overflow-hidden mt-[20px]">
        <label className={cell}>
          <span className="w-[30px] h-[30px] rounded-[7px] bg-[#FF3B30] flex items-center justify-center">
            <CalIcon size={17} color="#fff" />
          </span>
          <span className="flex-1">날짜</span>
          <input value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} placeholder="없음" className="w-[110px] text-right outline-none text-[#007AFF]" />
        </label>
      </div>
      <button
        onClick={() => {
          update((x) => void (x.reminders = x.reminders.filter((z) => z.id !== r.id)));
          onClose();
        }}
        className="mx-4 mt-[20px] rounded-[12px] bg-white py-[12px] text-[17px] text-[#FF3B30]"
      >
        미리 알림 삭제
      </button>
    </Sheet>
  );
}
export function RemindersApp() {
  useStatusBar(true);
  const d = useData();
  const [view, setView] = useState<View | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const lists = [...new Set(d.reminders.map((r) => r.list || "미리 알림"))];
  const colorOf = (l: string) => LIST_COLOR[Math.max(0, lists.indexOf(l)) % LIST_COLOR.length];
  const toggle = (rid: string) =>
    update((x) => {
      const y = x.reminders.find((z) => z.id === rid);
      if (y) y.done = !y.done;
    });
  const smart: [string, string, React.ReactNode, (r: Reminder) => boolean][] = [
    ["오늘", "#007AFF", <CalIcon key="t" size={17} color="#fff" />, (r) => r.due === "오늘" && !r.done],
    ["예정", "#FF3B30", <CalendarClock key="s" size={17} color="#fff" />, (r) => !!r.due && !r.done],
    ["전체", "#3A3A3C", <Inbox key="a" size={17} color="#fff" />, (r) => !r.done],
    ["완료됨", "#8E8E93", <CheckCircle2 key="d" size={17} color="#fff" />, (r) => r.done],
  ];
  /** 새 미리 알림: 지금 보고 있는 목록에 빈 줄을 만들고 바로 입력 */
  const addNew = () => {
    const list = view?.list ?? lists[0] ?? "미리 알림";
    const id = uid();
    update((x) => void x.reminders.push({ id, text: "", note: "", due: view?.title === "오늘" ? "오늘" : "", done: false, list }));
    if (!view) setView({ title: list, color: colorOf(list), list, filter: (r) => (r.list || "미리 알림") === list });
    setNewId(id);
  };
  const shown = view ? d.reminders.filter((r) => (view.title === "완료됨" ? view.filter(r) : view.filter(r) || r.id === newId) && (showDone || !r.done || view.title === "완료됨")) : [];
  const listItems = view?.list ? d.reminders.filter((r) => (r.list || "미리 알림") === view.list) : [];
  const edit = d.reminders.find((r) => r.id === editId);
  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      <NavBar title="" scrolled={scrolled} right={<span className="text-[17px] text-[#007AFF]">편집</span>} bg="rgba(242,242,247,0.9)" />
      <div ref={ref} className="absolute inset-0 scroll px-4" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 90 }}>
        <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px] mb-[14px]">
          <Search size={16} /> 검색
        </div>
        <div className="grid grid-cols-2 gap-[12px]">
          {smart.map(([name, color, icon, f]) => (
            <button key={name} onClick={() => setView({ title: name, color, filter: f })} className="rounded-[12px] bg-white p-[10px] text-left active:opacity-70">
              <div className="flex justify-between items-start">
                <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: color }}>
                  {icon}
                </span>
                <span className="text-[28px] font-bold leading-[30px]">{d.reminders.filter(f).length}</span>
              </div>
              <div className="text-[16px] font-semibold text-black/60 mt-[8px]">{name}</div>
            </button>
          ))}
        </div>
        <div className="text-[20px] font-bold mt-[24px] mb-[8px]">나의 목록</div>
        <div className="rounded-[12px] bg-white overflow-hidden">
          {lists.map((l, i) => (
            <button key={l} onClick={() => setView({ title: l, color: colorOf(l), list: l, filter: (r) => (r.list || "미리 알림") === l })} className="w-full flex items-center gap-[12px] pl-[12px] text-left active:bg-black/5">
              <span className="w-[30px] h-[30px] rounded-full flex items-center justify-center" style={{ background: colorOf(l) }}>
                <List size={16} color="#fff" strokeWidth={2.6} />
              </span>
              <span className={`flex-1 flex items-center py-[12px] pr-[12px] ${i < lists.length - 1 ? "hair-b" : ""}`}>
                <span className="flex-1 text-[17px]">{l}</span>
                <span className="text-[17px] text-black/45 mr-1">{d.reminders.filter((r) => (r.list || "미리 알림") === l && !r.done).length}</span>
                <ChevronRight size={18} className="text-black/25" />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pt-[10px] text-[#007AFF] text-[17px]" style={{ paddingBottom: "calc(var(--sab) + 6px)" }}>
        <button onClick={addNew} className="flex items-center gap-[6px] font-semibold">
          <span className="w-[22px] h-[22px] rounded-full bg-[#007AFF] flex items-center justify-center">
            <Plus size={16} color="#fff" strokeWidth={3} />
          </span>
          새로운 미리 알림
        </button>
        <span>목록 추가</span>
      </div>
      {view && (
        <Push>
          <Bar
            onBack={() => {
              // 아무것도 안 쓴 새 줄은 지우고 나감
              if (d.reminders.some((r) => !r.text.trim())) update((x) => void (x.reminders = x.reminders.filter((r) => r.text.trim())));
              setView(null);
              setNewId(null);
            }}
            back="목록"
            border={false}
            right={
              <button onClick={() => setShowDone(!showDone)} className="text-[15px]" aria-label="완료된 항목">
                {view.title !== "완료됨" && (showDone ? "완료된 항목 가리기" : "완료된 항목 보기")}
                {view.title === "완료됨" && <MoreHorizontal size={22} />}
              </button>
            }
          />
          <div className="flex-1 scroll px-4 pb-[90px]">
            <div className="flex items-baseline justify-between mb-[6px]">
              <span className="text-[34px] font-bold" style={{ color: view.color }}>
                {view.title}
              </span>
              {view.list && <span className="text-[17px] text-black/40">{listItems.filter((r) => r.done).length}개 완료됨</span>}
            </div>
            {shown.length === 0 && <div className="text-black/35 text-center pt-[90px]">미리 알림 없음</div>}
            {shown.map((r) => (
              <div key={r.id} className="flex gap-[12px] py-[10px] hair-b items-start">
                <button onClick={() => toggle(r.id)} aria-label="완료" className="pt-[1px] shrink-0">
                  {r.done ? (
                    <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${view.color}` }}>
                      <span className="w-[14px] h-[14px] rounded-full" style={{ background: view.color }} />
                    </span>
                  ) : (
                    <Circle size={22} className="text-black/25" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  {r.id === newId ? (
                    <input
                      autoFocus
                      defaultValue={r.text}
                      placeholder=""
                      className="w-full text-[17px] outline-none"
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        update((x) => {
                          if (!v) x.reminders = x.reminders.filter((z) => z.id !== r.id);
                          else {
                            const y = x.reminders.find((z) => z.id === r.id);
                            if (y) y.text = v;
                          }
                        });
                        setNewId(null);
                      }}
                    />
                  ) : (
                    <div className={`text-[17px] ${r.done ? "text-black/35" : ""}`}>{r.text}</div>
                  )}
                  {r.note && <div className="text-[15px] text-black/45">{r.note}</div>}
                  {r.due && <div className="text-[15px]" style={{ color: r.due === "오늘" && !r.done ? "#FF3B30" : "rgba(0,0,0,0.45)" }}>{r.due}</div>}
                </div>
                {r.id !== newId && (
                  <button onClick={() => setEditId(r.id)} aria-label="세부사항" className="text-[#007AFF] pt-[1px]">
                    <Info size={21} />
                  </button>
                )}
              </div>
            ))}
            {view.list && (
              <button onClick={addNew} className="flex items-center gap-[12px] py-[12px] text-black/35 text-[17px]">
                <Plus size={22} /> 새로운 미리 알림
              </button>
            )}
          </div>
        </Push>
      )}
      {edit && <RemDetail r={edit} onClose={() => setEditId(null)} />}
    </div>
  );
}

/* ═════════════ 지갑 ═════════════ */
export function WalletApp() {
  useStatusBar(true);
  const d = useData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [showNum, setShowNum] = useState(false);
  const cards = d.wallet;
  const cur = cards.find((c) => c.id === openId);
  const isBank = cur && cards[0]?.id === cur.id; // 첫 카드 = 뱅킹 앱 통장과 연결된 카드
  const Card = ({ c, big }: { c: (typeof cards)[number]; big?: boolean }) => (
    <div className="rounded-[16px] p-[16px] text-white flex flex-col" style={{ height: big ? 215 : 215, background: `linear-gradient(145deg, rgba(255,255,255,0.10), rgba(0,0,0,0.16)), ${c.color}`, boxShadow: "0 -1px 0 rgba(255,255,255,0.15) inset, 0 4px 18px rgba(0,0,0,0.18)" }}>
      <div className="flex justify-between items-start">
        <span className="text-[17px] font-semibold">{c.name}</span>
        <Wifi size={18} className="rotate-90 opacity-80" />
      </div>
      <div className="flex-1" />
      <div className="flex justify-between items-end">
        <span className="text-[17px] tabular tracking-[1px] opacity-90">{big && showNum ? c.number.replace(/•+/g, "4821 0937 5512").replace(/•/g, "") : c.number}</span>
        <span className="text-[12px] opacity-80">{c.sub}</span>
      </div>
    </div>
  );
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll px-4" style={{ paddingTop: "calc(var(--sat) + 10px)", paddingBottom: 40 }}>
        <div className="flex items-center justify-between h-[44px]">
          <span className="text-[34px] font-bold">지갑</span>
          <div className="flex gap-[10px]">
            <span className="w-[32px] h-[32px] rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <Plus size={20} />
            </span>
            <span className="w-[32px] h-[32px] rounded-full bg-[#F2F2F7] flex items-center justify-center">
              <MoreHorizontal size={20} />
            </span>
          </div>
        </div>
        {cards.length === 0 && <div className="text-center text-black/35 pt-[120px]">카드 없음</div>}
        {/* 카드 묶음: 겹쳐 쌓인 모습 — 누르면 그 카드 화면 */}
        <div className="relative mt-[14px]" style={{ height: cards.length ? 215 + 54 * (cards.length - 1) : 0 }}>
          {cards.map((c, i) => (
            <button key={c.id} onClick={() => (setOpenId(c.id), setShowNum(false))} className="absolute left-0 right-0 text-left active:scale-[0.99] transition-transform" style={{ top: i * 54, zIndex: i }}>
              <Card c={c} />
            </button>
          ))}
        </div>
      </div>
      {cur && (
        <Push>
          <Bar onBack={() => setOpenId(null)} back="" border={false} right={<span className="text-[17px] font-semibold">완료</span>} />
          <div className="flex-1 scroll px-4 pb-[40px]">
            <Card c={cur} big />
            <div className="grid grid-cols-2 gap-[10px] mt-[16px]">
              <button onClick={() => setShowNum(!showNum)} className="h-[46px] rounded-[12px] bg-[#F2F2F7] text-[15px] font-semibold flex items-center justify-center gap-[6px]">
                {showNum ? <EyeOff size={17} /> : <Eye size={17} />} 카드 번호 {showNum ? "가리기" : "보기"}
              </button>
              <span className="h-[46px] rounded-[12px] bg-[#F2F2F7] text-[15px] font-semibold flex items-center justify-center">자세히</span>
            </div>
            <div className="text-[20px] font-bold mt-[24px] mb-[8px]">최근 거래</div>
            <div className="rounded-[12px] bg-[#F2F2F7] overflow-hidden">
              {(isBank ? d.bank.txs.slice(0, 6) : []).map((t, i, arr) => (
                <div key={t.id} className={`flex items-center px-[14px] py-[11px] ${i < arr.length - 1 ? "border-b border-black/10" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-semibold truncate">{t.name}</div>
                    <div className="text-[13px] text-black/45">{t.when}</div>
                  </div>
                  <span className="text-[16px] tabular" style={{ color: t.amount > 0 ? "#34C759" : undefined }}>
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString()}원
                  </span>
                </div>
              ))}
              {!isBank && <div className="px-[14px] py-[16px] text-[15px] text-black/45">이 카드의 거래 내역이 없습니다.</div>}
            </div>
          </div>
        </Push>
      )}
    </div>
  );
}

/* 전화 앱 + 연락처 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Star, Clock, CircleUser, Grid3x3, Voicemail, Info, Phone as PhoneI, MessageCircle, Video, Mail, Plus, Delete, PhoneIncoming, PhoneOutgoing, Play, Pause } from "lucide-react";
import { useData, type Contact, type PhoneData } from "../store";
import { Avatar, LargeTitle, NavBar, SearchField, TabBar, useScrolled, usePhoneCtx, useStatusBar } from "../ui";

/* ───── 초성 인덱스 ───── */
const CHO = ["ㄱ", "ㄱ", "ㄴ", "ㄷ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅂ", "ㅅ", "ㅅ", "ㅇ", "ㅈ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
export const INDEX = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#"];
export function initial(name: string) {
  const c = name.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) return CHO[Math.floor((c - 0xac00) / 588)];
  if (/[ㄱ-ㅎ]/.test(name[0])) return CHO.includes(name[0]) ? name[0] : "#";
  if (/[A-Za-z]/.test(name[0])) return name[0].toUpperCase();
  return "#";
}

/** 연락처/통화기록에서 이 사람의 통화 대사 찾기 */
export function linesFor(d: PhoneData, name: string) {
  return d.calls.find((c) => c.name === name && c.lines.length)?.lines ?? ["……", "(신호가 가다가 끊긴다)"];
}

export function ContactList({ onPick, title = "연락처", showCard = true }: { onPick: (c: Contact) => void; title?: string; showCard?: boolean }) {
  const d = useData();
  const [q, setQ] = useState("");
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const secRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const groups = useMemo(() => {
    const g: Record<string, Contact[]> = {};
    d.contacts
      .filter((c) => !q || c.name.includes(q))
      .forEach((c) => {
        const k = initial(c.name);
        (g[k] ||= []).push(c);
      });
    Object.values(g).forEach((a) => a.sort((x, y) => x.name.localeCompare(y.name, "ko")));
    return INDEX.filter((k) => g[k]).map((k) => [k, g[k]] as const);
  }, [d.contacts, q]);
  const jump = (k: string) => {
    const el = secRefs.current[k];
    if (el && ref.current) ref.current.scrollTop = el.offsetTop - 98;
  };
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title={title} scrolled={scrolled} right={<Plus size={26} strokeWidth={2} />} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 110 }}>
        <LargeTitle>{title}</LargeTitle>
        <SearchField value={q} onChange={setQ} />
        {showCard && !q && (
          <div className="flex items-center gap-[12px] px-4 py-[10px] hair-b mx-0">
            <Avatar name={d.owner} size={60} />
            <div>
              <div className="text-[20px] font-semibold">{d.owner}</div>
              <div className="text-[13px] text-[#8e8e93]">내 카드</div>
            </div>
          </div>
        )}
        {groups.map(([k, list]) => (
          <div key={k} ref={(el) => (secRefs.current[k] = el)}>
            <div className="px-4 pt-[14px] pb-[2px] text-[15px] font-semibold text-[#8e8e93]">{k}</div>
            {list.map((c) => (
              <button key={c.id} onClick={() => onPick(c)} className="w-full text-left pl-4 active:bg-[#e5e5ea]">
                <div className="py-[11px] pr-[34px] hair-b text-[17px]">{c.name}</div>
              </button>
            ))}
          </div>
        ))}
        {!q && <div className="text-center text-[15px] text-[#8e8e93] py-[18px]">연락처 {d.contacts.length}개</div>}
      </div>
      {/* 우측 인덱스 */}
      <div className="absolute right-[2px] top-[160px] bottom-[110px] z-10 flex flex-col justify-center items-center">
        {INDEX.filter((_, i) => i < 14 || i % 3 === 0 || i === INDEX.length - 1).map((k) => (
          <button key={k} onClick={() => jump(k)} className="text-[10.5px] leading-[13.5px] font-semibold text-[#007AFF] px-[5px]">
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ContactDetail({ c, onBack, backLabel = "연락처" }: { c: Contact; onBack: () => void; backLabel?: string }) {
  const d = useData();
  const { call, open } = usePhoneCtx();
  const thread = d.threads.find((t) => t.app === "messages" && t.name === c.name);
  const recent = d.calls.filter((x) => x.name === c.name);
  const actions = [
    { l: "메시지", i: <MessageCircle size={22} fill="#007AFF" strokeWidth={0} />, f: () => thread && open("messages", thread.id) },
    { l: "전화", i: <PhoneI size={20} fill="#007AFF" strokeWidth={0} />, f: () => call(c.name, linesFor(d, c.name)) },
    { l: "FaceTime", i: <Video size={22} fill="#007AFF" strokeWidth={0} />, f: () => {} },
    { l: "메일", i: <Mail size={21} />, f: () => {}, off: true },
  ];
  return (
    <div className="absolute inset-0 bg-[#F2F2F7] z-30 push">
      <NavBar back={backLabel} onBack={onBack} right={<span className="text-[17px]">편집</span>} scrolled={false} />
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 60 }}>
        <div className="flex flex-col items-center pt-[6px]">
          <Avatar name={c.name} size={110} />
          <div className="text-[28px] font-normal mt-[12px] px-6 text-center leading-[34px]">{c.name}</div>
        </div>
        <div className="grid grid-cols-4 gap-[8px] px-4 mt-[18px]">
          {actions.map((a) => (
            <button key={a.l} onClick={a.f} className="h-[58px] rounded-[12px] bg-white flex flex-col items-center justify-center gap-[3px] text-[#007AFF]" style={{ opacity: a.off ? 0.4 : 1 }}>
              {a.i}
              <span className="text-[11px]">{a.l}</span>
            </button>
          ))}
        </div>
        <div className="mx-4 mt-[16px] rounded-[12px] bg-white px-4 py-[10px]">
          <div className="text-[13px]">{c.label}</div>
          <div className="text-[17px] text-[#007AFF] tabular">{c.phone}</div>
        </div>
        {recent.length > 0 && (
          <div className="mx-4 mt-[16px] rounded-[12px] bg-white px-4 py-[10px]">
            <div className="text-[13px] font-semibold mb-1">최근 통화</div>
            {recent.map((r) => (
              <div key={r.id} className="text-[15px] flex justify-between py-[3px]">
                <span style={{ color: r.kind === "missed" ? "#FF3B30" : "#000" }}>{r.kind === "missed" ? "부재중 전화" : r.kind === "in" ? "수신 전화" : "발신 전화"}</span>
                <span className="text-[#8e8e93]">{r.when}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mx-4 mt-[16px] rounded-[12px] bg-white px-4 py-[10px] min-h-[80px]">
          <div className="text-[13px]">메모</div>
          <div className="text-[17px] whitespace-pre-wrap">{c.note}</div>
        </div>
        <div className="mx-4 mt-[16px] rounded-[12px] bg-white overflow-hidden text-[17px]">
          {["메시지 보내기", "연락처 공유", "즐겨찾기에 추가"].map((x) => (
            <div key={x} className="px-4 py-[11px] text-[#007AFF] hair-b">
              {x}
            </div>
          ))}
          <div className="px-4 py-[11px] text-[#FF3B30]">이 발신자 차단</div>
        </div>
      </div>
    </div>
  );
}

function Recents() {
  const d = useData();
  const { call } = usePhoneCtx();
  const [seg, setSeg] = useState<"all" | "missed">("all");
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const list = d.calls.filter((c) => seg === "all" || c.kind === "missed");
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar
        title="최근 기록"
        scrolled={scrolled}
        right={<span className="text-[17px]">편집</span>}
      />
      <div className="absolute z-30 left-1/2 -translate-x-1/2 flex p-[2px] rounded-[9px] bg-[#767680]/[0.12] w-[180px]" style={{ top: "calc(var(--sat) + 7px)" }}>
        {(["all", "missed"] as const).map((s) => (
          <button key={s} onClick={() => setSeg(s)} className="flex-1 h-[28px] rounded-[7px] text-[13px] font-semibold transition-all" style={{ background: seg === s ? "#fff" : "transparent", boxShadow: seg === s ? "0 3px 8px rgba(0,0,0,0.12)" : "none" }}>
            {s === "all" ? "모두" : "부재중"}
          </button>
        ))}
      </div>
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 110 }}>
        <LargeTitle>최근 기록</LargeTitle>
        {list.map((c) => (
          <button key={c.id} onClick={() => call(c.name, c.lines)} className="w-full flex items-center text-left pl-[16px] active:bg-[#e5e5ea]">
            <span className="w-[22px] shrink-0 text-[#8e8e93]">{c.kind === "out" && <PhoneOutgoing size={14} />}{c.kind === "in" && <PhoneIncoming size={14} className="opacity-0" />}</span>
            <div className="flex-1 min-w-0 flex items-center hair-b py-[8px] pr-[12px]">
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-semibold truncate" style={{ color: c.kind === "missed" ? "#FF3B30" : "#000" }}>
                  {c.name}
                  {c.count && c.count > 1 ? ` (${c.count})` : ""}
                </div>
                <div className="text-[15px] text-[#8e8e93]">{c.label}</div>
              </div>
              <span className="text-[15px] text-[#8e8e93] mr-[10px] shrink-0">{c.when}</span>
              <Info size={22} className="text-[#007AFF] shrink-0" strokeWidth={1.8} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Favorites({ pick }: { pick: (c: Contact) => void }) {
  const d = useData();
  const { call } = usePhoneCtx();
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title="즐겨찾기" scrolled={scrolled} right={<Plus size={26} strokeWidth={2} />} />
      <div className="absolute top-[var(--sat)] left-0 h-[44px] flex items-center px-4 text-[17px] text-[#007AFF] z-30">편집</div>
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)" }}>
        <LargeTitle>즐겨찾기</LargeTitle>
        {d.contacts
          .filter((c) => c.fav)
          .map((c) => (
            <div key={c.id} className="flex items-center pl-4">
              <button onClick={() => call(c.name, linesFor(d, c.name))} className="flex items-center gap-[12px] flex-1 min-w-0 text-left">
                <Avatar name={c.name} size={40} />
                <div className="flex-1 min-w-0 hair-b py-[9px] flex items-center pr-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-semibold truncate">{c.name}</div>
                    <div className="text-[13px] text-[#8e8e93] flex items-center gap-1">
                      <PhoneI size={11} fill="#8e8e93" strokeWidth={0} />
                      {c.label}
                    </div>
                  </div>
                </div>
              </button>
              <button onClick={() => pick(c)} className="pr-3 hair-b py-[18px]">
                <Info size={22} className="text-[#007AFF]" strokeWidth={1.8} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

function Keypad() {
  const d = useData();
  const { call, toast } = usePhoneCtx();
  const [num, setNum] = useState("");
  const keys: [string, string][] = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
  const fmt = (s: string) => (s.length > 7 && s.startsWith("010") ? `${s.slice(0, 3)}-${s.slice(3, 7)}-${s.slice(7)}` : s.length > 3 && s.startsWith("010") ? `${s.slice(0, 3)}-${s.slice(3)}` : s);
  const match = d.contacts.find((c) => num.length >= 4 && c.phone.replace(/\D/g, "").endsWith(num.slice(-4)));
  const dial = () => {
    if (!num) return;
    if (num === "*#06#") return toast("IMEI 35 *** ******* 4");
    const tg = (d.triggers ?? []).find((x) => x.code && x.code === num);
    if (tg) {
      setNum("");
      if (tg.mode === "in") {
        // 걸자마자 끊기고, 잠시 뒤 그쪽에서 전화가 옴
        call(fmt(num), ["(신호가 한 번 가다 끊긴다)"]);
        setTimeout(() => call(tg.name, tg.lines, "in"), 9000);
      } else call(tg.name, tg.lines);
      return;
    }
    if (match) return call(match.name, linesFor(d, match.name));
    call(fmt(num), ["지금 거신 전화는 없는 번호입니다.", "확인하시고 다시 걸어 주십시오."]);
  };
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center" style={{ paddingTop: "calc(var(--sat) + 60px)" }}>
      <div className="h-[52px] text-[36px] font-normal tabular px-6 truncate max-w-full">{fmt(num)}</div>
      <div className="h-[22px] text-[15px] text-[#007AFF]">{match ? match.name : num ? "번호 추가" : ""}</div>
      <div className="grid grid-cols-3 gap-x-[28px] gap-y-[16px] mt-[18px]">
        {keys.map(([k, s]) => (
          <button key={k} onClick={() => setNum((n) => n + k)} className="w-[78px] h-[78px] rounded-full bg-[#E5E5EA] active:bg-[#bdbdc2] flex flex-col items-center justify-center transition-colors">
            <span className={`${k === "*" ? "text-[40px] translate-y-[8px]" : "text-[36px]"} leading-[38px] font-normal`}>{k}</span>
            <span className="text-[10px] font-bold tracking-[0.15em] h-[12px]">{s}</span>
          </button>
        ))}
        <span />
        <button onClick={dial} className="w-[78px] h-[78px] rounded-full bg-[#34C759] flex items-center justify-center active:brightness-90">
          <PhoneI size={34} fill="#fff" strokeWidth={0} />
        </button>
        <button onClick={() => setNum((n) => n.slice(0, -1))} className="flex items-center justify-center text-[#8e8e93]" style={{ opacity: num ? 1 : 0 }}>
          <Delete size={30} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}

/* 음성 사서함 재생: 재생 누르면 막대가 차오르면서 텍스트 변환이 한 줄씩 나옴 */
function VmPlayer({ lines }: { lines: string[] }) {
  const total = Math.max(6, Math.round(lines.join("").length / 5));
  const [play, setPlay] = useState(false);
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!play) return;
    const i = setInterval(() => setSec((x) => (x + 1 > total ? (setPlay(false), total) : x + 1)), 1000);
    return () => clearInterval(i);
  }, [play, total]);
  const shown = Math.ceil((sec / total) * lines.length);
  return (
    <div className="mt-[10px]" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-[10px]">
        <button
          onClick={() => {
            if (sec >= total) setSec(0);
            setPlay(!play);
          }}
          className="w-[32px] h-[32px] rounded-full bg-[#007AFF] flex items-center justify-center"
        >
          {play ? <Pause size={14} fill="#fff" strokeWidth={0} /> : <Play size={15} fill="#fff" strokeWidth={0} className="ml-[2px]" />}
        </button>
        <div className="flex-1 h-[3px] rounded-full bg-[#e5e5ea] overflow-hidden">
          <div className="h-full bg-[#007AFF] transition-all duration-1000 ease-linear" style={{ width: `${(sec / total) * 100}%` }} />
        </div>
        <span className="text-[12px] text-[#8e8e93] tabular">
          0:{String(sec).padStart(2, "0")} / 0:{String(total).padStart(2, "0")}
        </span>
      </div>
      <div className="text-[13px] text-[#8e8e93] mt-[10px] mb-[2px]">텍스트 변환</div>
      <div className="text-[15px] leading-[21px] min-h-[21px]">
        {sec === 0 && !play ? <span className="text-black/30">재생하면 받아쓴 내용이 여기에 나옵니다</span> : lines.slice(0, shown).join(" ")}
      </div>
    </div>
  );
}

function VoicemailTab() {
  const d = useData();
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const [openId, setOpenId] = useState<string | null>(null);
  const vms = d.calls.filter((c) => c.kind === "missed" && c.lines.length > 1);
  return (
    <div className="absolute inset-0 bg-white">
      <NavBar title="음성 사서함" scrolled={scrolled} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)" }}>
        <LargeTitle>음성 사서함</LargeTitle>
        {vms.length === 0 && <div className="text-center text-[#8e8e93] pt-[120px]">음성 메시지 없음</div>}
        {vms.map((c) => (
          <button key={c.id} onClick={() => setOpenId(openId === c.id ? null : c.id)} className="w-full text-left pl-[30px] pr-4">
            <div className="hair-b py-[10px]">
              <div className="flex justify-between">
                <span className="text-[17px] font-semibold">{c.name}</span>
                <span className="text-[15px] text-[#8e8e93]">{c.when}</span>
              </div>
              <div className="text-[15px] text-[#8e8e93]">{c.label}</div>
              {openId === c.id && <VmPlayer lines={c.lines} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PhoneApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("recents");
  const [detail, setDetail] = useState<Contact | null>(null);
  const missed = d.calls.filter((c) => c.kind === "missed").reduce((a, c) => a + (c.count || 1), 0);
  const vm = d.calls.filter((c) => c.kind === "missed" && c.lines.length > 1).length;
  return (
    <div className="absolute inset-0 bg-white">
      {tab === "fav" && <Favorites pick={setDetail} />}
      {tab === "recents" && <Recents />}
      {tab === "contacts" && <ContactList onPick={setDetail} />}
      {tab === "keypad" && <Keypad />}
      {tab === "vm" && <VoicemailTab />}
      <TabBar
        active={tab}
        onChange={setTab}
        items={[
          { id: "fav", label: "즐겨찾기", icon: <Star size={25} fill={tab === "fav" ? "currentColor" : "none"} strokeWidth={1.8} /> },
          { id: "recents", label: "최근 기록", icon: <Clock size={25} strokeWidth={tab === "recents" ? 2.4 : 1.8} />, badge: missed || undefined },
          { id: "contacts", label: "연락처", icon: <CircleUser size={26} strokeWidth={tab === "contacts" ? 2.4 : 1.8} /> },
          { id: "keypad", label: "키패드", icon: <Grid3x3 size={25} strokeWidth={tab === "keypad" ? 2.4 : 1.8} /> },
          { id: "vm", label: "음성 사서함", icon: <Voicemail size={27} strokeWidth={tab === "vm" ? 2.4 : 1.8} />, badge: vm || undefined },
        ]}
      />
      {detail && <ContactDetail c={detail} onBack={() => setDetail(null)} backLabel={tab === "fav" ? "즐겨찾기" : "연락처"} />}
    </div>
  );
}

export function ContactsApp() {
  useStatusBar(true);
  const [detail, setDetail] = useState<Contact | null>(null);
  return (
    <div className="absolute inset-0 bg-white">
      <ContactList onPick={setDetail} />
      {detail && <ContactDetail c={detail} onBack={() => setDetail(null)} />}
    </div>
  );
}

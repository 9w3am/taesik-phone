/* 폰 안에서 바로 편집 (휴대폰 편집 모드): 대화방에서 '나/상대'를 골라 바로 대사 추가 · 말풍선 눌러 고치기/지우기 · 이름 바꾸기 */
import { useState } from "react";
import { update, uid, type Thread, type Msg } from "./store";

/** 대화방에 말 한 줄 추가 (나 · 상대) */
export function appendMsg(threadId: string, from: "me" | "them", text: string) {
  if (!text.trim()) return;
  update((d) => {
    const t = d.threads.find((x) => x.id === threadId);
    if (!t) return;
    t.messages.push({ id: uid(), from, text: text.trim() });
    t.draft = "";
  });
}

/** 입력창 옆 '나 / 상대' 고르기 */
export function SenderChip({ value, onChange, accent = "#007AFF" }: { value: "me" | "them"; onChange: (v: "me" | "them") => void; accent?: string }) {
  return (
    <div className="flex shrink-0 rounded-full bg-[#E9E9EB] p-[2px] text-[13px] font-semibold self-center" onPointerDown={(e) => e.preventDefault()}>
      {(
        [
          ["me", "나"],
          ["them", "상대"],
        ] as const
      ).map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className="h-[30px] px-[10px] rounded-full" style={value === v ? { background: accent, color: v === "me" && accent === "#FEE500" ? "#191919" : "#fff" } : { color: "#6C6C70" }}>
          {l}
        </button>
      ))}
    </div>
  );
}

const sheetBox = "absolute inset-0 z-[60] flex flex-col justify-end fade";
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={sheetBox} style={{ background: "rgba(0,0,0,0.3)" }} onClick={onClose}>
      <div className="sheet bg-[#F2F2F7] rounded-t-[14px] px-[16px] pt-[8px]" style={{ paddingBottom: "calc(var(--kbsab) + 14px)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-[36px] h-[5px] rounded-full bg-black/20 mb-[10px]" />
        <div className="text-[17px] font-semibold text-center mb-[12px]">{title}</div>
        {children}
      </div>
    </div>
  );
}
const btn = "h-[46px] rounded-[12px] text-[16px] font-semibold";

/** 말풍선 고치기: 글 · 보낸 사람 · 위에 날짜 줄 · 지우기 */
export function MsgEditSheet({ t, mid, onClose }: { t: Thread; mid: string; onClose: () => void }) {
  const m = t.messages.find((x) => x.id === mid);
  const [text, setText] = useState(m?.text ?? "");
  const [from, setFrom] = useState<Msg["from"]>(m?.from ?? "me");
  if (!m) return null;
  const isDate = m.kind === "date";
  const set = (fn: (msgs: Msg[], i: number) => void) =>
    update((d) => {
      const th = d.threads.find((x) => x.id === t.id);
      const i = th?.messages.findIndex((x) => x.id === mid) ?? -1;
      if (th && i >= 0) fn(th.messages, i);
    });
  return (
    <Sheet title={isDate ? "날짜 줄 고치기" : "말풍선 고치기"} onClose={onClose}>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-[12px] bg-white px-[14px] py-[10px] text-[17px] leading-[23px] outline-none resize-none" placeholder={isDate ? "예: 10월 24일 목요일" : "내용"} />
      {!isDate && (
        <div className="flex gap-[6px] mt-[10px]">
          {(
            [
              ["me", "나"],
              ["them", "상대"],
              ["system", "알림 문구"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} onClick={() => setFrom(v)} className="flex-1 h-[38px] rounded-[10px] text-[15px] font-semibold" style={from === v ? { background: "#007AFF", color: "#fff" } : { background: "#fff", color: "#3C3C43" }}>
              {l}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => {
          set((msgs, i) => {
            msgs[i].text = text;
            if (!isDate) msgs[i].from = from;
          });
          onClose();
        }}
        className={`${btn} w-full mt-[12px] bg-[#007AFF] text-white`}
      >
        저장
      </button>
      <div className="grid grid-cols-2 gap-[8px] mt-[8px]">
        <button
          onClick={() => {
            set((msgs, i) => void msgs.splice(i, 0, { id: uid(), from: "system", kind: "date", text: "10월 24일 목요일" }));
            onClose();
          }}
          className={`${btn} bg-white text-[#007AFF]`}
        >
          위에 날짜 줄 넣기
        </button>
        <button
          onClick={() => {
            set((msgs, i) => void msgs.splice(i, 1));
            onClose();
          }}
          className={`${btn} bg-white text-[#FF3B30]`}
        >
          지우기
        </button>
      </div>
    </Sheet>
  );
}

/** 대화 상대 이름 바꾸기 */
export function RenameSheet({ t, onClose }: { t: Thread; onClose: () => void }) {
  const [name, setName] = useState(t.name);
  return (
    <Sheet title="이름 바꾸기" onClose={onClose}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className="w-full h-[46px] rounded-[12px] bg-white px-[14px] text-[17px] outline-none" />
      <button
        onClick={() => {
          update((d) => {
            const th = d.threads.find((x) => x.id === t.id);
            if (th && name.trim()) th.name = name.trim();
          });
          onClose();
        }}
        className={`${btn} w-full mt-[12px] bg-[#007AFF] text-white`}
      >
        저장
      </button>
    </Sheet>
  );
}

/** 편집 모드일 때 대화방 위에 뜨는 안내 */
export const EditHint = ({ text }: { text: string }) => (
  <div className="absolute left-1/2 -translate-x-1/2 z-[55] px-[12px] py-[6px] rounded-full text-[12px] font-semibold text-white pointer-events-none whitespace-nowrap" style={{ top: "calc(var(--sat) + 52px)", background: "rgba(0,122,255,0.92)" }}>
    {text}
  </div>
);

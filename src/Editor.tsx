/* 제작자용 편집 화면 (/editor 또는 #/editor) */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Download, Upload, RotateCcw, Sparkles, Cloud, Check, Copy, Smartphone } from "lucide-react";
import { useData, update, setData, resetData, uid, DAYS, type PhoneData, type Msg, type Thread, type AppKind } from "./store";
import { defaultData } from "./data";
import { photoSrc, shrinkImage } from "./photos";
import { generate, loadAiConf, saveAiConf, DEFAULT_MODEL, type AiTarget } from "./ai";
import Phone from "./Phone";
import { cloudEnabled, getSession, signIn, signOut, publish, SETUP_SQL, SB_URL } from "./cloud";

/* ───────── 대화 스크립트 ↔ 메시지 ───────── */
export function toScript(msgs: Msg[]) {
  return msgs
    .map((m) => {
      const body = m.kind === "deleted" ? "[삭제됨]" : m.kind === "pay" ? `[송금] ${m.amount ?? 0}${m.text ? " " + m.text : ""}` : m.kind === "photo" ? `[사진] ${m.photo ?? ""}` : m.text;
      const lines = body.split("\n");
      const head = m.from === "system" ? `--- ${lines[0]}` : `${m.from === "me" ? "나" : m.who || "상대"}: ${lines[0]}`;
      return [head, ...lines.slice(1).map((l) => "  " + l)].join("\n");
    })
    .join("\n");
}
export function fromScript(s: string): Msg[] {
  const out: Msg[] = [];
  for (const raw of s.split("\n")) {
    if (!raw.trim()) continue;
    if (/^\s{2,}/.test(raw) && out.length) {
      out[out.length - 1].text += "\n" + raw.trim();
      continue;
    }
    const line = raw.trim();
    if (line.startsWith("---")) {
      out.push({ id: uid(), from: "system", text: line.replace(/^-+\s*/, "") });
      continue;
    }
    const i = line.indexOf(":");
    let from: Msg["from"] = "them",
      who: string | undefined,
      body = line;
    if (i > 0 && i < 24) {
      const pre = line.slice(0, i).trim();
      body = line.slice(i + 1).trim();
      if (pre === "나") from = "me";
      else if (pre !== "상대") who = pre;
    }
    const m: Msg = { id: uid(), from, text: body };
    if (who) m.who = who;
    const pay = body.match(/^\[송금\]\s*([\d,]+)\s*(.*)$/);
    const pic = body.match(/^\[사진\]\s*(\S+)/);
    if (body === "[삭제됨]") Object.assign(m, { kind: "deleted", text: "" });
    else if (pay) Object.assign(m, { kind: "pay", amount: Number(pay[1].replace(/,/g, "")), text: pay[2] || "" });
    else if (pic) Object.assign(m, { kind: "photo", photo: pic[1], text: "사진" });
    out.push(m);
  }
  return out;
}

/* ───────── 입력 컴포넌트 ───────── */
function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}
const T = ({ value, onChange, ph }: { value: string; onChange: (v: string) => void; ph?: string }) => <input value={value ?? ""} placeholder={ph} onChange={(e) => onChange(e.target.value)} />;
const N = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />;
const C = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="!flex items-center gap-2 !text-[14px] !text-black !font-normal cursor-pointer select-none">
    <input type="checkbox" className="!w-4 !h-4" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);
const Btn = ({ children, onClick, kind = "plain", disabled }: { children: React.ReactNode; onClick?: () => void; kind?: "plain" | "primary" | "danger"; disabled?: boolean }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[9px] text-[14px] font-medium transition-colors disabled:opacity-40 ${
      kind === "primary" ? "bg-[#007AFF] text-white hover:bg-[#0068d9]" : kind === "danger" ? "bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/15" : "bg-black/[0.05] hover:bg-black/[0.09]"
    }`}
  >
    {children}
  </button>
);
const Card = ({ children, title, right }: { children: React.ReactNode; title?: string; right?: React.ReactNode }) => (
  <section className="bg-white rounded-[14px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-black/[0.06] mb-4">
    {(title || right) && (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-semibold">{title}</h3>
        <div className="flex gap-2">{right}</div>
      </div>
    )}
    {children}
  </section>
);

/** 배열 편집 공용 */
function Rows<X>({ items, set, make, render, label = "추가" }: { items: X[]; set: (x: X[]) => void; make: () => NoInfer<X>; render: (it: X, put: (v: Partial<X>) => void, i: number) => React.ReactNode; label?: string }) {
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="relative border border-black/[0.08] rounded-[12px] p-3 pr-11 bg-[#FAFAFC]">
          {render(it, (v) => set(items.map((x, j) => (j === i ? { ...x, ...v } : x))), i)}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button title="위로" onClick={() => i > 0 && set(items.map((x, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : x)))} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
              <ChevronUp size={16} />
            </button>
            <button title="아래로" onClick={() => i < items.length - 1 && set(items.map((x, j) => (j === i + 1 ? items[i] : j === i ? items[i + 1] : x)))} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
              <ChevronDown size={16} />
            </button>
            <button title="삭제" onClick={() => confirm("삭제할까요?") && set(items.filter((_, j) => j !== i))} className="w-7 h-7 rounded-md hover:bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <Btn onClick={() => set([...items, make()])}>
        <Plus size={15} /> {label}
      </Btn>
    </div>
  );
}

/* ───────── 섹션들 ───────── */
function Basic({ d }: { d: PhoneData }) {
  const s = (fn: (x: PhoneData) => void) => update(fn);
  return (
    <>
      <Card title="폰 기본">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <F label="폰 주인 이름">
            <T value={d.owner} onChange={(v) => s((x) => void (x.owner = v))} />
          </F>
          <F label="기기 이름">
            <T value={d.deviceName} onChange={(v) => s((x) => void (x.deviceName = v))} />
          </F>
          <F label="통신사">
            <T value={d.carrier} onChange={(v) => s((x) => void (x.carrier = v))} />
          </F>
          <F label="배터리 %">
            <N value={d.battery} onChange={(v) => s((x) => void (x.battery = v))} />
          </F>
          <F label="잠금 암호 (비우면 암호 없음)">
            <T value={d.passcode} ph="예: 0417" onChange={(v) => s((x) => void (x.passcode = v.replace(/\D/g, "").slice(0, 6)))} />
          </F>
          <F label="암호 힌트 (암호 화면에 표시)">
            <T value={d.passcodeHint} onChange={(v) => s((x) => void (x.passcodeHint = v))} />
          </F>
          <F label="자동 잠금 (초 · 0이면 끔)">
            <N value={d.autoLockSec ?? 120} onChange={(v) => s((x) => void (x.autoLockSec = v))} />
          </F>
          <F label="카카오톡 상태메시지">
            <T value={d.kakaoProfile.status} onChange={(v) => s((x) => void (x.kakaoProfile.status = v))} />
          </F>
        </div>
        <div className="mt-4">
          <C label="방문자가 입력창에 타자 쳐서 메시지 보내기 허용 (기본 켜짐 · 끄면 제작자가 넣은 초안만 전송 가능)" value={d.allowSend} onChange={(v) => s((x) => void (x.allowSend = v))} />
        </div>
      </Card>
      <Card title="소리 (벨소리 · 알림음)">
        <p className="text-[13px] text-black/50 mb-3 leading-[20px]">
          전화가 걸려올 때 반복 재생할 벨소리, 배너 알림이 뜰 때 한 번 재생할 알림음을 올리세요. (mp3/m4a/wav, 1MB 이하 권장 · 저장 공간 때문에)
          <br />
          아이폰 정품 벨소리는 애플 저작권이라 넣지 않았습니다. 본인이 쓸 권리가 있는 소리나 무료 소리(CC0)만 쓰세요. 제어 센터의 종 모양 버튼이 무음 모드입니다.
        </p>
        {(["ringtone", "notify"] as const).map((k) => (
          <div key={k} className="flex flex-wrap items-center gap-2 py-2 border-t border-black/5">
            <span className="w-[80px] text-[14px] font-medium">{k === "ringtone" ? "벨소리" : "알림음"}</span>
            <span className="text-[13px] text-black/50 flex-1 min-w-[120px]">{d.sounds?.[k] ? `등록됨 (${Math.round((d.sounds[k]!.length * 0.75) / 1024)}KB)` : "없음"}</span>
            {d.sounds?.[k] && <Btn onClick={() => new Audio(d.sounds![k]!).play().catch(() => {})}>들어보기</Btn>}
            <label className="!m-0 !text-[14px] !font-medium !text-black inline-flex items-center h-[34px] px-3 rounded-[9px] bg-black/[0.05] hover:bg-black/[0.09] cursor-pointer">
              파일 올리기
              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2_500_000) return alert("파일이 너무 큽니다. 2.5MB 이하로 줄여 주세요.");
                  const r = new FileReader();
                  r.onload = () => s((x) => void (x.sounds = { ...(x.sounds ?? {}), [k]: String(r.result) }));
                  r.readAsDataURL(f);
                  e.target.value = "";
                }}
              />
            </label>
            {d.sounds?.[k] && (
              <Btn kind="danger" onClick={() => s((x) => void (x.sounds = { ...(x.sounds ?? {}), [k]: undefined }))}>
                삭제
              </Btn>
            )}
          </div>
        ))}
      </Card>
      <Card title="날씨 위젯">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <F label="도시">
            <T value={d.weather.city} onChange={(v) => s((x) => void (x.weather.city = v))} />
          </F>
          <F label="기온">
            <N value={d.weather.temp} onChange={(v) => s((x) => void (x.weather.temp = v))} />
          </F>
          <F label="상태">
            <T value={d.weather.cond} onChange={(v) => s((x) => void (x.weather.cond = v))} />
          </F>
          <F label="최고">
            <N value={d.weather.hi} onChange={(v) => s((x) => void (x.weather.hi = v))} />
          </F>
          <F label="최저">
            <N value={d.weather.lo} onChange={(v) => s((x) => void (x.weather.lo = v))} />
          </F>
        </div>
      </Card>
    </>
  );
}

const APP_OPTS: [string, string][] = [
  ["messages", "메시지"],
  ["kakao", "카카오톡"],
  ["insta", "Instagram"],
  ["phone", "전화"],
  ["bank", "뱅킹"],
];

function Events({ d }: { d: PhoneData }) {
  const e = d.events;
  return (
    <>
      <Card title="수신 전화 이벤트">
        <p className="text-[13px] text-black/50 mb-3">잠금을 푼 뒤 지정한 시간이 지나면 전화가 걸려옵니다. 받으면 아래 대사가 한 줄씩 화면 중앙에 나옵니다.</p>
        <div className="grid grid-cols-3 gap-4 items-end">
          <C label="사용" value={e.incomingCall.enabled} onChange={(v) => update((x) => void (x.events.incomingCall.enabled = v))} />
          <F label="몇 초 뒤">
            <N value={e.incomingCall.afterSec} onChange={(v) => update((x) => void (x.events.incomingCall.afterSec = v))} />
          </F>
          <F label="발신자 표시">
            <T value={e.incomingCall.name} onChange={(v) => update((x) => void (x.events.incomingCall.name = v))} />
          </F>
        </div>
        <F label="상대 대사 (한 줄 = 한 문장)" className="mt-3">
          <textarea rows={5} value={e.incomingCall.lines.join("\n")} onChange={(ev) => update((x) => void (x.events.incomingCall.lines = ev.target.value.split("\n")))} />
        </F>
      </Card>
      <Card title="배너 알림 이벤트">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <C label="사용" value={e.banner.enabled} onChange={(v) => update((x) => void (x.events.banner.enabled = v))} />
          <F label="몇 초 뒤">
            <N value={e.banner.afterSec} onChange={(v) => update((x) => void (x.events.banner.afterSec = v))} />
          </F>
          <F label="앱">
            <select value={e.banner.app} onChange={(ev) => update((x) => void (x.events.banner.app = ev.target.value as AppKind))}>
              {APP_OPTS.slice(0, 3).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </F>
          <F label="제목 (대화방 이름과 같으면 탭 시 그 방이 열림)">
            <T value={e.banner.title} onChange={(v) => update((x) => void (x.events.banner.title = v))} />
          </F>
          <F label="내용">
            <T value={e.banner.text} onChange={(v) => update((x) => void (x.events.banner.text = v))} />
          </F>
        </div>
      </Card>
      <Card title="배터리 부족 팝업">
        <div className="grid grid-cols-3 gap-4 items-end">
          <C label="사용" value={e.lowBattery.enabled} onChange={(v) => update((x) => void (x.events.lowBattery.enabled = v))} />
          <F label="몇 초 뒤">
            <N value={e.lowBattery.afterSec} onChange={(v) => update((x) => void (x.events.lowBattery.afterSec = v))} />
          </F>
        </div>
      </Card>
      <Card title="숨은 장치 (키패드 번호 → 전화)">
        <p className="text-[13px] text-black/50 mb-3">전화 앱 키패드에 정한 번호를 누르고 통화 버튼을 누르면 전화가 연결되거나(받음), 끊긴 뒤 그쪽에서 다시 걸려옵니다(걸려옴). 트위터 공지에 힌트로 쓰기 좋아요.</p>
        <Rows
          items={d.triggers ?? []}
          set={(v) => update((x) => void (x.triggers = v))}
          make={() => ({ id: uid(), code: "", name: "", mode: "out" as const, lines: [] })}
          label="숨은 장치 추가"
          render={(t, put) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F label="누를 번호">
                <T value={t.code} ph="예: 0417" onChange={(v) => put({ code: v.replace(/[^0-9*#]/g, "") })} />
              </F>
              <F label="상대 표시 이름">
                <T value={t.name} onChange={(v) => put({ name: v })} />
              </F>
              <F label="방식">
                <select value={t.mode} onChange={(e) => put({ mode: e.target.value as "out" })}>
                  <option value="out">걸면 바로 받음</option>
                  <option value="in">끊기고 잠시 뒤 걸려옴</option>
                </select>
              </F>
              <F label="상대 대사 (한 줄 = 한 문장)" className="col-span-full">
                <textarea rows={3} value={t.lines.join("\n")} onChange={(e) => put({ lines: e.target.value.split("\n") })} />
              </F>
            </div>
          )}
        />
      </Card>
      <Card title="잠금화면 알림">
        <Rows
          items={d.lockNotifs}
          set={(v) => update((x) => void (x.lockNotifs = v))}
          make={() => ({ app: "messages" as AppKind, title: "", text: "", when: "지금" })}
          render={(n, put) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <F label="앱">
                <select value={n.app} onChange={(ev) => put({ app: ev.target.value as AppKind })}>
                  {APP_OPTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </F>
              <F label="제목">
                <T value={n.title} onChange={(v) => put({ title: v })} />
              </F>
              <F label="내용">
                <T value={n.text} onChange={(v) => put({ text: v })} />
              </F>
              <F label="시간 표기">
                <T value={n.when} onChange={(v) => put({ when: v })} />
              </F>
            </div>
          )}
        />
      </Card>
    </>
  );
}

function ScriptBox({ t }: { t: Thread }) {
  const [text, setText] = useState(() => toScript(t.messages));
  const [ok, setOk] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label>대화 내용 (한 줄 = 말풍선 하나)</label>
        <span className="text-[12px] text-black/40">{ok ? "자동 저장됨" : "저장 중…"}</span>
      </div>
      <textarea
        rows={18}
        spellCheck={false}
        className="font-mono !text-[13px]"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOk(false);
          clearTimeout(timer.current);
          const v = e.target.value;
          timer.current = window.setTimeout(() => {
            update((x) => {
              const y = x.threads.find((z) => z.id === t.id);
              if (y) y.messages = fromScript(v);
            });
            setOk(true);
          }, 350);
        }}
      />
      <div className="text-[12px] text-black/50 mt-2 leading-[19px] bg-black/[0.03] rounded-[10px] p-3">
        <b>쓰는 법</b> · <code>나: 내용</code> 최태식이 보낸 말 · <code>상대: 내용</code> 상대가 보낸 말 · 단체방은 <code>이름: 내용</code> · <code>--- 안내문</code> 가운데 회색 안내 · 줄 앞에 공백 두 칸이면 윗 말풍선에 줄바꿈으로 이어짐
        <br />
        <code>나: [송금] 150000 메모</code> 송금 카드 · <code>상대: [삭제됨]</code> 삭제된 메시지 · <code>상대: [사진] 사진ID</code> 사진 (ID는 에디터 사진 탭에서 확인)
      </div>
    </div>
  );
}

/* 대화 편집: '말풍선' 탭(하나씩 수정·삭제·순서 바꾸기) / '대본' 탭(한 번에 쓰기) */
function MsgEditor({ t }: { t: Thread }) {
  const [mode, setMode] = useState<"bubble" | "script">("bubble");
  const setMsgs = (fn: (list: Msg[]) => Msg[]) =>
    update((x) => {
      const th = x.threads.find((y) => y.id === t.id);
      if (th) th.messages = fn(th.messages);
    });
  const who = (m: Msg) => (m.from === "system" ? "__sys" : m.from === "me" ? "__me" : m.who || "__them");
  const names = Array.from(new Set(t.messages.filter((m) => m.who).map((m) => m.who!)));
  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["bubble", "script"] as const).map((k) => (
          <button key={k} onClick={() => setMode(k)} className={`h-[30px] px-3 rounded-full text-[13px] font-medium ${mode === k ? "bg-black text-white" : "bg-black/5"}`}>
            {k === "bubble" ? "말풍선으로 편집" : "대본으로 한 번에 쓰기"}
          </button>
        ))}
      </div>
      {mode === "script" ? (
        <ScriptBox key={t.id + t.messages.length} t={t} />
      ) : (
        <div className="space-y-2">
          {t.messages.map((m, i) => (
            <div key={m.id} className="flex gap-2 items-start">
              <select
                value={who(m)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMsgs((l) =>
                    l.map((x) =>
                      x.id !== m.id
                        ? x
                        : v === "__sys"
                          ? { ...x, from: "system", who: undefined }
                          : v === "__me"
                            ? { ...x, from: "me", who: undefined }
                            : v === "__them"
                              ? { ...x, from: "them", who: undefined }
                              : v === "__new"
                                ? { ...x, from: "them", who: prompt("발신자 이름") || undefined }
                                : { ...x, from: "them", who: v },
                    ),
                  );
                }}
                className="!w-[118px] shrink-0"
              >
                <option value="__me">나 (최태식)</option>
                <option value="__them">상대</option>
                {names.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="__new">+ 이름 추가</option>
                <option value="__sys">가운데 안내</option>
              </select>
              <textarea
                rows={Math.min(4, Math.max(1, m.text.split("\n").length))}
                value={m.kind === "pay" ? `[송금] ${m.amount ?? 0} ${m.text}` : m.kind === "photo" ? `[사진] ${m.photo ?? ""}` : m.kind === "deleted" ? "[삭제됨]" : m.text}
                onChange={(e) => {
                  const one = fromScript((m.from === "me" ? "나" : m.from === "system" ? "---" : m.who || "상대") + (m.from === "system" ? " " : ": ") + e.target.value.replace(/\n/g, "\n  "))[0];
                  setMsgs((l) => l.map((x) => (x.id !== m.id ? x : { ...x, text: one?.text ?? e.target.value, kind: one?.kind, amount: one?.amount, photo: one?.photo })));
                }}
                className="flex-1"
                style={{ background: m.from === "me" ? "#EAF3FF" : m.from === "system" ? "#F4F4F4" : "#fff" }}
              />
              <div className="flex shrink-0">
                <button title="위로" onClick={() => i > 0 && setMsgs((l) => l.map((x, j) => (j === i - 1 ? l[i] : j === i ? l[i - 1] : x)))} className="w-7 h-[34px] text-black/45 hover:text-black">
                  <ChevronUp size={16} className="mx-auto" />
                </button>
                <button title="아래로" onClick={() => i < t.messages.length - 1 && setMsgs((l) => l.map((x, j) => (j === i + 1 ? l[i] : j === i ? l[i + 1] : x)))} className="w-7 h-[34px] text-black/45 hover:text-black">
                  <ChevronDown size={16} className="mx-auto" />
                </button>
                <button title="아래에 추가" onClick={() => setMsgs((l) => [...l.slice(0, i + 1), { id: uid(), from: m.from === "me" ? "them" : "me", text: "" }, ...l.slice(i + 1)])} className="w-7 h-[34px] text-black/45 hover:text-black">
                  <Plus size={16} className="mx-auto" />
                </button>
                <button title="삭제" onClick={() => setMsgs((l) => l.filter((x) => x.id !== m.id))} className="w-7 h-[34px] text-[#FF3B30]/70 hover:text-[#FF3B30]">
                  <Trash2 size={15} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Btn onClick={() => setMsgs((l) => [...l, { id: uid(), from: "them", text: "" }])}>
              <Plus size={15} /> 상대 말 추가
            </Btn>
            <Btn onClick={() => setMsgs((l) => [...l, { id: uid(), from: "me", text: "" }])}>
              <Plus size={15} /> 내 말 추가
            </Btn>
          </div>
          <p className="text-[12px] text-black/45">송금은 <code>[송금] 150000 메모</code>, 사진은 <code>[사진] 사진ID</code>, 삭제된 메시지는 <code>[삭제됨]</code>이라고 쓰면 됩니다.</p>
        </div>
      )}
    </div>
  );
}

function Threads({ d }: { d: PhoneData }) {
  const [app, setApp] = useState<AppKind>("messages");
  const list = d.threads.filter((t) => t.app === app);
  const [sel, setSel] = useState<string | null>(list[0]?.id ?? null);
  const t = d.threads.find((x) => x.id === sel && x.app === app) ?? list[0];
  useEffect(() => {
    if (t) preview(t.app, t.id);
  }, [t?.id]); // eslint-disable-line
  const put = (v: Partial<Thread>) =>
    update((x) => {
      const y = x.threads.find((z) => z.id === t!.id);
      if (y) Object.assign(y, v);
    });
  const add = () => {
    const id = uid();
    update((x) => {
      x.threads.push({ id, app, name: "새 대화", unread: 0, last: "어제", messages: [] });
    });
    setSel(id);
  };
  const move = (dir: -1 | 1) =>
    update((x) => {
      const ids = x.threads.filter((z) => z.app === app).map((z) => z.id);
      const i = ids.indexOf(t!.id);
      const j = i + dir;
      if (j < 0 || j >= ids.length) return;
      const a = x.threads.findIndex((z) => z.id === ids[i]),
        b = x.threads.findIndex((z) => z.id === ids[j]);
      [x.threads[a], x.threads[b]] = [x.threads[b], x.threads[a]];
    });
  return (
    <>
      <div className="flex gap-2 mb-4">
        {(APP_OPTS.slice(0, 3) as [AppKind, string][]).map(([v, l]) => (
          <button key={v} onClick={() => (setApp(v), setSel(null))} className={`h-[34px] px-4 rounded-full text-[14px] font-medium ${app === v ? "bg-black text-white" : "bg-white border border-black/10"}`}>
            {l} <span className="opacity-50 ml-1">{d.threads.filter((x) => x.app === v).length}</span>
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[230px_1fr] gap-4 items-start">
        <Card>
          <div className="space-y-1 -mx-2 max-h-[260px] lg:max-h-[calc(100vh-260px)] overflow-auto">
            {list.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={`w-full text-left px-3 py-2 rounded-[9px] text-[14px] flex justify-between ${t?.id === x.id ? "bg-[#007AFF] text-white" : "hover:bg-black/5"}`}>
                <span className="truncate">{x.name}</span>
                {x.unread > 0 && <span className="opacity-70 text-[12px]">{x.unread}</span>}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Btn onClick={add}>
              <Plus size={15} /> 대화방 추가
            </Btn>
          </div>
        </Card>
        {t ? (
          <Card
            key={t.id}
            title={t.name}
            right={
              <>
                <Btn onClick={() => move(-1)}>
                  <ChevronUp size={15} />
                </Btn>
                <Btn onClick={() => move(1)}>
                  <ChevronDown size={15} />
                </Btn>
                <Btn kind="danger" onClick={() => confirm(`'${t.name}' 대화방을 삭제할까요?`) && update((x) => void (x.threads = x.threads.filter((z) => z.id !== t.id)))}>
                  <Trash2 size={15} /> 삭제
                </Btn>
              </>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <F label="이름 (저장명)">
                <T value={t.name} onChange={(v) => put({ name: v })} />
              </F>
              <F label="안 읽은 수">
                <N value={t.unread} onChange={(v) => put({ unread: v })} />
              </F>
              <F label="목록 날짜 표기">
                <T value={t.last ?? ""} ph="어제 / 화요일 / 10. 21." onChange={(v) => put({ last: v })} />
              </F>
              {app === "kakao" && (
                <F label="공지 (위에 고정)">
                  <T value={t.notice ?? ""} onChange={(v) => put({ notice: v || undefined })} />
                </F>
              )}
              {app === "kakao" && (
                <F label="단체방 인원 (1:1이면 0)">
                  <N value={t.members ?? 0} onChange={(v) => put({ members: v || undefined })} />
                </F>
              )}
            </div>
            <div className="flex flex-wrap gap-5 mb-4">
              {app === "messages" && <C label="고정" value={!!t.pinned} onChange={(v) => put({ pinned: v })} />}
              {app === "messages" && <C label="다 읽으면 상대가 전송 취소" value={!!t.unsendAfterRead} onChange={(v) => put({ unsendAfterRead: v })} />}
              {app === "kakao" && <C label="알림 끔" value={!!t.muted} onChange={(v) => put({ muted: v })} />}
            </div>
            <MsgEditor t={t} />
            <F label="보내지 않은 초안 (입력창에 미리 적혀 있고, 방문자가 전송 버튼을 누르면 최태식 메시지로 전송됨)" className="mt-4">
              <T value={t.draft ?? ""} onChange={(v) => put({ draft: v })} />
            </F>
          </Card>
        ) : (
          <Card>
            <p className="text-black/50">대화방이 없습니다.</p>
          </Card>
        )}
      </div>
    </>
  );
}

function Calls({ d }: { d: PhoneData }) {
  return (
    <Card title="통화 기록">
      <p className="text-[13px] text-black/50 mb-3">최근 기록에서 누르면 그 대사가 통화 화면 중앙에 텍스트로 나옵니다. 최태식 본인 대사는 넣지 마세요.</p>
      <Rows
        items={d.calls}
        set={(v) => update((x) => void (x.calls = v))}
        make={() => ({ id: uid(), name: "", kind: "in" as const, label: "휴대전화", when: "어제", lines: [] })}
        render={(c, put) => (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <F label="이름">
              <T value={c.name} onChange={(v) => put({ name: v })} />
            </F>
            <F label="종류">
              <select value={c.kind} onChange={(e) => put({ kind: e.target.value as "in" })}>
                <option value="in">수신</option>
                <option value="out">발신</option>
                <option value="missed">부재중</option>
              </select>
            </F>
            <F label="라벨">
              <T value={c.label} onChange={(v) => put({ label: v })} />
            </F>
            <F label="시간 표기">
              <T value={c.when} onChange={(v) => put({ when: v })} />
            </F>
            <F label="횟수">
              <N value={c.count ?? 1} onChange={(v) => put({ count: v })} />
            </F>
            <F label="상대 대사 (한 줄 = 한 문장)" className="col-span-full">
              <textarea rows={3} value={c.lines.join("\n")} onChange={(e) => put({ lines: e.target.value.split("\n") })} />
            </F>
          </div>
        )}
      />
    </Card>
  );
}

function Contacts({ d }: { d: PhoneData }) {
  return (
    <Card title={`연락처 (${d.contacts.length})`}>
      <Rows
        items={d.contacts}
        set={(v) => update((x) => void (x.contacts = v))}
        make={() => ({ id: uid(), name: "", phone: "010-****-0000", label: "휴대전화" })}
        render={(c, put) => (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <F label="저장명">
              <T value={c.name} onChange={(v) => put({ name: v })} />
            </F>
            <F label="번호">
              <T value={c.phone} onChange={(v) => put({ phone: v })} />
            </F>
            <F label="라벨">
              <T value={c.label} onChange={(v) => put({ label: v })} />
            </F>
            <F label="메모">
              <T value={c.note ?? ""} onChange={(v) => put({ note: v })} />
            </F>
            <C label="즐겨찾기" value={!!c.fav} onChange={(v) => put({ fav: v })} />
          </div>
        )}
      />
    </Card>
  );
}

function Notes({ d }: { d: PhoneData }) {
  return (
    <Card title="메모">
      <p className="text-[13px] text-black/50 mb-3">첫 줄이 제목이 됩니다. 줄 앞에 <code>[ ] </code> 또는 <code>[x] </code>를 쓰면 체크리스트가 됩니다. 잠금 암호를 넣으면 잠긴 메모가 됩니다.</p>
      <Rows
        items={d.notes}
        set={(v) => update((x) => void (x.notes = v))}
        make={() => ({ id: uid(), folder: "메모", title: "", body: "새 메모\n", when: "방금" })}
        render={(n, put) => (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <F label="시간 표기">
              <T value={n.when} onChange={(v) => put({ when: v })} />
            </F>
            <F label="잠금 암호 (선택)">
              <T value={n.lockCode ?? ""} onChange={(v) => put({ lockCode: v || undefined })} />
            </F>
            <C label="고정" value={!!n.pinned} onChange={(v) => put({ pinned: v })} />
            <span />
            <F label="본문" className="col-span-full">
              <textarea rows={7} value={n.body} onChange={(e) => put({ body: e.target.value, title: "" })} />
            </F>
          </div>
        )}
      />
    </Card>
  );
}

function Cal({ d }: { d: PhoneData }) {
  return (
    <Card title="캘린더 (매주 반복)">
      <Rows
        items={d.calendar}
        set={(v) => update((x) => void (x.calendar = v))}
        make={() => ({ id: uid(), days: [1], time: "", title: "", color: "#007AFF" })}
        render={(e, put) => (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <F label="제목">
              <T value={e.title} onChange={(v) => put({ title: v })} />
            </F>
            <F label="시작 (HH:MM, 비우면 하루 종일)">
              <T value={e.time} onChange={(v) => put({ time: v })} />
            </F>
            <F label="종료">
              <T value={e.end ?? ""} onChange={(v) => put({ end: v || undefined })} />
            </F>
            <F label="장소">
              <T value={e.place ?? ""} onChange={(v) => put({ place: v })} />
            </F>
            <F label="색">
              <input type="color" className="!h-[34px] !p-1" value={e.color} onChange={(ev) => put({ color: ev.target.value })} />
            </F>
            <div className="col-span-full flex gap-3">
              {DAYS.map((dn, i) => (
                <C key={i} label={dn} value={e.days.includes(i)} onChange={(v) => put({ days: v ? [...e.days, i].sort() : e.days.filter((x) => x !== i) })} />
              ))}
            </div>
          </div>
        )}
      />
    </Card>
  );
}

function Songs({ d }: { d: PhoneData }) {
  return (
    <Card title="음악">
      <p className="text-[13px] text-black/50 mb-3">링크를 비우면 유튜브 검색 결과로 연결됩니다. 유튜브/스포티파이 곡 주소를 넣으면 그 곡으로 바로 갑니다.</p>
      <Rows
        items={d.songs}
        set={(v) => update((x) => void (x.songs = v))}
        make={() => ({ id: uid(), title: "", artist: "", album: "", url: "", hue: Math.floor(Math.random() * 360) })}
        render={(s, put) => (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <F label="곡">
              <T value={s.title} onChange={(v) => put({ title: v })} />
            </F>
            <F label="아티스트">
              <T value={s.artist} onChange={(v) => put({ artist: v })} />
            </F>
            <F label="앨범">
              <T value={s.album} onChange={(v) => put({ album: v })} />
            </F>
            <F label="링크 (선택)">
              <T value={s.url} ph="https://youtu.be/..." onChange={(v) => put({ url: v })} />
            </F>
            <F label="커버 색 (0~360)">
              <N value={s.hue} onChange={(v) => put({ hue: v })} />
            </F>
          </div>
        )}
      />
    </Card>
  );
}

function PhotosEd({ d }: { d: PhoneData }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Card
      title={`사진 (${d.photos.length})`}
      right={
        <>
          <Btn kind="primary" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> 업로드
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              const files = [...(e.target.files || [])];
              for (const f of files) {
                const src = await shrinkImage(f);
                update((x) => void x.photos.unshift({ id: uid(), kind: "upload", src, caption: "", when: "오늘" }));
              }
              e.target.value = "";
            }}
          />
        </>
      }
    >
      <p className="text-[13px] text-black/50 mb-3">사진은 여기서 직접 올린 것만 폰에 나옵니다. 본인이 권리를 가진 사진만 쓰세요. 사진 ID를 대화 스크립트(<code>[사진] ID</code>)나 인스타 게시물/프로필에 넣으면 거기에도 나옵니다. 큰 사진은 자동으로 줄여서 저장합니다.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {d.photos.map((p) => (
          <div key={p.id} className="rounded-[12px] border border-black/[0.08] overflow-hidden bg-[#FAFAFC]">
            <img src={photoSrc(p.id, d.photos)} className="w-full aspect-square object-cover" alt="" />
            <div className="p-2 space-y-1.5">
              <input value={p.caption} placeholder="설명" onChange={(e) => update((x) => void (x.photos.find((y) => y.id === p.id)!.caption = e.target.value))} />
              <input value={p.when} placeholder="날짜 표기" onChange={(e) => update((x) => void (x.photos.find((y) => y.id === p.id)!.when = e.target.value))} />
              <div className="flex justify-between items-center">
                <code className="text-[11px] text-black/40 select-all">{p.id}</code>
                <button onClick={() => update((x) => void (x.photos = x.photos.filter((y) => y.id !== p.id)))} className="text-[#FF3B30]">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BankEd({ d }: { d: PhoneData }) {
  return (
    <Card title="뱅킹">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <F label="계좌 이름">
          <T value={d.bank.name} onChange={(v) => update((x) => void (x.bank.name = v))} />
        </F>
        <F label="계좌번호 (마스킹)">
          <T value={d.bank.account} onChange={(v) => update((x) => void (x.bank.account = v))} />
        </F>
        <F label="현재 잔액">
          <N value={d.bank.balance} onChange={(v) => update((x) => void (x.bank.balance = v))} />
        </F>
      </div>
      <Rows
        items={d.bank.txs}
        set={(v) => update((x) => void (x.bank.txs = v))}
        make={() => ({ id: uid(), when: "오늘", name: "", amount: -10000, memo: "체크카드" })}
        render={(t, put) => (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <F label="날짜 표기">
              <T value={t.when} onChange={(v) => put({ when: v })} />
            </F>
            <F label="이름 (예: 김*수)">
              <T value={t.name} onChange={(v) => put({ name: v })} />
            </F>
            <F label="금액 (출금은 -)">
              <N value={t.amount} onChange={(v) => put({ amount: v })} />
            </F>
            <F label="메모">
              <T value={t.memo} onChange={(v) => put({ memo: v })} />
            </F>
          </div>
        )}
      />
    </Card>
  );
}

function JsonEd({ d }: { d: PhoneData }) {
  const keys = ["ig", "safari", "alarms", "places", "weather"] as const;
  const [k, setK] = useState<(typeof keys)[number]>("ig");
  const [text, setText] = useState(() => JSON.stringify(d[k], null, 2));
  const [err, setErr] = useState("");
  useEffect(() => setText(JSON.stringify(d[k], null, 2)), [k]); // eslint-disable-line
  const names: Record<string, string> = { ig: "인스타그램 (피드·스토리·프로필)", safari: "사파리 (탭·검색기록·즐겨찾기)", alarms: "시계 알람", places: "지도 즐겨찾기", weather: "날씨" };
  return (
    <Card
      title="고급 편집 (JSON)"
      right={
        <Btn
          kind="primary"
          onClick={() => {
            try {
              const v = JSON.parse(text);
              update((x) => void ((x as Record<string, unknown>)[k] = v));
              setErr("적용됨");
            } catch (e) {
              setErr("JSON 오류: " + (e as Error).message);
            }
          }}
        >
          <Check size={15} /> 적용
        </Btn>
      }
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {keys.map((x) => (
          <button key={x} onClick={() => setK(x)} className={`h-[30px] px-3 rounded-full text-[13px] ${k === x ? "bg-black text-white" : "bg-black/5"}`}>
            {names[x]}
          </button>
        ))}
      </div>
      <textarea rows={24} spellCheck={false} className="font-mono !text-[12px]" value={text} onChange={(e) => setText(e.target.value)} />
      {err && <div className={`text-[13px] mt-2 ${err === "적용됨" ? "text-[#34C759]" : "text-[#FF3B30]"}`}>{err}</div>}
      <p className="text-[12px] text-black/45 mt-2">사파리 페이지 type: search(검색결과) / cafe(카페글) / market(중고거래) / job(구인) / news(기사). 사진은 사진 탭의 ID.</p>
    </Card>
  );
}

function AiEd({ d }: { d: PhoneData }) {
  const [conf, setConf] = useState(loadAiConf);
  const [target, setTarget] = useState<AiTarget>("thread");
  const [app, setApp] = useState<AppKind>("kakao");
  const [setting, setSetting] = useState("");
  const [relation, setRelation] = useState("");
  const [mood, setMood] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<unknown>(null);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true);
    setErr("");
    setOut(null);
    try {
      saveAiConf(conf);
      setOut(await generate(conf, { target, app: target === "thread" ? app : undefined, setting, relation, mood, extra }));
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };
  const apply = () => {
    const o = out as Record<string, unknown>;
    update((x) => {
      if (target === "thread") {
        const msgs = ((o.messages as Msg[]) || []).map((m) => ({ ...m, id: uid() }));
        x.threads.push({ id: uid(), app, name: String(o.name || "새 대화"), unread: 0, last: "어제", members: (o.members as number) || undefined, messages: msgs });
      } else if (target === "notes") ((o.notes as { title: string; body: string }[]) || []).forEach((n) => x.notes.push({ id: uid(), folder: "메모", title: "", body: n.body || n.title, when: "어제" }));
      else if (target === "events") ((o.events as { title: string; days: number[]; time: string }[]) || []).forEach((e) => x.calendar.push({ id: uid(), title: e.title, days: e.days || [], time: e.time || "", color: "#8E8E93" }));
      else if (target === "calls") ((o.calls as { name: string; kind: "in"; lines: string[] }[]) || []).forEach((c) => x.calls.push({ id: uid(), name: c.name, kind: c.kind || "in", label: "휴대전화", when: "어제", lines: c.lines || [] }));
    });
    setOut(null);
    setErr("폰에 추가했습니다.");
  };
  void d;
  return (
    <Card title="AI로 콘텐츠 생성">
      <p className="text-[13px] text-black/50 mb-4">
        캐릭터 설정·관계·분위기를 적으면 설정에 맞는 가상의 대화/메모/일정/통화를 만들어 줍니다. 정적 사이트라 서버가 없으므로 <b>본인의 Anthropic API 키</b>로 이 브라우저에서 직접 호출합니다. 키는 이 브라우저에만 저장되고 내보내기·게시 데이터에 포함되지 않습니다.
      </p>
      <div className="grid md:grid-cols-[1fr_220px] gap-3 mb-4">
        <F label="Anthropic API 키">
          <input type="password" value={conf.apiKey} placeholder="sk-ant-..." onChange={(e) => setConf({ ...conf, apiKey: e.target.value })} />
        </F>
        <F label="모델">
          <T value={conf.model} ph={DEFAULT_MODEL} onChange={(v) => setConf({ ...conf, model: v })} />
        </F>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <F label="만들 것">
          <select value={target} onChange={(e) => setTarget(e.target.value as AiTarget)}>
            <option value="thread">대화방 하나</option>
            <option value="notes">메모</option>
            <option value="events">캘린더 일정</option>
            <option value="calls">통화 기록 (대사)</option>
          </select>
        </F>
        {target === "thread" && (
          <F label="앱">
            <select value={app} onChange={(e) => setApp(e.target.value as AppKind)}>
              {APP_OPTS.slice(0, 3).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </F>
        )}
      </div>
      <div className="space-y-3">
        <F label="캐릭터 설정">
          <textarea rows={3} value={setting} placeholder="제작자가 정한 설정만 적으세요. 적지 않은 건 AI가 지어내지 않도록 지시합니다." onChange={(e) => setSetting(e.target.value)} />
        </F>
        <F label="관계 (예: 오래 거래한 정보상, 처음 연락 온 의뢰인)">
          <T value={relation} onChange={setRelation} />
        </F>
        <F label="원하는 분위기">
          <T value={mood} ph="건조함, 긴장감, 은근한 위협…" onChange={setMood} />
        </F>
        <F label="추가 요청">
          <T value={extra} ph="메시지 15개 정도, 마지막은 상대가 보낸 말로" onChange={setExtra} />
        </F>
      </div>
      <div className="flex gap-2 mt-4">
        <Btn kind="primary" onClick={run} disabled={busy}>
          <Sparkles size={15} /> {busy ? "생성 중…" : "생성"}
        </Btn>
        {out !== null && (
          <Btn onClick={apply}>
            <Check size={15} /> 폰에 추가
          </Btn>
        )}
      </div>
      {err && <div className="text-[13px] mt-3 text-[#FF3B30]">{err}</div>}
      {out !== null && <pre className="mt-3 text-[12px] bg-black/[0.04] rounded-[10px] p-3 max-h-[360px] overflow-auto whitespace-pre-wrap">{JSON.stringify(out, null, 2)}</pre>}
    </Card>
  );
}

/* 회차 저장: 지금 폰 상태를 이름 붙여 여러 개 저장 → 골라서 불러오기 / 공개용 파일로 받기 */
type Episode = { id: string; name: string; at: number; data: PhoneData };
const EP_KEY = "taesik-phone:episodes";
function loadEps(): Episode[] {
  try {
    return JSON.parse(localStorage.getItem(EP_KEY) || "[]");
  } catch {
    return [];
  }
}
function Episodes({ d, download }: { d: PhoneData; download: (name: string, obj: unknown) => void }) {
  const [eps, setEps] = useState<Episode[]>(loadEps);
  const [name, setName] = useState("");
  const save = (list: Episode[]) => {
    try {
      localStorage.setItem(EP_KEY, JSON.stringify(list));
      setEps(list);
    } catch {
      alert("저장 공간이 부족합니다. 오래된 회차를 지우거나 사진 수를 줄여 주세요.");
    }
  };
  return (
    <Card title="회차 저장 (연재용)">
      <p className="text-[13px] text-black/50 mb-3 leading-[20px]">
        지금 폰 상태를 '1화', '2화'처럼 이름 붙여 저장해 두고, 공개할 때 골라서 phone-data.json으로 받으면 됩니다. 회차는 이 브라우저에만 저장돼요.
      </p>
      <div className="flex gap-2 mb-3">
        <input value={name} placeholder="회차 이름 (예: 1화 — 첫 의뢰)" onChange={(e) => setName(e.target.value)} />
        <Btn
          kind="primary"
          onClick={() => {
            save([{ id: uid(), name: name.trim() || `${eps.length + 1}화`, at: Date.now(), data: structuredClone(d) }, ...eps]);
            setName("");
          }}
        >
          <Plus size={15} /> 지금 상태 저장
        </Btn>
      </div>
      {eps.length === 0 && <div className="text-[13px] text-black/40">저장된 회차가 없습니다.</div>}
      <div className="space-y-2">
        {eps.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-2 border border-black/[0.08] rounded-[12px] px-3 py-2 bg-[#FAFAFC]">
            <div className="flex-1 min-w-[140px]">
              <div className="text-[14px] font-semibold">{e.name}</div>
              <div className="text-[12px] text-black/45">{new Date(e.at).toLocaleString("ko-KR")}</div>
            </div>
            <Btn onClick={() => confirm(`'${e.name}' 상태로 폰을 바꿀까요? (지금 내용은 사라집니다. 먼저 저장해 두세요)`) && setData({ ...defaultData(), ...e.data })}>불러오기</Btn>
            <Btn kind="primary" onClick={() => download("phone-data.json", { ...e.data, _rev: Date.now() })}>
              <Download size={15} /> 이 회차로 공개 파일 받기
            </Btn>
            <Btn kind="danger" onClick={() => confirm("삭제할까요?") && save(eps.filter((x) => x.id !== e.id))}>
              <Trash2 size={15} />
            </Btn>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Backup({ d }: { d: PhoneData }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [sess, setSess] = useState(getSession());
  const download = (name: string, obj: unknown) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <Card title="백업 (JSON)">
        <div className="flex flex-wrap gap-2">
          <Btn kind="primary" onClick={() => download(`taesik-phone-backup-${new Date().toISOString().slice(0, 10)}.json`, d)}>
            <Download size={15} /> 내보내기
          </Btn>
          <Btn onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> 불러오기
          </Btn>
          <Btn kind="danger" onClick={() => confirm("모든 수정 내용을 지우고 기본 데이터로 되돌릴까요?") && resetData()}>
            <RotateCcw size={15} /> 기본값으로 초기화
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const j = JSON.parse(await f.text());
                const { _rev, ...rest } = j;
                void _rev;
                setData({ ...defaultData(), ...rest });
                setMsg("불러왔습니다.");
              } catch {
                setMsg("올바른 JSON 파일이 아닙니다.");
              }
              e.target.value = "";
            }}
          />
        </div>
        {msg && <div className="text-[13px] mt-3 text-black/60">{msg}</div>}
      </Card>
      <Episodes d={d} download={download} />
      <Card title="방문자에게 반영하기 (게시)">
        <p className="text-[14px] text-black/70 leading-[23px]">
          여기서 고친 내용은 우선 <b>이 브라우저</b>에만 저장됩니다. 링크로 들어오는 모든 사람에게 보이게 하려면 아래 둘 중 하나를 하세요.
        </p>
        <div className="mt-4 rounded-[12px] bg-black/[0.03] p-4">
          <div className="font-semibold text-[14px] mb-1">방법 1 · 파일로 게시 (서버 필요 없음, 추천)</div>
          <p className="text-[13px] text-black/60 leading-[21px] mb-3">
            아래 버튼으로 <code>phone-data.json</code>을 받아서 프로젝트의 <code>public/</code> 폴더(빌드된 경우 <code>dist/</code> 폴더, 단일 HTML이면 그 HTML과 같은 폴더)에 넣고 다시 배포하세요. 방문자는 접속할 때 이 파일을 읽습니다.
          </p>
          <Btn kind="primary" onClick={() => download("phone-data.json", { ...d, _rev: Date.now() })}>
            <Download size={15} /> phone-data.json 받기
          </Btn>
        </div>
        <div className="mt-3 rounded-[12px] bg-black/[0.03] p-4">
          <div className="font-semibold text-[14px] mb-1 flex items-center gap-1.5">
            <Cloud size={15} /> 방법 2 · Supabase로 즉시 게시
          </div>
          {cloudEnabled() ? (
            <>
              <p className="text-[13px] text-black/60 mb-3">연결됨: {SB_URL}</p>
              {sess ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px]">{sess.email} 로그인됨</span>
                  <Btn
                    kind="primary"
                    onClick={async () => {
                      try {
                        await publish(d);
                        setMsg("게시 완료! 방문자 화면에 반영됩니다.");
                      } catch (e) {
                        setMsg((e as Error).message);
                      }
                    }}
                  >
                    <Cloud size={15} /> 지금 게시
                  </Btn>
                  <Btn onClick={() => (signOut(), setSess(null))}>로그아웃</Btn>
                </div>
              ) : (
                <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
                  <input value={email} placeholder="제작자 이메일" onChange={(e) => setEmail(e.target.value)} />
                  <input type="password" value={pw} placeholder="비밀번호" onChange={(e) => setPw(e.target.value)} />
                  <Btn
                    kind="primary"
                    onClick={async () => {
                      try {
                        setSess(await signIn(email, pw));
                        setPw("");
                        setMsg("");
                      } catch (e) {
                        setMsg((e as Error).message);
                      }
                    }}
                  >
                    로그인
                  </Btn>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-black/60 leading-[21px]">
              아직 연결 안 됨. 프로젝트 폴더의 <code>.env</code>에 <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>를 넣고 다시 빌드하면 켜집니다. (README 참고)
            </p>
          )}
          <details className="mt-3">
            <summary className="text-[13px] cursor-pointer text-black/60">Supabase 테이블 만들기 SQL</summary>
            <pre className="text-[11px] bg-white rounded-[8px] p-3 mt-2 overflow-auto border border-black/5">{SETUP_SQL}</pre>
            <Btn onClick={() => navigator.clipboard.writeText(SETUP_SQL)}>
              <Copy size={14} /> 복사
            </Btn>
          </details>
        </div>
      </Card>
    </>
  );
}

const SECTIONS: [string, string, (p: { d: PhoneData }) => React.ReactElement][] = [
  ["basic", "기본 설정", Basic],
  ["events", "이벤트 · 잠금화면", Events],
  ["threads", "대화방 · 메시지", Threads],
  ["calls", "통화 기록", Calls],
  ["contacts", "연락처", Contacts],
  ["notes", "메모", Notes],
  ["calendar", "캘린더", Cal],
  ["songs", "음악", Songs],
  ["photos", "사진", PhotosEd],
  ["bank", "뱅킹", BankEd],
  ["json", "인스타 · 사파리 · 기타", JsonEd],
  ["ai", "AI 생성", AiEd],
  ["backup", "백업 · 회차 · 게시", Backup],
];

/** 미리보기 폰에 '이 앱 열기' 신호 */
export const preview = (app?: string, arg?: unknown, phase?: "lock") => {
  const detail = { app, arg, phase };
  (window as unknown as { __lastPreview?: unknown }).__lastPreview = detail; // 미리보기가 나중에 열려도 같은 화면으로
  window.dispatchEvent(new CustomEvent("phone:open", { detail }));
};

/* 섹션을 고르면 미리보기 폰에서 그 앱이 열림 */
const SECTION_APP: Record<string, string | undefined> = {
  calls: "phone",
  contacts: "contacts",
  notes: "notes",
  calendar: "calendar",
  songs: "music",
  photos: "photos",
  bank: "bank",
  json: "safari",
};

function PreviewPane({ onClose }: { onClose?: () => void }) {
  const [s, setS] = useState(() => Math.min(0.8, (window.innerHeight - 150) / 892));
  useEffect(() => {
    const f = () => setS(Math.min(0.8, (window.innerHeight - 150) / 892));
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2 items-center">
        <Btn onClick={() => preview(undefined, undefined, "lock")}>잠금화면</Btn>
        <Btn onClick={() => preview()}>홈</Btn>
        {onClose && <Btn onClick={onClose}>닫기</Btn>}
      </div>
      <Phone embedded previewScale={s} />
      <p className="text-[12px] text-black/45 text-center leading-[18px]">
        고치는 즉시 여기에 반영됩니다.
        <br />
        미리보기 폰도 직접 눌러서 써 볼 수 있어요.
      </p>
    </div>
  );
}

export default function Editor() {
  const d = useData();
  const [sec, setSec] = useState(() => sessionStorage.getItem("ed-sec") || "threads");
  const [showPrev, setShowPrev] = useState(false);
  const [wide, setWide] = useState(() => window.innerWidth >= 1200);
  useEffect(() => {
    sessionStorage.setItem("ed-sec", sec);
    if (sec === "events") preview(undefined, undefined, "lock");
    else if (sec === "basic") preview();
    else if (SECTION_APP[sec]) preview(SECTION_APP[sec]);
  }, [sec]);
  useEffect(() => {
    document.title = "편집 — 최태식의 iPhone";
    document.body.style.overflow = "auto";
    const f = () => setWide(window.innerWidth >= 1200);
    window.addEventListener("resize", f);
    return () => {
      document.title = "최태식의 iPhone";
      document.body.style.overflow = "";
      window.removeEventListener("resize", f);
    };
  }, []);
  const Cur = SECTIONS.find((s) => s[0] === sec)?.[2] ?? Threads;
  const goPhone = () => {
    if (location.pathname.endsWith("/editor")) location.href = location.pathname.replace(/editor\/?$/, "");
    else location.hash = "";
  };
  return (
    <div className="ed min-h-full bg-[#F2F2F7] text-black" style={{ fontFamily: "var(--font)" }}>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 h-[56px] flex items-center gap-3">
          <button onClick={goPhone} className="flex items-center gap-1 text-[#007AFF] text-[15px]">
            <ArrowLeft size={18} /> 폰 보기
          </button>
          <div className="font-semibold text-[16px] ml-2">최태식 폰 편집기</div>
          <span className="text-[12px] text-black/40 hidden md:inline">수정 즉시 자동 저장 · 오른쪽 미리보기에 바로 반영</span>
          <span className="flex-1" />
          {!wide && (
            <Btn kind="primary" onClick={() => setShowPrev(true)}>
              <Smartphone size={15} /> 미리보기
            </Btn>
          )}
        </div>
      </header>
      <div className={`max-w-[1600px] mx-auto px-4 py-5 grid gap-5 ${wide ? "grid-cols-[190px_minmax(0,1fr)_auto]" : "md:grid-cols-[190px_minmax(0,1fr)]"}`}>
        <nav className="md:sticky md:top-[76px] self-start flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => setSec(id)} className={`text-left px-3 h-[36px] rounded-[9px] text-[14px] whitespace-nowrap ${sec === id ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] font-semibold" : "hover:bg-black/5 text-black/70"}`}>
              {label}
            </button>
          ))}
        </nav>
        <main className="min-w-0">
          <Cur d={d} />
        </main>
        {wide && (
          <aside className="sticky top-[76px] self-start">
            <PreviewPane />
          </aside>
        )}
      </div>
      {!wide && showPrev && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-start justify-center pt-[70px] overflow-auto" onClick={() => setShowPrev(false)}>
          <div className="bg-[#F2F2F7] rounded-[20px] p-4" onClick={(e) => e.stopPropagation()}>
            <PreviewPane onClose={() => setShowPrev(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

/* 제작자용 편집 화면 (/editor 또는 #/editor) */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, Download, Upload, RotateCcw, Sparkles, Cloud, Check, Copy, Smartphone } from "lucide-react";
import { useData, update, setData, resetData, sanitize, uid, undo, redo, canUndo, canRedo, DAYS, type PhoneData, type Msg, type Thread, type AppKind, type Song, type CustomApp, type CustomItem, type Page } from "./store";
import { defaultData, blankData } from "./data";
import { photoSrc, shrinkImage } from "./photos";
import { fromLink, searchSong, fetchLyrics, isSpCollection, songYtId, LYRIC_LEAD, parseLyrics, fmtTime, parseDur, showDur } from "./songMeta";
import { soundYtId, loadYT, type YTPlayer } from "./music";
import { generate, loadAiConf, saveAiConf, DEFAULT_MODEL, type AiTarget } from "./ai";
import Phone from "./Phone";
import { AppIcon } from "./icons";
import { APPS, BUILTIN_APPS, syncCustomApps } from "./apps";
import { RINGTONES, NOTIFY_SOUNDS, toggleSound, stopSound, onSoundChange } from "./sounds";
import { cloudEnabled, getSession, signIn, signOut, publish, SETUP_SQL, SB_URL } from "./cloud";

/* ───────── 대화 스크립트 ↔ 메시지 ───────── */
export function toScript(msgs: Msg[]) {
  return msgs
    .map((m) => {
      const body = m.kind === "deleted" ? "[삭제됨]" : m.kind === "pay" ? `[송금] ${m.amount ?? 0}${m.text ? " " + m.text : ""}` : m.kind === "photo" ? `[사진] ${m.photo ?? ""}` : m.text;
      const lines = body.split("\n");
      const head = m.kind === "date" ? `=== ${lines[0]}` : m.from === "system" ? `--- ${lines[0]}` : `${m.from === "me" ? "나" : m.who || "상대"}: ${lines[0]}`;
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
    if (line.startsWith("===")) {
      out.push({ id: uid(), from: "system", kind: "date", text: line.replace(/^=+\s*/, "") });
      continue;
    }
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
/** 요약에 보이는 값 한국어로 */
const VAL_KO: Record<string, string> = { missed: "부재중", in: "수신", out: "발신", me: "나", them: "상대", new: "새 업무", doing: "진행 중", done: "끝남", declined: "거절" };
/** 항목 한 줄 요약: 글자 칸 앞의 두 개 (예: "박 실장 · 수신") */
const summaryOf = (it: unknown) => {
  if (!it || typeof it !== "object") return String(it ?? "");
  const parts = Object.entries(it as Record<string, unknown>)
    .filter(([k, v]) => k !== "id" && typeof v === "string" && v.trim() && !v.startsWith("data:") && !/^https?:/.test(v))
    .slice(0, 2)
    .map(([, v]) => VAL_KO[v as string] ?? (v as string).replace(/\s+/g, " "));
  return parts.join(" · ").slice(0, 70) || "(빈 항목)";
};
function Rows<X>({ items, set, make, render, label = "추가" }: { items: X[]; set: (x: X[]) => void; make: () => NoInfer<X>; render: (it: X, put: (v: Partial<X>) => void, i: number) => React.ReactNode; label?: string }) {
  const keyOf = (it: X, i: number) => String((it as { id?: string })?.id ?? i);
  // 항목이 많으면 한 줄로 접어 두고, 누르면 펼쳐서 고치기
  const many = items.length > 4;
  const [open, setOpen] = useState<Set<string>>(() => new Set(many ? [] : items.map(keyOf)));
  const lastAdded = useRef<string | null>(null);
  // 다른 버튼(예: 사파리 "새 탭 만들기")으로 새로 생긴 항목도 바로 펼쳐서 보여 줌
  const prevKeys = useRef<string[] | null>(null);
  useEffect(() => {
    const keys = items.map(keyOf);
    const old = prevKeys.current;
    prevKeys.current = keys;
    if (!old) return;
    const fresh = keys.filter((k) => !old.includes(k));
    if (fresh.length === 1 && keys.length === old.length + 1) {
      lastAdded.current = fresh[0];
      setOpen((s) => new Set(s).add(fresh[0]));
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (k: string) => setOpen((s) => (s.has(k) ? (s.delete(k), new Set(s)) : new Set(s).add(k)));
  useEffect(() => {
    if (!lastAdded.current) return;
    document.querySelector(`[data-row-key="${lastAdded.current}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    lastAdded.current = null;
  });
  return (
    <div className="space-y-2">
      {many && (
        <div className="flex gap-2 justify-end">
          <button className="text-[13px] text-[#007AFF]" onClick={() => setOpen(new Set(items.map(keyOf)))}>
            모두 펼치기
          </button>
          <span className="text-black/20">|</span>
          <button className="text-[13px] text-[#007AFF]" onClick={() => setOpen(new Set())}>
            모두 접기
          </button>
        </div>
      )}
      {items.map((it, i) => {
        const k = keyOf(it, i);
        const isOpen = open.has(k);
        return (
          <div key={k} data-row-key={k} className={`relative border border-black/[0.08] rounded-[12px] bg-[#FAFAFC] ${isOpen ? "p-3 pr-11" : "pr-11"}`}>
            {isOpen ? (
              <>
                {render(it, (v) => set(items.map((x, j) => (j === i ? { ...x, ...v } : x))), i)}
                {many && (
                  <button onClick={() => toggle(k)} className="mt-2 text-[13px] text-black/45 hover:text-black/70 flex items-center gap-1">
                    <ChevronUp size={14} /> 접기
                  </button>
                )}
              </>
            ) : (
              <button onClick={() => toggle(k)} className="w-full text-left px-3 h-[44px] flex items-center gap-2 text-[14px]">
                <ChevronRight size={15} className="text-black/35 shrink-0" />
                <span className="text-black/35 tabular w-[22px] shrink-0">{i + 1}</span>
                <span className="truncate">{summaryOf(it)}</span>
              </button>
            )}
            <div className={`absolute right-2 flex gap-1 ${isOpen ? "top-2 flex-col" : "top-[7px]"}`}>
              {isOpen && (
                <>
                  <button title="위로" onClick={() => i > 0 && set(items.map((x, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : x)))} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
                    <ChevronUp size={16} />
                  </button>
                  <button title="아래로" onClick={() => i < items.length - 1 && set(items.map((x, j) => (j === i + 1 ? items[i] : j === i ? items[i + 1] : x)))} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
                    <ChevronDown size={16} />
                  </button>
                </>
              )}
              <button title="삭제" onClick={() => confirm("삭제할까요?") && set(items.filter((_, j) => j !== i))} className="w-7 h-7 rounded-md hover:bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
      <Btn
        onClick={() => {
          const n = make();
          const k = keyOf(n, items.length);
          lastAdded.current = k;
          setOpen((s) => new Set(s).add(k));
          set([...items, n]);
        }}
      >
        <Plus size={15} /> {label}
      </Btn>
    </div>
  );
}

/** 되돌리기 · 다시 하기 버튼 (+ Ctrl+Z / Ctrl+Shift+Z · Ctrl+Y) */
function UndoBar() {
  useData(); // 바뀔 때마다 버튼 상태 갱신
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="flex gap-1">
      <button title="되돌리기 (Ctrl+Z)" disabled={!canUndo()} onClick={undo} className="h-[34px] px-2.5 rounded-[9px] text-[14px] bg-black/[0.05] hover:bg-black/[0.09] disabled:opacity-30">
        ↶ <span className="hidden sm:inline">되돌리기</span>
      </button>
      <button title="다시 하기 (Ctrl+Shift+Z)" disabled={!canRedo()} onClick={redo} className="h-[34px] px-2.5 rounded-[9px] text-[14px] bg-black/[0.05] hover:bg-black/[0.09] disabled:opacity-30">
        ↷ <span className="hidden sm:inline">다시 하기</span>
      </button>
    </div>
  );
}

/* ───────── 섹션들 ───────── */
function Basic({ d }: { d: PhoneData }) {
  const s = (fn: (x: PhoneData) => void) => update(fn);
  // 지금 재생 중인 미리듣기 (■ 표시용) · 이 화면을 떠나면 소리 멈춤
  const [playing, setPlaying] = useState("");
  useEffect(() => {
    const off = onSoundChange(setPlaying);
    return () => {
      off();
      stopSound();
    };
  }, []);
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
          <F label="계산기 금고 숫자 (계산기에 치고 = 누르면 열림)">
            <T value={d.vault?.code ?? ""} ph="예: 7777" onChange={(v) => s((x) => void (x.vault = { notes: x.vault?.notes ?? [], code: v.replace(/\D/g, "").slice(0, 9) }))} />
          </F>
          <F label="위장 암호 (치면 텅 빈 가짜 폰 · 비우면 끔)">
            <T value={d.decoyCode ?? ""} ph="예: 1111" onChange={(v) => s((x) => void (x.decoyCode = v.replace(/\D/g, "").slice(0, 6)))} />
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
          ▶를 눌러 들어 보고(한 번 더 누르면 멈춤, 다른 걸 누르면 이전 소리는 자동으로 멈춤) 마음에 드는 걸 '선택'하세요. 벨소리는 전화가 걸려올 때 반복, 알림음은 배너 알림이 뜰 때 한 번 나옵니다.
          <br />
          기본 소리는 Mixkit · Pixabay 무료 효과음(무료 라이선스, 출처 표기 불필요)입니다. 아이폰 정품 벨소리는 애플 저작권이라 넣지 않았어요. 직접 파일을 올려도 됩니다. 제어 센터의 종 버튼이 무음 모드.
        </p>
        {(["ringtone", "notify"] as const).map((k) => (
          <div key={k + "-presets"} className="py-2 border-t border-black/5">
            <div className="text-[14px] font-medium mb-2">{k === "ringtone" ? "벨소리 고르기" : "알림음 고르기"}</div>
            <div className="flex flex-wrap gap-2">
              {(k === "ringtone" ? RINGTONES : NOTIFY_SOUNDS).map(([id, label]) => {
                const on = d.sounds?.[k] === `preset:${id}`;
                return (
                  <div key={id} className={`flex items-center rounded-[10px] border ${on ? "border-[#007AFF] bg-[#007AFF]/10" : "border-black/10 bg-white"}`}>
                    <button onClick={() => toggleSound(`preset:${id}`)} className="px-[10px] h-[34px] text-[14px]" title={playing === `preset:${id}` ? "멈추기" : "들어보기"}>
                      <span className="inline-block w-[14px]" style={{ color: playing === `preset:${id}` ? "#FF3B30" : undefined }}>
                        {playing === `preset:${id}` ? "■" : "▶"}
                      </span>{" "}
                      {label}
                    </button>
                    <button
                      onClick={() => s((x) => void (x.sounds = { ...(x.sounds ?? {}), [k]: `preset:${id}` }))}
                      className={`px-[10px] h-[34px] text-[13px] font-semibold border-l ${on ? "text-[#007AFF] border-[#007AFF]/30" : "text-black/50 border-black/10"}`}
                    >
                      {on ? "선택됨" : "선택"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {(["ringtone", "notify"] as const).map((k) => (
          <div key={k} className="flex flex-wrap items-center gap-2 py-2 border-t border-black/5">
            <span className="w-[80px] text-[14px] font-medium">{k === "ringtone" ? "벨소리" : "알림음"}</span>
            <span className="text-[13px] text-black/50 flex-1 min-w-[120px]">
              {d.sounds?.[k]?.startsWith("preset:") ? `기본 소리: ${[...RINGTONES, ...NOTIFY_SOUNDS].find(([id]) => `preset:${id}` === d.sounds?.[k])?.[1] ?? ""}` : d.sounds?.[k] ? `직접 올린 파일 (${Math.round((d.sounds[k]!.length * 0.75) / 1024)}KB)` : "없음"}
            </span>
            {d.sounds?.[k] && <Btn onClick={() => toggleSound(d.sounds![k]!)}>{playing === d.sounds[k] ? "■ 멈추기" : "▶ 들어보기"}</Btn>}
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
              {APP_OPTS.slice(0, 2).map(([v, l]) => (
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
      <Card title="'누가 폰을 보고 있다' 연출 (한 번만)">
        <p className="text-[13px] text-black/50 mb-3">오래 들여다보면 딱 한 번, Face ID가 "얼굴을 인식할 수 없음"을 띄우고 잠금화면으로 돌아갑니다. 알림은 안 뜹니다.</p>
        <div className="grid grid-cols-3 gap-4 items-end">
          <C label="사용" value={!!e.watcher?.enabled} onChange={(v) => update((x) => void (x.events.watcher = { afterSec: x.events.watcher?.afterSec ?? 300, enabled: v }))} />
          <F label="몇 초 뒤">
            <N value={e.watcher?.afterSec ?? 300} onChange={(v) => update((x) => void (x.events.watcher = { enabled: x.events.watcher?.enabled ?? true, afterSec: v }))} />
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
        <b>쓰는 법</b> · <code>나: 내용</code> 최태식이 보낸 말 · <code>상대: 내용</code> 상대가 보낸 말 · 단체방은 <code>이름: 내용</code> · <code>--- 안내문</code> 가운데 회색 안내 · <code>=== 10월 22일 수요일</code> 날짜 줄(시간 없음) · 줄 앞에 공백 두 칸이면 윗 말풍선에 줄바꿈으로 이어짐
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
  const who = (m: Msg) => (m.kind === "date" ? "__date" : m.from === "system" ? "__sys" : m.from === "me" ? "__me" : m.who || "__them");
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
                        : v === "__date"
                          ? { ...x, from: "system", who: undefined, kind: "date" }
                          : v === "__sys"
                          ? { ...x, from: "system", who: undefined, kind: undefined }
                          : v === "__me"
                            ? { ...x, from: "me", who: undefined, kind: x.kind === "date" ? undefined : x.kind }
                            : v === "__them"
                              ? { ...x, from: "them", who: undefined, kind: x.kind === "date" ? undefined : x.kind }
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
                <option value="__date">날짜 줄</option>
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
            <Btn onClick={() => setMsgs((l) => [...l, { id: uid(), from: "system", kind: "date", text: "10월 25일 일요일" }])}>
              <Plus size={15} /> 날짜 줄 추가
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
        {(APP_OPTS.slice(0, 2) as [AppKind, string][]).map(([v, l]) => (
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
            <F label="폴더 (예: 메모, 의뢰)">
              <T value={n.folder} ph="메모" onChange={(v) => put({ folder: v || "메모" })} />
            </F>
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

/** 싱크 찍을 때 사람 반응 시간(초) */
const REACTION = 0.2;
/** 가사 싱크 맞추기: 이 창 안에서 노래가 나옴 → 파란 줄을 부르기 시작할 때 '지금!'(스페이스바) → 그 순간 재생 시간이 찍힘.
 *  다 찍으면 바로 들어 보며 확인. 줄을 누르면 그 부분부터 다시 찍기. */
function LyricSync({ song, onDone, onClose }: { song: Song; onDone: (lrc: string) => void; onClose: () => void }) {
  const parsed = parseLyrics(song.lyrics);
  const lines = parsed.map((l) => l.text);
  const vid = soundYtId(song);
  // 이미 싱크가 있으면 그 시간부터 시작 (고칠 부분만 다시 찍으면 됨)
  const [times, setTimes] = useState<number[]>(() => (parsed.every((l) => l.t !== null) ? parsed.map((l) => l.t as number) : []));
  const [cursor, setCursor] = useState(() => (parsed.every((l) => l.t !== null) ? lines.length : 0));
  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(!vid);
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // 유튜브 링크가 없을 때: 그냥 시계 (다른 데서 노래를 틀고 같이 시작)
  const clock = useRef<{ base: number; at: number | null }>({ base: 0, at: null });
  // 유튜브 시간은 띄엄띄엄 오니까 폰과 똑같이 사이를 채워서 읽음 (찍는 시간 = 폰에서 보이는 시간)
  const sm = useRef({ raw: -1, at: 0 });
  const getT = () => {
    const y = yt.current;
    if (!y) return clock.current.base + (clock.current.at !== null ? (performance.now() - clock.current.at) / 1000 : 0);
    const raw = y.getCurrentTime() || 0;
    const n = performance.now();
    if (raw !== sm.current.raw || y.getPlayerState() !== 1) sm.current = { raw, at: n };
    return y.getPlayerState() === 1 ? raw + Math.min(0.5, (n - sm.current.at) / 1000) : raw;
  };

  useEffect(() => {
    if (!vid || !host.current) return;
    let dead = false;
    loadYT().then((YT) => {
      if (dead || !host.current) return;
      const el = document.createElement("div");
      host.current.appendChild(el);
      const p = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        videoId: vid,
        width: "100%",
        height: "100%",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            yt.current = p;
            setReady(true);
          },
          onStateChange: (e: { data: number }) => setPlaying(e.data === 1),
        },
      });
    });
    return () => {
      dead = true;
      yt.current = null;
    };
  }, [vid]);
  useEffect(() => {
    const i = setInterval(() => setNow(getT()), 60);
    return () => clearInterval(i);
  });
  const play = () => {
    if (yt.current) yt.current.playVideo();
    else if (clock.current.at === null) {
      clock.current.at = performance.now();
      setPlaying(true);
    }
  };
  const pause = () => {
    if (yt.current) yt.current.pauseVideo();
    else if (clock.current.at !== null) {
      clock.current.base = getT();
      clock.current.at = null;
      setPlaying(false);
    }
  };
  const seek = (x: number) => {
    const t = Math.max(0, x);
    if (yt.current) yt.current.seekTo(t, true);
    else clock.current = { base: t, at: clock.current.at !== null ? performance.now() : null };
    setNow(t);
  };
  const stamp = () => {
    if (!playing) return play();
    if (cursor >= lines.length) return;
    // 사람은 노래를 듣고 나서 누르니까 평균 반응 시간만큼 당겨서 저장
    const t = Math.max(0, Math.round((getT() - REACTION) * 100) / 100);
    setTimes((old) => {
      const n = old.slice(0, cursor);
      n[cursor] = t;
      return n;
    });
    setCursor((c) => c + 1);
  };
  const undo = () => {
    if (!cursor) return;
    const c = cursor - 1;
    setCursor(c);
    setTimes((old) => old.slice(0, c));
    seek((times[c - 1] ?? times[c] ?? 2) - 1);
  };
  /** 이 줄부터 다시 찍기: 바로 앞 줄 시간 조금 전으로 돌아가서 */
  const redoFrom = (i: number) => {
    setCursor(i);
    setTimes((old) => old.slice(0, i));
    seek((times[i - 1] ?? 0) - (i ? 0.5 : 0));
    play();
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        stamp();
      }
      if (e.code === "Backspace" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const done = cursor >= lines.length;
  // 확인용: 지금 시간에 해당하는 줄 (다 찍은 뒤 들어 보면 이 줄이 따라 움직임)
  let live = -1;
  times.forEach((t, i) => t <= now + LYRIC_LEAD && (live = i));
  const focus = done ? live : cursor;
  useEffect(() => {
    listRef.current?.querySelector(`[data-row="${Math.max(0, focus)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focus]);
  const save = () => onDone(lines.map((l, i) => (times[i] !== undefined ? `[${fmtTime(times[i])}] ${l}` : l)).join("\n"));
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-[18px] w-full max-w-[560px] max-h-[94vh] flex flex-col p-4 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-bold">가사 싱크 맞추기</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/5 text-black/50 text-[18px]" aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="text-[13px] text-black/55 mt-1 leading-[19px]">
          {done ? (
            <>
              <b>다 찍었어요!</b> 재생해서 들어 보세요. 파란 줄이 노래랑 맞으면 <b>저장</b>. 틀린 줄은 눌러서 거기부터 다시 찍으면 돼요.
            </>
          ) : (
            <>
              <b>▶ 재생</b> 누르고, <b>파란 줄을 부르기 시작할 때</b> <b>지금!</b>을 누르세요 (컴퓨터: 스페이스바 · 되돌리기: ← 지우기 키).
            </>
          )}
        </div>
        {vid ? (
          <div ref={host} className="mt-3 w-full aspect-video max-h-[180px] rounded-[12px] overflow-hidden bg-black shrink-0" />
        ) : (
          <div className="mt-3 rounded-[12px] bg-[#FFF4E5] text-[13px] text-[#8a5a00] p-3 leading-[19px]">
            유튜브 링크가 없어서 여기서 노래를 틀 수 없어요. 곡 링크나 <b>소리용 유튜브 링크</b>를 넣으면 이 창에서 바로 나와요. (지금은 다른 데서 노래를 틀고 ▶를 같이 누르면 시계로 찍혀요)
          </div>
        )}
        <div className="flex items-center gap-2 mt-3 shrink-0">
          <Btn kind="primary" disabled={!ready} onClick={() => (playing ? pause() : play())}>
            {playing ? "❚❚ 일시정지" : "▶ 재생"}
          </Btn>
          <Btn onClick={() => seek(getT() - 5)}>5초 뒤로</Btn>
          {times.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-black/55">
              전체
              <Btn onClick={() => setTimes((o) => o.map((x) => Math.max(0, Math.round((x - 0.1) * 100) / 100)))}>0.1초 빨리</Btn>
              <Btn onClick={() => setTimes((o) => o.map((x) => Math.round((x + 0.1) * 100) / 100))}>0.1초 늦게</Btn>
            </span>
          )}
          <span className="flex-1 text-right text-[20px] font-bold tabular">{fmtTime(now)}</span>
        </div>
        <div ref={listRef} className="flex-1 overflow-auto rounded-[12px] bg-black/[0.03] p-2 mt-3 min-h-[150px]">
          {lines.map((l, i) => {
            const cur = i === focus;
            return (
              <button
                key={i}
                data-row={i}
                onClick={() => redoFrom(i)}
                title="이 줄부터 다시 찍기"
                className={`w-full flex gap-3 px-2 py-[6px] rounded-[8px] text-left text-[15px] hover:bg-black/[0.04] ${cur ? (done ? "bg-[#007AFF]/10 text-[#007AFF] font-bold" : "bg-[#007AFF] text-white font-bold") : i < cursor ? "text-black" : "text-black/35"}`}
              >
                <span className={`tabular w-[64px] shrink-0 text-[13px] pt-[1px] ${cur && !done ? "text-white/80" : "text-black/40"}`}>{times[i] !== undefined ? fmtTime(times[i]) : ""}</span>
                <span>{l || "♪ (간주)"}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 shrink-0">
          <button
            onClick={stamp}
            disabled={done || !ready}
            className="flex-1 min-w-[160px] h-[52px] rounded-[14px] bg-[#007AFF] text-white text-[18px] font-bold disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {!playing && !done ? "▶ 재생하고 시작" : done ? "다 찍었어요" : `지금! (${cursor + 1}/${lines.length})`}
          </button>
          <Btn onClick={undo} disabled={!cursor}>
            한 줄 되돌리기
          </Btn>
          <Btn
            onClick={() => {
              setTimes([]);
              setCursor(0);
              seek(0);
            }}
          >
            처음부터
          </Btn>
          <Btn kind="primary" disabled={!times.length} onClick={save}>
            저장
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SongEd({ s, put: putNow }: { s: Song; put: (v: Partial<Song>) => void }) {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [sync, setSync] = useState(false);
  const lastLink = useRef(s.url);
  // 기다렸다가 저장할 땐 곡 ID로 바로 (그 사이 다른 칸을 고쳐도 덮어쓰지 않게)
  const put = (v: Partial<Song>) =>
    update((x) => {
      const y = x.songs.find((z) => z.id === s.id);
      if (y) Object.assign(y, v);
    });
  /** 링크(또는 제목)로 표지 · 제목 · 가수 · 길이 · 미리듣기 · 가사까지 전부 자동으로 */
  const fill = async (kind: "link" | "search", url = s.url, silent = false) => {
    setBusy(kind);
    setMsg("");
    const cur = { title: s.title, artist: s.artist, album: s.album, dur: s.dur, lyrics: s.lyrics };
    try {
      let m: Awaited<ReturnType<typeof fromLink>>;
      if (kind === "link") {
        try {
          m = await fromLink(url);
        } catch (err) {
          // 멜론 · 지니 등 외부에서 못 읽는 링크: 써 둔 제목으로 찾기
          if (!cur.title) throw err;
          m = await searchSong(cur.title, cur.artist);
        }
      } else m = await searchSong(cur.title, cur.artist);
      const v: Partial<Song> = {};
      // 제목으로 찾을 땐 이미 쓴 제목·가수는 그대로 (해외 스토어 결과가 영어 제목일 수 있음)
      const keep = kind === "search";
      if (m.title && !(keep && cur.title)) v.title = m.title;
      if (m.artist && !(keep && cur.artist)) v.artist = m.artist;
      if ((m.album || m.title) && !(keep && cur.album)) v.album = m.album || m.title;
      if (m.cover) v.cover = m.cover;
      if (m.dur) v.dur = m.dur;
      if (m.preview) v.preview = m.preview;
      put(v);
      const ytSound = !!(songYtId(url) || songYtId(s.yt || ""));
      if (isSpCollection(url)) setMsg("✓ 넣었어요. 이건 앨범/플레이리스트 링크라 가사는 못 붙여요 — 곡 링크(주소에 /track/ 이 있는 것)를 넣으면 가사까지 돼요");
      // 유튜브로 소리 나는 곡: 가사는 재생할 때 그 영상 길이에 맞는 싱크로 자동 (미리 저장하면 길이가 다른 버전일 수 있음)
      else if (ytSound && !cur.lyrics?.trim()) setMsg("✓ 표지 · 정보 넣었어요. 가사는 재생할 때 유튜브 길이에 맞춰 자동으로 싱크돼요");
      // 가사가 비어 있으면 자동으로 (싱크 가사 우선)
      else if (!cur.lyrics?.trim()) {
        setMsg("가사 찾는 중…");
        const lr = await fetchLyrics(v.title || cur.title, v.artist || cur.artist, v.dur || cur.dur);
        if (lr) put({ lyrics: lr });
        setMsg(lr ? (parseLyrics(lr).some((l) => l.t !== null) ? "✓ 표지 · 정보 · 싱크 가사까지 다 넣었어요" : "✓ 다 넣었어요 (이 곡은 싱크 없는 가사만 있음)") : "✓ 표지 · 정보 넣음 (가사는 못 찾음 — 재생할 때 한 번 더 찾아봐요)");
      } else setMsg("✓ 표지 · 정보 넣었어요");
    } catch {
      setMsg("");
      if (!silent) alert(kind === "link" ? "이 링크에서는 정보를 못 가져왔어요.\n유튜브 · 스포티파이 · 애플뮤직 곡 링크가 가장 잘 돼요.\n(멜론 등은 곡 제목을 먼저 쓰고 다시 눌러 보세요)" : "못 찾았어요. 곡 제목과 가수 이름을 확인해 주세요.");
    }
    setBusy("");
  };
  const fetchLy = async () => {
    setBusy("lyrics");
    setMsg("");
    const lr = await fetchLyrics(s.title, s.artist, s.dur).catch(() => "");
    if (lr) put({ lyrics: lr });
    setMsg(lr ? "✓ 가사 넣었어요" : "가사를 못 찾았어요. 제목 · 가수 이름을 확인해 주세요.");
    setBusy("");
  };
  /** 링크를 붙여넣거나 칸에서 나가면 알아서 채우기 */
  const autoFill = (url: string) => {
    if (!/^https?:\/\//.test(url.trim()) || url === lastLink.current || busy) return;
    lastLink.current = url;
    fill("link", url, true);
  };
  const synced = parseLyrics(s.lyrics).some((l) => l.t !== null);
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <F label="곡 링크 (유튜브 · 스포티파이 · 애플뮤직) — 붙여넣으면 표지 · 제목 · 가수가 자동으로 채워져요" className="col-span-full">
        <div className="flex gap-2">
          <input
            value={s.url ?? ""}
            placeholder="https://youtu.be/..."
            onChange={(e) => putNow({ url: e.target.value })}
            onPaste={(e) => {
              const v = e.clipboardData.getData("text").trim();
              setTimeout(() => autoFill(v), 0);
            }}
            onBlur={(e) => autoFill(e.target.value)}
          />
          <Btn kind="primary" disabled={!s.url || !!busy} onClick={() => fill("link")}>
            <span className="whitespace-nowrap">{busy === "link" ? "가져오는 중…" : "다시 채우기"}</span>
          </Btn>
        </div>
        {!songYtId(s.url) && (
          <div className="mt-2">
            <label>소리용 유튜브 링크 — 넣으면 전곡이 나와요 (없으면 30초 미리듣기)</label>
            <input value={s.yt ?? ""} placeholder="https://youtu.be/... (공식 음원 · Topic 영상이 가사 싱크가 가장 잘 맞아요)" onChange={(ev) => putNow({ yt: ev.target.value })} />
          </div>
        )}
        {msg && <div className="text-[13px] mt-1.5" style={{ color: msg.startsWith("✓") ? "#248A3D" : "rgba(0,0,0,0.5)" }}>{msg}</div>}
      </F>
      <F label="곡">
        <T value={s.title} onChange={(v) => putNow({ title: v })} />
      </F>
      <F label="아티스트">
        <T value={s.artist} onChange={(v) => putNow({ artist: v })} />
      </F>
      <F label="앨범">
        <T value={s.album} onChange={(v) => putNow({ album: v })} />
      </F>
      <F label="곡 길이 (예: 3:25)">
        <input key={s.dur ?? 0} defaultValue={showDur(s.dur)} placeholder="자동" onBlur={(e) => put({ dur: parseDur(e.target.value) || undefined })} />
      </F>
      <F label="커버 색 (사진 없을 때)">
        <N value={s.hue} onChange={(v) => putNow({ hue: v })} />
      </F>
      <div className="col-span-full flex flex-wrap items-center gap-3">
        {s.cover ? <img src={s.cover} alt="" className="w-[48px] h-[48px] rounded-[8px] object-cover" /> : <span className="w-[48px] h-[48px] rounded-[8px]" style={{ background: `hsl(${s.hue} 35% 35%)` }} />}
        <Btn
          kind="primary"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("phone:open", { detail: { app: "music" } }));
            setTimeout(() => window.dispatchEvent(new CustomEvent("music:play", { detail: { id: s.id } })), 150);
          }}
        >
          ▶ 폰에서 들어 보기
        </Btn>
        <Btn disabled={!(s.title || s.artist) || !!busy} onClick={() => fill("search")}>
          {busy === "search" ? "찾는 중…" : "제목으로 표지 찾기"}
        </Btn>
        <label className="!m-0 !text-[14px] !font-medium !text-black inline-flex items-center h-[34px] px-3 rounded-[9px] bg-black/[0.05] hover:bg-black/[0.09] cursor-pointer">
          앨범 사진 올리기
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) put({ cover: await shrinkImage(f, 500) });
            }}
          />
        </label>
        {s.cover && (
          <Btn kind="danger" onClick={() => putNow({ cover: undefined })}>
            앨범 사진 지우기
          </Btn>
        )}
      </div>
      <F label={`가사 ${synced ? "(싱크 맞춤 ✓)" : s.lyrics?.trim() ? "(싱크 없음)" : "(비워 두면 재생할 때 자동으로 찾아요)"}`} className="col-span-full">
        <textarea rows={6} value={s.lyrics ?? ""} placeholder={"비워 두면 재생할 때 알아서 찾아서 보여 줘요.\n직접 넣으려면 한 줄에 한 소절씩. [00:12.50] 처럼 시간을 붙이면 노래에 맞춰 내려가요."} onChange={(e) => putNow({ lyrics: e.target.value })} />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Btn disabled={!s.title.trim() || !!busy} onClick={fetchLy}>
            {busy === "lyrics" ? "찾는 중…" : s.lyrics?.trim() ? "가사 다시 가져오기" : "가사 자동으로 가져오기"}
          </Btn>
          <Btn disabled={!s.lyrics?.trim()} onClick={() => setSync(true)}>
            싱크 맞추기 (여기서 노래 들으며)
          </Btn>
          {synced && <Btn onClick={() => putNow({ lyrics: parseLyrics(s.lyrics).map((l) => l.text).join("\n") })}>싱크 지우기</Btn>}
          <span className="inline-flex items-center gap-1.5 text-[13px] text-black/60">
            싱크 조절
            <Btn onClick={() => putNow({ lyricsOffset: Math.round(((s.lyricsOffset || 0) - 0.5) * 10) / 10 })}>가사 빨리</Btn>
            <span className="tabular w-[44px] text-center">{(s.lyricsOffset || 0) > 0 ? "+" : ""}{(s.lyricsOffset || 0).toFixed(1)}초</span>
            <Btn onClick={() => putNow({ lyricsOffset: Math.round(((s.lyricsOffset || 0) + 0.5) * 10) / 10 })}>가사 늦게</Btn>
          </span>
        </div>
      </F>
      {sync && (
        <LyricSync
          song={s}
          onClose={() => setSync(false)}
          onDone={(lrc) => {
            put({ lyrics: lrc });
            setSync(false);
          }}
        />
      )}
    </div>
  );
}

/* ───────── 홈 화면 · 앱: 앱 보이기 / 숨기기 / 순서 · 폴더 · 직접 앱 만들기 ───────── */
const appLabel = (id: string) => (id.startsWith("folder:") ? `📁 ${id.slice(7)}` : APPS[id]?.label ?? id);
function AppChip({ id, onLeft, onRight, onHide, extra }: { id: string; onLeft?: () => void; onRight?: () => void; onHide?: () => void; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-black/[0.08] rounded-[12px] pl-1.5 pr-1 h-[42px]">
      {id.startsWith("folder:") ? <span className="w-[28px] h-[28px] rounded-[7px] bg-black/10 flex items-center justify-center text-[14px]">📁</span> : <AppIcon id={id} size={28} />}
      <span className="text-[13px] font-medium max-w-[110px] truncate">{appLabel(id)}</span>
      {onLeft && (
        <button title="앞으로" onClick={onLeft} className="w-6 h-7 rounded hover:bg-black/5 text-black/45">
          ‹
        </button>
      )}
      {onRight && (
        <button title="뒤로" onClick={onRight} className="w-6 h-7 rounded hover:bg-black/5 text-black/45">
          ›
        </button>
      )}
      {extra}
      {onHide && (
        <button title="숨기기" onClick={onHide} className="h-7 px-2 rounded-md text-[12px] text-[#FF3B30] hover:bg-[#FF3B30]/10">
          숨기기
        </button>
      )}
    </div>
  );
}
const LAYOUTS: [CustomApp["layout"], string, string][] = [
  ["list", "목록", "메모 · 기록 · 받은 편지함처럼: 한 줄씩 → 누르면 자세히"],
  ["feed", "피드 (SNS)", "인스타 · 트위터처럼: 글 + 사진 + 좋아요"],
  ["grid", "사진 모음", "갤러리 · 앨범처럼: 사진 바둑판 → 누르면 크게"],
  ["page", "웹페이지", "기사 · 블로그 · 공지처럼: 위에서 아래로 읽는 글"],
];
function HomeEd({ d }: { d: PhoneData }) {
  syncCustomApps(d.customApps); // 미리보기가 안 열려 있어도 이름 · 아이콘이 보이게
  const h = d.home;
  const placed = new Set([...h.grid, ...h.dock, ...Object.values(h.folders).flat()]);
  const allApps = [...BUILTIN_APPS, ...d.customApps.map((a) => "c:" + a.id)];
  const hidden = allApps.filter((a) => !placed.has(a));
  const folderNames = Object.keys(h.folders);
  const setHome = (fn: (x: PhoneData["home"]) => void) => update((x) => fn(x.home));
  const move = (arr: string[], i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  const removeEverywhere = (x: PhoneData["home"], id: string) => {
    x.grid = x.grid.filter((a) => a !== id);
    x.dock = x.dock.filter((a) => a !== id);
    for (const k of Object.keys(x.folders)) x.folders[k] = x.folders[k].filter((a) => a !== id);
  };
  const newApp = (layout: CustomApp["layout"]) => {
    const id = uid();
    const sample: Record<CustomApp["layout"], { name: string; bg: string; text: string; item: Partial<CustomItem> }> = {
      list: { name: "새 앱", bg: "#34C759", text: "", item: { title: "첫 번째 항목", sub: "한 줄 설명", when: "어제", body: "눌렀을 때 보이는 내용" } },
      feed: { name: "새 SNS", bg: "#FF2D55", text: "", item: { title: "계정 이름", sub: "위치 · 설명", when: "2시간 전", body: "글 내용" } },
      grid: { name: "새 앨범", bg: "#FF9500", text: "", item: { title: "사진 설명", when: "10월 24일", body: "" } },
      page: { name: "새 사이트", bg: "#5856D6", text: "", item: { title: "글 제목", sub: "부제", when: "2026. 10. 25.", body: "본문을 여기에 쓰세요." } },
    };
    const s = sample[layout];
    update((x) => {
      x.customApps.push({ id, name: s.name, iconBg: s.bg, iconText: s.text, theme: "light", tint: "#007AFF", layout, header: "", items: [{ id: uid(), title: "", sub: "", body: "", photo: "", when: "", ...s.item }] });
      x.home.grid.push("c:" + id);
    });
    setTimeout(() => preview("c:" + id), 50);
  };
  return (
    <>
      <Card title="홈 화면 배치">
        <p className="text-[13px] text-black/50 mb-3">
          앱 순서는 ‹ › 로 바꾸고, 안 쓸 앱은 <b>숨기기</b>. 숨긴 앱은 맨 아래에서 다시 꺼낼 수 있어요. 오른쪽 폰에 바로 보여요.
        </p>
        <div className="text-[13px] font-semibold text-black/60 mb-2">홈 화면 ({h.grid.length}개 · 4칸씩 줄바꿈)</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {h.grid.map((id, i) => (
            <AppChip
              key={id}
              id={id}
              onLeft={() => setHome((x) => move(x.grid, i, -1))}
              onRight={() => setHome((x) => move(x.grid, i, 1))}
              onHide={() => setHome((x) => (id.startsWith("folder:") ? (x.grid = x.grid.filter((a) => a !== id)) : removeEverywhere(x, id)))}
              extra={
                !id.startsWith("folder:") && h.dock.length < 4 ? (
                  <button title="아래 독으로" onClick={() => setHome((x) => (removeEverywhere(x, id), x.dock.push(id)))} className="h-7 px-1.5 rounded-md text-[12px] text-[#007AFF] hover:bg-[#007AFF]/10">
                    독↓
                  </button>
                ) : null
              }
            />
          ))}
        </div>
        <div className="text-[13px] font-semibold text-black/60 mb-2">아래 독 (최대 4개)</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {h.dock.map((id, i) => (
            <AppChip
              key={id}
              id={id}
              onLeft={() => setHome((x) => move(x.dock, i, -1))}
              onRight={() => setHome((x) => move(x.dock, i, 1))}
              onHide={() => setHome((x) => removeEverywhere(x, id))}
              extra={
                <button title="홈 화면으로" onClick={() => setHome((x) => (removeEverywhere(x, id), x.grid.push(id)))} className="h-7 px-1.5 rounded-md text-[12px] text-[#007AFF] hover:bg-[#007AFF]/10">
                  홈↑
                </button>
              }
            />
          ))}
          {h.dock.length === 0 && <span className="text-[13px] text-black/35">비어 있음</span>}
        </div>
        {folderNames.map((f) => (
          <div key={f} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-semibold text-black/60">📁 폴더</span>
              <input
                className="!w-[140px] !h-[30px]"
                defaultValue={f}
                onBlur={(e) => {
                  const n = e.target.value.trim().slice(0, 20);
                  if (!n || n === f || h.folders[n]) return;
                  setHome((x) => {
                    x.folders[n] = x.folders[f];
                    delete x.folders[f];
                    x.grid = x.grid.map((a) => (a === "folder:" + f ? "folder:" + n : a));
                  });
                }}
              />
              {!h.grid.includes("folder:" + f) && <Btn onClick={() => setHome((x) => void x.grid.push("folder:" + f))}>홈 화면에 놓기</Btn>}
              <Btn kind="danger" onClick={() => confirm(`'${f}' 폴더를 없앨까요? (안의 앱은 숨김으로)`) && setHome((x) => (delete x.folders[f], (x.grid = x.grid.filter((a) => a !== "folder:" + f))))}>
                폴더 없애기
              </Btn>
            </div>
            <div className="flex flex-wrap gap-2">
              {h.folders[f].map((id, i) => (
                <AppChip key={id} id={id} onLeft={() => setHome((x) => move(x.folders[f], i, -1))} onRight={() => setHome((x) => move(x.folders[f], i, 1))} onHide={() => setHome((x) => removeEverywhere(x, id))} />
              ))}
              {h.folders[f].length === 0 && <span className="text-[13px] text-black/35">비어 있음 (빈 폴더는 폰에 안 보여요)</span>}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 mb-5">
          <Btn
            onClick={() => {
              const n = prompt("폴더 이름", "새 폴더")?.trim().slice(0, 20);
              if (n && !h.folders[n]) setHome((x) => ((x.folders[n] = []), x.grid.push("folder:" + n)));
            }}
          >
            <Plus size={15} /> 폴더 추가
          </Btn>
          <Btn onClick={() => confirm("홈 화면 배치를 처음 모습으로 되돌릴까요? (직접 만든 앱은 숨김으로)") && update((x) => void (x.home = defaultData().home))}>
            <RotateCcw size={14} /> 처음 배치로
          </Btn>
        </div>
        <div className="text-[13px] font-semibold text-black/60 mb-2">숨긴 앱 ({hidden.length}개) — 눌러서 꺼내기</div>
        <div className="flex flex-wrap gap-2">
          {hidden.map((id) => (
            <AppChip
              key={id}
              id={id}
              extra={
                <>
                  <button onClick={() => setHome((x) => void x.grid.push(id))} className="h-7 px-1.5 rounded-md text-[12px] text-[#007AFF] hover:bg-[#007AFF]/10">
                    홈에
                  </button>
                  {h.dock.length < 4 && (
                    <button onClick={() => setHome((x) => void x.dock.push(id))} className="h-7 px-1.5 rounded-md text-[12px] text-[#007AFF] hover:bg-[#007AFF]/10">
                      독에
                    </button>
                  )}
                  {folderNames.map((f) => (
                    <button key={f} onClick={() => setHome((x) => void x.folders[f].push(id))} className="h-7 px-1.5 rounded-md text-[12px] text-[#007AFF] hover:bg-[#007AFF]/10">
                      {f}에
                    </button>
                  ))}
                </>
              }
            />
          ))}
          {hidden.length === 0 && <span className="text-[13px] text-black/35">없음</span>}
        </div>
      </Card>

      <Card title={`직접 만든 앱 (${d.customApps.length})`}>
        <p className="text-[13px] text-black/50 mb-3">
          모양을 골라 <b>앱 만들기</b> → 이름 · 아이콘 · 글을 넣으면 폰 홈 화면에 생겨요. 다른 캐릭터 폰 템플릿 만들 때도 그대로 쓰면 돼요.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-4">
          {LAYOUTS.map(([l, name, desc]) => (
            <button key={l} onClick={() => newApp(l)} className="text-left rounded-[12px] border border-black/[0.08] bg-white hover:bg-black/[0.02] p-3">
              <div className="text-[14px] font-semibold">
                <Plus size={14} className="inline -mt-0.5" /> {name} 앱 만들기
              </div>
              <div className="text-[12px] text-black/50 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {d.customApps.map((a) => {
            const put = (v: Partial<CustomApp>) =>
              update((x) => {
                const y = x.customApps.find((z) => z.id === a.id);
                if (y) Object.assign(y, v);
              });
            return (
              <div key={a.id} className="rounded-[14px] border border-black/[0.08] bg-[#FAFAFC] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <AppIcon id={"c:" + a.id} size={44} />
                  <div className="font-semibold text-[16px] flex-1 truncate">{a.name}</div>
                  <Btn onClick={() => preview("c:" + a.id)}>폰에서 열기</Btn>
                  <Btn
                    kind="danger"
                    onClick={() =>
                      confirm(`'${a.name}' 앱을 지울까요?`) &&
                      update((x) => {
                        x.customApps = x.customApps.filter((z) => z.id !== a.id);
                        removeEverywhere(x.home, "c:" + a.id);
                      })
                    }
                  >
                    <Trash2 size={14} /> 앱 지우기
                  </Btn>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <F label="앱 이름">
                    <T value={a.name} onChange={(v) => put({ name: v.slice(0, 40) })} />
                  </F>
                  <F label="아이콘 글자 (1~2자 · 이모지 OK)">
                    <T value={a.iconText} ph={a.name.slice(0, 1)} onChange={(v) => put({ iconText: v.slice(0, 4) })} />
                  </F>
                  <F label="아이콘 색">
                    <input type="color" className="!h-[34px] !p-1" value={a.iconBg} onChange={(e) => put({ iconBg: e.target.value })} />
                  </F>
                  <F label="버튼 · 글자 강조 색">
                    <input type="color" className="!h-[34px] !p-1" value={a.tint} onChange={(e) => put({ tint: e.target.value })} />
                  </F>
                  <F label="모양">
                    <select value={a.layout} onChange={(e) => put({ layout: e.target.value as CustomApp["layout"] })}>
                      {LAYOUTS.map(([l, n]) => (
                        <option key={l} value={l}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </F>
                  <F label="화면">
                    <select value={a.theme} onChange={(e) => put({ theme: e.target.value as CustomApp["theme"] })}>
                      <option value="light">밝게</option>
                      <option value="dark">어둡게</option>
                    </select>
                  </F>
                  <F label="맨 위 설명 (선택)" className="col-span-2">
                    <T value={a.header} onChange={(v) => put({ header: v })} />
                  </F>
                  <div className="col-span-full flex flex-wrap items-center gap-2">
                    <label className="!m-0 !text-[14px] !font-medium !text-black inline-flex items-center h-[34px] px-3 rounded-[9px] bg-black/[0.05] hover:bg-black/[0.09] cursor-pointer">
                      아이콘 사진 올리기
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) put({ iconImg: await shrinkImage(f, 200) });
                        }}
                      />
                    </label>
                    {a.iconImg && (
                      <Btn kind="danger" onClick={() => put({ iconImg: undefined })}>
                        아이콘 사진 지우기
                      </Btn>
                    )}
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-black/60 mt-4 mb-2">글 · 항목 ({a.items.length})</div>
                <Rows
                  items={a.items}
                  set={(v) => put({ items: v })}
                  make={() => ({ id: uid(), title: "", sub: "", body: "", photo: "", when: "" })}
                  label="글 추가"
                  render={(it, putIt) => (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <F label={a.layout === "feed" ? "계정 이름" : "제목"}>
                        <T value={it.title} onChange={(v) => putIt({ title: v })} />
                      </F>
                      <F label={a.layout === "feed" ? "위치 · 한 줄" : "부제 · 한 줄 설명"}>
                        <T value={it.sub} onChange={(v) => putIt({ sub: v })} />
                      </F>
                      <F label="날짜 · 시간 표시">
                        <T value={it.when} ph="어제 / 10월 24일" onChange={(v) => putIt({ when: v })} />
                      </F>
                      <F label="내용" className="col-span-full">
                        <textarea rows={3} value={it.body} onChange={(e) => putIt({ body: e.target.value })} />
                      </F>
                      <div className="col-span-full flex flex-wrap items-center gap-2">
                        {photoSrc(it.photo, d.photos) && <img src={photoSrc(it.photo, d.photos)} alt="" className="w-[44px] h-[44px] rounded-[8px] object-cover" />}
                        <label className="!m-0 !text-[14px] !font-medium !text-black inline-flex items-center h-[34px] px-3 rounded-[9px] bg-black/[0.05] hover:bg-black/[0.09] cursor-pointer">
                          사진 올리기
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (!f) return;
                              const src = await shrinkImage(f, 900);
                              update((x) => {
                                const y = x.customApps.find((z) => z.id === a.id)?.items.find((z) => z.id === it.id);
                                if (y) y.photo = src;
                              });
                            }}
                          />
                        </label>
                        {d.photos.length > 0 && (
                          <select className="!w-auto" value={d.photos.some((p) => p.id === it.photo) ? it.photo : ""} onChange={(e) => putIt({ photo: e.target.value })}>
                            <option value="">사진 앱에서 고르기…</option>
                            {d.photos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.caption || p.when || p.id}
                              </option>
                            ))}
                          </select>
                        )}
                        {it.photo && (
                          <Btn kind="danger" onClick={() => putIt({ photo: "" })}>
                            사진 빼기
                          </Btn>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function Songs({ d }: { d: PhoneData }) {
  return (
    <Card title="음악">
      <p className="text-[13px] text-black/50 mb-3">
        곡 링크를 <b>붙여넣기만 하면</b> 표지 · 제목 · 가수 · 길이가 자동으로 들어가요. <b>유튜브 링크면 전곡</b>이 나오고, 가사는 재생할 때 영상 길이에 맞는 싱크 가사를 알아서 찾아요. 스포티파이 · 애플뮤직 링크는 30초 미리듣기 (아래 소리용 유튜브 링크를 넣으면 전곡).
      </p>
      <Rows
        items={d.songs}
        set={(v) => update((x) => void (x.songs = v))}
        make={() => ({ id: uid(), title: "", artist: "", album: "", url: "", hue: Math.floor(Math.random() * 360) })}
        render={(s, put) => <SongEd s={s} put={put} />}
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
              <label className="!flex items-center gap-1 !text-[12px] !text-black/70 !font-normal !m-0 cursor-pointer">
                <input type="checkbox" className="!w-3.5 !h-3.5" checked={!!p.vault} onChange={(e) => update((x) => void (x.photos.find((y) => y.id === p.id)!.vault = e.target.checked))} />
                계산기 금고에만 보이게
              </label>
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
            <F label="송금 메모 (내역에 금액 아래 크게 보임)">
              <T value={t.memo} ph="예: 화 풀고 전화 좀 받아줘" onChange={(v) => put({ memo: v })} />
            </F>
          </div>
        )}
      />
    </Card>
  );
}

/* ───────── 쉬운 편집: 어떤 데이터든 입력 칸으로 (JSON 몰라도 됨) ───────── */
const KEY_KO: Record<string, string> = {
  title: "제목", name: "이름", text: "내용", body: "본문", time: "시간", when: "언제", date: "날짜", label: "이름표", url: "주소", q: "검색어", query: "검색어",
  type: "종류", kind: "종류", desc: "설명", sub: "부제", note: "메모", memo: "메모", value: "값", amount: "금액", count: "개수", steps: "걸음 수", cash: "캐시",
  goal: "목표", on: "켜짐", enabled: "사용", days: "요일", hour: "시", minute: "분", city: "도시", temp: "기온", hi: "최고", lo: "최저", cond: "날씨", icon: "아이콘",
  address: "주소", addr: "주소", place: "장소", dist: "거리", host: "사이트", site: "사이트", tabs: "탭", history: "방문 기록", bookmarks: "즐겨찾기", private: "비공개",
  code: "번호", notes: "메모", items: "항목", list: "목록", friends: "친구", rank: "순위", points: "점수", price: "가격", photo: "사진 ID", photos: "사진 ID", duration: "길이",
  dur: "길이", hourly: "시간별", daily: "10일 예보", rings: "링", sleep: "수면", heart: "심박수", move: "움직이기", exercise: "운동", stand: "일어서기", weekly: "주간",
  favorites: "즐겨찾기", page: "페이지", engine: "검색 엔진", results: "검색 결과", area: "지역", seller: "판매자", meta: "부가 정보", specs: "사양", dealer: "판매처",
  discount: "할인", rating: "별점", reviews: "리뷰 수", delivery: "배송", x: "가로 위치", y: "세로 위치", todayWon: "오늘 번 돈", streak: "연속 출석", bubbles: "받기 버블",
  badges: "배지", quiz: "퀴즈", options: "보기", answer: "정답", shop: "교환 상품", moveGoal: "움직이기 목표", km: "거리(km)", lines: "줄", hours: "시간",
  from: "보낸 사람", subject: "제목", unread: "안 읽음", box: "편지함", done: "완료", due: "마감", channel: "채널", progress: "본 정도 (0~1)", hue: "색 (0~360)",
  ep: "회차", watching: "시청 중인 콘텐츠", myList: "내가 찜한 리스트", profile: "프로필 이름", handle: "아이디", feed: "피드", replies: "답글", reposts: "재게시", likes: "좋아요",
  option: "옵션", status: "상태", store: "가게", menu: "메뉴", number: "카드 번호 표시", searches: "검색 기록", color: "색",
  category: "카테고리", question: "질문", detail: "자세한 내용", asker: "질문한 사람", answers: "답변",
  apps: "앱", total: "합계", pickups: "화면 켠 횟수", firstPickup: "처음 켠 시각", peakAt: "가장 많이 쓴 시각", author: "작성자", source: "출처", views: "조회수",
};
const keyName = (k: string) => KEY_KO[k] ?? k;
/** 고르는 칸 (영어 값 대신 한국어로 고르기) */
const KEY_OPTS: Record<string, [string, string][]> = {
  box: [
    ["inbox", "받은 편지함"],
    ["sent", "보낸 편지함"],
    ["junk", "정크"],
  ],
};
/** 새 항목: 마지막 항목 모양을 따라 빈 값으로 */
const blankLike = (v: unknown): unknown => {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "id" ? uid() : blankLike(x)]));
  return "";
};
function AutoField({ value, onChange, label, depth = 0, k }: { value: unknown; onChange: (v: unknown) => void; label?: string; depth?: number; k?: string }) {
  // 긴 목록은 접어 두기 (눌러서 펼침)
  const [open, setOpen] = useState(depth < 1 || !Array.isArray(value) || value.length <= 5);
  const photos = useData().photos;
  if (typeof value === "boolean") return <C label={label ?? ""} value={value} onChange={onChange} />;
  // 사진 칸: 올리기 · 사진 앱에서 고르기 · 빼기 (주소를 직접 쓸 필요 없음)
  if ((k === "photo" || k === "avatar") && (typeof value === "string" || value === undefined)) {
    const src = photoSrc(value ?? "", photos);
    return (
      <F label={label ?? "사진"} className="col-span-full">
        <div className="flex flex-wrap items-center gap-2">
          {src ? <img src={src} alt="" className="w-[44px] h-[44px] rounded-[8px] object-cover" /> : <span className="w-[44px] h-[44px] rounded-[8px] bg-black/[0.05] flex items-center justify-center text-[11px] text-black/35">없음</span>}
          <label className="!m-0 !text-[14px] !font-medium !text-black inline-flex items-center h-[34px] px-3 rounded-[9px] bg-black/[0.05] hover:bg-black/[0.09] cursor-pointer">
            사진 올리기
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onChange(await shrinkImage(f, 900));
              }}
            />
          </label>
          {photos.length > 0 && (
            <select className="!w-auto" value={photos.some((p) => p.id === value) ? value : ""} onChange={(e) => onChange(e.target.value)}>
              <option value="">사진 앱에서 고르기…</option>
              {photos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.caption || p.when || p.id}
                </option>
              ))}
            </select>
          )}
          {value && (
            <Btn kind="danger" onClick={() => onChange("")}>
              사진 빼기
            </Btn>
          )}
        </div>
      </F>
    );
  }
  if (typeof value === "number")
    return (
      <F label={label ?? ""}>
        <N value={value} onChange={onChange} />
      </F>
    );
  if (typeof value === "string" && k && KEY_OPTS[k])
    return (
      <F label={label ?? ""}>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {KEY_OPTS[k].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </F>
    );
  if (k === "color" && typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))
    return (
      <F label={label ?? ""}>
        <input type="color" className="!h-[34px] !p-1" value={value} onChange={(e) => onChange(e.target.value)} />
      </F>
    );
  if (value === null || value === undefined || typeof value === "string") {
    const s = (value as string) ?? "";
    const long = s.length > 60 || s.includes("\n");
    return (
      <F label={label ?? ""} className={long ? "col-span-full" : ""}>
        {long ? <textarea rows={Math.min(8, s.split("\n").length + 1)} value={s} onChange={(e) => onChange(e.target.value)} /> : <input value={s} onChange={(e) => onChange(e.target.value)} />}
      </F>
    );
  }
  if (Array.isArray(value)) {
    const prim = value.length > 0 && value.every((x) => typeof x !== "object" || x === null);
    const sample = value[value.length - 1];
    const set = (i: number, v: unknown) => onChange(value.map((x, j) => (j === i ? v : x)));
    const move = (i: number, d: number) => {
      const j = i + d;
      if (j < 0 || j >= value.length) return;
      const n = value.slice();
      [n[i], n[j]] = [n[j], n[i]];
      onChange(n);
    };
    return (
      <div className="col-span-full">
        <button onClick={() => setOpen(!open)} className="text-[13px] font-semibold text-black/70 mb-2 flex items-center gap-1">
          {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} {label} <span className="text-black/35 font-normal">({value.length}개)</span>
        </button>
        {open && (
          <div className="flex flex-col gap-2">
            {value.map((x, i) => (
              <div key={(x as { id?: string })?.id ?? i} className={`flex gap-2 items-start ${prim ? "" : "rounded-[12px] border border-black/[0.08] p-3"}`}>
                <div className={`flex-1 min-w-0 ${prim ? "" : "grid grid-cols-2 md:grid-cols-3 gap-3"}`}>
                  {prim ? <AutoField value={x} onChange={(v) => set(i, v)} depth={depth + 1} /> : <AutoField value={x} onChange={(v) => set(i, v)} depth={depth + 1} />}
                </div>
                <div className="flex flex-col shrink-0">
                  <button title="위로" onClick={() => move(i, -1)} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
                    <ChevronUp size={15} />
                  </button>
                  <button title="아래로" onClick={() => move(i, 1)} className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50">
                    <ChevronDown size={15} />
                  </button>
                  <button title="삭제" onClick={() => onChange(value.filter((_, j) => j !== i))} className="w-7 h-7 rounded-md hover:bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div>
              <Btn onClick={() => onChange([...value, value.length ? blankLike(sample) : ""])}>
                <Plus size={15} /> 추가
              </Btn>
            </div>
          </div>
        )}
      </div>
    );
  }
  // 객체: 칸 여러 개
  const obj = value as Record<string, unknown>;
  const fields = Object.entries(obj).filter(([k]) => k !== "id");
  const inner = fields.map(([key, v]) => <AutoField key={key} k={key} label={keyName(key)} value={v} onChange={(nv) => onChange({ ...obj, [key]: nv })} depth={depth + 1} />);
  if (depth === 0 || !label) return <>{inner}</>;
  return (
    <div className="col-span-full rounded-[12px] bg-black/[0.025] p-3">
      <button onClick={() => setOpen(!open)} className="text-[13px] font-semibold text-black/70 flex items-center gap-1">
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />} {label}
      </button>
      {open && <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">{inner}</div>}
    </div>
  );
}

/* ───────── 사파리: 열린 탭(웹사이트) 고르기 · 만들기 ───────── */
type PageType = Page["type"];
/** 웹사이트 종류마다 예시 내용 (새 탭을 만들면 이걸로 시작 → 고쳐 쓰면 됨) */
const PAGE_TPL: Record<Exclude<PageType, "blank">, { name: string; url: string; title: string; page: Page }> = {
  search: { name: "검색 결과 (네이버 · 구글)", url: "m.search.naver.com", title: "검색어 : 네이버 검색", page: { type: "search", engine: "naver", query: "검색어", results: [{ title: "검색 결과 제목", url: "example.com", desc: "검색 결과 설명", source: "블로그" }] } },
  cafe: { name: "카페 글", url: "m.cafe.naver.com", title: "카페 글 제목", page: { type: "cafe", cafe: "카페 이름", board: "자유게시판", title: "글 제목", author: "닉네임", views: 120, body: "글 내용", comments: [{ who: "댓글러", text: "댓글 내용" }] } },
  board: { name: "커뮤니티 글 (갤러리 · 게시판)", url: "m.dcinside.com", title: "글 제목 - 갤러리", page: { type: "board", site: "커뮤니티", gallery: "갤러리 이름", title: "글 제목", author: "ㅇㅇ", views: 300, recommend: 5, body: "글 내용", comments: [{ who: "ㅇㅇ", text: "댓글" }] } },
  market: { name: "중고거래 (당근 · 번개 · 중고나라)", url: "daangn.com", title: "물건 이름 | 당근", page: { type: "market", site: "daangn", title: "물건 이름", price: "10,000원", area: "OO동", seller: "판매자", temp: 36.5, body: "물건 설명", photo: "", meta: "끌올 3분 전" } },
  car: { name: "중고차", url: "encar.com", title: "차 이름 - 엔카", page: { type: "car", title: "차 이름", price: "1,500만원", specs: [["연식", "2019년"], ["주행", "8만km"]], body: "차 설명", dealer: "OO모터스" } },
  shop: { name: "쇼핑 (쿠팡 등)", url: "coupang.com", title: "상품 이름 : 쿠팡", page: { type: "shop", name: "상품 이름", price: "19,900원", discount: "20%", rating: 4.5, reviews: 1234, delivery: "내일 도착", seller: "판매자" } },
  wiki: { name: "위키 (나무위키 등)", url: "namu.wiki", title: "문서 이름 - 나무위키", page: { type: "wiki", title: "문서 이름", updated: "최근 수정 시각: 2026-10-24", sections: [{ h: "개요", body: "문서 내용" }] } },
  video: { name: "동영상 (유튜브)", url: "m.youtube.com", title: "영상 제목 - YouTube", page: { type: "video", title: "영상 제목", channel: "채널 이름", subs: "구독자 1.2만명", views: "조회수 3.4만회", when: "2일 전", duration: "12:34", desc: "영상 설명", comments: [{ who: "@댓글러", text: "댓글" }] } },
  sns: { name: "SNS 검색 (X 등)", url: "x.com", title: "검색어 - X 검색", page: { type: "sns", query: "검색어", posts: [{ name: "이름", handle: "@id", text: "글 내용", when: "1시간", replies: 2, reposts: 5, likes: 30 }] } },
  job: { name: "구인 공고", url: "alba.co.kr", title: "공고 제목 - 알바", page: { type: "job", site: "알바 사이트", company: "회사 이름", title: "공고 제목", pay: "시급 12,000원", conditions: ["주 3일", "야간"], body: "공고 내용" } },
  blog: { name: "네이버 블로그 글", url: "m.blog.naver.com", title: "글 제목 : 네이버 블로그", page: { type: "blog", category: "일상", title: "글 제목", author: "블로그 이름", when: "2026. 10. 24. 21:10", body: "본문을 여기에 쓰세요.", photo: "", likes: 12, comments: [{ who: "이웃", text: "댓글" }] } },
  qna: { name: "지식iN 질문", url: "m.kin.naver.com", title: "질문 제목 : 지식iN", page: { type: "qna", question: "질문 제목", detail: "질문 내용", asker: "비공개", when: "2026.10.24.", views: 85, answers: [{ who: "답변자", text: "답변 내용" }] } },
  news: { name: "뉴스 기사", url: "n.news.naver.com", title: "기사 제목 : 네이버 뉴스", page: { type: "news", press: "OO일보", title: "기사 제목", body: "기사 본문", reporter: "홍길동 기자" } },
};
function SafariEd({ d }: { d: PhoneData }) {
  const sf = d.safari;
  const set = (fn: (x: PhoneData["safari"]) => void) => update((x) => fn(x.safari));
  const addTab = (t: Exclude<PageType, "blank">) => {
    const tpl = PAGE_TPL[t];
    set((x) => void x.tabs.push({ id: uid(), title: tpl.title, url: tpl.url, page: structuredClone(tpl.page) }));
    setTimeout(() => preview("safari"), 50);
  };
  return (
    <>
      <p className="text-[13px] text-black/50 mb-3">
        사파리에 <b>열려 있는 탭 = 웹사이트 한 장</b>이에요. 아래에서 종류를 골라 탭을 만들고, 글자만 바꿔 쓰면 돼요. 오른쪽 폰 사파리에서 바로 보여요.
      </p>
      <div className="text-[13px] font-semibold text-black/60 mb-2">새 탭(웹사이트) 만들기</div>
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(PAGE_TPL) as Exclude<PageType, "blank">[]).map((t) => (
          <Btn key={t} onClick={() => addTab(t)}>
            <Plus size={14} /> {PAGE_TPL[t].name}
          </Btn>
        ))}
      </div>
      <div className="text-[13px] font-semibold text-black/60 mb-2">열린 탭 ({sf.tabs.length})</div>
      <Rows
        items={sf.tabs}
        set={(v) => set((x) => void (x.tabs = v))}
        make={() => ({ id: uid(), title: PAGE_TPL.search.title, url: PAGE_TPL.search.url, page: structuredClone(PAGE_TPL.search.page) })}
        label="검색 결과 탭 추가"
        render={(tab, put) => {
          const { type, ...rest } = tab.page as Page & Record<string, unknown>;
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <F label="탭 제목 (탭 목록에 보이는 이름)">
                <T value={tab.title} onChange={(v) => put({ title: v })} />
              </F>
              <F label="주소창에 보이는 주소">
                <T value={tab.url} onChange={(v) => put({ url: v })} />
              </F>
              <F label="웹사이트 종류">
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as Exclude<PageType, "blank">;
                    if (t !== type && confirm("종류를 바꾸면 이 탭 내용이 예시로 바뀌어요. 바꿀까요?")) put({ page: structuredClone(PAGE_TPL[t].page) });
                  }}
                >
                  {(Object.keys(PAGE_TPL) as Exclude<PageType, "blank">[]).map((t) => (
                    <option key={t} value={t}>
                      {PAGE_TPL[t].name}
                    </option>
                  ))}
                </select>
              </F>
              <AutoField value={rest} onChange={(v) => put({ page: { type, ...(v as object) } as Page })} />
              <div className="col-span-full">
                <Btn onClick={() => preview("safari")}>폰 사파리에서 보기</Btn>
              </div>
            </div>
          );
        }}
      />
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <div className="grid gap-3">
          <AutoField label="즐겨찾기 (사파리 첫 화면)" value={sf.favorites} onChange={(v) => set((x) => void (x.favorites = v as typeof x.favorites))} depth={1} />
        </div>
        <div className="grid gap-3">
          <AutoField label="최근 검색어 · 방문 기록" value={sf.history} onChange={(v) => set((x) => void (x.history = v as string[]))} depth={1} />
        </div>
      </div>
    </>
  );
}

function JsonEd({ d }: { d: PhoneData }) {
  // 폰에서 숨긴 앱(인스타 · 업무)은 목록에서 뺌 — 데이터는 그대로 보관
  const keys = ["safari", "mail", "reminders", "wallet", "youtube", "netflix", "x", "coupang", "baemin", "kakaot", "weather", "alarms", "places", "cashwalk", "health", "voiceMemos", "screenTime", "vault"] as const;
  const [k, setK] = useState<(typeof keys)[number]>("safari");
  const [mode, setMode] = useState<"easy" | "json">("easy");
  const [text, setText] = useState(() => JSON.stringify(d[k], null, 2));
  const [err, setErr] = useState("");
  useEffect(() => {
    setText(JSON.stringify(d[k], null, 2));
    setErr("");
  }, [k, mode]); // eslint-disable-line
  const names: Record<string, string> = { mail: "메일", reminders: "미리 알림", wallet: "지갑 (카드)", youtube: "YouTube", netflix: "Netflix", x: "X (아이디는 랜덤으로)", coupang: "쿠팡 주문목록", baemin: "배달의민족 주문내역", kakaot: "카카오 T 이용기록", safari: "사파리 (탭 · 검색 기록 · 즐겨찾기)", alarms: "시계 알람", places: "지도 즐겨찾기", weather: "날씨", cashwalk: "캐시워크", health: "건강", voiceMemos: "음성 메모", screenTime: "스크린 타임", vault: "계산기 금고 (숫자 · 메모)" };
  const val = (d as unknown as Record<string, unknown>)[k];
  return (
    <Card
      title="사파리 · 그 밖의 앱"
      right={
        <div className="flex gap-1 bg-black/[0.05] rounded-[10px] p-[3px]">
          {(
            [
              ["easy", "쉬운 편집"],
              ["json", "JSON (고급)"],
            ] as const
          ).map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} className={`h-[28px] px-3 rounded-[8px] text-[13px] ${mode === m ? "bg-white shadow-sm font-semibold" : "text-black/55"}`}>
              {l}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {keys.map((x) => (
          <button key={x} onClick={() => setK(x)} className={`h-[30px] px-3 rounded-full text-[13px] ${k === x ? "bg-black text-white" : "bg-black/5"}`}>
            {names[x]}
          </button>
        ))}
      </div>
      {mode === "easy" ? (
        <>
          {k === "safari" ? (
            <SafariEd d={d} />
          ) : (
            <>
              <p className="text-[13px] text-black/50 mb-3">고치면 바로 저장되고 오른쪽 폰에 바로 보여요.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <AutoField value={val} label={names[k]} onChange={(v) => update((x) => void ((x as unknown as Record<string, unknown>)[k] = v))} />
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <textarea rows={24} spellCheck={false} className="font-mono !text-[12px]" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex items-center gap-3 mt-2">
            <Btn
              kind="primary"
              onClick={() => {
                try {
                  const v = JSON.parse(text);
                  update((x) => void ((x as unknown as Record<string, unknown>)[k] = v));
                  setErr("적용됨");
                } catch (e) {
                  setErr("JSON 오류: " + (e as Error).message);
                }
              }}
            >
              <Check size={15} /> 적용
            </Btn>
            {err && <span className={`text-[13px] ${err === "적용됨" ? "text-[#34C759]" : "text-[#FF3B30]"}`}>{err}</span>}
          </div>
        </>
      )}
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
        <b>안 써도 되는 기능이에요.</b> 캐릭터 설정을 적으면 AI가 대화 · 메모 · 일정 · 통화 대사를 대신 써 줘요. 마음에 들면 "폰에 추가", 아니면 다시 생성.
      </p>
      <ol className="text-[13px] text-black/60 mb-4 list-decimal pl-5 leading-[21px]">
        <li>
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[#007AFF]">
            Anthropic 콘솔
          </a>
          에 가입하고 <b>API 키</b>를 만들어요 (유료 · 쓴 만큼만 결제).
        </li>
        <li>만든 키(sk-ant-로 시작)를 아래 칸에 붙여넣어요. 키는 이 브라우저에만 저장되고, 백업 · 게시 파일엔 안 들어가요.</li>
        <li>만들 것을 고르고 설정 · 관계 · 분위기를 적은 뒤 <b>생성</b>.</li>
        <li>아래에 결과가 나오면 확인하고 <b>폰에 추가</b>. (추가한 뒤에도 각 메뉴에서 고칠 수 있어요)</li>
      </ol>
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
              {APP_OPTS.slice(0, 2).map(([v, l]) => (
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
      {out !== null && (
        <div className="mt-3 rounded-[12px] bg-black/[0.035] p-3 max-h-[380px] overflow-auto text-[14px] leading-[21px]">
          {/* 결과 미리 보기: 대화면 말풍선 순서대로, 아니면 한 줄씩 */}
          {(() => {
            const o = out as { messages?: { from?: string; text?: string }[] } | unknown[];
            if (o && !Array.isArray(o) && Array.isArray(o.messages))
              return o.messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : ""} mb-1`}>
                  <span className={`px-3 py-1.5 rounded-[14px] max-w-[80%] whitespace-pre-wrap ${m.from === "me" ? "bg-[#007AFF] text-white" : "bg-white"}`}>{m.text}</span>
                </div>
              ));
            const list: unknown[] = Array.isArray(o) ? o : [o];
            return list.map((x, i) => (
              <div key={i} className="py-1 border-b border-black/5 last:border-0">
                {summaryOf(x)}
              </div>
            ));
          })()}
          <details className="mt-2">
            <summary className="text-[12px] text-black/40 cursor-pointer">원본 데이터 보기</summary>
            <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(out, null, 2)}</pre>
          </details>
        </div>
      )}
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
            <Btn onClick={() => confirm(`'${e.name}' 상태로 폰을 바꿀까요? (지금 내용은 사라집니다. 먼저 저장해 두세요)`) && setData(sanitize(e.data) ?? defaultData())}>불러오기</Btn>
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
          <Btn onClick={() => confirm("내용을 전부 비운 새 폰으로 시작할까요? (다른 캐릭터 템플릿용)\n지금 내용은 먼저 '파일로 내보내기'나 '회차 저장'으로 남겨 두세요. 실수하면 위의 ↶ 되돌리기로 돌아올 수 있어요.") && update((x) => void Object.assign(x, blankData()))}>
            <Plus size={15} /> 빈 폰으로 시작 (새 캐릭터)
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
                if (f.size > 20_000_000) throw new Error("too big");
                const clean = sanitize(JSON.parse(await f.text()));
                if (!clean) throw new Error("bad shape");
                setData(clean);
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
  ["home", "홈 화면 · 앱", HomeEd],
  ["events", "이벤트 · 잠금화면", Events],
  ["threads", "대화방 · 메시지", Threads],
  ["calls", "통화 기록", Calls],
  ["contacts", "연락처", Contacts],
  ["notes", "메모", Notes],
  ["calendar", "캘린더", Cal],
  ["songs", "음악", Songs],
  ["photos", "사진", PhotosEd],
  ["bank", "뱅킹", BankEd],
  ["json", "사파리 · 그 밖의 앱", JsonEd],
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
  // 컴퓨터: 오른쪽 칸에 맞춤 / 휴대폰: 화면 폭에 맞춰 크게
  const calc = () =>
    window.innerWidth < 720
      ? Math.min(0.9, (window.innerWidth - 56) / 433, (window.innerHeight - 170) / 892)
      : Math.max(0.42, Math.min(0.8, (window.innerHeight - 140) / 892, (window.innerWidth * 0.44) / 433));
  const [s, setS] = useState(calc);
  useEffect(() => {
    const f = () => setS(calc());
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
  const [wide, setWide] = useState(() => window.innerWidth >= 720);
  const [roomy, setRoomy] = useState(() => window.innerWidth >= 1280);
  useEffect(() => {
    sessionStorage.setItem("ed-sec", sec);
    if (sec === "events") preview(undefined, undefined, "lock");
    else if (sec === "basic" || sec === "home") preview();
    else if (SECTION_APP[sec]) preview(SECTION_APP[sec]);
  }, [sec]);
  useEffect(() => {
    document.title = "편집 — 최태식의 iPhone";
    document.body.style.overflow = "auto";
    const f = () => (setWide(window.innerWidth >= 720), setRoomy(window.innerWidth >= 1280));
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
          <UndoBar />
          {!wide && (
            <Btn kind="primary" onClick={() => setShowPrev(true)}>
              <Smartphone size={15} /> 미리보기
            </Btn>
          )}
        </div>
      </header>
      <div className={`max-w-[1600px] mx-auto px-4 py-5 grid gap-5 ${wide ? (roomy ? "grid-cols-[190px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]") : ""}`}>
        <nav className={`self-start flex gap-1 overflow-x-auto no-scrollbar ${roomy ? "sticky top-[76px] flex-col" : "col-span-full -mb-2"}`}>
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

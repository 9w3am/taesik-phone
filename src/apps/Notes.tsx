/* iOS 메모 — 폴더 · 목록 · 체크리스트 · 잠긴 메모 · 편집 저장 */
import { useState } from "react";
import { Folder, FolderPlus, SquarePen, Share, MoreHorizontal, Lock, ChevronRight, Trash2, Check, ListChecks, Camera, PenTool, Table } from "lucide-react";
import { useData, update, uid, type Note } from "../store";
import { LargeTitle, NavBar, SearchField, useScrolled, useStatusBar } from "../ui";

const TINT = "#E0A100";
const titleOf = (n: Note) => n.title || n.body.split("\n")[0] || "새로운 메모";
const previewOf = (n: Note) => n.body.split("\n").slice(1).find((l) => l.trim())?.replace(/^\[[ x]\] /, "") ?? "추가 텍스트 없음";

function Body({ n, onEdit }: { n: Note; onEdit: () => void }) {
  const lines = n.body.split("\n");
  const toggle = (i: number) =>
    update((d) => {
      const x = d.notes.find((y) => y.id === n.id);
      if (!x) return;
      const ls = x.body.split("\n");
      ls[i] = ls[i].startsWith("[x] ") ? "[ ] " + ls[i].slice(4) : "[x] " + ls[i].slice(4);
      x.body = ls.join("\n");
    });
  return (
    <div className="px-[20px] pb-[120px] min-h-full" onClick={onEdit}>
      {lines.map((l, i) => {
        if (i === 0) return <div key={i} className="text-[28px] font-bold leading-[34px] tracking-[-0.02em] mb-[6px]">{l || " "}</div>;
        const chk = l.startsWith("[ ] ") || l.startsWith("[x] ");
        if (chk) {
          const done = l.startsWith("[x] ");
          return (
            <div key={i} className="flex items-start gap-[10px] py-[3px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(i);
                }}
                className="w-[23px] h-[23px] mt-[1px] rounded-full shrink-0 flex items-center justify-center transition-colors"
                style={{ border: done ? "none" : "1.5px solid #C7C7CC", background: done ? TINT : "transparent" }}
              >
                {done && <Check size={14} color="#fff" strokeWidth={3.4} />}
              </button>
              <span className="text-[17px] leading-[24px]" style={{ color: done ? "#8e8e93" : "#000" }}>
                {l.slice(4)}
              </span>
            </div>
          );
        }
        const heading = i > 0 && l && lines[i - 1] === "" && lines[i + 1]?.startsWith("[");
        return (
          <div key={i} className={`text-[17px] leading-[24px] whitespace-pre-wrap ${heading ? "font-semibold mt-[6px]" : ""}`}>
            {l || " "}
          </div>
        );
      })}
    </div>
  );
}

function NoteView({ n, onBack }: { n: Note; onBack: () => void }) {
  const [unlocked, setUnlocked] = useState(!n.lockCode);
  const [ask, setAsk] = useState(false);
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const [editing, setEditing] = useState(n.body === "");
  const [text, setText] = useState(n.body);
  const save = () => {
    update((d) => {
      const x = d.notes.find((y) => y.id === n.id);
      if (x) {
        x.body = text;
        x.title = "";
        x.when = "방금";
      }
    });
    setEditing(false);
  };
  const del = () => {
    update((d) => {
      d.notes = d.notes.filter((y) => y.id !== n.id);
    });
    onBack();
  };
  return (
    <div className="absolute inset-0 bg-white z-20 push flex flex-col">
      <NavBar
        back="메모"
        onBack={() => {
          if (editing) save();
          onBack();
        }}
        tint={TINT}
        scrolled={false}
        bg="#fff"
        right={
          editing ? (
            <button onClick={save} className="text-[17px] font-semibold">
              완료
            </button>
          ) : (
            <>
              <Share size={22} strokeWidth={1.9} />
              <button onClick={del}>
                <Trash2 size={21} strokeWidth={1.9} />
              </button>
              <MoreHorizontal size={24} strokeWidth={1.9} className="rounded-full border-[1.8px] p-[1px]" style={{ borderColor: TINT }} />
            </>
          )
        }
      />
      <div className="flex-1 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)" }}>
        {!unlocked ? (
          <div className="flex flex-col items-center pt-[150px] text-center px-8">
            <Lock size={46} strokeWidth={1.6} color="#8e8e93" />
            <div className="text-[20px] font-semibold mt-[14px]">이 메모는 잠겨 있습니다.</div>
            <button onClick={() => setAsk(true)} className="text-[17px] mt-[10px]" style={{ color: TINT }}>
              메모 보기
            </button>
          </div>
        ) : (
          <>
            <div className="text-center text-[13px] text-[#8e8e93] pb-[8px]">{n.when}</div>
            {editing ? (
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full min-h-[600px] px-[20px] outline-none resize-none text-[17px] leading-[24px]"
                style={{ caretColor: TINT }}
              />
            ) : (
              <Body
                n={n}
                onEdit={() => {
                  setText(n.body);
                  setEditing(true);
                }}
              />
            )}
          </>
        )}
      </div>
      {/* 하단 도구 막대 */}
      <div className="flex justify-between items-center px-[22px] pt-[10px] bg-white" style={{ paddingBottom: "calc(var(--kbsab) + 2px)", color: TINT }}>
        <ListChecks size={23} strokeWidth={1.8} />
        <Table size={22} strokeWidth={1.8} />
        <Camera size={23} strokeWidth={1.8} />
        <PenTool size={22} strokeWidth={1.8} />
        <SquarePen size={23} strokeWidth={1.8} />
      </div>
      {ask && (
        <div className="absolute inset-0 z-40 flex items-center justify-center fade" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className={`w-[270px] rounded-[14px] overflow-hidden blur-bar text-center ${bad ? "shake" : ""}`} style={{ background: "rgba(242,242,242,0.92)" }}>
            <div className="px-4 pt-[19px] pb-[14px]">
              <div className="text-[17px] font-semibold">암호 입력</div>
              <div className="text-[13px] mt-[3px]">'{titleOf(n)}' 메모를 보려면 암호를 입력하십시오.</div>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("note-ok")?.click()}
                className="w-full mt-[14px] h-[30px] rounded-[7px] border border-black/15 bg-white px-2 text-[14px] outline-none"
              />
            </div>
            <div className="grid grid-cols-2 hair-t text-[17px] text-[#007AFF]">
              <button className="h-[44px]" onClick={() => (setAsk(false), setPw(""))}>
                취소
              </button>
              <button
                id="note-ok"
                className="h-[44px] font-semibold"
                style={{ boxShadow: "inset 0.5px 0 0 var(--sep)" }}
                onClick={() => {
                  if (pw === n.lockCode) {
                    setUnlocked(true);
                    setAsk(false);
                  } else {
                    setBad(true);
                    setTimeout(() => setBad(false), 450);
                    setPw("");
                  }
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ n, onClick, last }: { n: Note; onClick: () => void; last: boolean }) {
  return (
    <button onClick={onClick} className="w-full text-left pl-[16px] active:bg-[#e5e5ea]">
      <div className={`py-[10px] pr-[16px] ${last ? "" : "hair-b"}`}>
        <div className="text-[17px] font-semibold truncate flex items-center gap-[5px]">
          {n.lockCode && <Lock size={14} strokeWidth={2.6} className="shrink-0" />}
          {titleOf(n)}
        </div>
        <div className="text-[15px] text-[#8e8e93] truncate">
          <span className="text-black/80 mr-[8px]">{n.when}</span>
          {n.lockCode ? "잠김" : previewOf(n)}
        </div>
      </div>
    </button>
  );
}

export default function Notes() {
  useStatusBar(true);
  const d = useData();
  const [view, setView] = useState<"folders" | "list">("folders");
  const [folder, setFolder] = useState("메모");
  const folders = Array.from(new Set(["메모", ...d.notes.map((n) => n.folder || "메모")]));
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const notes = d.notes.filter((n) => (n.folder || "메모") === folder && (!q || (n.body + n.title).includes(q)));
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);
  const cur = d.notes.find((n) => n.id === openId);
  const compose = () => {
    const id = uid();
    update((x) => {
      x.notes.unshift({ id, folder, title: "", body: "", when: "방금" });
    });
    setOpenId(id);
  };
  const Group = ({ title, list }: { title: string; list: Note[] }) =>
    list.length ? (
      <>
        <div className="px-[20px] pt-[18px] pb-[7px] text-[20px] font-bold">{title}</div>
        <div className="mx-[16px] rounded-[12px] bg-white overflow-hidden">
          {list.map((n, i) => (
            <Row key={n.id} n={n} last={i === list.length - 1} onClick={() => setOpenId(n.id)} />
          ))}
        </div>
      </>
    ) : null;

  return (
    <div className="absolute inset-0 bg-[#F2F2F7]">
      {view === "folders" ? (
        <>
          <NavBar title="폴더" scrolled={false} tint={TINT} right={<span className="text-[17px]">편집</span>} bg="#F2F2F7" />
          <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)" }}>
            <LargeTitle>폴더</LargeTitle>
            <SearchField />
            <div className="px-[20px] pt-[14px] pb-[7px] text-[20px] font-bold">iCloud</div>
            <div className="mx-[16px] rounded-[12px] bg-white overflow-hidden">
              {[...folders.map((f) => [f, d.notes.filter((n) => (n.folder || "메모") === f).length] as const), ["최근 삭제된 항목", 0] as const].map(([l, c], i, arr) => (
                <button
                  key={l}
                  onClick={() => {
                    if (l === "최근 삭제된 항목") return;
                    setFolder(l);
                    setView("list");
                  }}
                  className="w-full flex items-center pl-[16px] text-left"
                >
                  {l !== "최근 삭제된 항목" ? <Folder size={24} color={TINT} strokeWidth={1.8} /> : <Trash2 size={23} color={TINT} strokeWidth={1.8} />}
                  <div className={`flex-1 flex items-center ml-[12px] py-[12px] pr-[12px] ${i < arr.length - 1 ? "hair-b" : ""}`}>
                    <span className="flex-1 text-[17px]">{l}</span>
                    <span className="text-[17px] text-[#8e8e93] mr-[6px]">{c}</span>
                    <ChevronRight size={18} className="text-[#c4c4c6]" strokeWidth={2.4} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-[20px] pt-[10px]" style={{ paddingBottom: "var(--sab)", color: TINT }}>
            <FolderPlus size={25} strokeWidth={1.8} />
            <button onClick={compose}>
              <SquarePen size={24} strokeWidth={1.8} />
            </button>
          </div>
        </>
      ) : (
        <>
          <NavBar title={folder} back="폴더" onBack={() => setView("folders")} scrolled={scrolled} tint={TINT} right={<MoreHorizontal size={24} strokeWidth={1.9} className="rounded-full border-[1.8px] p-[1px]" style={{ borderColor: TINT }} />} />
          <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 100 }}>
            <LargeTitle>{folder}</LargeTitle>
            <SearchField value={q} onChange={setQ} />
            <Group title="고정됨" list={pinned} />
            <Group title="이전 30일" list={rest} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[20px] pt-[10px] blur-bar" style={{ paddingBottom: "var(--sab)", background: "rgba(242,242,247,0.9)" }}>
            <span className="w-[24px]" />
            <span className="text-[11px] text-black/80">{notes.length}개의 메모</span>
            <button onClick={compose} style={{ color: TINT }}>
              <SquarePen size={24} strokeWidth={1.8} />
            </button>
          </div>
        </>
      )}
      {cur && <NoteView key={cur.id} n={cur} onBack={() => setOpenId(null)} />}
    </div>
  );
}

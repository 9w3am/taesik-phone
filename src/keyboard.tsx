/* 아이폰 키보드 — 폰 안의 입력칸을 누르면 기기 키보드 대신 이 키보드가 올라옴 (휴대폰 · 컴퓨터 어디서든)
   한글 두벌식(받침 · 겹받침 · 겹모음 조합, 지우기는 한 자모씩) · 영어 · 숫자/기호 · 글자 풍선 · 키보드 소리 */
import { useEffect, useRef, useState } from "react";

/** 키보드 높이 (폰 화면 기준 px, 아래 홈 막대 영역 포함) */
export const KB_HEIGHT = 336;

/* ───────── 한글 조합 ───────── */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VCOMB: Record<string, string> = { ㅗㅏ: "ㅘ", ㅗㅐ: "ㅙ", ㅗㅣ: "ㅚ", ㅜㅓ: "ㅝ", ㅜㅔ: "ㅞ", ㅜㅣ: "ㅟ", ㅡㅣ: "ㅢ" };
const JCOMB: Record<string, string> = { ㄱㅅ: "ㄳ", ㄴㅈ: "ㄵ", ㄴㅎ: "ㄶ", ㄹㄱ: "ㄺ", ㄹㅁ: "ㄻ", ㄹㅂ: "ㄼ", ㄹㅅ: "ㄽ", ㄹㅌ: "ㄾ", ㄹㅍ: "ㄿ", ㄹㅎ: "ㅀ", ㅂㅅ: "ㅄ" };
const split = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, [k[0], k[1]]])) as Record<string, [string, string]>;
const VSPLIT = split(VCOMB);
const JSPLIT = split(JCOMB);
type Comp = { cho?: string; jung?: string; jong?: string };
const render = (c: Comp) => (c.cho && c.jung ? String.fromCharCode(0xac00 + (CHO.indexOf(c.cho) * 21 + JUNG.indexOf(c.jung)) * 28 + JONG.indexOf(c.jong || "")) : c.cho || c.jung || "");

/* ───────── 자판 ───────── */
const KO = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];
const KO_SHIFT: Record<string, string> = { ㅂ: "ㅃ", ㅈ: "ㅉ", ㄷ: "ㄸ", ㄱ: "ㄲ", ㅅ: "ㅆ", ㅐ: "ㅒ", ㅔ: "ㅖ" };
const EN = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];
const NUM = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", ":", ";", "(", ")", "₩", "&", "@", '"'],
  [".", ",", "?", "!", "'"],
];
const SYM = [
  ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
  ["_", "\\", "|", "~", "<", ">", "$", "£", "¥", "•"],
  [".", ",", "?", "!", "'"],
];

/* 이모지 키보드 (실제 아이폰처럼 분류별 · 옆으로 넘기기) */
const EMOJI: [string, string, string[]][] = [
  ["🕘", "자주 사용하는 항목", ["😂", "❤️", "👍", "🙏", "😭", "🥲", "😅", "🔥", "✨", "👀", "💯", "😮‍💨", "🫠", "🤔", "😎", "🙃"]],
  ["😀", "스마일리 및 사람", ["😀", "😃", "😄", "😁", "😆", "🥹", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😋", "😛", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🫢", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "👍", "👎", "👊", "✊", "🤝", "👏", "🙌", "🙏", "💪", "👋"]],
  ["🐶", "동물 및 자연", ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🦆", "🦅", "🦉", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🌲", "🌵", "🌸", "🌹", "🌙", "⭐️", "☀️", "⛅️", "🌧️", "⛈️", "❄️", "🌊"]],
  ["🍔", "음식 및 음료", ["🍏", "🍎", "🍌", "🍉", "🍇", "🍓", "🍑", "🥑", "🥦", "🌽", "🥕", "🥚", "🍳", "🥓", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🌮", "🍜", "🍣", "🍱", "🍙", "🍚", "🍰", "🍩", "🍪", "🥛", "🧃", "🥤", "💧"]],
  ["⚽️", "활동", ["⚽️", "🏀", "🏈", "⚾️", "🎾", "🏐", "🏓", "🥊", "🥋", "🏋️", "🤸", "🚴", "🏃", "🧗", "🎮", "🎯", "🎲", "🎧", "🎤", "🎬"]],
  ["🚗", "여행 및 장소", ["🚗", "🚕", "🚙", "🚌", "🏎️", "🚓", "🚑", "🚒", "🚚", "🏍️", "🚲", "✈️", "🚀", "⛴️", "🚢", "🏠", "🏢", "🏥", "🏦", "🏪", "🌃", "🌉"]],
  ["💡", "사물", ["⌚️", "📱", "💻", "⌨️", "📷", "📞", "☎️", "📺", "⏰", "💡", "🔦", "💵", "💳", "💎", "🔑", "🗝️", "🔒", "🔓", "🧰", "🔧", "🔨", "✂️", "📦", "✉️", "📌", "📎", "🗑️"]],
  ["❤️", "기호", ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💯", "✅", "❌", "⭕️", "❗️", "❓", "‼️", "⚠️", "🚫", "🔞", "♻️", "🆗", "🆕", "🔴", "⚫️", "⚪️"]],
];

/* 키보드 소리: 실제 아이폰처럼 짧은 '톡' (파일 없이 직접 만듦) */
let actx: AudioContext | null = null;
function tick(kind: "key" | "del" | "mod") {
  try {
    actx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t = actx.currentTime;
    const len = Math.floor(actx.sampleRate * 0.012);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const f = actx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = kind === "del" ? 1500 : kind === "mod" ? 1100 : 2400;
    f.Q.value = 1.2;
    const g = actx.createGain();
    g.gain.value = 0.55;
    src.connect(f).connect(g).connect(actx.destination);
    src.start(t);
  } catch {
    /* 소리 못 내는 환경 */
  }
}

const isText = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && /^(text|search|email|url|tel|password|number|)$/.test(el.type)));

/** 입력칸 글자 바꾸기 (React 입력칸도 알아듣게) */
function edit(el: HTMLInputElement | HTMLTextAreaElement, del: number, text: string) {
  const v = el.value;
  const s0 = el.selectionStart ?? v.length;
  const e0 = el.selectionEnd ?? s0;
  // 지울 때는 "글자 하나" 단위로 (이모지 😂 · 👍🏻 같은 건 여러 칸이라 반만 지워지면 깨짐)
  let back = del;
  if (del === 1 && s0 === e0 && s0 > 0) {
    const before = v.slice(0, s0);
    const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
    const last = Seg ? [...new Seg("ko", { granularity: "grapheme" }).segment(before)].pop()?.segment : Array.from(before).pop();
    back = last ? last.length : 1;
  }
  const start = s0 === e0 ? Math.max(0, s0 - back) : s0;
  const nv = v.slice(0, start) + text + v.slice(e0);
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, nv);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  const pos = start + text.length;
  try {
    el.setSelectionRange(pos, pos);
  } catch {
    /* number 칸 등 */
  }
}

/** 폰 화면 안 입력칸에 기기 키보드가 안 뜨게 하고, 누르면 아이폰 키보드를 띄움 */
export function usePhoneKeyboard(root: React.RefObject<HTMLElement>, layoutKey?: unknown) {
  const [target, setTarget] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mark = () => el.querySelectorAll("input, textarea").forEach((x) => isText(x) && x.getAttribute("inputmode") !== "none" && (x.setAttribute("inputmode", "none"), x.setAttribute("autocomplete", "off"), x.setAttribute("autocorrect", "off"), x.setAttribute("spellcheck", "false")));
    mark();
    const mo = new MutationObserver(mark);
    mo.observe(el, { childList: true, subtree: true });
    const onIn = (e: FocusEvent) => isText(e.target as Element) && setTarget(e.target as HTMLInputElement);
    const onOut = () =>
      setTimeout(() => {
        const a = document.activeElement;
        if (!(a && el.contains(a) && isText(a))) setTarget(null);
      }, 0);
    el.addEventListener("focusin", onIn);
    el.addEventListener("focusout", onOut);
    return () => {
      mo.disconnect();
      el.removeEventListener("focusin", onIn);
      el.removeEventListener("focusout", onOut);
    };
  }, [root, layoutKey]);
  return [target, () => (target?.blur(), setTarget(null))] as const;
}

export function IosKeyboard({ target, muted, onHide }: { target: HTMLInputElement | HTMLTextAreaElement; muted?: boolean; onHide: () => void }) {
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [page, setPage] = useState<"abc" | "num" | "sym" | "emoji">("abc");
  const [cat, setCat] = useState(0);
  const [shift, setShift] = useState<0 | 1 | 2>(0); // 0 끔 · 1 한 번 · 2 고정(영어)
  const [pop, setPop] = useState<null | { k: string; x: number; y: number; w: number }>(null);
  const comp = useRef<Comp | null>(null);
  const ours = useRef(false);
  const lastShift = useRef(0);
  const holdT = useRef<number>();
  const kbRef = useRef<HTMLDivElement>(null);
  // 사용자가 다른 방법(컴퓨터 자판 · 커서 이동)으로 고치면 조합 끊기
  useEffect(() => {
    const reset = () => {
      if (ours.current) return;
      comp.current = null;
    };
    target.addEventListener("input", reset);
    target.addEventListener("pointerdown", reset);
    target.addEventListener("keydown", reset);
    comp.current = null;
    return () => {
      target.removeEventListener("input", reset);
      target.removeEventListener("pointerdown", reset);
      target.removeEventListener("keydown", reset);
    };
  }, [target]);
  const put = (del: number, text: string) => {
    ours.current = true;
    edit(target, del, text);
    ours.current = false;
  };
  const sound = (k: "key" | "del" | "mod") => {
    if (!muted) tick(k);
    navigator.vibrate?.(4);
  };
  const jamo = (k: string) => {
    const c = comp.current;
    const isV = JUNG.includes(k);
    if (!c) {
      comp.current = isV ? { jung: k } : { cho: k };
      return put(0, render(comp.current));
    }
    if (!isV) {
      if (c.cho && c.jung && !c.jong && JONG.includes(k)) {
        c.jong = k;
        return put(1, render(c));
      }
      if (c.jong && JCOMB[c.jong + k]) {
        c.jong = JCOMB[c.jong + k];
        return put(1, render(c));
      }
      comp.current = { cho: k };
      return put(0, k);
    }
    if (c.cho && !c.jung) {
      c.jung = k;
      return put(1, render(c));
    }
    if (c.jung && !c.jong && VCOMB[c.jung + k]) {
      c.jung = VCOMB[c.jung + k];
      return put(1, render(c));
    }
    if (c.jong) {
      // 받침이 다음 글자 첫소리로 넘어감 (예: 갑 + ㅏ → 가바)
      let carry = c.jong;
      if (JSPLIT[c.jong]) {
        c.jong = JSPLIT[c.jong][0];
        carry = JSPLIT[carry][1];
      } else c.jong = undefined;
      put(1, render(c));
      comp.current = { cho: carry, jung: k };
      return put(0, render(comp.current));
    }
    comp.current = { jung: k };
    put(0, k);
  };
  const back = () => {
    const c = comp.current;
    if (c) {
      if (c.jong) c.jong = JSPLIT[c.jong]?.[0];
      else if (c.jung) c.jung = c.cho ? VSPLIT[c.jung]?.[0] : VSPLIT[c.jung]?.[0];
      else c.cho = undefined;
      const r = render(c);
      if (!r) {
        comp.current = null;
        return put(1, "");
      }
      return put(1, r);
    }
    put(1, "");
  };
  const press = (k: string) => {
    lastShift.current = 0; // 시프트를 "연달아" 두 번 눌렀을 때만 대문자 고정
    if (lang === "ko" && page === "abc") {
      const kk = shift ? KO_SHIFT[k] ?? k : k;
      jamo(kk);
    } else {
      comp.current = null;
      put(0, page === "abc" && shift ? k.toUpperCase() : k);
    }
    if (shift === 1) setShift(0);
  };
  const space = () => {
    comp.current = null;
    put(0, " ");
  };
  const isSearch = target instanceof HTMLInputElement && (target.type === "search" || /검색|search/i.test(target.placeholder) || target.getAttribute("enterkeyhint") === "search");
  const ret = () => {
    comp.current = null;
    if (target instanceof HTMLTextAreaElement) return put(0, "\n");
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
    if (isSearch) onHide();
  };
  const holdDel = (down: boolean) => {
    clearTimeout(holdT.current);
    if (!down) return;
    sound("del");
    back();
    const rep = () => {
      back();
      sound("del");
      holdT.current = window.setTimeout(rep, 85);
    };
    holdT.current = window.setTimeout(rep, 420);
  };
  useEffect(() => () => clearTimeout(holdT.current), []);
  const rows = page === "num" ? NUM : page === "sym" ? SYM : lang === "ko" ? KO : EN;
  const showPop = (e: React.PointerEvent<HTMLElement>, k: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    const R = kbRef.current!.getBoundingClientRect();
    const sc = (kbRef.current!.offsetWidth || 393) / (R.width || 393);
    setPop({ k, x: (r.left - R.left) * sc, y: (r.top - R.top) * sc, w: r.width * sc });
  };
  const key = "flex items-center justify-center rounded-[5px] select-none active:brightness-90";
  const keyStyle = { background: "#FFFFFF", boxShadow: "0 1px 0 #898A8D", color: "#000" };
  const modStyle = { background: "#ABB0BA", boxShadow: "0 1px 0 #898A8D", color: "#000" };
  const label = (k: string) => (lang === "ko" && page === "abc" ? (shift ? KO_SHIFT[k] ?? k : k) : page === "abc" && shift ? k.toUpperCase() : k);
  return (
    <div
      ref={kbRef}
      className="absolute left-0 right-0 bottom-0 z-[89] select-none touch-none kb-up"
      style={{ height: KB_HEIGHT, background: "rgba(209,211,217,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      // 키를 눌러도 입력칸 커서가 안 사라지게
      onPointerDown={(e) => e.preventDefault()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {page === "emoji" ? (
        <div className="absolute inset-0 flex flex-col" style={{ paddingBottom: 34 }}>
          <div className="px-[12px] pt-[8px] text-[12px] font-semibold text-black/45">{EMOJI[cat][1]}</div>
          <div data-dragscroll className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x">
            <div className="grid grid-rows-5 grid-flow-col auto-cols-[44px] gap-x-[2px] px-[8px] h-full pt-[2px]">
              {EMOJI[cat][2].map((em, i) => (
                <button
                  key={em + i}
                  // 이모지는 손을 뗄 때 입력 (옆으로 넘기다가 잘못 들어가지 않게)
                  onClick={() => {
                    sound("key");
                    comp.current = null;
                    put(0, em);
                  }}
                  className="text-[30px] leading-[36px] flex items-center justify-center rounded-[8px] active:bg-black/10"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-[2px] px-[6px] h-[46px]">
            <button
              onPointerDown={() => {
                sound("mod");
                setPage("abc");
              }}
              className="h-[34px] px-[10px] rounded-[6px] text-[15px] font-medium"
              style={modStyle}
            >
              {lang === "ko" ? "가" : "ABC"}
            </button>
            <div className="flex-1 flex justify-around">
              {EMOJI.map(([ic], i) => (
                <button key={ic} onPointerDown={() => setCat(i)} className="w-[30px] h-[30px] rounded-full text-[18px] flex items-center justify-center" style={{ background: i === cat ? "rgba(0,0,0,0.12)" : undefined, filter: i === cat ? "none" : "grayscale(1)", opacity: i === cat ? 1 : 0.6 }}>
                  {ic}
                </button>
              ))}
            </div>
            <button aria-label="지우기" onPointerDown={() => holdDel(true)} onPointerUp={() => holdDel(false)} onPointerLeave={() => holdDel(false)} className="w-[38px] h-[34px] flex items-center justify-center">
              <svg width="24" height="18" viewBox="0 0 24 18">
                <path d="M8 1.5h13a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H8L1.5 9z" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M11.5 5.5l7 7m0-7l-7 7" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
      <div className="px-[3px] pt-[8px] flex flex-col gap-[11px]">
        {rows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-[6px]" style={{ paddingLeft: ri === 1 && page === "abc" ? 19 : 0, paddingRight: ri === 1 && page === "abc" ? 19 : 0 }}>
            {ri === 2 && (
              <button
                aria-label={page === "abc" ? "시프트" : page === "num" ? "기호" : "숫자"}
                onPointerDown={() => {
                  sound("mod");
                  if (page !== "abc") return setPage(page === "num" ? "sym" : "num");
                  const now = Date.now();
                  if (lang === "en" && now - lastShift.current < 320) setShift(2);
                  else setShift(shift ? 0 : 1);
                  lastShift.current = now;
                }}
                className={key}
                style={{ ...(shift && page === "abc" ? keyStyle : modStyle), width: page === "abc" ? 42 : 46, height: 42, marginRight: page === "abc" ? 8 : 6 }}
              >
                {page === "abc" ? (
                  <svg width="20" height="19" viewBox="0 0 20 19">
                    <path d="M10 1.5L1.8 10h4.4v6.8h7.6V10h4.4z" fill={shift ? "#000" : "none"} stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
                    {shift === 2 && <rect x="6.2" y="17.6" width="7.6" height="1.4" fill="#000" />}
                  </svg>
                ) : (
                  <span className="text-[15px]">{page === "num" ? "#+=" : "123"}</span>
                )}
              </button>
            )}
            {row.map((k) => (
              <button
                key={k}
                onPointerDown={(e) => {
                  showPop(e, label(k));
                  sound("key");
                  press(k);
                }}
                onPointerUp={() => setPop(null)}
                onPointerLeave={() => setPop(null)}
                className={key}
                style={{ ...keyStyle, width: page !== "abc" && ri === 2 ? 50 : 33.5, height: 42, fontSize: lang === "ko" && page === "abc" ? 20 : 22, fontWeight: 400 }}
              >
                {label(k)}
              </button>
            ))}
            {ri === 2 && (
              <button aria-label="지우기" onPointerDown={() => holdDel(true)} onPointerUp={() => holdDel(false)} onPointerLeave={() => holdDel(false)} className={key} style={{ ...modStyle, width: page === "abc" ? 42 : 46, height: 42, marginLeft: page === "abc" ? 8 : 6 }}>
                <svg width="24" height="18" viewBox="0 0 24 18">
                  <path d="M8 1.5h13a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H8L1.5 9z" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M11.5 5.5l7 7m0-7l-7 7" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {/* 맨 아랫줄: 123 · 이모지 · 스페이스 · 리턴 */}
        <div className="flex gap-[6px] px-[0px]">
          <button
            onPointerDown={() => {
              sound("mod");
              comp.current = null;
              setPage(page === "abc" ? "num" : "abc");
              setShift(0);
            }}
            className={key}
            style={{ ...modStyle, width: 89, height: 42, fontSize: 16 }}
          >
            {page === "abc" ? "123" : lang === "ko" ? "가" : "ABC"}
          </button>
          <button
            onPointerDown={() => {
              sound("mod");
              comp.current = null;
              setPage("emoji");
            }}
            className={key}
            style={{ ...modStyle, width: 42, height: 42 }}
            aria-label="이모지"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9.5" fill="none" stroke="#000" strokeWidth="1.5" />
              <circle cx="8.7" cy="10" r="1.2" />
              <circle cx="15.3" cy="10" r="1.2" />
              <path d="M7.5 14c1 2 2.6 3 4.5 3s3.5-1 4.5-3" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onPointerDown={() => {
              sound("key");
              space();
            }}
            className={key}
            style={{ ...keyStyle, flex: 1, height: 42, fontSize: 16 }}
          >
            {lang === "ko" ? "스페이스" : "space"}
          </button>
          <button
            onPointerDown={() => {
              sound("mod");
              ret();
            }}
            className={key}
            style={{ ...(isSearch ? { background: "#007AFF", color: "#fff", boxShadow: "0 1px 0 #898A8D" } : modStyle), width: 89, height: 42, fontSize: 16 }}
            aria-label="리턴"
          >
            {isSearch ? (
              "검색"
            ) : (
              <svg width="22" height="16" viewBox="0 0 22 16">
                <path d="M19.5 1.5v6.5a3 3 0 0 1-3 3H3m0 0l4.5-4.5M3 11l4.5 4.5" fill="none" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
      )}
      {/* 아래: 언어 바꾸기(🌐) · 받아쓰기(🎤) */}
      <div className="absolute left-0 right-0 flex justify-between px-[22px]" style={{ bottom: 40, display: page === "emoji" ? "none" : undefined }}>
        <button
          aria-label="언어 바꾸기"
          onPointerDown={() => {
            sound("mod");
            comp.current = null;
            setLang(lang === "ko" ? "en" : "ko");
            setPage("abc");
            setShift(0);
          }}
          className="w-[36px] h-[36px] flex items-center justify-center"
        >
          <svg width="26" height="26" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" fill="none" stroke="#3C3C43" strokeWidth="1.4" />
            <ellipse cx="12" cy="12" rx="4" ry="9.5" fill="none" stroke="#3C3C43" strokeWidth="1.4" />
            <path d="M2.5 12h19M4.5 7h15M4.5 17h15" stroke="#3C3C43" strokeWidth="1.4" />
          </svg>
        </button>
        <button aria-label="받아쓰기" onPointerDown={() => sound("mod")} className="w-[36px] h-[36px] flex items-center justify-center">
          <svg width="18" height="26" viewBox="0 0 18 26">
            <rect x="5" y="1.5" width="8" height="15" rx="4" fill="none" stroke="#3C3C43" strokeWidth="1.5" />
            <path d="M1.8 12a7.2 7.2 0 0 0 14.4 0M9 19.2v4.8" fill="none" stroke="#3C3C43" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {/* 키보드 위로 겹쳐 보이는 홈 막대 (실제 아이폰처럼) */}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[134px] h-[5px] rounded-full bg-black pointer-events-none" />
      {/* 글자 풍선 (누르는 동안 위로 크게) */}
      {pop && (
        <div className="absolute pointer-events-none flex flex-col items-center" style={{ left: pop.x - 12, top: pop.y - 52, width: pop.w + 24 }}>
          <div className="w-full h-[54px] rounded-[10px] bg-white flex items-center justify-center text-[32px]" style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
            {pop.k}
          </div>
          <div className="bg-white" style={{ width: pop.w, height: 42, marginTop: -2, borderRadius: "0 0 6px 6px", boxShadow: "0 2px 3px rgba(0,0,0,0.2)" }} />
        </div>
      )}
    </div>
  );
}

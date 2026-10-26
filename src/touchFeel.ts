/* 컴퓨터에서도 실제 폰처럼: 마우스로 누르고 끌면 손가락처럼 스크롤(놓으면 미끄러지듯 멈춤),
   끌다가 놓은 건 버튼 누름으로 안 침 · 글자/사진 끌기 · 오른쪽 클릭 메뉴 막기 */
import { useEffect } from "react";

const scrollable = (el: Element | null, root: HTMLElement): HTMLElement | null => {
  for (let n = el as HTMLElement | null; n && n !== root; n = n.parentElement) {
    const st = getComputedStyle(n);
    const y = /(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 1;
    const x = /(auto|scroll)/.test(st.overflowX) && n.scrollWidth > n.clientWidth + 1;
    if (y || x) return n;
  }
  return null;
};

export function usePhoneTouchFeel(root: React.RefObject<HTMLElement>, layoutKey?: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let drag: null | { box: HTMLElement; x: number; y: number; sl: number; st: number; moved: boolean; vx: number; vy: number; t: number; lx: number; ly: number } = null;
    let raf = 0;
    let suppressClick = false;
    const down = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      const t = e.target as Element;
      // 직접 끌기를 처리하는 곳(키보드 · 사진 넘기기 · 슬라이더 등)과 입력칸은 그대로
      if (t.closest("input, textarea, select, [data-nodrag]") || (t.closest(".touch-none") && !t.closest("[data-dragscroll]"))) return;
      const box = scrollable(t, el);
      if (!box) return;
      drag = { box, x: e.clientX, y: e.clientY, sl: box.scrollLeft, st: box.scrollTop, moved: false, vx: 0, vy: 0, t: performance.now(), lx: e.clientX, ly: e.clientY };
    };
    const move = (e: PointerEvent) => {
      const d = drag;
      if (!d) return;
      const k = el.offsetWidth / (el.getBoundingClientRect().width || 1); // 화면 배율 보정
      const dx = (e.clientX - d.x) * k;
      const dy = (e.clientY - d.y) * k;
      if (!d.moved && Math.hypot(dx, dy) < 6) return;
      d.moved = true;
      d.box.scrollLeft = d.sl - dx;
      d.box.scrollTop = d.st - dy;
      const now = performance.now();
      const dt = Math.max(1, now - d.t);
      d.vx = (((e.clientX - d.lx) * k) / dt) * 16;
      d.vy = (((e.clientY - d.ly) * k) / dt) * 16;
      d.t = now;
      d.lx = e.clientX;
      d.ly = e.clientY;
    };
    const up = () => {
      const d = drag;
      drag = null;
      if (!d?.moved) return;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      // 놓으면 미끄러지듯 멈춤 (관성)
      let vx = d.vx;
      let vy = d.vy;
      const step = () => {
        vx *= 0.94;
        vy *= 0.94;
        d.box.scrollLeft -= vx;
        d.box.scrollTop -= vy;
        if (Math.abs(vx) > 0.4 || Math.abs(vy) > 0.4) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const click = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };
    const noDrag = (e: DragEvent) => e.preventDefault();
    const noMenu = (e: MouseEvent) => {
      if (!(e.target as Element).closest("input, textarea")) e.preventDefault();
    };
    el.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("click", click, true);
    el.addEventListener("dragstart", noDrag);
    el.addEventListener("contextmenu", noMenu);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("dragstart", noDrag);
      el.removeEventListener("contextmenu", noMenu);
    };
  }, [root, layoutKey]);
}

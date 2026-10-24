/*
  사진 생성기 — 외부 이미지 0장. 전부 canvas로 직접 그린 "야간 폰카" 느낌의 이미지라 저작권 문제가 없다.
  kind 형식: "parking:7" (종류:시드). 업로드한 사진은 data: URL 그대로 사용.
*/
import type { Photo } from "./store";

const cache = new Map<string, string>();

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amt: number, r: () => number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (r() - 0.5) * amt;
    d[i] += v;
    d[i + 1] += v;
    d[i + 2] += v;
  }
  ctx.putImageData(img, 0, 0);
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, k = 0.75) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace("A", String(a)));
  g.addColorStop(1, color.replace("A", "0"));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function draw(kind: string, seed: number, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const r = rng(seed + kind.length * 31);

  if (kind === "parking") {
    // 지하주차장: 콘크리트, 형광등, 기둥, 바닥 주차선
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#2a2c2b");
    bg.addColorStop(0.45, "#1c1e1d");
    bg.addColorStop(1, "#3a3a36");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const vx = w * (0.4 + r() * 0.2),
      vy = h * 0.42;
    // 천장 형광등 (원근)
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const y = vy - (1 - t) * (1 - t) * h * 0.4;
      const lw = 12 + (1 - t) * 140;
      ctx.fillStyle = `rgba(235,245,240,${0.55 + (1 - t) * 0.4})`;
      ctx.fillRect(vx - lw / 2 + (r() - 0.5) * 6, y, lw, 3 + (1 - t) * 6);
      glow(ctx, vx, y, lw * 0.9, "rgba(200,225,215,A)", 0.18);
    }
    // 바닥 주차선
    ctx.strokeStyle = "rgba(230,220,170,0.55)";
    ctx.lineWidth = 3;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(vx + i * 8, vy + 10);
      ctx.lineTo(vx + i * 160, h);
      ctx.stroke();
    }
    // 기둥
    for (const side of [-1, 1]) {
      const px = vx + side * (w * 0.33 + r() * 30);
      const pw = 70 + r() * 30;
      const pg = ctx.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      pg.addColorStop(0, "#3c3e3c");
      pg.addColorStop(1, "#2b2c2b");
      ctx.fillStyle = pg;
      ctx.fillRect(px - pw / 2, h * 0.12, pw, h);
      ctx.fillStyle = "rgba(240,200,60,0.75)";
      ctx.fillRect(px - pw / 2, h * 0.62, pw, 18);
      ctx.fillStyle = "rgba(20,20,20,0.85)";
      ctx.font = `bold ${pw * 0.45}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(side < 0 ? "B2" : String.fromCharCode(65 + Math.floor(r() * 6)) + Math.ceil(r() * 9), px, h * 0.5);
    }
    // 멀리 있는 차 실루엣 + 미등
    ctx.fillStyle = "#0e0f10";
    const cx = vx + (r() - 0.5) * 120;
    ctx.beginPath();
    ctx.roundRect(cx - 60, vy + 4, 120, 38, 10);
    ctx.fill();
    glow(ctx, cx - 44, vy + 26, 16, "rgba(255,40,30,A)", 0.9);
    glow(ctx, cx + 44, vy + 26, 16, "rgba(255,40,30,A)", 0.9);
    ctx.filter = "blur(1px)";
    ctx.drawImage(c, 0, 0);
    ctx.filter = "none";
    vignette(ctx, w, h, 0.7);
    grain(ctx, w, h, 26, r);
  } else if (kind === "alley") {
    // 비 젖은 골목 + 가로등
    ctx.fillStyle = "#15161b";
    ctx.fillRect(0, 0, w, h);
    const vx = w * (0.45 + r() * 0.1),
      vy = h * 0.45;
    // 좌우 벽
    ctx.fillStyle = "#16171b";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(vx - 40, vy - 60);
    ctx.lineTo(vx - 40, vy + 30);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = "#121317";
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(vx + 40, vy - 60);
    ctx.lineTo(vx + 40, vy + 30);
    ctx.lineTo(w, h);
    ctx.fill();
    // 창문 불빛
    for (let i = 0; i < 7; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const t = r() * 0.8;
      const x = side < 0 ? t * (vx - 40) : w - t * (w - vx - 40);
      const y = vy - 60 + (1 - t) * -h * 0.3 + r() * 60;
      const s = 6 + (1 - t) * 30;
      ctx.fillStyle = r() < 0.5 ? "rgba(255,190,110,0.55)" : "rgba(170,200,255,0.35)";
      ctx.fillRect(x - s / 2, y, s, s * 0.8);
    }
    // 가로등
    const lx = vx + (r() - 0.5) * 160,
      ly = vy - 120 - r() * 60;
    glow(ctx, lx, ly, 320, "rgba(255,150,60,A)", 0.6);
    glow(ctx, lx, ly, 30, "rgba(255,230,180,A)", 1);
    // 바닥 반사
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,160,80,${0.06 + r() * 0.1})`;
      ctx.fillRect(lx - 30 + (r() - 0.5) * 120, vy + 40 + r() * (h - vy), 2 + r() * 10, 1 + r() * 2);
    }
    ctx.globalAlpha = 1;
    ctx.filter = "blur(1.4px)";
    ctx.drawImage(c, 0, 0);
    ctx.filter = "none";
    vignette(ctx, w, h, 0.6);
    grain(ctx, w, h, 34, r);
  } else if (kind === "car" || kind === "rain") {
    // 차 안에서 본 밤거리 / 빗방울 창문
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#07080c");
    bg.addColorStop(1, "#14161d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const cols = ["rgba(255,170,80,A)", "rgba(255,60,50,A)", "rgba(200,220,255,A)", "rgba(120,255,170,A)"];
    for (let i = 0; i < 26; i++) {
      glow(ctx, r() * w, h * 0.25 + r() * h * 0.5, 18 + r() * 60, cols[Math.floor(r() * cols.length)], 0.35 + r() * 0.4);
    }
    ctx.filter = "blur(6px)";
    ctx.drawImage(c, 0, 0);
    ctx.filter = "none";
    if (kind === "rain") {
      for (let i = 0; i < 260; i++) {
        const x = r() * w,
          y = r() * h,
          s = 1 + r() * 4;
        ctx.fillStyle = `rgba(220,230,255,${0.08 + r() * 0.22})`;
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (r() < 0.06) {
          ctx.fillStyle = "rgba(220,230,255,0.08)";
          ctx.fillRect(x - 1, y, 2, 20 + r() * 60);
        }
      }
    } else {
      // 대시보드 실루엣 + 계기판 불빛
      ctx.fillStyle = "#030304";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.quadraticCurveTo(w * 0.5, h * 0.62, w, h * 0.7);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
      glow(ctx, w * 0.28, h * 0.8, 50, "rgba(90,170,255,A)", 0.35);
      ctx.fillStyle = "#030304";
      ctx.beginPath();
      ctx.arc(w * 0.28, h * 0.98, w * 0.2, Math.PI, 0);
      ctx.lineWidth = 16;
      ctx.strokeStyle = "#0a0a0c";
      ctx.stroke();
      // 룸미러
      ctx.fillStyle = "#050506";
      ctx.beginPath();
      ctx.roundRect(w * 0.55, h * 0.05, w * 0.3, h * 0.08, 14);
      ctx.fill();
    }
    vignette(ctx, w, h, 0.65);
    grain(ctx, w, h, 30, r);
  } else if (kind === "tunnel") {
    ctx.fillStyle = "#120a04";
    ctx.fillRect(0, 0, w, h);
    const vx = w / 2 + (r() - 0.5) * 60,
      vy = h * 0.46;
    for (let i = 0; i < 18; i++) {
      const t = i / 18;
      const k = (1 - t) * (1 - t);
      for (const side of [-1, 1]) {
        const x = vx + side * k * w * 0.7;
        const y = vy - k * h * 0.42;
        glow(ctx, x, y, 8 + k * 60, "rgba(255,140,40,A)", 0.7);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 30]);
    ctx.beginPath();
    ctx.moveTo(vx, vy + 10);
    ctx.lineTo(vx + (r() - 0.5) * 40, h);
    ctx.stroke();
    ctx.setLineDash([]);
    glow(ctx, vx + 30, vy + 20, 14, "rgba(255,40,30,A)", 0.8);
    glow(ctx, vx + 52, vy + 20, 14, "rgba(255,40,30,A)", 0.8);
    ctx.filter = "blur(2.5px)";
    ctx.drawImage(c, 0, 0);
    ctx.filter = "none";
    vignette(ctx, w, h, 0.6);
    grain(ctx, w, h, 28, r);
  } else if (kind === "sky") {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1b2233");
    bg.addColorStop(0.6, "#5d5562");
    bg.addColorStop(0.75, "#a07766");
    bg.addColorStop(1, "#0b0b0d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0b0b0d";
    let x = 0;
    while (x < w) {
      const bw = 30 + r() * 90,
        bh = h * (0.12 + r() * 0.3);
      ctx.fillRect(x, h - bh, bw, bh);
      for (let i = 0; i < 6; i++) {
        if (r() < 0.4) {
          ctx.fillStyle = "rgba(255,200,120,0.5)";
          ctx.fillRect(x + r() * bw, h - r() * bh, 3, 4);
          ctx.fillStyle = "#0b0b0d";
        }
      }
      x += bw + 2;
    }
    // 난간
    ctx.fillStyle = "#050506";
    ctx.fillRect(0, h * 0.86, w, 6);
    for (let i = 0; i < w; i += 40) ctx.fillRect(i, h * 0.86, 4, h);
    vignette(ctx, w, h, 0.5);
    grain(ctx, w, h, 22, r);
  } else if (kind === "sketch") {
    // 모눈 수첩 위 볼펜 현장 스케치
    ctx.fillStyle = "#e9e6dc";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(90,120,160,0.22)";
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 22) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 22) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(25,30,60,0.85)";
    ctx.lineWidth = 2.2;
    const jit = (v: number) => v + (r() - 0.5) * 3;
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(jit(x1), jit(y1));
      ctx.lineTo(jit(x2), jit(y2));
      ctx.stroke();
    };
    // 건물 블록
    const bx = w * 0.18,
      by = h * 0.2,
      bw2 = w * 0.42,
      bh2 = h * 0.34;
    line(bx, by, bx + bw2, by);
    line(bx + bw2, by, bx + bw2, by + bh2);
    line(bx + bw2, by + bh2, bx, by + bh2);
    line(bx, by + bh2, bx, by);
    // 도로
    line(0, h * 0.68, w, h * 0.66);
    line(0, h * 0.78, w, h * 0.77);
    line(w * 0.78, 0, w * 0.76, h);
    line(w * 0.88, 0, w * 0.87, h);
    ctx.fillStyle = "rgba(25,30,60,0.9)";
    ctx.font = "italic 22px 'Pretendard Variable', sans-serif";
    ctx.fillText("정문 X", bx + 10, by + bh2 + 26);
    ctx.fillText("B2 →", bx + bw2 - 60, by + bh2 - 12);
    ctx.fillText("CCTV?", w * 0.62, h * 0.12);
    ctx.fillText("차 교대", w * 0.6, h * 0.73);
    // 화살표 경로 (빨간 볼펜)
    ctx.strokeStyle = "rgba(190,30,30,0.85)";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(bx + bw2, by + bh2 * 0.8);
    ctx.quadraticCurveTo(w * 0.7, h * 0.6, w * 0.82, h * 0.95);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.72, 14, 0, Math.PI * 2);
    ctx.stroke();
    // 종이 그림자
    const sh = ctx.createLinearGradient(0, 0, w, h);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 14, r);
  } else if (kind === "memo") {
    // 접힌 종이 메모 (볼펜 글씨)
    ctx.fillStyle = "#2b2622";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((r() - 0.5) * 0.15);
    ctx.fillStyle = "#efeadf";
    ctx.fillRect(-w * 0.36, -h * 0.4, w * 0.72, h * 0.8);
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.moveTo(-w * 0.36, 0);
    ctx.lineTo(w * 0.36, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(20,25,55,0.88)";
    ctx.font = "26px 'Pretendard Variable', sans-serif";
    const lines = ["23:00 귀가", "편의점 (같은 곳)", "택시 / 차 X", "주말 X", "→ 확인만"];
    lines.forEach((t, i) => ctx.fillText(t, -w * 0.3 + (r() - 0.5) * 6, -h * 0.28 + i * 52));
    ctx.restore();
    vignette(ctx, w, h, 0.55);
    grain(ctx, w, h, 18, r);
  } else {
    ctx.fillStyle = "#1c1c1e";
    ctx.fillRect(0, 0, w, h);
  }
  return c;
}

/** "kind:seed" → data URL (메모리 캐시) */
export function genPhoto(spec: string, w = 600, h = 800) {
  const key = `${spec}@${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [kind, s] = spec.split(":");
  let url = "";
  try {
    url = draw(kind, Number(s) || 1, w, h).toDataURL("image/jpeg", 0.82);
  } catch {
    url = "";
  }
  cache.set(key, url);
  return url;
}

/** 사진 참조 → 이미지 URL. "gen:kind:seed" / data URL / 사진 id */
export function photoSrc(ref: string, photos: Photo[], w = 600, h = 800) {
  if (!ref) return "";
  if (ref.startsWith("data:") || ref.startsWith("http")) return ref;
  if (ref.startsWith("gen:")) return genPhoto(ref.slice(4), w, h);
  const p = photos.find((x) => x.id === ref);
  if (!p) return "";
  return p.src || genPhoto(p.kind, w, h);
}

/** 업로드 이미지를 축소해 data URL로 (LocalStorage 용량 절약) */
export function shrinkImage(file: File, max = 900): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

/* iOS 사진 — 보관함 그리드 · 앨범 · 확대 보기 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Heart, Info, Trash2, Lock, Share, Image as ImageIcon, Images, Search, Sparkles, ChevronRight } from "lucide-react";
import { useData, update } from "../store";
import { photoSrc } from "../photos";
import { TabBar, useStatusBar, usePhoneCtx, Img, LargeTitle } from "../ui";

function Viewer({ start, ids, onClose }: { start: number; ids: string[]; onClose: () => void }) {
  const d = useData();
  const { setStatusDark } = usePhoneCtx();
  const [i, setI] = useState(start);
  const [chrome, setChrome] = useState(true);
  const p = d.photos.find((x) => x.id === ids[i]);
  const dark = !chrome;
  // 손가락으로 넘기기 (옆으로) · 아래로 내려 닫기
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const g = useRef<{ x: number; y: number; axis: "" | "x" | "y"; k: number } | null>(null);
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    g.current = { x: e.clientX, y: e.clientY, axis: "", k: r.width ? 393 / r.width : 1 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 이미 끝난 터치 */
    }
  };
  const move = (e: React.PointerEvent) => {
    const st = g.current;
    if (!st) return;
    const mx = (e.clientX - st.x) * st.k;
    const my = (e.clientY - st.y) * st.k;
    if (!st.axis && Math.hypot(mx, my) > 8) st.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    if (st.axis === "x") setDx((i === 0 && mx > 0) || (i === ids.length - 1 && mx < 0) ? mx / 3 : mx);
    if (st.axis === "y") setDy(Math.max(0, my));
  };
  const up = () => {
    const st = g.current;
    g.current = null;
    if (!st) return;
    if (!st.axis) setChrome((c) => !c);
    if (st.axis === "x") {
      if (dx < -60 && i < ids.length - 1) setI(i + 1);
      else if (dx > 60 && i > 0) setI(i - 1);
    }
    if (st.axis === "y" && dy > 110) return onClose();
    setDx(0);
    setDy(0);
  };
  const dragging = !!g.current?.axis;
  useEffect(() => {
    setStatusDark(!dark);
    return () => setStatusDark(true);
  }, [dark, setStatusDark]);
  if (!p) return null;
  return (
    <div className="absolute inset-0 z-30 photo-in">
      <div className="absolute inset-0" style={{ background: dark ? "#000" : "#fff", opacity: 1 - Math.min(0.85, dy / 320), transition: dragging ? "none" : "opacity .3s" }} />
      <div className="absolute inset-0 overflow-hidden touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="flex h-full" style={{ transform: `translateX(calc(${-i * 100}% + ${dx}px))`, transition: dragging ? "none" : "transform .34s cubic-bezier(.25,.9,.3,1)" }}>
          {ids.map((id, k) => (
            <div key={id} className="w-full h-full shrink-0 flex items-center justify-center" style={{ paddingLeft: 6, paddingRight: 6 }}>
              {Math.abs(k - i) <= 1 && (
                <Img
                  src={photoSrc(id, d.photos)}
                  className="w-full max-h-full"
                  style={{
                    objectFit: "contain",
                    aspectRatio: "3/4",
                    transform: k === i && dy ? `translateY(${dy}px) scale(${1 - Math.min(0.35, dy / 900)})` : "none",
                    transition: dragging ? "none" : "transform .3s cubic-bezier(.25,.9,.3,1)",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {chrome && dy < 20 && (
        <>
          <div className="absolute top-0 left-0 right-0 blur-bar flex items-center px-2" style={{ paddingTop: "var(--sat)", background: "rgba(255,255,255,0.88)" }}>
            <button data-back onClick={onClose} className="h-[44px] flex items-center text-[#007AFF]">
              <ChevronLeft size={30} strokeWidth={2.3} />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ bottom: 4 }}>
              <div className="text-[15px] font-semibold leading-[19px]">{p.when}</div>
              <div className="text-[11px] text-black/50 leading-[15px] h-[15px]">{p.caption}</div>
            </div>
            <span className="flex-1" />
            <span className="text-[17px] text-[#007AFF] pr-2">편집</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 blur-bar flex justify-between items-center px-[24px] pt-[12px] text-[#007AFF]" style={{ paddingBottom: "var(--sab)", background: "rgba(255,255,255,0.88)" }}>
            <Share size={23} strokeWidth={1.8} />
            <button
              onClick={() =>
                update((x) => {
                  const y = x.photos.find((z) => z.id === p.id);
                  if (y) y.fav = !y.fav;
                })
              }
            >
              <Heart size={24} strokeWidth={1.8} fill={p.fav ? "#007AFF" : "none"} />
            </button>
            <Info size={24} strokeWidth={1.8} />
            <button
              onClick={() => {
                update((x) => {
                  const y = x.photos.find((z) => z.id === p.id);
                  if (y) y.deleted = !y.deleted;
                });
                onClose();
              }}
            >
              <Trash2 size={23} strokeWidth={1.8} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Photos() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("lib");
  const [view, setView] = useState<{ ids: string[]; i: number } | null>(null);
  const [album, setAlbum] = useState<string | null>(null);
  const all = d.photos.filter((p) => !p.deleted && !p.vault).map((p) => p.id);
  const favs = d.photos.filter((p) => p.fav && !p.deleted && !p.vault).map((p) => p.id);
  const trash = d.photos.filter((p) => p.deleted).map((p) => p.id);
  const [trashOpen, setTrashOpen] = useState(false);
  const grid = (ids: string[]) => (
    <div className="grid grid-cols-3 gap-[1.5px]">
      {ids.map((id, i) => (
        <button key={id} onClick={() => setView({ ids, i })} className="aspect-square overflow-hidden relative">
          <Img src={photoSrc(id, d.photos)} className="w-full h-full" />
          {d.photos.find((p) => p.id === id)?.fav && <Heart size={13} fill="#fff" color="#fff" className="absolute left-[5px] bottom-[5px]" />}
        </button>
      ))}
    </div>
  );
  return (
    <div className="absolute inset-0 bg-white">
      {tab === "lib" && (
        <div className="absolute inset-0 scroll" style={{ paddingBottom: 140 }}>
          <div>
            <div style={{ height: "calc(var(--sat) + 66px)" }} />
            {all.length ? (
              <>
                {grid([...all].reverse())}
                <div className="text-center py-[14px]">
                  <div className="text-[15px] font-semibold">사진 {all.length}장</div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-10" style={{ height: 520 }}>
                <div className="text-[22px] font-bold">사진 없음</div>
                <div className="text-[15px] text-black/50 mt-[6px] leading-[21px]">이 iPhone으로 찍은 사진과 비디오가 여기에 표시됩니다.</div>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === "lib" && (
        <>
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none blur-bar" style={{ height: "calc(var(--sat) + 62px)", background: "rgba(255,255,255,0.88)" }} />
          <div className="absolute left-[16px] right-[16px] z-10 flex justify-between items-end text-black" style={{ top: "calc(var(--sat) + 6px)" }}>
            <div>
              <div className="text-[28px] font-bold leading-[32px]">보관함</div>
              <div className="text-[15px] font-semibold text-black/50">최근 항목</div>
            </div>
            <span className="text-[14px] font-semibold px-[12px] py-[5px] rounded-full bg-black/[0.06] text-[#007AFF]">
              선택
            </span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 z-10 flex p-[3px] rounded-full blur-bar text-[13px] font-semibold" style={{ bottom: "calc(var(--sab) + 64px)", background: "rgba(120,120,128,0.2)" }}>
            {["년", "월", "일", "모든 사진"].map((s, i) => (
              <span key={s} className="px-[13px] py-[5px] rounded-full" style={{ background: i === 3 ? "#fff" : "transparent", color: "#000", boxShadow: i === 3 ? "0 2px 6px rgba(0,0,0,0.12)" : "none" }}>
                {s}
              </span>
            ))}
          </div>
        </>
      )}
      {tab === "albums" && (
        <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 120 }}>
          {album ? (
            <>
              <button onClick={() => setAlbum(null)} className="flex items-center text-[#007AFF] text-[17px] px-2 -mt-[40px] h-[40px]">
                <ChevronLeft size={28} strokeWidth={2.3} /> 앨범
              </button>
              <LargeTitle>{album}</LargeTitle>
              {album === "최근 삭제된 항목" ? (
                trashOpen ? (
                  <>
                    <div className="px-4 pb-[12px] text-[13px] text-black/50 leading-[18px]">항목은 영구적으로 삭제되기 전 최대 30일 동안 표시됩니다. 그 이후에는 영구적으로 삭제됩니다.</div>
                    {trash.length ? grid(trash) : <div className="text-center text-black/40 pt-[80px]">사진 없음</div>}
                  </>
                ) : (
                  <div className="flex flex-col items-center pt-[120px] text-center px-10">
                    <Lock size={40} strokeWidth={1.6} className="text-black/40" />
                    <div className="text-[20px] font-semibold mt-[12px]">이 앨범은 잠겨 있음</div>
                    <button onClick={() => setTrashOpen(true)} className="text-[17px] text-[#007AFF] mt-[10px]">
                      앨범 보기
                    </button>
                  </div>
                )
              ) : (
                grid(album === "즐겨찾는 항목" ? favs : all)
              )}
            </>
          ) : (
            <>
              <LargeTitle>앨범</LargeTitle>
              <div className="px-4 pb-[8px] flex justify-between items-baseline">
                <span className="text-[22px] font-bold">나의 앨범</span>
                <span className="text-[17px] text-[#007AFF]">모두 보기</span>
              </div>
              <div className="grid grid-cols-2 gap-[14px] px-4">
                {[
                  ["최근 항목", all],
                  ["즐겨찾는 항목", favs],
                ].map(([name, ids]) => (
                  <button key={name as string} onClick={() => setAlbum(name as string)} className="text-left">
                    <Img src={(ids as string[])[0] ? photoSrc((ids as string[])[0], d.photos) : ""} className="w-full aspect-square rounded-[8px]" />
                    <div className="text-[15px] mt-[6px]">{name as string}</div>
                    <div className="text-[15px] text-black/50">{(ids as string[]).length}</div>
                  </button>
                ))}
              </div>
              <div className="px-4 pt-[26px] pb-[6px] text-[22px] font-bold">유틸리티</div>
              <div className="mx-4">
                {["가져오기", "가려진 항목", "최근 삭제된 항목"].map((x) => (
                  <button key={x} onClick={() => x === "최근 삭제된 항목" && (setTrashOpen(false), setAlbum(x))} className="w-full flex items-center py-[11px] hair-b text-[17px] text-[#007AFF] text-left">
                    <span className="flex-1">{x}</span>
                    {x === "최근 삭제된 항목" ? <Lock size={14} className="text-black/30 mr-[6px]" /> : <span className="text-black/40 mr-[6px]">0</span>}
                    <ChevronRight size={18} className="text-[#c4c4c6]" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {tab === "foryou" && (
        <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: 120 }}>
          <LargeTitle>For You</LargeTitle>
          <div className="px-4 text-[22px] font-bold pb-2">추억</div>
          {d.photos.length === 0 && <div className="px-4 text-[15px] text-black/50">추억이 아직 없습니다. 사진이 쌓이면 여기에 모아서 보여 줍니다.</div>}
          {d.photos.length > 0 && <div className="mx-4 rounded-[14px] overflow-hidden relative">
            <Img src={photoSrc(d.photos[0]?.id ?? "", d.photos)} className="w-full aspect-[4/5]" />
            <div className="absolute bottom-0 left-0 right-0 p-[16px] text-white" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
              <div className="text-[24px] font-bold">밤</div>
              <div className="text-[15px] opacity-85">최근</div>
            </div>
          </div>}
        </div>
      )}
      {tab === "search" && (
        <div className="absolute inset-0 px-4" style={{ paddingTop: "calc(var(--sat) + 50px)" }}>
          <div className="text-[34px] font-bold">검색</div>
          <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px] mt-2">
            <Search size={16} />
            사진, 사람, 장소...
          </div>
        </div>
      )}
      <TabBar
        active={tab}
        onChange={setTab}
        items={[
          { id: "lib", label: "보관함", icon: <ImageIcon size={24} strokeWidth={1.8} /> },
          { id: "foryou", label: "For You", icon: <Sparkles size={24} strokeWidth={1.8} /> },
          { id: "albums", label: "앨범", icon: <Images size={24} strokeWidth={1.8} /> },
          { id: "search", label: "검색", icon: <Search size={24} strokeWidth={2} /> },
        ]}
      />
      {view && <Viewer start={view.i} ids={view.ids} onClose={() => setView(null)} />}
    </div>
  );
}

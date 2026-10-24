/* iOS 사진 — 보관함 그리드 · 앨범 · 확대 보기 */
import { useEffect, useState } from "react";
import { ChevronLeft, Heart, Info, Trash2, Share, Image as ImageIcon, Images, Search, Sparkles, ChevronRight } from "lucide-react";
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
  useEffect(() => {
    setStatusDark(!dark);
    return () => setStatusDark(true);
  }, [dark, setStatusDark]);
  if (!p) return null;
  return (
    <div className="absolute inset-0 z-30 fade" style={{ background: dark ? "#000" : "#fff" }}>
      <div className="absolute inset-0 flex items-center justify-center" onClick={() => setChrome(!chrome)}>
        <Img src={photoSrc(p.id, d.photos)} className="w-full max-h-full" style={{ objectFit: "contain", aspectRatio: "3/4" }} />
      </div>
      <button className="absolute left-0 top-[120px] bottom-[120px] w-[30%]" onClick={() => setI(Math.max(0, i - 1))} aria-label="이전" />
      <button className="absolute right-0 top-[120px] bottom-[120px] w-[30%]" onClick={() => setI(Math.min(ids.length - 1, i + 1))} aria-label="다음" />
      {chrome && (
        <>
          <div className="absolute top-0 left-0 right-0 blur-bar flex items-center px-2" style={{ paddingTop: "var(--sat)", background: "rgba(255,255,255,0.88)" }}>
            <button data-back onClick={onClose} className="h-[44px] flex items-center text-[#007AFF]">
              <ChevronLeft size={30} strokeWidth={2.3} />
            </button>
            <div className="flex-1 text-center -ml-8">
              <div className="text-[15px] font-semibold">{p.when}</div>
              <div className="text-[11px] text-black/50">{p.caption || " "}</div>
            </div>
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
            <Trash2 size={23} strokeWidth={1.8} />
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
  const all = d.photos.map((p) => p.id);
  const favs = d.photos.filter((p) => p.fav).map((p) => p.id);
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
              {grid(album === "즐겨찾는 항목" ? favs : all)}
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
                  <div key={x} className="flex items-center py-[11px] hair-b text-[17px] text-[#007AFF]">
                    <span className="flex-1">{x}</span>
                    <ChevronRight size={18} className="text-[#c4c4c6]" />
                  </div>
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

/* 직접 만든 앱 — 편집 화면 "홈 화면 · 앱"에서 이름 · 아이콘 · 모양 · 글을 넣으면 폰에 생김 (템플릿용)
   모양: 목록(눌러서 자세히) / 피드(SNS 글+사진) / 사진 모음 / 웹페이지(글 한 편) */
import { useState } from "react";
import { ChevronLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useData, type CustomApp, type CustomItem } from "../store";
import { photoSrc } from "../photos";
import { LargeTitle, NavBar, useScrolled, useStatusBar, Img } from "../ui";

/** 직접 만든 앱 아이콘 (사진을 올렸으면 사진, 아니면 색 + 글자) */
export function CustomIcon({ app }: { app: CustomApp }) {
  if (app.iconImg?.startsWith("data:image/")) return <img src={app.iconImg} alt="" className="w-full h-full object-cover" />;
  return (
    <div className="w-full h-full flex items-center justify-center font-bold text-white" style={{ background: app.iconBg, fontSize: app.iconText.length > 1 ? "38%" : "50%" }}>
      <span style={{ fontSize: "inherit" }}>{app.iconText || app.name.slice(0, 1)}</span>
    </div>
  );
}

function Detail({ app, it, onBack }: { app: CustomApp; it: CustomItem; onBack: () => void }) {
  const d = useData();
  const dark = app.theme === "dark";
  const src = photoSrc(it.photo, d.photos);
  return (
    <div className="absolute inset-0 z-30 push flex flex-col" style={{ background: dark ? "#000" : "#fff", color: dark ? "#fff" : "#000" }}>
      <div style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[44px] flex items-center px-2">
          <button data-back onClick={onBack} className="flex items-center text-[17px]" style={{ color: app.tint }}>
            <ChevronLeft size={28} strokeWidth={2.2} /> {app.name}
          </button>
        </div>
      </div>
      <div className="flex-1 scroll px-[20px] pb-[50px]">
        {it.when && <div className="text-[13px] opacity-50 mt-[6px]">{it.when}</div>}
        <div className="text-[26px] font-bold leading-[32px] mt-[4px]">{it.title}</div>
        {it.sub && <div className="text-[16px] opacity-60 mt-[4px]">{it.sub}</div>}
        {src && <Img src={src} className="w-full rounded-[12px] mt-[16px]" style={{ aspectRatio: "4/3", objectFit: "cover" }} />}
        <div className="text-[17px] leading-[26px] mt-[16px] whitespace-pre-wrap" style={{ wordBreak: "keep-all" }}>
          {it.body}
        </div>
      </div>
    </div>
  );
}

export default function CustomAppView({ id }: { id: string }) {
  const d = useData();
  const app = d.customApps.find((a) => a.id === id);
  const dark = app?.theme === "dark";
  useStatusBar(!dark);
  const [ref, scrolled] = useScrolled<HTMLDivElement>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  if (!app) return null;
  const bg = dark ? "#000" : app.layout === "list" ? "#F2F2F7" : "#fff";
  const fg = dark ? "#fff" : "#000";
  const cur = app.items.find((x) => x.id === openId);
  const empty = <div className="text-center opacity-40 pt-[120px] text-[15px]">아직 아무것도 없어요</div>;
  return (
    <div className="absolute inset-0" style={{ background: bg, color: fg }}>
      <NavBar title={app.name} scrolled={scrolled} tint={app.tint} dark={dark} bg={dark ? "rgba(0,0,0,0.8)" : undefined} />
      <div ref={ref} className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 44px)", paddingBottom: "calc(var(--sab) + 30px)" }}>
        <LargeTitle>{app.name}</LargeTitle>
        {app.header && <div className="px-4 -mt-[2px] mb-[12px] text-[15px] opacity-60 whitespace-pre-wrap">{app.header}</div>}
        {app.items.length === 0 && empty}

        {app.layout === "list" && app.items.length > 0 && (
          <div className="mx-4 rounded-[12px] overflow-hidden" style={{ background: dark ? "#1C1C1E" : "#fff" }}>
            {app.items.map((it, i) => {
              const src = photoSrc(it.photo, d.photos);
              return (
                <button key={it.id} onClick={() => setOpenId(it.id)} className="w-full flex items-center gap-[12px] pl-[14px] text-left active:opacity-60">
                  {src && <Img src={src} className="w-[44px] h-[44px] rounded-[8px] shrink-0" style={{ objectFit: "cover" }} />}
                  <div className="flex-1 min-w-0 py-[11px] pr-[14px]" style={{ borderBottom: i < app.items.length - 1 ? `0.5px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}` : undefined }}>
                    <div className="flex items-baseline gap-2">
                      <span className="flex-1 text-[17px] font-semibold truncate">{it.title || "제목 없음"}</span>
                      {it.when && <span className="text-[14px] opacity-45 shrink-0">{it.when}</span>}
                    </div>
                    {(it.sub || it.body) && <div className="text-[15px] opacity-55 truncate">{it.sub || it.body.split("\n")[0]}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {app.layout === "feed" &&
          app.items.map((it) => {
            const src = photoSrc(it.photo, d.photos);
            const on = liked.has(it.id);
            return (
              <div key={it.id} className="pb-[14px]" style={{ borderBottom: `0.5px solid ${dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}` }}>
                <div className="flex items-center gap-[10px] px-[14px] py-[10px]">
                  <span className="w-[34px] h-[34px] rounded-full overflow-hidden shrink-0">
                    <CustomIcon app={app} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{it.title || app.name}</div>
                    {it.sub && <div className="text-[12px] opacity-50 truncate">{it.sub}</div>}
                  </div>
                  <MoreHorizontal size={20} className="opacity-60" />
                </div>
                {src && <Img src={src} className="w-full" style={{ aspectRatio: "4/5", objectFit: "cover" }} onClick={() => setLiked((s) => new Set(s).add(it.id))} />}
                <div className="flex items-center gap-[16px] px-[14px] pt-[10px]">
                  <button onClick={() => setLiked((s) => (s.has(it.id) ? (s.delete(it.id), new Set(s)) : new Set(s).add(it.id)))} aria-label="좋아요">
                    <Heart size={24} fill={on ? "#FF3040" : "none"} color={on ? "#FF3040" : fg} />
                  </button>
                  <MessageCircle size={23} />
                  <Send size={22} />
                  <span className="flex-1" />
                  <Bookmark size={22} />
                </div>
                {it.body && <div className="px-[14px] pt-[8px] text-[14px] leading-[19px] whitespace-pre-wrap">{it.body}</div>}
                {it.when && <div className="px-[14px] pt-[6px] text-[12px] opacity-45">{it.when}</div>}
              </div>
            );
          })}

        {app.layout === "grid" && app.items.length > 0 && (
          <div className="grid grid-cols-3 gap-[2px]">
            {app.items.map((it) => (
              <button key={it.id} onClick={() => setOpenId(it.id)} className="aspect-square overflow-hidden" style={{ background: dark ? "#1C1C1E" : "#eee" }}>
                {photoSrc(it.photo, d.photos) ? <Img src={photoSrc(it.photo, d.photos)} className="w-full h-full" style={{ objectFit: "cover" }} /> : <span className="text-[13px] opacity-60 px-2">{it.title}</span>}
              </button>
            ))}
          </div>
        )}

        {app.layout === "page" &&
          app.items.map((it) => {
            const src = photoSrc(it.photo, d.photos);
            return (
              <article key={it.id} className="px-[20px] pb-[26px]">
                {it.when && <div className="text-[13px] opacity-50">{it.when}</div>}
                {it.title && <h2 className="text-[24px] font-bold leading-[30px] mt-[2px]">{it.title}</h2>}
                {it.sub && <div className="text-[15px] opacity-60 mt-[4px]">{it.sub}</div>}
                {src && <Img src={src} className="w-full rounded-[10px] mt-[12px]" style={{ aspectRatio: "16/10", objectFit: "cover" }} />}
                {it.body && <p className="text-[17px] leading-[27px] mt-[12px] whitespace-pre-wrap" style={{ wordBreak: "keep-all" }}>{it.body}</p>}
              </article>
            );
          })}
      </div>
      {cur && <Detail app={app} it={cur} onBack={() => setOpenId(null)} />}
    </div>
  );
}

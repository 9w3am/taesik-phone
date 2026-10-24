/* 사파리 안의 모바일 웹사이트들 — 구글 · 나무위키 · 유튜브 · X · 디시 · 엔카 · 쿠팡 */
import { Search, Mic, Menu, ThumbsUp, ThumbsDown, Share2, Download, MessageCircle, Repeat2, Heart, BarChart2, Bookmark, ChevronRight, Star, Image as ImageIcon, ShoppingCart, Home, User, Play, MoreVertical, Bell, Phone } from "lucide-react";
import type { Page } from "../store";

type P<T extends Page["type"]> = Extract<Page, { type: T }>;

/* 이미지가 없을 때 쓰는 회색 자리 (모바일 웹에서 이미지가 아직 안 뜬 것처럼) */
export function NoImage({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: dark ? "#1f1f1f" : "#F1F1F1" }}>
      <ImageIcon size={30} strokeWidth={1.3} className={dark ? "text-white/20" : "text-black/15"} />
    </div>
  );
}

/* ───── Google ───── */
function GLogo({ size = 24 }: { size?: number }) {
  const c = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335"];
  return (
    <span style={{ fontSize: size, fontFamily: "'Product Sans', Arial, sans-serif", fontWeight: 500, letterSpacing: "-0.04em" }}>
      {"Google".split("").map((ch, i) => (
        <span key={i} style={{ color: c[i] }}>
          {ch}
        </span>
      ))}
    </span>
  );
}
export function GooglePage({ p }: { p: P<"search"> }) {
  return (
    <div className="bg-white min-h-full pb-8" style={{ fontFamily: "Arial, 'Pretendard Variable', sans-serif" }}>
      <div className="flex items-center justify-between px-[14px] pt-[8px]">
        <Menu size={22} className="text-[#5f6368]" />
        <GLogo size={26} />
        <span className="w-[30px] h-[30px] rounded-full bg-[#7B1FA2] text-white text-[13px] flex items-center justify-center">T</span>
      </div>
      <div className="mx-[14px] mt-[12px] h-[46px] rounded-full flex items-center gap-[10px] px-[16px]" style={{ boxShadow: "0 1px 6px rgba(32,33,36,0.28)" }}>
        <Search size={18} className="text-[#5f6368]" />
        <span className="flex-1 text-[16px] truncate text-[#202124]">{p.query}</span>
        <Mic size={20} className="text-[#4285F4]" />
      </div>
      <div className="flex gap-[22px] px-[18px] pt-[14px] text-[14px] text-[#5f6368] overflow-x-auto no-scrollbar hair-b">
        {["전체", "이미지", "동영상", "뉴스", "쇼핑", "지도"].map((t, i) => (
          <span key={t} className={`pb-[10px] whitespace-nowrap ${i === 0 ? "text-[#1a73e8] border-b-[3px] border-[#1a73e8] font-medium" : ""}`}>
            {t}
          </span>
        ))}
      </div>
      {p.results.map((r, i) => (
        <div key={i} className="px-[16px] py-[14px]" style={{ borderBottom: "8px solid #f1f3f4" }}>
          <div className="flex items-center gap-[10px]">
            <span className="w-[26px] h-[26px] rounded-full bg-[#f1f3f4] flex items-center justify-center text-[11px] font-bold text-[#5f6368]">{(r.source || r.url)[0]}</span>
            <div className="min-w-0">
              <div className="text-[14px] text-[#202124] truncate">{r.source || r.url}</div>
              <div className="text-[12px] text-[#4d5156] truncate">https://{r.url} › ...</div>
            </div>
          </div>
          <div className="text-[18px] leading-[24px] text-[#1a0dab] mt-[8px]">{r.title}</div>
          <div className="text-[14px] leading-[21px] text-[#4d5156] mt-[4px] line-clamp-3">{r.desc}</div>
        </div>
      ))}
      <div className="px-[16px] pt-[14px] text-[16px] text-[#202124]">관련 검색어</div>
      {["녹화 시간 늘리는 법", "영상 복구", "메모리 추천"].map((x) => (
        <div key={x} className="mx-[16px] mt-[8px] h-[44px] rounded-full bg-[#f1f3f4] flex items-center gap-[10px] px-[16px] text-[14px] text-[#202124]">
          <Search size={15} className="text-[#5f6368]" />
          {p.query.split(" ")[0]} {x}
        </div>
      ))}
    </div>
  );
}

/* ───── 나무위키 ───── */
export function WikiPage({ p }: { p: P<"wiki"> }) {
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="h-[50px] flex items-center gap-[10px] px-[12px] text-white" style={{ background: "#00A495" }}>
        <Menu size={22} />
        <span className="text-[18px] font-bold tracking-[-0.03em]">나무위키</span>
        <span className="flex-1" />
        <Search size={20} />
      </div>
      <div className="px-[16px] pt-[18px]">
        <div className="text-[26px] font-bold tracking-[-0.02em]">{p.title}</div>
        <div className="text-[12px] text-black/45 mt-[4px]">{p.updated}</div>
        <div className="flex gap-[6px] mt-[12px] text-[12px]">
          {["편집", "토론", "역사"].map((x) => (
            <span key={x} className="px-[10px] py-[4px] rounded-[4px] border border-black/15">
              {x}
            </span>
          ))}
        </div>
        <div className="mt-[16px] rounded-[4px] border border-black/10 p-[12px] text-[14px] leading-[22px] bg-[#f5f5f5]">
          <div className="font-bold mb-[4px]">목차</div>
          {p.sections.map((s) => (
            <div key={s.h} className="text-[#0275d8]">
              {s.h}
            </div>
          ))}
        </div>
        {p.sections.map((s) => (
          <div key={s.h} className="mt-[22px]">
            <div className="text-[20px] font-bold pb-[6px] border-b border-black/15">
              <span className="text-[#0275d8]">{s.h.split(" ")[0]}</span> {s.h.split(" ").slice(1).join(" ")}
            </div>
            <div className="text-[15px] leading-[26px] mt-[10px] whitespace-pre-wrap">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── YouTube ───── */
export function VideoPage({ p }: { p: P<"video"> }) {
  return (
    <div className="bg-[#0f0f0f] min-h-full pb-8 text-white" style={{ fontFamily: "Roboto, Arial, 'Pretendard Variable', sans-serif" }}>
      <div className="h-[48px] flex items-center gap-[4px] px-[12px]">
        <svg width="28" height="20" viewBox="0 0 28 20">
          <rect width="28" height="20" rx="5" fill="#FF0000" />
          <path d="M11 6l7 4-7 4z" fill="#fff" />
        </svg>
        <span className="text-[19px] font-bold tracking-[-0.06em]">YouTube</span>
        <span className="flex-1" />
        <Bell size={21} className="mr-[14px]" />
        <Search size={21} />
      </div>
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        <span className="w-[56px] h-[56px] rounded-full bg-black/60 flex items-center justify-center">
          <Play size={26} fill="#fff" strokeWidth={0} className="ml-[3px]" />
        </span>
        <span className="absolute bottom-[8px] right-[8px] text-[12px] bg-black/80 px-[4px] rounded-[3px]">{p.duration}</span>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
          <div className="h-full w-[18%] bg-[#FF0000]" />
        </div>
      </div>
      <div className="px-[12px] pt-[12px]">
        <div className="text-[18px] font-bold leading-[24px]">{p.title}</div>
        <div className="text-[12px] text-white/60 mt-[6px]">
          {p.views} · {p.when} <span className="text-white font-semibold">...더보기</span>
        </div>
        <div className="flex items-center gap-[10px] mt-[14px]">
          <span className="w-[36px] h-[36px] rounded-full bg-[#3f3f3f] flex items-center justify-center text-[15px] font-bold">{p.channel[0]}</span>
          <div className="flex-1 min-w-0">
            <span className="text-[15px] font-semibold">{p.channel}</span>
            <span className="text-[12px] text-white/60 ml-[6px]">{p.subs}</span>
          </div>
          <span className="h-[36px] px-[16px] rounded-full bg-white text-black text-[14px] font-semibold flex items-center">구독</span>
        </div>
        <div className="flex gap-[8px] mt-[14px] overflow-x-auto no-scrollbar">
          <span className="h-[34px] rounded-full bg-white/10 flex items-center text-[14px] font-medium shrink-0">
            <span className="flex items-center gap-[6px] px-[14px]">
              <ThumbsUp size={18} /> 1.2만
            </span>
            <span className="w-[1px] h-[22px] bg-white/20" />
            <span className="px-[14px]">
              <ThumbsDown size={18} />
            </span>
          </span>
          {[
            [Share2, "공유"],
            [Download, "오프라인 저장"],
          ].map(([I, l]) => {
            const C = I as typeof Share2;
            return (
              <span key={l as string} className="h-[34px] px-[14px] rounded-full bg-white/10 flex items-center gap-[6px] text-[14px] font-medium shrink-0">
                <C size={18} /> {l as string}
              </span>
            );
          })}
        </div>
        <div className="mt-[14px] rounded-[12px] bg-white/10 p-[12px]">
          <div className="text-[14px] font-semibold">댓글 {p.comments.length * 113}</div>
          {p.comments.map((c, i) => (
            <div key={i} className="flex gap-[10px] mt-[12px]">
              <span className="w-[24px] h-[24px] rounded-full bg-[#5f5f5f] shrink-0" />
              <div>
                <div className="text-[12px] text-white/60">{c.who}</div>
                <div className="text-[14px] leading-[20px]">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[13px] text-white/60 mt-[14px] leading-[19px]">{p.desc}</div>
      </div>
    </div>
  );
}

/* ───── X (트위터) ───── */
export function SnsPage({ p }: { p: P<"sns"> }) {
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="flex items-center gap-[14px] px-[14px] h-[52px]">
        <span className="w-[30px] h-[30px] rounded-full bg-[#cfd9de]" />
        <div className="flex-1 h-[36px] rounded-full bg-[#eff3f4] flex items-center gap-[8px] px-[14px] text-[15px]">
          <Search size={16} className="text-[#536471]" />
          {p.query}
        </div>
        <MoreVertical size={20} />
      </div>
      <div className="flex text-[15px] hair-b">
        {["인기", "최신", "사용자", "미디어"].map((t, i) => (
          <span key={t} className={`flex-1 text-center pb-[12px] pt-[4px] ${i === 1 ? "font-bold" : "text-[#536471]"}`}>
            <span className={i === 1 ? "border-b-[4px] border-[#1d9bf0] pb-[10px]" : ""}>{t}</span>
          </span>
        ))}
      </div>
      {p.posts.map((x, i) => (
        <div key={i} className="flex gap-[10px] px-[14px] py-[12px] hair-b">
          <span className="w-[40px] h-[40px] rounded-full bg-[#cfd9de] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] truncate">
              <span className="font-bold">{x.name}</span> <span className="text-[#536471]">{x.handle} · {x.when}</span>
            </div>
            <div className="text-[15px] leading-[20px] mt-[2px] whitespace-pre-wrap">{x.text}</div>
            <div className="flex justify-between text-[13px] text-[#536471] mt-[10px] pr-[10px]">
              <span className="flex items-center gap-[4px]">
                <MessageCircle size={16} /> {x.replies}
              </span>
              <span className="flex items-center gap-[4px]">
                <Repeat2 size={17} /> {x.reposts}
              </span>
              <span className="flex items-center gap-[4px]">
                <Heart size={16} /> {x.likes}
              </span>
              <span className="flex items-center gap-[4px]">
                <BarChart2 size={16} /> {x.likes * 23}
              </span>
              <Bookmark size={16} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───── 디시인사이드 ───── */
export function BoardPage({ p }: { p: P<"board"> }) {
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="h-[48px] flex items-center gap-[10px] px-[12px] text-white" style={{ background: "#3B4890" }}>
        <Menu size={22} />
        <span className="text-[16px] font-bold">{p.gallery}</span>
        <span className="flex-1" />
        <Search size={20} />
      </div>
      <div className="px-[14px] pt-[14px] pb-[12px] border-b border-black/10">
        <div className="text-[17px] font-bold leading-[24px]">{p.title}</div>
        <div className="flex justify-between text-[12px] text-black/50 mt-[8px]">
          <span>{p.author}</span>
          <span>
            조회 {p.views.toLocaleString()} · 추천 {p.recommend}
          </span>
        </div>
      </div>
      <div className="px-[14px] py-[18px] text-[15px] leading-[25px] whitespace-pre-wrap">{p.body}</div>
      <div className="flex justify-center gap-[10px] pb-[18px]">
        <span className="w-[64px] h-[64px] rounded-full border-2 flex flex-col items-center justify-center text-[12px] font-bold" style={{ borderColor: "#3B4890", color: "#3B4890" }}>
          <ThumbsUp size={18} />
          {p.recommend}
        </span>
        <span className="w-[64px] h-[64px] rounded-full border-2 border-black/20 flex flex-col items-center justify-center text-[12px] font-bold text-black/40">
          <ThumbsDown size={18} />0
        </span>
      </div>
      <div className="px-[14px] py-[8px] text-[13px] font-bold bg-[#f3f3f3]">
        전체 댓글 <span style={{ color: "#d31900" }}>{p.comments.length}</span>개
      </div>
      {p.comments.map((c, i) => (
        <div key={i} className="px-[14px] py-[10px] border-b border-black/5">
          <div className="text-[13px] font-semibold text-black/70">{c.who}</div>
          <div className="text-[14px] mt-[2px]">{c.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ───── 엔카 ───── */
export function CarPage({ p }: { p: P<"car"> }) {
  return (
    <div className="bg-[#f4f4f4] min-h-full pb-[80px] relative">
      <div className="h-[50px] flex items-center gap-[10px] px-[14px] bg-white hair-b">
        <span className="text-[20px] font-black tracking-[-0.05em]" style={{ color: "#F15A24" }}>
          encar
        </span>
        <span className="flex-1" />
        <Search size={21} />
        <Menu size={22} />
      </div>
      <NoImage className="w-full aspect-[4/3]" />
      <div className="bg-white px-[16px] py-[16px]">
        <div className="text-[18px] font-bold">{p.title}</div>
        <div className="text-[24px] font-extrabold mt-[6px]" style={{ color: "#F15A24" }}>
          {p.price}
        </div>
      </div>
      <div className="bg-white mt-[8px] px-[16px] py-[14px] grid grid-cols-2 gap-y-[10px] text-[14px]">
        {p.specs.map(([k, v]) => (
          <div key={k} className="flex gap-[10px]">
            <span className="text-black/45 w-[64px]">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
      </div>
      <div className="bg-white mt-[8px] px-[16px] py-[14px]">
        <div className="text-[15px] font-bold mb-[8px]">판매자 설명</div>
        <div className="text-[14px] leading-[23px] whitespace-pre-wrap">{p.body}</div>
        <div className="text-[13px] text-black/45 mt-[12px] flex items-center">
          {p.dealer} <ChevronRight size={14} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-[8px] p-[12px] bg-white hair-t">
        <span className="flex-1 h-[48px] rounded-[6px] border border-black/15 text-[15px] font-bold flex items-center justify-center">문자 문의</span>
        <span className="flex-1 h-[48px] rounded-[6px] text-white text-[15px] font-bold flex items-center justify-center gap-[6px]" style={{ background: "#F15A24" }}>
          <Phone size={17} fill="#fff" strokeWidth={0} /> 전화 문의
        </span>
      </div>
    </div>
  );
}

/* ───── 쿠팡 ───── */
export function ShopPage({ p }: { p: P<"shop"> }) {
  const full = Math.floor(p.rating);
  return (
    <div className="bg-white min-h-full pb-[80px] relative">
      <div className="h-[50px] flex items-center gap-[10px] px-[12px] hair-b">
        <span className="text-[20px] font-black tracking-[-0.04em]">
          {"coupang".split("").map((ch, i) => (
            <span key={i} style={{ color: ["#B5241F", "#E8781C", "#F6B71A", "#7FBA42", "#2C9CD6", "#2C9CD6", "#2C9CD6"][i] }}>
              {ch}
            </span>
          ))}
        </span>
        <div className="flex-1 h-[34px] rounded-[4px] border-2 border-[#346aff] flex items-center px-[8px] text-[13px] text-black/40">쿠팡에서 검색하세요!</div>
        <ShoppingCart size={22} />
      </div>
      <NoImage className="w-full aspect-square" />
      <div className="px-[14px] pt-[14px]">
        <div className="text-[13px] text-[#346aff]">{p.seller === "로켓배송" ? "브랜드샵 >" : p.seller}</div>
        <div className="text-[16px] leading-[22px] mt-[4px]">{p.name}</div>
        <div className="flex items-center gap-[4px] mt-[8px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} fill={i < full ? "#F7A600" : i < p.rating ? "#F7A60088" : "#e5e5e5"} strokeWidth={0} />
          ))}
          <span className="text-[13px] text-[#346aff] ml-[4px]">{p.reviews.toLocaleString()}개 상품평</span>
        </div>
        <div className="mt-[14px] pt-[12px] border-t border-black/10">
          <span className="text-[16px] font-bold text-[#AE0000] mr-[6px]">{p.discount}</span>
          <span className="text-[22px] font-bold">{p.price}</span>
        </div>
        <div className="mt-[8px] flex items-center gap-[6px] text-[14px]">
          <span className="text-[12px] font-black italic text-white bg-[#346aff] px-[5px] rounded-[2px]">로켓배송</span>
          <span className="font-bold text-[#00891A]">{p.delivery}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-[8px] p-[10px] bg-white hair-t">
        <span className="flex-1 h-[48px] rounded-[4px] border border-[#346aff] text-[#346aff] text-[15px] font-bold flex items-center justify-center">장바구니 담기</span>
        <span className="flex-1 h-[48px] rounded-[4px] bg-[#346aff] text-white text-[15px] font-bold flex items-center justify-center">바로구매</span>
      </div>
    </div>
  );
}

export { Home, User };

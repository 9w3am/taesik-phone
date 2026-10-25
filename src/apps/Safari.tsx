/* Safari — 하단 주소창, 탭 전환, 실제 사이트 같은 모바일 페이지 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Share, BookOpen, Copy, RotateCw, Lock, Search, Plus, X, Heart, Home, MoreVertical, Eye, MessageSquare, Clock, Menu, User } from "lucide-react";
import { useData, update, uid, type Page, type SafariTab } from "../store";
import { photoSrc } from "../photos";
import { Img, useStatusBar } from "../ui";
import { GooglePage, WikiPage, VideoPage, SnsPage, BoardPage, CarPage, ShopPage, NoImage } from "./SafariPages";

const NAVER = "#03C75A";

function NaverLogo({ size = 30 }: { size?: number }) {
  return (
    <span className="rounded-[7px] flex items-center justify-center text-white font-black shrink-0" style={{ width: size, height: size, background: NAVER, fontSize: size * 0.55, fontFamily: "Arial,sans-serif" }}>
      N
    </span>
  );
}

function SearchPage({ p }: { p: Extract<Page, { type: "search" }> }) {
  return (
    <div className="bg-[#F1F3F5] min-h-full pb-6">
      <div className="bg-white px-[14px] pt-[10px] pb-0">
        <div className="h-[46px] rounded-[10px] border-2 flex items-center gap-[8px] px-[8px]" style={{ borderColor: NAVER }}>
          <NaverLogo size={26} />
          <span className="flex-1 text-[16px] truncate">{p.query}</span>
          <X size={18} className="text-black/30" />
          <Search size={21} color={NAVER} strokeWidth={2.6} />
        </div>
        <div className="flex gap-[18px] text-[15px] pt-[12px] overflow-x-auto no-scrollbar">
          {["통합", "블로그", "카페", "이미지", "지식iN", "뉴스", "동영상"].map((t, i) => (
            <span key={t} className={`pb-[9px] whitespace-nowrap ${i === 0 ? "font-bold border-b-[2.5px] border-black" : "text-black/55"}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      {p.results.map((r, i) => (
        <div key={i} className="bg-white mt-[8px] px-[16px] py-[16px]">
          <div className="flex items-center gap-[8px] text-[12px] text-black/55">
            <span className="w-[22px] h-[22px] rounded-full bg-[#EEF1F4] flex items-center justify-center text-[10px] font-bold text-black/50">{(r.source || r.url)[0]}</span>
            <span className="truncate">{r.source || r.url}</span>
          </div>
          <div className="text-[17px] font-semibold mt-[8px] leading-[24px] text-[#0068C3]">{r.title}</div>
          <div className="text-[14px] text-black/65 mt-[5px] leading-[21px] line-clamp-3">{r.desc}</div>
        </div>
      ))}
      <div className="bg-white mt-[8px] px-[16px] py-[14px]">
        <div className="text-[15px] font-bold mb-[8px]">함께 많이 찾는</div>
        <div className="flex flex-wrap gap-[6px]">
          {["관련 검색어", "보관 기간 법", "열람 방법", "삭제 요청"].map((x) => (
            <span key={x} className="text-[13px] px-[11px] py-[6px] rounded-full bg-[#F1F3F5]">
              {p.query.split(" ")[0]} {x}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CafePage({ p }: { p: Extract<Page, { type: "cafe" }> }) {
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="flex items-center gap-[10px] px-[14px] h-[50px] hair-b">
        <Menu size={22} />
        <span className="text-[16px] font-bold flex-1 truncate">{p.cafe}</span>
        <Search size={21} />
      </div>
      <div className="px-[16px] pt-[16px]">
        <div className="text-[13px] font-semibold" style={{ color: NAVER }}>
          {p.board} &gt;
        </div>
        <div className="text-[20px] font-bold leading-[28px] mt-[6px]">{p.title}</div>
        <div className="flex items-center gap-[10px] mt-[14px] pb-[14px] hair-b">
          <span className="w-[36px] h-[36px] rounded-full bg-[#E9ECEF] flex items-center justify-center">
            <User size={18} className="text-black/30" />
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{p.author}</div>
            <div className="text-[12px] text-black/45 flex items-center gap-[8px]">
              <span className="flex items-center gap-[2px]">
                <Eye size={12} /> 조회 {p.views.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="text-[16px] leading-[27px] whitespace-pre-wrap py-[20px]">{p.body}</div>
        <div className="flex items-center gap-[16px] text-[13px] text-black/60 py-[12px] hair-b">
          <span className="flex items-center gap-[4px]">
            <Heart size={16} /> 좋아요 {Math.round(p.views / 90)}
          </span>
          <span className="flex items-center gap-[4px]">
            <MessageSquare size={16} /> 댓글 {p.comments.length}
          </span>
        </div>
        {p.comments.map((c, i) => (
          <div key={i} className="flex gap-[10px] py-[12px] hair-b">
            <span className="w-[30px] h-[30px] rounded-full bg-[#E9ECEF] shrink-0" />
            <div>
              <div className="text-[13px] font-semibold">
                {c.who}
                {c.who === p.author && <span className="ml-[4px] text-[11px] px-[4px] rounded-[3px] border" style={{ color: NAVER, borderColor: NAVER }}>작성자</span>}
              </div>
              <div className="text-[14px] leading-[20px] mt-[2px]">{c.text}</div>
              <div className="text-[12px] text-black/40 mt-[3px]">답글쓰기</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketPage({ p }: { p: Extract<Page, { type: "market" }> }) {
  const d = useData();
  return (
    <div className="bg-white min-h-full pb-[80px] relative">
      <div className="relative">
        {photoSrc(p.photo, d.photos) ? <Img src={photoSrc(p.photo, d.photos)} className="w-full aspect-square" /> : <NoImage className="w-full aspect-square" />}
        <div className={`absolute top-0 left-0 right-0 flex justify-between px-[12px] pt-[10px] text-black/70`}>
          <div className="flex gap-[14px]">
            <ChevronLeft size={26} />
            <Home size={23} />
          </div>
          <div className="flex gap-[14px]">
            <Share size={22} />
            <MoreVertical size={22} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-[10px] px-[16px] py-[14px] hair-b">
        <span className="w-[40px] h-[40px] rounded-full bg-[#E9ECEF] flex items-center justify-center">
          <User size={20} className="text-black/30" />
        </span>
        <div className="flex-1">
          <div className="text-[15px] font-bold">{p.seller}</div>
          <div className="text-[13px] text-black/50">{p.area}</div>
        </div>
        <div className="text-right">
          {p.site === "daangn" ? (<>
          <div className="text-[15px] font-bold text-[#DE5D06]">{p.temp}°C</div>
          <div className="w-[60px] h-[4px] rounded-full bg-[#F1F3F5] mt-[2px] overflow-hidden">
            <div className="h-full bg-[#DE5D06]" style={{ width: `${Math.min(100, p.temp)}%` }} />
          </div>
          <div className="text-[11px] text-black/40 underline mt-[2px]">매너온도</div></>) : (
            <div className="text-[12px] text-black/50">{p.site === "bunjang" ? "번개페이 안전결제" : "중고나라 페이"}</div>
          )}
        </div>
      </div>
      <div className="px-[16px] pt-[18px]">
        <div className="text-[20px] font-bold leading-[27px]">{p.title}</div>
        <div className="text-[13px] text-black/45 mt-[6px]">{p.meta}</div>
        <div className="text-[16px] leading-[26px] whitespace-pre-wrap mt-[16px]">{p.body}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-[14px] px-[16px] py-[12px] hair-t bg-white">
        <Heart size={24} className="text-black/40" />
        <span className="w-[0.5px] h-[30px] bg-black/10" />
        <span className="text-[17px] font-bold flex-1">{p.price}</span>
        <span className="h-[40px] px-[16px] rounded-[6px] text-white text-[15px] font-bold flex items-center" style={{ background: p.site === "bunjang" ? "#D80C18" : p.site === "joongna" ? "#0DCC5A" : "#FF6F0F" }}>
          {p.site === "bunjang" ? "번개톡" : "채팅하기"}
        </span>
      </div>
    </div>
  );
}

function JobPage({ p }: { p: Extract<Page, { type: "job" }> }) {
  return (
    <div className="bg-[#F4F6FA] min-h-full pb-[80px] relative">
      <div className="h-[50px] flex items-center px-[14px] bg-white hair-b">
        <span className="text-[19px] font-black tracking-[-0.04em]" style={{ color: "#4876EF" }}>
          {p.site}
        </span>
        <span className="flex-1" />
        <Search size={21} />
      </div>
      <div className="bg-white px-[18px] pt-[20px] pb-[18px]">
        <div className="text-[14px] text-black/60">{p.company}</div>
        <div className="text-[20px] font-bold leading-[28px] mt-[6px]">{p.title}</div>
        <div className="text-[15px] font-semibold mt-[12px]" style={{ color: "#4876EF" }}>
          {p.pay}
        </div>
      </div>
      <div className="bg-white mt-[8px] px-[18px] py-[16px]">
        <div className="text-[15px] font-bold mb-[10px]">지원 자격</div>
        {p.conditions.map((c) => (
          <div key={c} className="text-[14px] py-[5px] flex gap-[8px]">
            <span className="text-black/30">·</span>
            {c}
          </div>
        ))}
      </div>
      <div className="bg-white mt-[8px] px-[18px] py-[16px]">
        <div className="text-[15px] font-bold mb-[10px]">상세 요강</div>
        <div className="text-[14px] leading-[23px] whitespace-pre-wrap">{p.body}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex gap-[8px] p-[12px] bg-white hair-t">
        <span className="w-[48px] h-[48px] rounded-[8px] border border-black/10 flex items-center justify-center">
          <Heart size={21} className="text-black/40" />
        </span>
        <span className="flex-1 h-[48px] rounded-[8px] text-white text-[16px] font-bold flex items-center justify-center" style={{ background: "#4876EF" }}>
          입사지원
        </span>
      </div>
    </div>
  );
}

function NewsPage({ p }: { p: Extract<Page, { type: "news" }> }) {
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="h-[50px] flex items-center gap-[8px] px-[14px] hair-b">
        <NaverLogo size={22} />
        <span className="text-[16px] font-bold">뉴스</span>
        <span className="flex-1" />
        <Search size={21} />
      </div>
      <div className="px-[18px] pt-[18px]">
        <div className="text-[14px] font-bold">{p.press}</div>
        <div className="text-[22px] font-bold leading-[31px] mt-[10px] tracking-[-0.02em]">{p.title}</div>
        <div className="text-[13px] text-black/45 mt-[10px] pb-[16px] hair-b">{p.reporter}</div>
        <div className="text-[17px] leading-[29px] whitespace-pre-wrap pt-[18px]">{p.body}</div>
      </div>
    </div>
  );
}

/* 네이버 블로그 글 (모바일) */
function BlogPage({ p }: { p: Extract<Page, { type: "blog" }> }) {
  const d = useData();
  const src = photoSrc(p.photo, d.photos);
  return (
    <div className="bg-white min-h-full pb-8">
      <div className="h-[50px] flex items-center gap-[8px] px-[14px] hair-b">
        <NaverLogo size={22} />
        <span className="text-[16px] font-bold">blog</span>
        <span className="flex-1" />
        <Search size={21} />
        <Menu size={22} />
      </div>
      <div className="px-[18px] pt-[16px]">
        <div className="text-[13px] font-semibold" style={{ color: NAVER }}>
          {p.category}
        </div>
        <div className="text-[22px] font-bold leading-[30px] mt-[6px] tracking-[-0.02em]">{p.title}</div>
        <div className="flex items-center gap-[10px] mt-[14px] pb-[14px] hair-b">
          <span className="w-[36px] h-[36px] rounded-full bg-[#E7F8EE] text-[#03A94D] font-bold flex items-center justify-center">{p.author.slice(0, 1)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{p.author}</div>
            <div className="text-[12px] text-black/45">{p.when}</div>
          </div>
          <span className="h-[30px] px-[12px] rounded-full border border-black/15 text-[13px] flex items-center">+ 이웃추가</span>
        </div>
        {src && <Img src={src} className="w-full rounded-[4px] mt-[18px]" style={{ aspectRatio: "4/3" }} />}
        <div className="text-[16px] leading-[28px] whitespace-pre-wrap pt-[18px]">{p.body}</div>
        <div className="flex items-center gap-[18px] mt-[26px] pt-[14px] border-t border-black/10 text-[14px] text-black/60">
          <span className="flex items-center gap-[5px]">
            <Heart size={18} /> 공감 {p.likes}
          </span>
          <span className="flex items-center gap-[5px]">
            <MessageSquare size={18} /> 댓글 {p.comments.length}
          </span>
        </div>
        {p.comments.map((c, i) => (
          <div key={i} className="py-[12px] hair-b">
            <div className="text-[14px] font-semibold">{c.who}</div>
            <div className="text-[15px] mt-[2px]">{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 네이버 지식iN 질문 · 답변 */
function QnaPage({ p }: { p: Extract<Page, { type: "qna" }> }) {
  return (
    <div className="bg-[#F5F6F8] min-h-full pb-8">
      <div className="h-[50px] flex items-center gap-[8px] px-[14px] bg-white hair-b">
        <NaverLogo size={22} />
        <span className="text-[16px] font-bold">지식iN</span>
        <span className="flex-1" />
        <Search size={21} />
      </div>
      <div className="bg-white px-[18px] pt-[16px] pb-[18px]">
        <div className="flex items-start gap-[8px]">
          <span className="text-[24px] font-black leading-[28px]" style={{ color: NAVER }}>
            Q
          </span>
          <div className="text-[19px] font-bold leading-[27px]">{p.question}</div>
        </div>
        {p.detail && <div className="text-[15px] leading-[24px] text-black/75 mt-[10px] whitespace-pre-wrap">{p.detail}</div>}
        <div className="text-[12px] text-black/40 mt-[12px]">
          {p.asker} · {p.when} · 조회수 {p.views}
        </div>
      </div>
      {p.answers.map((a, i) => (
        <div key={i} className="bg-white mt-[8px] px-[18px] py-[16px]">
          <div className="flex items-center gap-[8px] mb-[8px]">
            <span className="text-[24px] font-black" style={{ color: "#F5A623" }}>
              A
            </span>
            <span className="text-[14px] font-semibold">{a.who}</span>
            {i === 0 && <span className="text-[11px] px-[6px] py-[2px] rounded-[3px] font-bold text-white" style={{ background: NAVER }}>질문자 채택</span>}
          </div>
          <div className="text-[15px] leading-[25px] whitespace-pre-wrap">{a.text}</div>
        </div>
      ))}
    </div>
  );
}

const FAV: Record<string, string> = { Google: "#4285F4", YouTube: "#FF0000", 나무위키: "#00A495", 당근: "#FF6F0F", 번개장터: "#D80C18", 쿠팡: "#E8781C", X: "#000" };

function StartPage({ onGo }: { onGo: (q: string) => void }) {
  const d = useData();
  return (
    <div className="bg-[#F2F2F7] min-h-full px-[18px] pt-[22px] pb-10">
      <div className="text-[22px] font-bold mb-[14px]">즐겨찾기</div>
      <div className="grid grid-cols-4 gap-y-[18px]">
        {d.safari.favorites.map((f) => (
          <button key={f.url} onClick={() => onGo(f.title)} className="flex flex-col items-center gap-[6px]">
            <span className="w-[62px] h-[62px] rounded-[14px] bg-white flex items-center justify-center text-[26px] font-bold text-black/70" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              {f.title === "NAVER" ? <NaverLogo size={40} /> : <span style={{ color: FAV[f.title] ?? "#555" }}>{f.title === "YouTube" ? "▶" : f.title[0]}</span>}
            </span>
            <span className="text-[12px] text-black/70 truncate max-w-[76px]">{f.title}</span>
          </button>
        ))}
      </div>
      <div className="text-[22px] font-bold mt-[30px] mb-[10px]">개인 정보 보호 리포트</div>
      <div className="rounded-[14px] bg-white p-[14px] flex items-center gap-[12px] text-[14px]">
        <span className="text-[26px] font-semibold">27</span>
        <span className="text-black/60 leading-[19px]">지난 7일 동안 Safari가 27개의 추적기가 사용자를 프로파일링하지 못하도록 차단했습니다.</span>
      </div>
    </div>
  );
}

function PageView({ page, onGo }: { page: Page; onGo: (q: string) => void }) {
  if (page.type === "search") return page.engine === "google" ? <GooglePage p={page} /> : <SearchPage p={page} />;
  if (page.type === "wiki") return <WikiPage p={page} />;
  if (page.type === "video") return <VideoPage p={page} />;
  if (page.type === "sns") return <SnsPage p={page} />;
  if (page.type === "board") return <BoardPage p={page} />;
  if (page.type === "car") return <CarPage p={page} />;
  if (page.type === "shop") return <ShopPage p={page} />;
  if (page.type === "cafe") return <CafePage p={page} />;
  if (page.type === "market") return <MarketPage p={page} />;
  if (page.type === "job") return <JobPage p={page} />;
  if (page.type === "news") return <NewsPage p={page} />;
  if (page.type === "blog") return <BlogPage p={page} />;
  if (page.type === "qna") return <QnaPage p={page} />;
  return <StartPage onGo={onGo} />;
}

export default function Safari() {
  useStatusBar(true);
  const d = useData();
  const [cur, setCur] = useState<string>(d.safari.tabs[0]?.id ?? "");
  const [overview, setOverview] = useState(false);
  const [priv, setPriv] = useState(false); // 비공개 탭 그룹
  const [hist, setHist] = useState(false); // 방문 기록
  const [typing, setTyping] = useState(false);
  const [q, setQ] = useState("");
  const tab = d.safari.tabs.find((t) => t.id === cur);
  const go = (query: string) => {
    if (!query.trim()) return;
    const t: SafariTab = {
      id: uid(),
      title: `${query} - Google 검색`,
      url: "google.com",
      page: {
        type: "search",
        engine: "google",
        query,
        results: [
          { title: `${query} — 블로그 후기 모음`, url: "m.blog.naver.com", desc: `${query}에 대해 직접 알아본 내용을 정리했습니다. 생각보다 정보가 많지 않아서…`, source: "블로그" },
          { title: `${query} - 나무위키`, url: "namu.wiki", desc: `${query}에 대한 문서. 개요, 상세, 관련 문서…`, source: "나무위키" },
          { title: `${query} 질문드립니다 (지식iN)`, url: "m.kin.naver.com", desc: `${query} 관련해서 아시는 분 계신가요? 급하게 알아보는 중입니다.`, source: "지식iN" },
          { title: `'${query}' 관련 기사`, url: "n.news.naver.com", desc: `${query}와 관련한 최근 보도 내용을 정리했다.`, source: "뉴스" },
        ],
      },
    };
    update((x) => {
      const i = x.safari.tabs.findIndex((y) => y.id === cur);
      if (i >= 0) x.safari.tabs[i] = { ...t, id: cur };
      else x.safari.tabs.unshift(t);
      x.safari.history = [query, ...x.safari.history.filter((h) => h !== query)].slice(0, 30);
    });
    if (!tab) setCur(t.id);
    setTyping(false);
    setQ("");
  };
  const newTab = () => {
    const id = uid();
    update((x) => {
      x.safari.tabs.push({ id, title: "시작 페이지", url: "", page: { type: "blank" } });
    });
    setCur(id);
    setOverview(false);
  };
  const closeTab = (id: string) =>
    update((x) => {
      x.safari.tabs = x.safari.tabs.filter((t) => t.id !== id);
    });

  if (overview)
    return (
      <div className="absolute inset-0 fade" style={{ background: priv ? "#1C1C1E" : "#E9E9EE" }}>
        {priv && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[40px] text-white">
            <div className="text-[20px] font-semibold">비공개 브라우징</div>
            <div className="text-[14px] text-white/60 mt-[8px] leading-[20px]">Safari는 방문한 페이지, 검색 기록, 자동 완성 정보를 기억하지 않습니다. 비공개 탭은 잠겨 있으며 사용 중이 아닐 때 잠깁니다.</div>
          </div>
        )}
        <div className={`absolute inset-0 scroll px-[16px] grid grid-cols-2 gap-[16px] content-start ${priv ? "hidden" : ""}`} style={{ paddingTop: "calc(var(--sat) + 14px)", paddingBottom: 120 }}>
          {d.safari.tabs.map((t) => (
            <div key={t.id} className="relative">
              <button
                onClick={() => {
                  setCur(t.id);
                  setOverview(false);
                }}
                className="w-full rounded-[12px] overflow-hidden bg-white text-left"
                style={{ outline: t.id === cur ? "3px solid #007AFF" : "none", outlineOffset: 2, boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}
              >
                <div className="h-[210px] overflow-hidden pointer-events-none">
                  <div style={{ transform: "scale(0.45)", transformOrigin: "top left", width: "222%" }}>
                    <PageView page={t.page} onGo={() => {}} />
                  </div>
                </div>
              </button>
              <button onClick={() => closeTab(t.id)} className="absolute top-[7px] right-[7px] w-[22px] h-[22px] rounded-full bg-black/45 text-white flex items-center justify-center">
                <X size={13} strokeWidth={3} />
              </button>
              <div className="text-[12px] text-center mt-[6px] truncate px-1">{t.title}</div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-[20px] pt-[12px] blur-bar text-[17px] text-[#007AFF]" style={{ paddingBottom: "var(--sab)", background: priv ? "rgba(28,28,30,0.9)" : "rgba(233,233,238,0.85)" }}>
          <button onClick={newTab} className={priv ? "opacity-40" : ""} disabled={priv}>
            <Plus size={26} />
          </button>
          <div className="flex p-[2px] rounded-[9px] text-[13px] font-semibold" style={{ background: priv ? "rgba(118,118,128,0.3)" : "rgba(118,118,128,0.14)" }}>
            {[true, false].map((pv) => (
              <button
                key={String(pv)}
                onClick={() => setPriv(pv)}
                className="px-[12px] h-[28px] rounded-[7px]"
                style={{ background: priv === pv ? (priv ? "#636366" : "#fff") : "transparent", color: priv ? "#fff" : "#000", boxShadow: priv === pv && !priv ? "0 2px 6px rgba(0,0,0,0.12)" : "none" }}
              >
                {pv ? "비공개" : `${d.safari.tabs.length}개의 탭`}
              </button>
            ))}
          </div>
          <button onClick={() => setOverview(false)} className="font-semibold">
            완료
          </button>
        </div>
      </div>
    );

  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 140 }}>
        {tab ? <PageView page={tab.page} onGo={go} /> : <StartPage onGo={go} />}
      </div>
      {hist && (
        <div className="absolute inset-0 z-40 flex items-end fade" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setHist(false)}>
          <div className="w-full h-[88%] bg-[#F2F2F7] rounded-t-[14px] flex flex-col sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-[16px] h-[52px]">
              <span className="w-[40px]" />
              <span className="text-[17px] font-semibold">방문 기록</span>
              <button onClick={() => setHist(false)} className="text-[17px] text-[#007AFF] font-semibold">
                완료
              </button>
            </div>
            <div className="px-[16px] pb-[10px]">
              <div className="h-[36px] rounded-[10px] bg-[#767680]/[0.12] flex items-center gap-[6px] px-[8px] text-[#8e8e93] text-[17px]">
                <Search size={16} /> 방문 기록 검색
              </div>
            </div>
            <div className="flex-1 scroll pb-[40px]">
              {[
                ["오늘", d.safari.tabs.slice(0, Math.ceil(d.safari.tabs.length / 2))],
                ["어제", d.safari.tabs.slice(Math.ceil(d.safari.tabs.length / 2))],
              ].map(([label, list]) => (
                <div key={label as string}>
                  <div className="px-[16px] pt-[14px] pb-[6px] text-[13px] font-semibold text-black/50">{label as string}</div>
                  <div className="mx-[16px] rounded-[12px] bg-white overflow-hidden">
                    {(list as SafariTab[]).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setCur(t.id);
                          setHist(false);
                        }}
                        className="w-full text-left pl-[14px] flex items-center gap-[12px]"
                      >
                        <span className="w-[28px] h-[28px] rounded-[7px] bg-[#E9E9EE] flex items-center justify-center text-[12px] font-bold text-black/50 shrink-0">{t.url[0]?.toUpperCase()}</span>
                        <div className="flex-1 min-w-0 py-[9px] hair-b pr-[14px]">
                          <div className="text-[15px] truncate">{t.title}</div>
                          <div className="text-[13px] text-black/45 truncate">{t.url}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end px-[20px] py-[12px] text-[17px] text-[#007AFF] hair-t" style={{ paddingBottom: "var(--sab)" }}>
              지우기
            </div>
          </div>
        </div>
      )}
      {/* 주소 입력 화면 */}
      {typing && (
        <div className="absolute inset-0 z-30 bg-[#F2F2F7] fade" style={{ paddingTop: "var(--sat)" }}>
          <div className="flex items-center gap-[10px] px-[12px] py-[8px]">
            <div className="flex-1 h-[40px] rounded-[12px] bg-white flex items-center gap-[6px] px-[10px]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <Search size={16} className="text-black/40" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go(q)} placeholder="검색 또는 웹 사이트 이름 입력" className="flex-1 outline-none text-[17px] bg-transparent min-w-0" />
            </div>
            <button onClick={() => setTyping(false)} className="text-[17px] text-[#007AFF]">
              취소
            </button>
          </div>
          <div className="px-[16px] pt-[10px] text-[20px] font-bold">최근 검색</div>
          <div className="mx-[16px] mt-[8px] rounded-[12px] bg-white overflow-hidden">
            {d.safari.history
              .filter((h) => !q || h.includes(q))
              .map((h) => (
                <button key={h} onClick={() => go(h)} className="w-full flex items-center gap-[12px] pl-[14px] text-left">
                  <Clock size={17} className="text-black/35 shrink-0" />
                  <span className="flex-1 py-[11px] hair-b text-[16px] truncate pr-3">{h}</span>
                </button>
              ))}
          </div>
        </div>
      )}
      {/* 하단 주소창 + 툴바 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 blur-bar" style={{ background: "rgba(246,246,246,0.92)", boxShadow: "inset 0 0.5px 0 var(--sep)", paddingBottom: "var(--sab)" }}>
        <div className="px-[12px] pt-[8px]">
          <button onClick={() => setTyping(true)} className="w-full h-[44px] rounded-[13px] bg-white flex items-center px-[12px] gap-[6px]" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
            <span className="text-[15px] font-semibold text-black/80">
              <span className="text-[12px]">가</span>가
            </span>
            <span className="flex-1 flex items-center justify-center gap-[4px] text-[16px] text-black truncate">
              {tab?.url && <Lock size={12} strokeWidth={2.8} className="text-black/55" />}
              {tab?.url || "검색 또는 웹 사이트 이름 입력"}
            </span>
            <RotateCw size={17} className="text-black/70" />
          </button>
        </div>
        <div className="flex justify-between items-center px-[22px] h-[46px] text-[#007AFF]">
          <ChevronLeft size={28} strokeWidth={1.9} />
          <ChevronRight size={28} strokeWidth={1.9} className="opacity-35" />
          <Share size={23} strokeWidth={1.9} />
          <button onClick={() => setHist(true)}>
            <BookOpen size={24} strokeWidth={1.9} />
          </button>
          <button onClick={() => setOverview(true)}>
            <Copy size={23} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );
}

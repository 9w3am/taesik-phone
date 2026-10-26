/* 엔터 앱: 유튜브 · 넷플릭스 · X — 화면 안쪽(검색 · 상세 · 글쓰기 · 프로필)까지 실제 앱처럼 */
import { useRef, useState } from "react";
import { ChevronLeft, Search, Bell, Cast, House, Clapperboard, CirclePlus, Youtube, User, Play, Pause, Download, MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, Mail as MailIcon, Users, MoreHorizontal, Plus, Clock, ArrowUpRight, ThumbsUp, ThumbsDown, X as XIcon, CalendarDays, Image as ImageIcon } from "lucide-react";
import { useData, update, uid, type YtVideo, type NfTitle, type XPost } from "../store";
import { photoSrc } from "../photos";
import { TabBar, useStatusBar, Img } from "../ui";
import { Avatar, Thumb, Push, Sheet, Bar } from "./moreKit";

/* ═════════════ 유튜브 ═════════════ */
const ytText = (v: YtVideo) => v.title.split(/[([]/)[0].trim();
function YtCard({ v, onOpen }: { v: YtVideo; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full text-left pb-[18px]">
      <Thumb photo={v.photo} hue={v.hue} className="w-full aspect-video" text={ytText(v)}>
        <span className="absolute right-[8px] bottom-[8px] text-[12px] font-semibold text-white bg-black/80 rounded-[4px] px-[4px] py-[1px]">{v.duration}</span>
        {v.progress > 0 && <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${v.progress * 100}%` }} />}
      </Thumb>
      <div className="flex gap-[12px] px-[12px] pt-[10px]">
        <Avatar name={v.channel} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] leading-[20px] font-medium line-clamp-2">{v.title}</div>
          <div className="text-[12px] text-black/55 mt-[2px]">
            {v.channel} · {v.views} · {v.when}
          </div>
        </div>
        <MoreHorizontal size={18} className="rotate-90 text-black/70 shrink-0" />
      </div>
    </button>
  );
}
function YtRow({ v, onOpen }: { v: YtVideo; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full flex gap-[10px] text-left px-[12px] py-[6px]">
      <Thumb photo={v.photo} hue={v.hue} className="w-[160px] aspect-video rounded-[8px] shrink-0" text={ytText(v)}>
        <span className="absolute right-[5px] bottom-[5px] text-[11px] font-semibold text-white bg-black/80 rounded-[4px] px-[4px]">{v.duration}</span>
        {v.progress > 0 && <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${v.progress * 100}%` }} />}
      </Thumb>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] leading-[19px] font-medium line-clamp-2">{v.title}</div>
        <div className="text-[12px] text-black/55 mt-[3px]">{v.channel}</div>
        <div className="text-[12px] text-black/55">
          {v.views} · {v.when}
        </div>
      </div>
    </button>
  );
}
function YtWatch({ v, list, onPick, onClose }: { v: YtVideo; list: YtVideo[]; onPick: (v: YtVideo) => void; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const [more, setMore] = useState(false);
  const [liked, setLiked] = useState(false);
  const [subbed, setSubbed] = useState(false);
  return (
    <div className="absolute inset-0 z-30 bg-white sheet flex flex-col" style={{ paddingTop: "var(--sat)" }}>
      <div className="relative bg-black shrink-0">
        <Thumb photo={v.photo} hue={v.hue} className="w-full aspect-video" text={ytText(v)}>
          <button onClick={() => setPaused(!paused)} className="absolute inset-0 flex items-center justify-center" aria-label={paused ? "재생" : "일시 정지"}>
            <span className="w-[56px] h-[56px] rounded-full bg-black/50 flex items-center justify-center">{paused ? <Play size={28} fill="#fff" color="#fff" /> : <Pause size={28} fill="#fff" color="#fff" />}</span>
          </button>
          <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-white/30">
            <span className="block h-full bg-[#FF0000]" style={{ width: `${Math.max(0.03, v.progress) * 100}%` }} />
          </span>
        </Thumb>
        <button data-back onClick={onClose} className="absolute left-[8px] top-[8px] w-[34px] h-[34px] rounded-full bg-black/40 text-white flex items-center justify-center" aria-label="닫기">
          <ChevronLeft size={22} className="-rotate-90" />
        </button>
      </div>
      <div className="flex-1 scroll pb-[30px]">
        <button onClick={() => setMore(!more)} className="text-left px-[12px] pt-[12px] w-full">
          <div className="text-[18px] font-bold leading-[24px]">{v.title}</div>
          <div className="text-[12px] text-black/55 mt-[4px]">
            {v.views} · {v.when} <span className="font-semibold text-black">{more ? "간략히" : "...더보기"}</span>
          </div>
        </button>
        {more && <div className="mx-[12px] mt-[10px] rounded-[12px] bg-black/5 p-[12px] text-[14px] leading-[20px] whitespace-pre-wrap">{v.desc || "설명이 없습니다."}</div>}
        <div className="flex items-center gap-[10px] mt-[14px] px-[12px]">
          <Avatar name={v.channel} size={36} />
          <span className="flex-1 text-[15px] font-semibold truncate">{v.channel}</span>
          <button onClick={() => setSubbed(!subbed)} className="h-[34px] px-[16px] rounded-full text-[14px] font-semibold" style={subbed ? { background: "rgba(0,0,0,0.06)" } : { background: "#0F0F0F", color: "#fff" }}>
            {subbed ? "구독중" : "구독"}
          </button>
        </div>
        <div className="flex gap-[8px] mt-[14px] px-[12px] overflow-x-auto no-scrollbar">
          <span className="h-[34px] rounded-full bg-black/5 text-[14px] font-medium flex items-center whitespace-nowrap overflow-hidden">
            <button onClick={() => setLiked(!liked)} className="flex items-center gap-[6px] px-[14px] h-full border-r border-black/10" aria-label="좋아요">
              <ThumbsUp size={17} fill={liked ? "#0F0F0F" : "none"} /> {liked ? "1천" : "999"}
            </button>
            <span className="px-[12px]">
              <ThumbsDown size={17} />
            </span>
          </span>
          {["공유", "리믹스", "오프라인 저장", "저장"].map((b) => (
            <span key={b} className="h-[34px] px-[14px] rounded-full bg-black/5 text-[14px] font-medium flex items-center whitespace-nowrap">
              {b}
            </span>
          ))}
        </div>
        <div className="mx-[12px] mt-[14px] rounded-[12px] bg-black/5 p-[12px] text-[14px]">
          <span className="font-semibold">댓글</span>
          <div className="text-black/55 mt-[4px]">댓글이 사용 중지되었습니다.</div>
        </div>
        <div className="mt-[16px]">
          {list
            .filter((x) => x.id !== v.id)
            .map((x) => (
              <YtCard key={x.id} v={x} onOpen={() => onPick(x)} />
            ))}
        </div>
      </div>
    </div>
  );
}
/** Shorts: 세로로 꽉 찬 영상, 위아래로 넘기기 */
function YtShorts({ list, onOpen }: { list: YtVideo[]; onOpen: (v: YtVideo) => void }) {
  const [i, setI] = useState(0);
  const start = useRef<number | null>(null);
  const v = list[i];
  if (!v) return <div className="absolute inset-0 bg-black text-white/50 flex items-center justify-center">Shorts 없음</div>;
  const go = (dir: number) => setI((x) => Math.max(0, Math.min(list.length - 1, x + dir)));
  return (
    <div
      className="absolute inset-0 bg-black text-white touch-none"
      onWheel={(e) => Math.abs(e.deltaY) > 30 && go(e.deltaY > 0 ? 1 : -1)}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dy = e.clientY - start.current;
        start.current = null;
        if (Math.abs(dy) > 40) go(dy < 0 ? 1 : -1);
      }}
    >
      <Thumb key={v.id} photo={v.photo} hue={v.hue} className="absolute inset-0 fade" text={ytText(v)} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35), transparent 20%, transparent 60%, rgba(0,0,0,0.7))" }} />
      <div className="absolute left-[14px] right-[70px]" style={{ bottom: "calc(var(--sab) + 70px)" }}>
        <div className="flex items-center gap-[8px] mb-[8px]">
          <Avatar name={v.channel} size={30} />
          <span className="text-[14px] font-semibold">@{v.channel.replace(/\s/g, "")}</span>
          <span className="h-[28px] px-[12px] rounded-full bg-white text-black text-[13px] font-semibold flex items-center">구독</span>
        </div>
        <button onClick={() => onOpen(v)} className="text-left text-[14px] leading-[19px] line-clamp-2">
          {v.title}
        </button>
      </div>
      <div className="absolute right-[10px] flex flex-col items-center gap-[18px] text-[12px]" style={{ bottom: "calc(var(--sab) + 80px)" }}>
        {[
          [<ThumbsUp key="l" size={26} fill="#fff" />, "좋아요"],
          [<ThumbsDown key="d" size={26} fill="#fff" />, "싫어요"],
          [<MessageCircle key="c" size={26} fill="#fff" />, "댓글"],
          [<Share key="s" size={24} />, "공유"],
        ].map(([ic, l]) => (
          <span key={l as string} className="flex flex-col items-center gap-[4px]">
            {ic}
            {l}
          </span>
        ))}
      </div>
      <div className="absolute top-0 left-0 right-0 flex justify-between px-[14px] text-[18px] font-bold" style={{ paddingTop: "calc(var(--sat) + 8px)" }}>
        <span>Shorts</span>
        <Search size={22} />
      </div>
      <div className="absolute right-[4px] top-1/2 -translate-y-1/2 flex flex-col gap-[4px]">
        {list.map((x, k) => (
          <span key={x.id} className="w-[3px] h-[14px] rounded-full" style={{ background: k === i ? "#fff" : "rgba(255,255,255,0.3)" }} />
        ))}
      </div>
    </div>
  );
}
export function YoutubeApp() {
  const d = useData();
  const [tab, setTab] = useState("home");
  useStatusBar(tab !== "shorts");
  const [chip, setChip] = useState("전체");
  const [play, setPlay] = useState<YtVideo | null>(null);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const yt = d.youtube;
  const all = [...yt.feed, ...yt.history.filter((h) => !yt.feed.some((f) => f.id === h.id))];
  const channels = [...new Set(all.map((v) => v.channel))];
  const found = q.trim() ? all.filter((v) => `${v.title} ${v.channel}`.toLowerCase().includes(q.trim().toLowerCase())) : [];
  return (
    <div className="absolute inset-0 bg-white">
      {tab !== "shorts" && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white" style={{ paddingTop: "var(--sat)" }}>
          <div className="h-[44px] flex items-center px-[12px] gap-[18px]">
            <span className="flex items-center gap-[2px] flex-1">
              <svg width="30" height="21" viewBox="0 0 30 21">
                <rect width="30" height="21" rx="6" fill="#FF0000" />
                <path d="M12 6v9l8-4.5z" fill="#fff" />
              </svg>
              <span className="text-[19px] font-bold tracking-[-1px] ml-[2px]" style={{ fontFamily: "Arial, sans-serif" }}>
                YouTube
              </span>
            </span>
            <Cast size={22} />
            <Bell size={22} />
            <button onClick={() => setSearch(true)} aria-label="검색">
              <Search size={22} />
            </button>
          </div>
          {tab === "home" && (
            <div className="flex gap-[8px] px-[12px] pb-[10px] overflow-x-auto no-scrollbar">
              {["전체", "음악", "게임", "운동", "자동차", "뉴스", "최근에 업로드된 동영상"].map((c) => (
                <button key={c} onClick={() => setChip(c)} className="h-[32px] px-[12px] rounded-[8px] text-[14px] font-medium whitespace-nowrap shrink-0" style={chip === c ? { background: "#0F0F0F", color: "#fff" } : { background: "rgba(0,0,0,0.05)" }}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "shorts" ? (
        <YtShorts list={all} onOpen={setPlay} />
      ) : (
        <div className="absolute inset-0 scroll" style={{ paddingTop: `calc(var(--sat) + ${tab === "home" ? 86 : 44}px)`, paddingBottom: 100 }}>
          {tab === "home" && (yt.feed.length ? yt.feed.map((v) => <YtCard key={v.id} v={v} onOpen={() => setPlay(v)} />) : <div className="text-center text-black/35 pt-[100px]">동영상 없음</div>)}
          {tab === "subs" && (
            <>
              <div className="flex gap-[14px] px-[12px] py-[10px] overflow-x-auto no-scrollbar border-b border-black/[0.06]">
                {channels.map((c) => (
                  <span key={c} className="flex flex-col items-center gap-[4px] w-[64px] shrink-0">
                    <Avatar name={c} size={56} />
                    <span className="text-[11px] text-black/70 truncate w-full text-center">{c}</span>
                  </span>
                ))}
              </div>
              <div className="pt-[10px]">{all.length ? all.map((v) => <YtCard key={v.id} v={v} onOpen={() => setPlay(v)} />) : <div className="text-center text-black/35 pt-[100px]">구독한 채널이 없습니다</div>}</div>
            </>
          )}
          {tab === "me" && (
            <div className="px-[12px]">
              <div className="flex items-center gap-[14px] py-[10px]">
                <span className="w-[64px] h-[64px] rounded-full bg-[#5C6BC0] text-white text-[28px] font-semibold flex items-center justify-center">T</span>
                <div>
                  <div className="text-[22px] font-bold">내 채널</div>
                  <div className="text-[13px] text-black/55">채널 보기 ›</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-[14px] mb-[10px]">
                <span className="text-[20px] font-bold">기록</span>
                <span className="text-[14px] font-medium border border-black/15 rounded-full px-[12px] h-[30px] flex items-center">모두 보기</span>
              </div>
              <div className="flex gap-[10px] overflow-x-auto no-scrollbar -mx-[12px] px-[12px]">
                {yt.history.map((v) => (
                  <button key={v.id} onClick={() => setPlay(v)} className="w-[160px] shrink-0 text-left">
                    <Thumb photo={v.photo} hue={v.hue} className="w-full aspect-video rounded-[10px]" text={ytText(v)}>
                      <span className="absolute right-[6px] bottom-[6px] text-[11px] font-semibold text-white bg-black/80 rounded-[4px] px-[4px]">{v.duration}</span>
                      {v.progress > 0 && <span className="absolute left-0 bottom-0 h-[3px] bg-[#FF0000]" style={{ width: `${v.progress * 100}%` }} />}
                    </Thumb>
                    <div className="text-[13px] font-medium leading-[17px] line-clamp-2 mt-[6px]">{v.title}</div>
                    <div className="text-[12px] text-black/55 truncate">{v.channel}</div>
                  </button>
                ))}
              </div>
              {[
                [<Play key="1" size={22} />, "내 동영상"],
                [<Download key="2" size={22} />, "오프라인 저장 동영상"],
                [<Clock key="3" size={22} />, "나중에 볼 동영상"],
              ].map(([ic, l]) => (
                <div key={l as string} className="flex items-center gap-[18px] py-[12px] text-[16px]">
                  {ic}
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <TabBar
        active={tab}
        onChange={(t) => t !== "add" && setTab(t)}
        tint={tab === "shorts" ? "#fff" : "#0F0F0F"}
        inactive={tab === "shorts" ? "#fff" : "#0F0F0F"}
        bg={tab === "shorts" ? "#0F0F0F" : "#fff"}
        dark={tab === "shorts"}
        items={[
          { id: "home", label: "홈", icon: <House size={24} fill={tab === "home" ? "#0F0F0F" : "none"} strokeWidth={1.7} /> },
          { id: "shorts", label: "Shorts", icon: <Clapperboard size={23} strokeWidth={1.7} /> },
          { id: "add", label: "", icon: <CirclePlus size={34} strokeWidth={1.1} /> },
          { id: "subs", label: "구독", icon: <Youtube size={24} strokeWidth={1.7} /> },
          { id: "me", label: "나", icon: <User size={24} strokeWidth={1.7} fill={tab === "me" ? "#0F0F0F" : "none"} /> },
        ]}
      />
      {search && (
        <Push>
          <div style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[48px] flex items-center gap-[8px] px-[6px]">
              <button data-back onClick={() => (setSearch(false), setQ(""))} aria-label="뒤로" className="w-[36px] h-[36px] flex items-center justify-center">
                <ChevronLeft size={26} />
              </button>
              <label className="flex-1 h-[38px] rounded-full bg-black/5 flex items-center px-[14px]">
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="YouTube 검색" className="flex-1 bg-transparent outline-none text-[16px]" />
                {q && (
                  <button onClick={() => setQ("")} aria-label="지우기">
                    <XIcon size={18} />
                  </button>
                )}
              </label>
            </div>
          </div>
          <div className="flex-1 scroll pb-[30px]">
            {!q.trim() &&
              yt.searches.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="w-full flex items-center gap-[16px] px-[16px] py-[11px] text-[16px] text-left">
                  <Clock size={20} className="text-black/55" />
                  <span className="flex-1">{s}</span>
                  <ArrowUpRight size={18} className="text-black/40 -scale-x-100" />
                </button>
              ))}
            {q.trim() && (found.length ? found.map((v) => <YtRow key={v.id} v={v} onOpen={() => setPlay(v)} />) : <div className="text-center text-black/40 pt-[80px]">검색결과가 없습니다</div>)}
          </div>
        </Push>
      )}
      {play && <YtWatch v={play} list={all} onPick={setPlay} onClose={() => setPlay(null)} />}
    </div>
  );
}

/* ═════════════ 넷플릭스 ═════════════ */
function NfPoster({ t, w = 108, onOpen }: { t: NfTitle; w?: number; onOpen?: () => void }) {
  return (
    <button onClick={onOpen} className="shrink-0 text-left" style={{ width: w }}>
      <Thumb photo={t.photo} hue={t.hue} className="rounded-[4px]" style={{ width: w, height: w * 1.45 }}>
        <span className="absolute left-[6px] top-[4px] text-[#E50914] font-black text-[18px]" style={{ fontFamily: "Arial Black, sans-serif" }}>
          N
        </span>
        <span className="absolute left-[6px] right-[6px] bottom-[8px] text-white text-[13px] font-bold leading-[16px]" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {t.title}
        </span>
      </Thumb>
      {t.progress > 0 && (
        <div className="h-[3px] bg-white/25 mt-[3px] rounded-full overflow-hidden">
          <div className="h-full bg-[#E50914]" style={{ width: `${t.progress * 100}%` }} />
        </div>
      )}
    </button>
  );
}
function NfDetail({ t, onClose }: { t: NfTitle; onClose: () => void }) {
  const eps = Math.max(1, Math.min(24, t.eps || 1));
  const curEp = Number((t.ep.match(/(\d+)화/) || [])[1] || 0);
  const [saved, setSaved] = useState(false);
  return (
    <Push bg="#000">
      <div className="flex-1 scroll text-white pb-[40px]">
        <div className="relative" style={{ paddingTop: "var(--sat)" }}>
          <Thumb photo={t.photo} hue={t.hue} className="w-full aspect-video">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-[54px] h-[54px] rounded-full border-2 border-white bg-black/40 flex items-center justify-center">
                <Play size={26} fill="#fff" color="#fff" />
              </span>
            </span>
            <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-white/25">
              <span className="block h-full bg-[#E50914]" style={{ width: `${t.progress * 100}%` }} />
            </span>
          </Thumb>
          <button data-back onClick={onClose} className="absolute right-[12px] w-[32px] h-[32px] rounded-full bg-black/60 flex items-center justify-center" style={{ top: "calc(var(--sat) + 10px)" }} aria-label="닫기">
            <XIcon size={18} />
          </button>
        </div>
        <div className="px-[14px] pt-[12px]">
          <div className="flex items-center gap-[6px] text-[13px]">
            <span className="text-[#E50914] font-black text-[16px]" style={{ fontFamily: "Arial Black, sans-serif" }}>
              N
            </span>
            <span className="tracking-[2px] text-white/70 text-[11px]">시리즈</span>
          </div>
          <div className="text-[24px] font-bold mt-[4px]">{t.title}</div>
          <div className="flex items-center gap-[8px] text-[13px] text-white/60 mt-[4px]">
            <span className="text-[#46D369] font-semibold">98% 일치</span>
            <span>{t.year || "2025"}</span>
            <span className="border border-white/40 rounded-[3px] px-[4px] text-[11px]">15+</span>
            <span>에피소드 {eps}개</span>
            <span className="border border-white/40 rounded-[3px] px-[4px] text-[10px]">HD</span>
          </div>
          <span className="mt-[12px] h-[40px] rounded-[4px] bg-white text-black text-[16px] font-bold flex items-center justify-center gap-[6px]">
            <Play size={20} fill="#000" /> {t.progress > 0 ? "이어서 시청하기" : "재생"}
          </span>
          <span className="mt-[8px] h-[40px] rounded-[4px] bg-white/15 text-[16px] font-bold flex items-center justify-center gap-[6px]">
            <Download size={19} /> 저장
          </span>
          {t.ep && t.progress > 0 && <div className="text-[13px] text-white/60 mt-[10px]">{t.ep} · {Math.round(t.progress * 100)}% 시청함</div>}
          <div className="text-[14px] leading-[20px] mt-[10px]">{t.desc || "작품 소개가 없습니다."}</div>
          <div className="flex gap-[36px] mt-[16px] text-[11px] text-white/70">
            <button onClick={() => setSaved(!saved)} className="flex flex-col items-center gap-[4px]">
              {saved ? <span className="text-[22px] leading-[22px]">✓</span> : <Plus size={22} />}내가 찜한 리스트
            </button>
            <span className="flex flex-col items-center gap-[4px]">
              <ThumbsUp size={22} />
              평가
            </span>
            <span className="flex flex-col items-center gap-[4px]">
              <Share size={22} />
              공유
            </span>
          </div>
          <div className="border-t-4 border-[#E50914] w-[70px] mt-[20px]" />
          <div className="text-[15px] font-bold mt-[8px] mb-[10px]">회차</div>
          {Array.from({ length: eps }).map((_, i) => (
            <div key={i} className="flex gap-[10px] mb-[14px]">
              <Thumb photo={t.photo} hue={(t.hue + i * 9) % 360} className="w-[124px] aspect-video rounded-[4px] shrink-0">
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-[30px] h-[30px] rounded-full border border-white bg-black/40 flex items-center justify-center">
                    <Play size={14} fill="#fff" color="#fff" />
                  </span>
                </span>
                {i + 1 < curEp && <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-[#E50914]" />}
                {i + 1 === curEp && <span className="absolute left-0 bottom-0 h-[3px] bg-[#E50914]" style={{ width: `${t.progress * 100}%` }} />}
              </Thumb>
              <div className="flex-1 min-w-0 self-center">
                <div className="text-[14px] font-semibold">
                  {i + 1}. {i + 1}화
                </div>
                <div className="text-[12px] text-white/50">{48 + ((i * 7) % 15)}분</div>
              </div>
              <Download size={20} className="self-center text-white/70" />
            </div>
          ))}
        </div>
      </div>
    </Push>
  );
}
export function NetflixApp() {
  useStatusBar(false);
  const d = useData();
  const n = d.netflix;
  const [tab, setTab] = useState("home");
  const [open, setOpen] = useState<NfTitle | null>(null);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const all = [...n.watching, ...n.myList];
  const hero = n.watching[0] ?? n.myList[0];
  const who = n.profile ? `${n.profile}님` : "회원님";
  return (
    <div className="absolute inset-0 bg-black text-white">
      <div className="absolute inset-0 scroll" style={{ paddingBottom: 100 }}>
        {tab === "home" ? (
          <>
            <div className="relative" style={{ paddingTop: "var(--sat)" }}>
              {hero && <Thumb photo={hero.photo} hue={hero.hue} className="absolute inset-0" style={{ opacity: 0.55 }} />}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 30%, transparent 55%, #000)" }} />
              <div className="relative">
                <div className="h-[44px] flex items-center px-[16px] gap-[18px]">
                  <span className="flex-1 text-[22px] font-bold">{who}을 위한 콘텐츠</span>
                  <Download size={22} />
                  <button onClick={() => setSearch(true)} aria-label="검색">
                    <Search size={22} />
                  </button>
                </div>
                <div className="flex gap-[8px] px-[16px] mt-[4px]">
                  {["시리즈", "영화", "카테고리 ⌄"].map((c) => (
                    <span key={c} className="h-[32px] px-[14px] rounded-full border border-white/50 text-[14px] flex items-center">
                      {c}
                    </span>
                  ))}
                </div>
                {hero && (
                  <div className="mx-[24px] mt-[18px] mb-[22px] rounded-[10px] overflow-hidden border border-white/15" style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                    <Thumb photo={hero.photo} hue={hero.hue} className="w-full" style={{ aspectRatio: "3/4" }}>
                      <button onClick={() => setOpen(hero)} className="absolute inset-0" aria-label="자세히" />
                      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85))" }} />
                      <div className="absolute left-0 right-0 bottom-[16px] px-[16px] text-center">
                        {/* 실제 넷플릭스처럼: 위에 N 시리즈 표시 · 아래에 짧은 소개 줄 */}
                        <div className="flex items-center justify-center gap-[4px] mb-[6px]">
                          <span className="text-[#E50914] font-black text-[20px] leading-none" style={{ fontFamily: "Arial Black, sans-serif" }}>N</span>
                          <span className="text-[11px] font-bold tracking-[0.3em] text-white/85">{hero.eps && hero.eps > 1 ? "시리즈" : "영화"}</span>
                        </div>
                        <div className="text-[32px] font-black leading-[36px]">{hero.title}</div>
                        {hero.desc && <div className="text-[12px] text-white/80 mt-[8px] line-clamp-1">{hero.desc}</div>}
                        <div className="flex gap-[10px] mt-[14px]">
                          <button onClick={() => setOpen(hero)} className="flex-1 h-[40px] rounded-[4px] bg-white text-black text-[16px] font-bold flex items-center justify-center gap-[6px]">
                            <Play size={20} fill="#000" /> 재생
                          </button>
                          <span className="flex-1 h-[40px] rounded-[4px] bg-white/25 text-white text-[16px] font-bold flex items-center justify-center gap-[6px]">
                            <Plus size={20} /> 내가 찜한 리스트
                          </span>
                        </div>
                      </div>
                    </Thumb>
                  </div>
                )}
              </div>
            </div>
            {n.watching.length > 0 && (
              <>
                <div className="px-[16px] text-[19px] font-bold mb-[8px]">{who}이 시청 중인 콘텐츠</div>
                <div className="flex gap-[8px] px-[16px] overflow-x-auto no-scrollbar mb-[22px]">
                  {n.watching.map((t) => (
                    <div key={t.id}>
                      <NfPoster t={t} onOpen={() => setOpen(t)} />
                      <div className="text-[11px] text-white/55 mt-[3px] w-[108px] truncate">{t.ep}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {n.myList.length > 0 && (
              <>
                <div className="px-[16px] text-[19px] font-bold mb-[8px]">내가 찜한 리스트</div>
                <div className="flex gap-[8px] px-[16px] overflow-x-auto no-scrollbar">
                  {n.myList.map((t) => (
                    <NfPoster key={t.id} t={t} onOpen={() => setOpen(t)} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : tab === "new" ? (
          <div className="px-[16px]" style={{ paddingTop: "calc(var(--sat) + 10px)" }}>
            <div className="text-[24px] font-bold mb-[14px]">NEW & HOT</div>
            {all.length === 0 && <div className="text-white/45 text-center pt-[100px]">공개 예정 콘텐츠 없음</div>}
            {all.map((t, i) => (
              <button key={t.id} onClick={() => setOpen(t)} className="w-full text-left mb-[24px]">
                <div className="text-[13px] text-white/60 mb-[6px]">{10 + i}월 {25 + i}일 공개</div>
                <Thumb photo={t.photo} hue={t.hue} className="w-full aspect-video rounded-[6px]" text={t.title} />
                <div className="flex items-center justify-between mt-[10px]">
                  <span className="text-[18px] font-bold">{t.title}</span>
                  <span className="flex flex-col items-center text-[11px] text-white/70">
                    <Bell size={20} />
                    알림 받기
                  </span>
                </div>
                <div className="text-[13px] text-white/60 mt-[4px] line-clamp-2">{t.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-[16px]" style={{ paddingTop: "calc(var(--sat) + 10px)" }}>
            <div className="text-[24px] font-bold mb-[14px]">나의 넷플릭스</div>
            <div className="flex flex-col items-center py-[10px]">
              <span className="w-[72px] h-[72px] rounded-[6px] bg-[#0071EB] text-[30px] font-bold flex items-center justify-center">{n.profile || "?"}</span>
              <div className="text-[18px] font-bold mt-[8px]">{n.profile || "프로필"}</div>
            </div>
            <div className="text-[17px] font-bold mt-[16px] mb-[8px]">시청 중인 콘텐츠</div>
            <div className="flex gap-[8px] overflow-x-auto no-scrollbar">
              {n.watching.map((t) => (
                <NfPoster key={t.id} t={t} onOpen={() => setOpen(t)} />
              ))}
            </div>
            <div className="text-[17px] font-bold mt-[20px] mb-[8px]">내가 찜한 리스트</div>
            <div className="flex gap-[8px] overflow-x-auto no-scrollbar">
              {n.myList.map((t) => (
                <NfPoster key={t.id} t={t} onOpen={() => setOpen(t)} />
              ))}
            </div>
          </div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#fff"
        inactive="#808080"
        dark
        bg="rgba(18,18,18,0.96)"
        items={[
          { id: "home", label: "홈", icon: <House size={23} fill={tab === "home" ? "#fff" : "none"} strokeWidth={1.7} /> },
          { id: "new", label: "NEW & HOT", icon: <Clapperboard size={23} strokeWidth={1.7} /> },
          { id: "my", label: "나의 넷플릭스", icon: <span className="w-[22px] h-[22px] rounded-[4px] bg-[#0071EB] text-[12px] font-bold text-white flex items-center justify-center">{n.profile.slice(0, 1) || "?"}</span> },
        ]}
      />
      {search && (
        <Push bg="#000">
          <div style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center gap-[8px] px-[8px]">
              <button data-back onClick={() => (setSearch(false), setQ(""))} aria-label="뒤로">
                <ChevronLeft size={28} color="#fff" />
              </button>
              <label className="flex-1 h-[38px] rounded-[4px] bg-[#333] flex items-center gap-[8px] px-[10px] text-white/60">
                <Search size={18} className="shrink-0" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="게임, 시리즈, 영화를 검색하세요..." className="flex-1 min-w-0 bg-transparent outline-none text-white text-[15px] placeholder:text-white/45" />
              </label>
            </div>
          </div>
          <div className="flex-1 scroll text-white px-[12px] pb-[30px]">
            <div className="text-[18px] font-bold my-[10px]">{q.trim() ? "검색 결과" : "추천 시리즈 & 영화"}</div>
            {all
              .filter((t) => !q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()))
              .map((t) => (
                <button key={t.id} onClick={() => setOpen(t)} className="w-full flex items-center gap-[10px] mb-[6px] text-left bg-[#181818]">
                  <Thumb photo={t.photo} hue={t.hue} className="w-[140px] aspect-video shrink-0" text={t.title} />
                  <span className="flex-1 text-[15px] font-semibold">{t.title}</span>
                  <span className="w-[32px] h-[32px] rounded-full border border-white flex items-center justify-center mr-[10px]">
                    <Play size={14} fill="#fff" />
                  </span>
                </button>
              ))}
          </div>
        </Push>
      )}
      {open && <NfDetail t={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* ═════════════ X (트위터) — 아이디는 랜덤 ═════════════ */
const fmtN = (v: number) => (v >= 10000 ? `${(v / 10000).toFixed(1).replace(/\.0$/, "")}만` : v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}천` : String(v || ""));
const XLogo = ({ size = 24, color = "#0F1419" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43z" fill={color} />
  </svg>
);
function XActions({ p, big }: { p: XPost; big?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [rt, setRt] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className={`flex justify-between text-[#536471] ${big ? "text-[14px] py-[10px] border-y border-black/[0.08] mt-[12px] px-[4px]" : "text-[13px] mt-[10px] pr-[6px]"}`}>
      <span className="flex items-center gap-[5px]">
        <MessageCircle size={big ? 20 : 17} /> {fmtN(p.replies)}
      </span>
      <button onClick={(e) => (e.stopPropagation(), setRt(!rt))} className="flex items-center gap-[5px]" style={{ color: rt ? "#00BA7C" : undefined }}>
        <Repeat2 size={big ? 21 : 18} /> {fmtN(p.reposts + (rt ? 1 : 0))}
      </button>
      <button onClick={(e) => (e.stopPropagation(), setLiked(!liked))} className="flex items-center gap-[5px]" style={{ color: liked ? "#F91880" : undefined }}>
        <Heart size={big ? 20 : 17} fill={liked ? "#F91880" : "none"} /> {fmtN(p.likes + (liked ? 1 : 0))}
      </button>
      <span className="flex items-center gap-[5px]">
        <BarChart2 size={big ? 20 : 17} /> {fmtN(p.likes * 37 + 120)}
      </span>
      <span className="flex items-center gap-[12px]">
        <button onClick={(e) => (e.stopPropagation(), setSaved(!saved))} style={{ color: saved ? "#1D9BF0" : undefined }} aria-label="북마크">
          <Bookmark size={big ? 20 : 17} fill={saved ? "#1D9BF0" : "none"} />
        </button>
        <Share size={big ? 20 : 17} />
      </span>
    </div>
  );
}
function XRow({ p, onOpen }: { p: XPost; onOpen: () => void }) {
  const d = useData();
  const src = photoSrc(p.photo, d.photos);
  return (
    <div onClick={onOpen} className="flex gap-[10px] px-[14px] py-[12px] hair-b cursor-pointer active:bg-black/[0.02]">
      <Avatar name={p.name || p.handle} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-[4px] text-[15px]">
          <span className="font-bold truncate max-w-[45%]">{p.name}</span>
          <span className="text-[#536471] truncate">
            {p.handle} · {p.when}
          </span>
          <span className="flex-1" />
          <MoreHorizontal size={16} className="text-[#536471] shrink-0" />
        </div>
        <div className="text-[15px] leading-[20px] whitespace-pre-wrap mt-[1px]" style={{ overflowWrap: "anywhere" }}>
          {p.text}
        </div>
        {src && <Img src={src} className="w-full rounded-[16px] mt-[10px] border border-black/10" style={{ aspectRatio: "16/10" }} />}
        <XActions p={p} />
      </div>
    </div>
  );
}
export function XApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState<"for" | "following">("for");
  const [nav, setNav] = useState("home");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState("");
  const [profile, setProfile] = useState(false);
  const [q, setQ] = useState("");
  const meHandle = "@" + (d.x.handle || "user").replace(/^@/, "");
  const cur = d.x.feed.find((p) => p.id === openId);
  const mine = d.x.feed.filter((p) => p.handle === meHandle);
  const post = () => {
    if (!draft.trim()) return;
    update((x) => void x.x.feed.unshift({ id: uid(), name: x.x.name || "ㅇ", handle: meHandle, text: draft.trim(), when: "방금", replies: 0, reposts: 0, likes: 0, photo: "" }));
    setDraft("");
    setCompose(false);
  };
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute top-0 left-0 right-0 z-10 blur-bar" style={{ paddingTop: "var(--sat)", background: "rgba(255,255,255,0.88)" }}>
        <div className="h-[44px] flex items-center justify-between px-[14px]">
          <button onClick={() => setProfile(true)} aria-label="내 프로필">
            <Avatar name={d.x.name || d.x.handle || "?"} size={32} />
          </button>
          <XLogo />
          <span className="w-[32px]" />
        </div>
        {nav === "home" && (
          <div className="flex hair-b">
            {(
              [
                ["for", "추천"],
                ["following", "팔로우 중"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className="flex-1 h-[46px] flex flex-col items-center justify-center text-[15px]" style={{ fontWeight: tab === k ? 700 : 500, color: tab === k ? "#0F1419" : "#536471" }}>
                <span className="relative">
                  {l}
                  {tab === k && <span className="absolute left-0 right-0 -bottom-[12px] h-[4px] rounded-full bg-[#1D9BF0]" />}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 scroll" style={{ paddingTop: `calc(var(--sat) + ${nav === "home" ? 91 : 44}px)`, paddingBottom: 100 }}>
        {nav === "home" ? (
          tab === "for" ? (
            d.x.feed.length ? d.x.feed.map((p) => <XRow key={p.id} p={p} onOpen={() => setOpenId(p.id)} />) : <div className="text-center text-[#536471] pt-[100px]">게시물 없음</div>
          ) : (
            <div className="px-[30px] pt-[60px]">
              <div className="text-[28px] font-extrabold leading-[32px]">팔로우하는 계정이 없습니다</div>
              <div className="text-[15px] text-[#536471] mt-[8px]">계정을 팔로우하면 여기에 게시물이 표시됩니다.</div>
            </div>
          )
        ) : nav === "search" ? (
          <div>
            <div className="px-[14px]">
              <label className="h-[38px] rounded-full bg-[#EFF3F4] flex items-center gap-[8px] px-[14px] text-[#536471] text-[15px]">
                <Search size={17} className="shrink-0" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="flex-1 min-w-0 bg-transparent outline-none text-[#0F1419]" />
              </label>
            </div>
            {q.trim() ? (
              d.x.feed.filter((p) => `${p.text} ${p.name} ${p.handle}`.toLowerCase().includes(q.trim().toLowerCase())).map((p) => <XRow key={p.id} p={p} onOpen={() => setOpenId(p.id)} />)
            ) : (
              <div className="px-[14px]">
                <div className="text-[20px] font-extrabold mt-[18px]">나를 위한 트렌드</div>
                {["#오늘의날씨", "#새벽운동", "중고차"].map((t, i) => (
                  <button key={t} onClick={() => setQ(t.replace("#", ""))} className="block w-full text-left py-[10px]">
                    <div className="text-[13px] text-[#536471]">대한민국 트렌드 · {i + 1}</div>
                    <div className="text-[15px] font-bold">{t}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-[#536471] pt-[120px] text-[15px] px-[30px]">
            <div className="text-[28px] font-extrabold text-[#0F1419] leading-[32px] mb-[8px]">{nav === "noti" ? "알림 없음" : nav === "dm" ? "받은 쪽지함에 오신 것을 환영합니다!" : "커뮤니티 둘러보기"}</div>
            {nav === "noti" ? "좋아요, 재게시, 답글 등 모든 활동을 여기서 확인할 수 있습니다." : nav === "dm" ? "X에서 다른 사람들과 비공개 대화를 나누세요." : "관심 있는 커뮤니티를 찾아보세요."}
          </div>
        )}
      </div>
      {nav === "home" && (
        <button onClick={() => setCompose(true)} aria-label="게시하기" className="absolute right-[16px] z-20 w-[56px] h-[56px] rounded-full bg-[#1D9BF0] text-white flex items-center justify-center" style={{ bottom: "calc(var(--sab) + 66px)", boxShadow: "0 4px 12px rgba(29,155,240,0.4)" }}>
          <Plus size={28} strokeWidth={2.4} />
        </button>
      )}
      <TabBar
        active={nav}
        onChange={setNav}
        tint="#0F1419"
        inactive="#0F1419"
        bg="rgba(255,255,255,0.95)"
        items={[
          { id: "home", label: "", icon: <House size={26} fill={nav === "home" ? "#0F1419" : "none"} strokeWidth={1.8} /> },
          { id: "search", label: "", icon: <Search size={25} strokeWidth={nav === "search" ? 2.8 : 1.8} /> },
          { id: "comm", label: "", icon: <Users size={25} strokeWidth={1.8} /> },
          { id: "noti", label: "", icon: <Bell size={25} fill={nav === "noti" ? "#0F1419" : "none"} strokeWidth={1.8} /> },
          { id: "dm", label: "", icon: <MailIcon size={25} strokeWidth={nav === "dm" ? 2.6 : 1.8} /> },
        ]}
      />
      {cur && (
        <Push>
          <Bar onBack={() => setOpenId(null)} title="게시물" tint="#0F1419" />
          <div className="flex-1 scroll px-[14px] pt-[12px] pb-[80px]">
            <div className="flex items-center gap-[10px]">
              <Avatar name={cur.name || cur.handle} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate">{cur.name}</div>
                <div className="text-[14px] text-[#536471] truncate">{cur.handle}</div>
              </div>
              {cur.handle !== meHandle && <span className="h-[32px] px-[16px] rounded-full bg-[#0F1419] text-white text-[14px] font-bold flex items-center">팔로우</span>}
            </div>
            <div className="text-[17px] leading-[24px] whitespace-pre-wrap mt-[12px]" style={{ overflowWrap: "anywhere" }}>
              {cur.text}
            </div>
            {photoSrc(cur.photo, d.photos) && <Img src={photoSrc(cur.photo, d.photos)} className="w-full rounded-[16px] mt-[12px] border border-black/10" style={{ aspectRatio: "16/10" }} />}
            <div className="text-[14px] text-[#536471] mt-[12px]">
              {cur.when} · 조회수 <b className="text-[#0F1419]">{fmtN(cur.likes * 37 + 120)}</b>회
            </div>
            <XActions p={cur} big />
            {cur.replies === 0 && <div className="text-center text-[#536471] text-[15px] pt-[40px]">아직 답글이 없습니다</div>}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-black/[0.08] px-[14px] pt-[8px] flex items-center gap-[10px]" style={{ paddingBottom: "calc(var(--sab) + 6px)" }}>
            <Avatar name={d.x.name || "?"} size={30} />
            <span className="flex-1 h-[36px] rounded-full bg-[#EFF3F4] text-[#536471] text-[15px] flex items-center px-[14px]">답글 게시하기</span>
          </div>
        </Push>
      )}
      {profile && (
        <Push>
          <div className="flex-1 scroll pb-[40px]">
            <div className="relative h-[120px] bg-[#CFD9DE]" style={{ paddingTop: "var(--sat)" }}>
              <button data-back onClick={() => setProfile(false)} className="absolute left-[10px] w-[32px] h-[32px] rounded-full bg-black/50 text-white flex items-center justify-center" style={{ top: "calc(var(--sat) + 6px)" }} aria-label="뒤로">
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className="px-[14px] -mt-[36px] flex items-end justify-between">
              <span className="rounded-full border-4 border-white">
                <Avatar name={d.x.name || "?"} size={72} />
              </span>
              <span className="h-[34px] px-[16px] rounded-full border border-black/20 text-[14px] font-bold flex items-center">프로필 수정</span>
            </div>
            <div className="px-[14px] mt-[10px]">
              <div className="text-[20px] font-extrabold">{d.x.name || "이름 없음"}</div>
              <div className="text-[15px] text-[#536471]">{meHandle}</div>
              <div className="text-[15px] text-[#536471] mt-[10px] flex items-center gap-[4px]">
                <CalendarDays size={16} /> 가입일: 2024년 3월
              </div>
              <div className="text-[14px] mt-[8px]">
                <b>12</b> <span className="text-[#536471]">팔로우 중</span> <b className="ml-[12px]">3</b> <span className="text-[#536471]">팔로워</span>
              </div>
            </div>
            <div className="flex border-b border-black/[0.08] mt-[14px] text-[15px]">
              {["게시물", "답글", "미디어", "마음에 들어요"].map((t, i) => (
                <span key={t} className="flex-1 h-[46px] flex items-center justify-center" style={{ fontWeight: i === 0 ? 700 : 500, color: i === 0 ? "#0F1419" : "#536471" }}>
                  <span className="relative">
                    {t}
                    {i === 0 && <span className="absolute left-0 right-0 -bottom-[12px] h-[4px] rounded-full bg-[#1D9BF0]" />}
                  </span>
                </span>
              ))}
            </div>
            {mine.length ? mine.map((p) => <XRow key={p.id} p={p} onOpen={() => (setProfile(false), setOpenId(p.id))} />) : <div className="text-center text-[#536471] pt-[50px] text-[15px]">아직 게시물이 없습니다</div>}
          </div>
        </Push>
      )}
      {compose && (
        <Sheet onClose={() => setCompose(false)}>
          <div className="flex items-center justify-between px-[14px] h-[52px]">
            <button onClick={() => setCompose(false)} className="text-[16px]">
              취소
            </button>
            <button onClick={post} disabled={!draft.trim() || !d.allowSend} className="h-[34px] px-[16px] rounded-full bg-[#1D9BF0] text-white text-[15px] font-bold disabled:opacity-50">
              게시하기
            </button>
          </div>
          <div className="flex gap-[10px] px-[14px] flex-1">
            <Avatar name={d.x.name || "?"} size={40} />
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 280))} placeholder="무슨 일이 일어나고 있나요?" className="flex-1 text-[18px] outline-none resize-none pt-[8px]" />
          </div>
          <div className="flex items-center gap-[18px] px-[14px] py-[10px] border-t border-black/[0.08] text-[#1D9BF0]" style={{ paddingBottom: "calc(var(--sab) + 6px)" }}>
            <ImageIcon size={22} />
            <span className="flex-1" />
            <span className="text-[13px] text-[#536471]">{280 - draft.length}</span>
          </div>
        </Sheet>
      )}
    </div>
  );
}

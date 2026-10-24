/* Instagram (2025 하단 탭: 홈 · 릴스 · DM · 검색 · 프로필) */
import { useEffect, useState } from "react";
import { Home as HomeI, Clapperboard, Send, Search, Heart, MessageCircle, Bookmark, MoreHorizontal, Plus, ChevronDown, ChevronLeft, Lock, Camera, SquarePen, Phone, Video, Music2, Grid3x3, UserSquare2, Menu } from "lucide-react";
import { useData, won, type Post, type Thread } from "../store";
import { photoSrc } from "../photos";
import { usePhoneCtx, Img } from "../ui";
import { markRead, useAutoBottom, useComposer } from "./Messages";

const RING = "conic-gradient(from 200deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5, #FEDA75)";
const logo = { fontFamily: "'Grand Hotel', 'Snell Roundhand', cursive", fontSize: 31, lineHeight: "34px" };
/** 프로필 사진: ig.users[].avatar 에 사진 id를 넣으면 그 사진, 없으면 인스타 기본 프로필 */
function useAvatar(handle: string) {
  const d = useData();
  const u = d.ig.users.find((x) => x.handle === handle);
  return u?.avatar ? photoSrc(u.avatar, d.photos) : "";
}

function IgAvatar({ handle, size = 32, ring = false, me = false }: { handle: string; size?: number; ring?: boolean; me?: boolean }) {
  const src = useAvatar(handle);
  const inner = me || !src ? (
    <div className="rounded-full bg-[#DBDBDB] flex items-end justify-center overflow-hidden" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="16" r="7" fill="#fff" />
        <path d="M6 38c1.5-8 7-12 14-12s12.5 4 14 12z" fill="#fff" />
      </svg>
    </div>
  ) : (
    <img src={src} className="rounded-full object-cover" style={{ width: size, height: size }} alt="" />
  );
  if (!ring) return inner;
  return (
    <div className="rounded-full p-[2.5px]" style={{ background: RING }}>
      <div className="rounded-full p-[2.5px] bg-white">{inner}</div>
    </div>
  );
}

function PostView({ p }: { p: Post }) {
  const d = useData();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article className="pb-[14px]">
      <div className="flex items-center gap-[10px] px-[12px] h-[52px]">
        <IgAvatar handle={p.user} size={32} ring />
        <span className="text-[14px] font-semibold flex-1">{p.user}</span>
        <MoreHorizontal size={20} />
      </div>
      <Img src={photoSrc(p.photo, d.photos)} className="w-full aspect-[4/5]" onClick={() => setLiked(true)} />
      <div className="flex items-center gap-[16px] px-[12px] pt-[10px]">
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-[5px] text-[14px] font-semibold">
          <Heart size={25} strokeWidth={1.8} fill={liked ? "#FF3040" : "none"} color={liked ? "#FF3040" : "currentColor"} />
          {won(p.likes + (liked ? 1 : 0))}
        </button>
        <span className="flex items-center gap-[5px] text-[14px] font-semibold">
          <MessageCircle size={24} strokeWidth={1.8} style={{ transform: "scaleX(-1)" }} />
          {p.comments}
        </span>
        <Send size={23} strokeWidth={1.8} />
        <button className="ml-auto" onClick={() => setSaved(!saved)}>
          <Bookmark size={24} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="px-[12px] pt-[8px] text-[14px] leading-[19px]">
        <span className="font-semibold mr-[5px]">{p.user}</span>
        {p.caption}
      </div>
      <div className="px-[12px] pt-[4px] text-[12px] text-black/45">{p.when}</div>
    </article>
  );
}

function Feed() {
  const d = useData();
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <Plus size={27} strokeWidth={1.7} />
        <div className="flex items-center gap-[2px]">
          <span style={logo}>Instagram</span>
          <ChevronDown size={16} className="mt-[4px]" />
        </div>
        <Heart size={25} strokeWidth={1.8} />
      </div>
      <div className="flex gap-[14px] px-[12px] py-[8px] overflow-x-auto no-scrollbar">
        <div className="flex flex-col items-center gap-[5px] shrink-0 w-[70px]">
          <div className="relative">
            <IgAvatar handle={d.ig.me.handle} size={66} me />
            <span className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full bg-[#0095F6] border-[2.5px] border-white flex items-center justify-center">
              <Plus size={13} color="#fff" strokeWidth={3.5} />
            </span>
          </div>
          <span className="text-[12px] text-black/60">내 스토리</span>
        </div>
        {d.ig.stories.map((h) => (
          <div key={h} className="flex flex-col items-center gap-[5px] shrink-0 w-[74px]">
            <IgAvatar handle={h} size={64} ring />
            <span className="text-[12px] truncate w-full text-center">{h}</span>
          </div>
        ))}
      </div>
      <div className="h-[0.5px] bg-black/10" />
      {d.ig.feed
        .filter((p) => photoSrc(p.photo, d.photos))
        .map((p) => (
          <PostView key={p.id} p={p} />
        ))}
      <div className="px-[14px] pt-[18px]">
        <div className="text-[15px] font-semibold">회원님을 위한 추천</div>
        {d.ig.users.map((u) => (
          <div key={u.handle} className="flex items-center gap-[12px] py-[9px]">
            <IgAvatar handle={u.handle} size={44} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate">{u.handle}</div>
              <div className="text-[13px] text-black/50 truncate">{u.name} · {u.bio}</div>
            </div>
            <span className="h-[32px] px-[16px] rounded-[8px] bg-[#0095F6] text-white text-[14px] font-semibold flex items-center">팔로우</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Reels() {
  const d = useData();
  const p = d.ig.feed[1] ?? d.ig.feed[0];
  const { setStatusDark } = usePhoneCtx();
  useEffect(() => {
    setStatusDark(false);
    return () => setStatusDark(true);
  }, [setStatusDark]);
  if (!p || !photoSrc(p.photo, d.photos))
    return (
      <div className="absolute inset-0 bg-black text-white flex flex-col items-center justify-center gap-[10px] text-center px-10">
        <div className="w-[34px] h-[34px] rounded-full border-[3px] border-white/20 border-t-white/80 animate-spin" />
        <div className="text-[15px] font-semibold mt-2">릴스를 불러올 수 없습니다</div>
        <div className="text-[13px] text-white/55">네트워크 연결 상태를 확인하고 다시 시도하세요.</div>
      </div>
    );
  return (
    <div className="absolute inset-0 bg-black text-white">
      <Img src={photoSrc(p.photo, d.photos)} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 60%, rgba(0,0,0,0.55))" }} />
      <div className="absolute left-0 right-0 flex justify-between items-center px-[16px]" style={{ top: "calc(var(--sat) + 6px)" }}>
        <span className="text-[22px] font-bold flex items-center gap-1">
          릴스 <ChevronDown size={18} />
        </span>
        <Camera size={26} strokeWidth={1.8} />
      </div>
      <div className="absolute right-[12px] bottom-[118px] flex flex-col items-center gap-[20px] text-[13px] font-semibold">
        <div className="flex flex-col items-center gap-1">
          <Heart size={28} strokeWidth={1.8} />
          {won(p.likes)}
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle size={27} strokeWidth={1.8} style={{ transform: "scaleX(-1)" }} />
          {p.comments}
        </div>
        <Send size={26} strokeWidth={1.8} />
        <MoreHorizontal size={24} />
        <div className="w-[28px] h-[28px] rounded-[7px] border-2 border-white overflow-hidden">
          <IgAvatar handle={p.user} size={24} />
        </div>
      </div>
      <div className="absolute left-[14px] right-[70px] bottom-[110px]">
        <div className="flex items-center gap-[8px]">
          <IgAvatar handle={p.user} size={32} />
          <span className="text-[14px] font-semibold">{p.user}</span>
          <span className="text-[13px] font-semibold border border-white/70 rounded-[8px] px-[9px] py-[3px]">팔로우</span>
        </div>
        <div className="text-[14px] mt-[8px] leading-[19px] line-clamp-2">{p.caption}</div>
        <div className="flex items-center gap-[6px] text-[13px] mt-[8px] opacity-90">
          <Music2 size={13} />
          {p.user} · 원본 오디오
        </div>
      </div>
    </div>
  );
}

function DMChat({ t, onBack }: { t: Thread; onBack: () => void }) {
  const c = useComposer(t);
  const ref = useAutoBottom(t.messages.length);
  return (
    <div className="fixed inset-0 bg-white flex flex-col push z-30">
      <div className="hair-b" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[50px] flex items-center px-[8px] gap-[10px]">
          <button data-back onClick={onBack}>
            <ChevronLeft size={30} strokeWidth={1.8} />
          </button>
          <IgAvatar handle={t.name} size={30} />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold truncate leading-[18px]">{t.name}</div>
            <div className="text-[12px] text-black/50 leading-[15px]">{t.name}</div>
          </div>
          <Phone size={23} strokeWidth={1.7} />
          <Video size={26} strokeWidth={1.7} className="mr-[6px]" />
        </div>
      </div>
      <div ref={ref} className="flex-1 scroll px-[12px] pt-[16px] pb-[10px]">
        <div className="flex flex-col items-center pb-[24px]">
          <IgAvatar handle={t.name} size={90} />
          <div className="text-[18px] font-semibold mt-[10px]">{t.name}</div>
          <div className="text-[13px] text-black/50">{t.name} · Instagram</div>
          <span className="mt-[12px] text-[13px] font-semibold bg-[#EFEFEF] rounded-[8px] px-[14px] py-[6px]">프로필 보기</span>
        </div>
        {t.messages.map((m, i) => {
          const mine = m.from === "me";
          const next = t.messages[i + 1];
          const prev = t.messages[i - 1];
          const last = !next || next.from !== m.from;
          return (
            <div key={m.id} className={`flex items-end gap-[8px] ${mine ? "justify-end" : ""}`} style={{ marginTop: prev && prev.from === m.from ? 2 : 10 }}>
              {!mine && <div className="w-[28px]">{last && <IgAvatar handle={t.name} size={28} />}</div>}
              <div
                className="max-w-[70%] px-[13px] py-[8px] text-[15px] leading-[20px] rounded-[22px] whitespace-pre-wrap"
                style={mine ? { background: "linear-gradient(135deg,#5B51F5,#8A3CF0)", color: "#fff", wordBreak: "keep-all" } : { background: "#EFEFEF", wordBreak: "keep-all" }}
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-[10px] pt-[6px]" style={{ paddingBottom: "calc(var(--sab) + 4px)" }}>
        <div className="h-[46px] rounded-full bg-[#EFEFEF] flex items-center pl-[5px] pr-[14px] gap-[10px]">
          <span className="w-[36px] h-[36px] rounded-full bg-[#3797F0] flex items-center justify-center shrink-0">
            <Camera size={19} color="#fff" />
          </span>
          <input
            value={c.text}
            readOnly={!c.editable}
            onChange={(e) => c.setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && c.send()}
            placeholder="메시지 보내기..."
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-black/45 min-w-0"
          />
          {c.canSend && (
            <button onClick={c.send} className="text-[15px] font-semibold text-[#3797F0]">
              보내기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DMs() {
  const d = useData();
  const { appArg } = usePhoneCtx();
  const list = d.threads.filter((t) => t.app === "insta");
  const [openId, setOpenId] = useState<string | null>((appArg as string) || null);
  useEffect(() => {
    if (openId) markRead(openId);
  }, [openId]);
  const cur = list.find((t) => t.id === openId);
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <span className="text-[22px] font-bold flex items-center gap-[4px]">
          {d.ig.me.handle} <ChevronDown size={18} />
        </span>
        <SquarePen size={24} strokeWidth={1.7} />
      </div>
      <div className="px-[14px] py-[6px]">
        <div className="h-[36px] rounded-[10px] bg-[#EFEFEF] flex items-center gap-[8px] px-[12px] text-black/45 text-[15px]">
          <Search size={16} />
          검색
        </div>
      </div>
      <div className="flex items-center justify-between px-[14px] pt-[12px] pb-[6px]">
        <span className="text-[16px] font-bold">메시지</span>
        <span className="text-[14px] text-black/50">요청</span>
      </div>
      {list.map((t) => {
        const last = t.messages[t.messages.length - 1];
        return (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="w-full flex items-center gap-[12px] px-[14px] py-[8px] text-left active:bg-black/[0.03]">
            <IgAvatar handle={t.name} size={56} />
            <div className="flex-1 min-w-0">
              <div className={`text-[14px] truncate ${t.unread ? "font-bold" : ""}`}>{t.name}</div>
              <div className={`text-[14px] truncate ${t.unread ? "font-semibold text-black" : "text-black/50"}`}>
                {last?.from === "me" ? "회원님: " : ""}
                {last?.text} · {t.last}
              </div>
            </div>
            {t.unread > 0 && <span className="w-[8px] h-[8px] rounded-full bg-[#0095F6]" />}
            <Camera size={24} strokeWidth={1.5} className="text-black/50" />
          </button>
        );
      })}
      {cur && <DMChat t={cur} onBack={() => setOpenId(null)} />}
    </>
  );
}

function Explore() {
  const d = useData();
  return (
    <>
      <div className="px-[12px] pt-[4px] pb-[8px] flex items-center gap-[10px]">
        <div className="flex-1 h-[36px] rounded-[10px] bg-[#EFEFEF] flex items-center gap-[8px] px-[12px] text-black/45 text-[15px]">
          <Search size={16} />
          검색
        </div>
      </div>
      <div className="flex justify-between px-[14px] pt-[6px] pb-[4px]">
        <span className="text-[16px] font-bold">최근 검색 항목</span>
        <span className="text-[14px] text-[#0095F6]">모두 보기</span>
      </div>
      {[...d.ig.users].reverse().map((u) => (
        <div key={u.handle} className="flex items-center gap-[12px] px-[14px] py-[8px]">
          <IgAvatar handle={u.handle} size={50} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{u.handle}</div>
            <div className="text-[13px] text-black/50 truncate">{u.name} · 팔로워 {u.followers.toLocaleString()}명</div>
          </div>
          <span className="text-black/40 text-[20px] leading-none">×</span>
        </div>
      ))}
    </>
  );
}

function Profile() {
  const d = useData();
  const me = d.ig.me;
  return (
    <>
      <div className="flex items-center justify-between px-[14px] h-[44px]">
        <Plus size={26} strokeWidth={1.7} />
        <span className="text-[18px] font-bold flex items-center gap-[5px]">
          {me.private && <Lock size={14} strokeWidth={2.6} />}
          {me.handle}
          <ChevronDown size={16} />
        </span>
        <Menu size={26} strokeWidth={1.7} />
      </div>
      <div className="flex items-center px-[16px] pt-[10px] gap-[24px]">
        <IgAvatar handle={me.handle} size={86} me />
        <div className="flex-1">
          <div className="text-[14px] font-semibold mb-[6px]">{me.name || d.owner}</div>
          <div className="flex justify-between pr-[8px]">
            {[
              [me.posts, "게시물"],
              [me.followers, "팔로워"],
              [me.following, "팔로잉"],
            ].map(([n, l]) => (
              <div key={l as string} className="text-left">
                <div className="text-[16px] font-semibold leading-[20px]">{n as number}</div>
                <div className="text-[13px] leading-[17px]">{l as string}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {me.bio && <div className="px-[16px] pt-[8px] text-[14px] whitespace-pre-wrap">{me.bio}</div>}
      <div className="flex gap-[6px] px-[16px] pt-[14px]">
        <span className="flex-1 h-[34px] rounded-[8px] bg-[#EFEFEF] text-[14px] font-semibold flex items-center justify-center">프로필 편집</span>
        <span className="flex-1 h-[34px] rounded-[8px] bg-[#EFEFEF] text-[14px] font-semibold flex items-center justify-center">프로필 공유</span>
      </div>
      <div className="flex mt-[16px] hair-b">
        <span className="flex-1 flex justify-center py-[10px] border-b border-black">
          <Grid3x3 size={22} />
        </span>
        <span className="flex-1 flex justify-center py-[10px] text-black/40">
          <Clapperboard size={22} />
        </span>
        <span className="flex-1 flex justify-center py-[10px] text-black/40">
          <UserSquare2 size={22} />
        </span>
      </div>
      <div className="flex flex-col items-center pt-[56px]">
        <div className="w-[84px] h-[84px] rounded-full border-2 border-black flex items-center justify-center">
          <Camera size={40} strokeWidth={1.3} />
        </div>
        <div className="text-[26px] font-extrabold mt-[14px]">게시물 없음</div>
      </div>
    </>
  );
}

export default function Insta() {
  const d = useData();
  const { appArg } = usePhoneCtx();
  const [tab, setTab] = useState(appArg ? "dm" : "home");
  const unread = d.threads.filter((t) => t.app === "insta").reduce((a, t) => a + t.unread, 0);
  const dark = tab === "reels";
  const items = [
    { id: "home", icon: <HomeI size={27} strokeWidth={tab === "home" ? 2.4 : 1.7} fill={tab === "home" ? "currentColor" : "none"} /> },
    { id: "reels", icon: <Clapperboard size={26} strokeWidth={tab === "reels" ? 2.4 : 1.7} /> },
    { id: "dm", icon: <Send size={25} strokeWidth={tab === "dm" ? 2.4 : 1.7} />, badge: unread },
    { id: "search", icon: <Search size={26} strokeWidth={tab === "search" ? 2.8 : 1.8} /> },
    { id: "profile", icon: <div className={`rounded-full ${tab === "profile" ? "ring-2 ring-offset-1 ring-black" : ""}`}><IgAvatar handle={d.ig.me.handle} size={26} me /></div> },
  ];
  return (
    <div className="absolute inset-0 bg-white">
      {tab === "reels" ? (
        <Reels />
      ) : (
        <div className="absolute inset-0 scroll" style={{ paddingTop: "var(--sat)", paddingBottom: 100 }}>
          {tab === "home" && <Feed />}
          {tab === "dm" && <DMs />}
          {tab === "search" && <Explore />}
          {tab === "profile" && <Profile />}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-around pt-[10px]" style={{ paddingBottom: "calc(var(--sab) - 4px)", background: dark ? "#000" : "#fff", color: dark ? "#fff" : "#000", boxShadow: dark ? "none" : "inset 0 0.5px 0 rgba(0,0,0,0.1)" }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)} className="relative w-[48px] h-[34px] flex items-center justify-center">
            {it.icon}
            {!!it.badge && <span className="absolute top-[-2px] right-[4px] min-w-[18px] h-[18px] px-[5px] rounded-full bg-[#FF3040] text-white text-[11px] font-bold flex items-center justify-center border-2" style={{ borderColor: dark ? "#000" : "#fff" }}>{it.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

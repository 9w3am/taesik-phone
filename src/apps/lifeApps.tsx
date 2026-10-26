/* 생활 앱: 쿠팡 · 배달의민족 · 카카오 T — 주문 상세 · 배송조회 · 이용 상세(경로 · 영수증)까지 실제 앱처럼 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, House, Menu, User, ShoppingCart, Heart, List, Bell, MapPin, Car, Bike, ParkingSquare, LayoutGrid, Package, UtensilsCrossed, Check, Star, Clock, X as XIcon } from "lucide-react";
import { useData, type ShopOrder, type FoodOrder, type Ride } from "../store";
import { TabBar, useStatusBar } from "../ui";
import { Thumb, Push, hueOf } from "./moreKit";

/** 이름 가리기: 최태식 → 최*식 (템플릿에서도 안전하게) */
const mask = (s: string) => (s.length <= 1 ? "*" : s.length === 2 ? s[0] + "*" : s[0] + "*".repeat(s.length - 2) + s[s.length - 1]);
const won = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;
const fmtWon = (n: number) => `${n.toLocaleString()}원`;
const orderNo = (id: string) => String(Math.abs([...id].reduce((a, c) => (a * 131 + c.charCodeAt(0)) % 9999999967, 7))).padStart(10, "1").slice(0, 10);

/* ═════════════ 쿠팡 ═════════════ */
function CpHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="bg-white" style={{ paddingTop: "var(--sat)" }}>
      <div className="h-[48px] flex items-center px-[10px] border-b border-black/[0.06]">
        {onBack ? (
          <button data-back onClick={onBack} aria-label="뒤로">
            <ChevronLeft size={26} />
          </button>
        ) : (
          <span className="w-[26px]" />
        )}
        <span className="flex-1 text-center text-[17px] font-bold mr-[26px]">{title}</span>
      </div>
    </div>
  );
}
function CpThumb({ o, size = 72 }: { o: ShopOrder; size?: number }) {
  return (
    <Thumb photo={o.photo} hue={hueOf(o.name)} className="rounded-[6px] border border-black/[0.05] shrink-0" style={{ width: size, height: size, ...(o.photo ? {} : { background: "#F3F4F6" }) }}>
      {!o.photo && <Package size={size * 0.42} strokeWidth={1.4} className="absolute inset-0 m-auto text-black/25" />}
    </Thumb>
  );
}
export function CoupangApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("my");
  const [detail, setDetail] = useState<string | null>(null); // 주문 날짜
  const [track, setTrack] = useState<ShopOrder | null>(null);
  const groups = [...new Set(d.coupang.map((o) => o.when))];
  const items = d.coupang.filter((o) => o.when === detail);
  const total = items.reduce((a, o) => a + won(o.price), 0);
  return (
    <div className="absolute inset-0 bg-[#F0F2F5]">
      {tab === "my" ? (
        <>
          <div className="absolute top-0 left-0 right-0 z-10">
            <CpHeader title="주문목록" />
            <div className="bg-white px-[12px] py-[10px]">
              <div className="h-[40px] rounded-[6px] border border-black/15 flex items-center gap-[8px] px-[12px] text-[14px] text-black/40">
                <Search size={17} /> 주문한 상품을 검색할 수 있어요!
              </div>
            </div>
          </div>
          <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 109px)", paddingBottom: 100 }}>
            {d.coupang.length === 0 && <div className="text-center text-black/40 pt-[100px]">주문 내역이 없습니다</div>}
            {groups.map((g) => (
              <div key={g} className="bg-white mb-[8px] px-[14px] py-[14px]">
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[17px] font-bold">{g} 주문</span>
                  <button onClick={() => setDetail(g)} className="text-[14px] text-[#346AFF] font-medium">
                    주문 상세보기 ›
                  </button>
                </div>
                {d.coupang
                  .filter((o) => o.when === g)
                  .map((o) => (
                    <div key={o.id} className="rounded-[8px] border border-black/[0.08] p-[12px] mb-[8px]">
                      <div className="text-[16px] font-bold" style={{ color: o.status.includes("완료") ? "#111" : "#00891A" }}>
                        {o.status}
                        {o.status.includes("완료") && <span className="text-[#00891A] font-semibold"> · 문 앞</span>}
                      </div>
                      <div className="flex gap-[12px] mt-[10px]">
                        <CpThumb o={o} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] leading-[19px] line-clamp-2">{o.name}</div>
                          <div className="text-[13px] text-black/45 mt-[2px]">{o.option}</div>
                          <div className="text-[15px] font-bold mt-[4px]">{o.price}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-[6px] mt-[12px]">
                        <button onClick={() => setTrack(o)} className="h-[36px] rounded-[4px] border border-black/15 text-[13px]">
                          배송조회
                        </button>
                        <span className="h-[36px] rounded-[4px] border border-black/15 text-[13px] flex items-center justify-center">교환, 반품 신청</span>
                        <span className="h-[36px] rounded-[4px] border border-black/15 text-[13px] flex items-center justify-center">리뷰 작성하기</span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-white scroll" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: 100 }}>
          <div className="px-[12px] flex items-center gap-[10px]">
            <span className="text-[22px] font-black tracking-[-1px]">
              <span className="text-[#9B4A1E]">c</span>
              <span className="text-[#E2312C]">o</span>
              <span className="text-[#F4A51C]">u</span>
              <span className="text-[#76B82A]">p</span>
              <span className="text-[#4DA9E0]">a</span>
              <span className="text-[#E2312C]">n</span>
              <span className="text-[#76B82A]">g</span>
            </span>
            <div className="flex-1 h-[40px] rounded-[8px] bg-[#F3F4F6] flex items-center gap-[8px] px-[12px] text-[14px] text-black/40">
              <Search size={17} /> 쿠팡에서 검색하세요!
            </div>
          </div>
          <div className="mx-[12px] mt-[12px] h-[120px] rounded-[10px] flex flex-col justify-center px-[18px] text-white" style={{ background: "linear-gradient(120deg,#346AFF,#5B8CFF)" }}>
            <div className="text-[13px] opacity-90">로켓배송</div>
            <div className="text-[20px] font-bold">내일 새벽 도착 보장</div>
          </div>
          <div className="grid grid-cols-5 gap-y-[14px] px-[12px] mt-[16px] text-[12px] text-center">
            {["로켓프레시", "로켓배송", "쿠팡이츠", "골드박스", "판매자특가", "생필품", "식품", "스포츠", "자동차용품", "더보기"].map((c) => (
              <span key={c} className="flex flex-col items-center gap-[4px]">
                <span className="w-[44px] h-[44px] rounded-full bg-[#F3F4F6]" />
                {c}
              </span>
            ))}
          </div>
          {d.coupang.length > 0 && (
            <>
              <div className="px-[12px] mt-[22px] mb-[8px] text-[17px] font-bold">최근 주문한 상품</div>
              <div className="flex gap-[10px] px-[12px] overflow-x-auto no-scrollbar">
                {d.coupang.map((o) => (
                  <div key={o.id} className="w-[110px] shrink-0">
                    <CpThumb o={o} size={110} />
                    <div className="text-[12px] line-clamp-2 mt-[4px]">{o.name}</div>
                    <div className="text-[13px] font-bold">{o.price}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#111"
        inactive="#999"
        bg="#fff"
        items={[
          { id: "home", label: "홈", icon: <House size={23} strokeWidth={1.7} /> },
          { id: "cat", label: "카테고리", icon: <Menu size={23} strokeWidth={1.7} /> },
          { id: "search", label: "검색", icon: <Search size={23} strokeWidth={1.7} /> },
          { id: "my", label: "마이쿠팡", icon: <User size={23} strokeWidth={1.7} fill={tab === "my" ? "#111" : "none"} /> },
          { id: "cart", label: "장바구니", icon: <ShoppingCart size={23} strokeWidth={1.7} /> },
        ]}
      />
      {detail && (
        <Push bg="#F0F2F5">
          <CpHeader title="주문 상세" onBack={() => setDetail(null)} />
          <div className="flex-1 scroll pb-[40px]">
            <div className="bg-white px-[14px] py-[14px] mb-[8px] text-[14px]">
              <div className="text-[17px] font-bold">{detail} 주문</div>
              <div className="text-black/50 mt-[2px]">주문번호 {orderNo(items[0]?.id ?? detail)}</div>
            </div>
            <div className="bg-white px-[14px] py-[12px] mb-[8px]">
              {items.map((o) => (
                <div key={o.id} className="flex gap-[12px] py-[8px]">
                  <CpThumb o={o} size={60} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold" style={{ color: o.status.includes("완료") ? "#111" : "#00891A" }}>
                      {o.status}
                    </div>
                    <div className="text-[14px] line-clamp-2">{o.name}</div>
                    <div className="text-[13px] text-black/45">
                      {o.option} · {o.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white px-[14px] py-[14px] mb-[8px] text-[14px]">
              <div className="text-[16px] font-bold mb-[10px]">받는사람 정보</div>
              {[
                ["받는사람", mask(d.owner || "고객")],
                ["연락처", "010-****-****"],
                ["받는주소", "OO시 OO구 ****"],
                ["배송요청사항", "문 앞"],
              ].map(([k, v]) => (
                <div key={k} className="flex py-[4px]">
                  <span className="w-[96px] text-black/50">{k}</span>
                  <span className="flex-1">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-white px-[14px] py-[14px] text-[14px]">
              <div className="text-[16px] font-bold mb-[10px]">결제 정보</div>
              {[
                ["총 상품가격", fmtWon(total)],
                ["배송비", "0원"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-[4px]">
                  <span className="text-black/50">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="flex justify-between py-[8px] mt-[6px] border-t border-black/[0.08] text-[16px] font-bold">
                <span>총 결제금액</span>
                <span className="text-[#E2312C]">{fmtWon(total)}</span>
              </div>
              <div className="flex justify-between py-[4px] text-black/50">
                <span>결제수단</span>
                <span>쿠페이 머니</span>
              </div>
            </div>
          </div>
        </Push>
      )}
      {track && (
        <Push bg="#fff">
          <CpHeader title="배송조회" onBack={() => setTrack(null)} />
          <div className="flex-1 scroll px-[16px] pb-[40px]">
            <div className="text-[22px] font-bold mt-[18px]">{track.status.includes("완료") ? "배송완료" : track.status}</div>
            <div className="text-[14px] text-black/55 mt-[4px]">{track.name}</div>
            <div className="rounded-[10px] bg-[#F3F6FF] p-[12px] mt-[14px] text-[14px]">
              <div className="font-bold">쿠팡친구</div>
              <div className="text-black/55">고객님의 상품을 안전하게 배송합니다.</div>
            </div>
            {(() => {
              const done = track.status.includes("완료");
              const steps = ["상품 준비 중", "배송 시작", "배송 중", "배송 완료"];
              const at = done ? 3 : track.status.includes("배송중") || track.status.includes("배송 중") ? 2 : 1;
              return (
                <div className="mt-[18px]">
                  {steps.map((s, i) => (
                    <div key={s} className="flex gap-[12px]">
                      <div className="flex flex-col items-center">
                        <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ background: i <= at ? "#346AFF" : "#E5E7EB" }}>
                          {i <= at && <Check size={13} color="#fff" strokeWidth={3} />}
                        </span>
                        {i < steps.length - 1 && <span className="w-[2px] h-[40px]" style={{ background: i < at ? "#346AFF" : "#E5E7EB" }} />}
                      </div>
                      <div className="pt-[1px]">
                        <div className="text-[15px]" style={{ fontWeight: i === at ? 700 : 400, color: i <= at ? "#111" : "#9CA3AF" }}>
                          {s}
                        </div>
                        {i <= at && <div className="text-[12px] text-black/40">{track.when.replace(/^\d{4}\. /, "")} {["09:12", "13:40", "06:02", "07:31"][i]}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </Push>
      )}
    </div>
  );
}

/* ═════════════ 배달의민족 ═════════════ */
const BAEMIN = "#2AC1BC";
function FoodThumb({ o, size = 64 }: { o: FoodOrder; size?: number }) {
  return (
    <Thumb photo={o.photo} hue={hueOf(o.store)} className="rounded-[10px] shrink-0" style={{ width: size, height: size }}>
      {!o.photo && <UtensilsCrossed size={size * 0.4} strokeWidth={1.6} className="absolute inset-0 m-auto text-white/80" />}
    </Thumb>
  );
}
export function BaeminApp() {
  useStatusBar(true);
  const d = useData();
  const [tab, setTab] = useState("orders");
  const [open, setOpen] = useState<FoodOrder | null>(null);
  return (
    <div className="absolute inset-0 bg-[#F6F6F6]">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white" style={{ paddingTop: "var(--sat)" }}>
        <div className="h-[50px] flex items-center justify-center text-[18px] font-bold border-b border-black/[0.06]">{tab === "orders" ? "주문내역" : tab === "like" ? "찜" : tab === "my" ? "my배민" : "배달의민족"}</div>
        {tab === "orders" && (
          <div className="flex gap-[8px] px-[14px] py-[10px]">
            {["배달 · 포장", "장보기 · 쇼핑", "선물하기"].map((c, i) => (
              <span key={c} className="h-[32px] px-[12px] rounded-full text-[14px] flex items-center" style={i === 0 ? { background: "#222", color: "#fff", fontWeight: 600 } : { background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="absolute inset-0 scroll px-[14px]" style={{ paddingTop: `calc(var(--sat) + ${tab === "orders" ? 104 : 60}px)`, paddingBottom: 100 }}>
        {tab === "orders" ? (
          <>
            {d.baemin.length === 0 && <div className="text-center text-black/40 pt-[100px]">주문내역이 없어요</div>}
            {d.baemin.map((o) => (
              <div key={o.id} className="bg-white rounded-[14px] p-[16px] mb-[10px]">
                <button onClick={() => setOpen(o)} className="w-full flex justify-between items-center text-[13px] text-black/45">
                  <span>
                    {o.status} · {o.when}
                  </span>
                  <span>주문상세</span>
                </button>
                <button onClick={() => setOpen(o)} className="w-full flex gap-[12px] mt-[10px] text-left">
                  <FoodThumb o={o} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[17px] font-bold flex items-center">
                      <span className="truncate">{o.store}</span>
                      <ChevronRight size={18} className="shrink-0" />
                    </div>
                    <div className="text-[14px] text-black/60 mt-[2px] line-clamp-2">{o.menu}</div>
                    <div className="text-[14px] mt-[2px]">{o.price}</div>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-[8px] mt-[14px]">
                  <span className="h-[40px] rounded-[8px] border border-black/15 text-[14px] font-semibold flex items-center justify-center">같은 메뉴 담기</span>
                  <span className="h-[40px] rounded-[8px] text-[14px] font-semibold flex items-center justify-center" style={{ background: "#E8F8F7", color: "#139F99" }}>
                    리뷰 쓰기
                  </span>
                </div>
              </div>
            ))}
          </>
        ) : tab === "home" ? (
          <>
            <div className="h-[44px] rounded-[12px] bg-white flex items-center gap-[8px] px-[14px] text-[15px] text-black/40 mt-[6px]" style={{ border: `2px solid ${BAEMIN}` }}>
              <Search size={18} color={BAEMIN} /> 찾는 메뉴가 뭐예요?
            </div>
            <div className="grid grid-cols-4 gap-y-[16px] mt-[18px] text-[13px] text-center">
              {["한식", "치킨", "분식", "돈까스·회", "피자", "중식", "족발·보쌈", "샐러드", "카페·디저트", "도시락", "패스트푸드", "아시안"].map((c) => (
                <span key={c} className="flex flex-col items-center gap-[6px]">
                  <span className="w-[54px] h-[54px] rounded-[16px] bg-white" />
                  {c}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-black/40 pt-[100px]">{tab === "like" ? "찜한 가게가 없어요" : "로그인 정보"}</div>
        )}
      </div>
      <TabBar
        active={tab}
        onChange={setTab}
        tint="#222"
        inactive="#999"
        bg="#fff"
        items={[
          { id: "home", label: "홈", icon: <House size={23} strokeWidth={1.7} /> },
          { id: "search", label: "검색", icon: <Search size={23} strokeWidth={1.7} /> },
          { id: "like", label: "찜", icon: <Heart size={23} strokeWidth={1.7} /> },
          { id: "orders", label: "주문내역", icon: <List size={23} strokeWidth={tab === "orders" ? 2.6 : 1.7} color={tab === "orders" ? BAEMIN : undefined} /> },
          { id: "my", label: "my배민", icon: <User size={23} strokeWidth={1.7} /> },
        ]}
      />
      {open && (
        <Push bg="#F6F6F6">
          <div className="bg-white" style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center px-[10px] border-b border-black/[0.06]">
              <button data-back onClick={() => setOpen(null)} aria-label="뒤로">
                <ChevronLeft size={26} />
              </button>
              <span className="flex-1 text-center text-[17px] font-bold mr-[26px]">주문상세</span>
            </div>
          </div>
          <div className="flex-1 scroll pb-[40px]">
            <div className="bg-white px-[16px] py-[18px] mb-[8px]">
              <div className="text-[13px] font-semibold" style={{ color: BAEMIN }}>
                {o_label(open)}
              </div>
              <div className="flex items-center gap-[12px] mt-[8px]">
                <FoodThumb o={open} size={52} />
                <div className="flex-1 min-w-0">
                  <div className="text-[18px] font-bold truncate">{open.store}</div>
                  <div className="text-[13px] text-black/45 flex items-center gap-[3px]">
                    <Star size={13} fill="#FFC107" color="#FFC107" /> 4.9 · 리뷰 1,204
                  </div>
                </div>
              </div>
              <div className="text-[13px] text-black/45 mt-[10px]">주문일시 {open.when}</div>
              <div className="text-[13px] text-black/45">주문번호 B{orderNo(open.id).slice(0, 8)}</div>
            </div>
            <div className="bg-white px-[16px] py-[16px] mb-[8px]">
              <div className="text-[16px] font-bold mb-[10px]">주문 메뉴</div>
              {open.menu.split(/ 외 |,\s*/).map((m, i) => (
                <div key={i} className="flex justify-between py-[4px] text-[15px]">
                  <span>{m}</span>
                </div>
              ))}
            </div>
            <div className="bg-white px-[16px] py-[16px] mb-[8px] text-[15px]">
              <div className="flex justify-between py-[3px]">
                <span className="text-black/55">주문금액</span>
                <span>{fmtWon(Math.max(0, won(open.price) - 3000))}</span>
              </div>
              <div className="flex justify-between py-[3px]">
                <span className="text-black/55">배달팁</span>
                <span>3,000원</span>
              </div>
              <div className="flex justify-between pt-[10px] mt-[6px] border-t border-black/[0.08] text-[17px] font-bold">
                <span>결제금액</span>
                <span>{open.price}</span>
              </div>
              <div className="flex justify-between py-[3px] text-black/55 text-[14px]">
                <span>결제방법</span>
                <span>배민페이</span>
              </div>
            </div>
            <div className="bg-white px-[16px] py-[16px] text-[15px]">
              <div className="text-[16px] font-bold mb-[8px]">배달 정보</div>
              <div className="text-black/70">OO동 ****</div>
              <div className="text-black/45 text-[14px] mt-[4px]">요청사항: 문 앞에 두고 벨 누르지 말아주세요</div>
            </div>
          </div>
        </Push>
      )}
    </div>
  );
}
const o_label = (o: FoodOrder) => (o.status.includes("완료") ? "배달이 완료되었어요" : o.status);

/* ═════════════ 카카오 T ═════════════ */
function RideMap({ seed }: { seed: string }) {
  const h = hueOf(seed);
  const pts = [
    [40, 150],
    [90 + (h % 30), 120],
    [150, 140 - (h % 40)],
    [220, 90],
    [290 - (h % 25), 60],
    [340, 40],
  ];
  return (
    <svg viewBox="0 0 380 190" className="w-full h-[190px] block" style={{ background: "#EEF1F4" }}>
      {[30, 70, 110, 150].map((y) => (
        <line key={y} x1="0" y1={y + (h % 9)} x2="380" y2={y - 10} stroke="#fff" strokeWidth="9" />
      ))}
      {[60, 150, 250, 320].map((x) => (
        <line key={x} x1={x} y1="0" x2={x + 20} y2="190" stroke="#fff" strokeWidth="7" />
      ))}
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#1E1E1E" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[0][0]} cy={pts[0][1]} r="8" fill="#1E1E1E" />
      <circle cx={pts[5][0]} cy={pts[5][1]} r="9" fill="#FFE600" stroke="#1E1E1E" strokeWidth="3" />
    </svg>
  );
}
export function KakaoTApp() {
  useStatusBar(true);
  const d = useData();
  const [hist, setHist] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const dests = [...new Set(d.kakaot.map((r) => r.to))];
  // 실제 카카오 T처럼 서비스마다 색이 있는 아이콘
  const services: [string, React.ReactNode][] = [
    ["택시", <Car key="1" size={30} color="#1E1E1E" fill="#FFC800" strokeWidth={1.8} />],
    ["대리", <Car key="2" size={30} color="#1E1E1E" fill="#3D7BFF" strokeWidth={1.8} />],
    ["바이크", <Bike key="3" size={30} color="#00B493" strokeWidth={2.2} />],
    ["주차", <ParkingSquare key="4" size={30} color="#fff" fill="#4A5BF0" strokeWidth={2} />],
    ["퀵 · 배송", <LayoutGrid key="5" size={30} color="#FF6B3D" strokeWidth={2.2} />],
    ["전체", <Menu key="6" size={28} color="#555" />],
  ];
  const fare = (r: Ride) => {
    const total = won(r.price);
    const base = 4800;
    return { base, dist: Math.max(0, total - base), km: (Math.max(1.6, (total - base) / 1000 + 1.6)).toFixed(1), min: Math.round(8 + total / 1400) };
  };
  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute inset-0 scroll" style={{ paddingTop: "calc(var(--sat) + 8px)", paddingBottom: 60 }}>
        <div className="flex items-center justify-between px-[18px] h-[44px]">
          <span className="text-[22px] font-black tracking-[-0.5px]">
            kakao <span className="text-[#FFC800]">T</span>
          </span>
          <Bell size={22} />
        </div>
        <button onClick={() => setSearch(true)} className="mx-[18px] mt-[8px] h-[54px] w-[calc(100%-36px)] rounded-[14px] bg-[#FFE600] flex items-center px-[16px] gap-[10px] text-[17px] font-bold">
          <Search size={20} strokeWidth={2.6} /> 어디로 갈까요?
        </button>
        <div className="grid grid-cols-3 gap-y-[18px] px-[18px] mt-[22px]">
          {services.map(([l, ic]) => (
            <div key={l} className="flex flex-col items-center gap-[6px]">
              <span className="w-[62px] h-[62px] rounded-[18px] bg-[#F5F6F7] flex items-center justify-center text-[#333]">{ic}</span>
              <span className="text-[13px] font-medium">{l}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setHist(true)} className="w-full flex items-center justify-between px-[18px] mt-[26px] mb-[6px]">
          <span className="text-[18px] font-bold">최근 이용</span>
          <span className="text-[14px] text-black/45 flex items-center">
            이용기록 <ChevronRight size={16} />
          </span>
        </button>
        {d.kakaot.slice(0, 3).map((r) => (
          <button key={r.id} onClick={() => setRide(r)} className="w-full flex items-center gap-[12px] px-[18px] py-[10px] text-left">
            <MapPin size={20} className="text-black/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold truncate">{r.to}</div>
              <div className="text-[13px] text-black/45 truncate">{r.from}에서</div>
            </div>
          </button>
        ))}
      </div>
      {search && (
        <Push>
          <div style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center px-[10px]">
              <button data-back onClick={() => (setSearch(false), setQ(""))} aria-label="뒤로">
                <ChevronLeft size={28} />
              </button>
            </div>
            <div className="mx-[16px] rounded-[14px] border border-black/10 overflow-hidden">
              <div className="flex items-center gap-[10px] px-[14px] h-[48px] border-b border-black/[0.06] text-[15px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#333]" /> 현재 위치
              </div>
              <label className="flex items-center gap-[10px] px-[14px] h-[48px] text-[15px]">
                <span className="w-[8px] h-[8px] rounded-full bg-[#FFC800]" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="도착지 검색" className="flex-1 outline-none" />
                {q && (
                  <button onClick={() => setQ("")} aria-label="지우기">
                    <XIcon size={18} className="text-black/40" />
                  </button>
                )}
              </label>
            </div>
          </div>
          <div className="flex-1 scroll px-[16px] pt-[16px] pb-[40px]">
            <div className="text-[14px] font-bold text-black/50 mb-[6px]">최근 목적지</div>
            {dests
              .filter((x) => !q.trim() || x.includes(q.trim()))
              .map((x) => (
                <div key={x} className="flex items-center gap-[12px] py-[12px] border-b border-black/[0.05]">
                  <Clock size={18} className="text-black/35" />
                  <span className="text-[16px]">{x}</span>
                </div>
              ))}
            {q.trim() && !dests.some((x) => x.includes(q.trim())) && <div className="text-center text-black/40 pt-[60px] text-[15px]">'{q}' 검색 결과가 없어요</div>}
          </div>
        </Push>
      )}
      {hist && (
        <Push bg="#F5F6F7">
          <div className="bg-white" style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center px-[10px]">
              <button data-back onClick={() => setHist(false)} aria-label="뒤로">
                <ChevronLeft size={28} />
              </button>
              <span className="flex-1 text-center text-[17px] font-bold mr-[28px]">이용기록</span>
            </div>
          </div>
          <div className="flex-1 scroll px-[14px] pt-[12px] pb-[40px]">
            {d.kakaot.length === 0 && <div className="text-center text-black/40 pt-[100px]">이용기록이 없습니다</div>}
            {d.kakaot.map((r) => (
              <button key={r.id} onClick={() => setRide(r)} className="w-full text-left bg-white rounded-[14px] p-[16px] mb-[10px]">
                <div className="flex justify-between text-[13px] text-black/45">
                  <span>{r.kind}</span>
                  <span>{r.when}</span>
                </div>
                <div className="mt-[10px] flex gap-[10px]">
                  <div className="flex flex-col items-center pt-[6px]">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#333]" />
                    <span className="w-px flex-1 bg-black/15 my-[3px]" />
                    <span className="w-[8px] h-[8px] rounded-full bg-[#FFC800]" />
                  </div>
                  <div className="flex-1 min-w-0 text-[16px]">
                    <div className="truncate">{r.from}</div>
                    <div className="truncate mt-[10px] font-semibold">{r.to}</div>
                  </div>
                  <div className="text-[17px] font-bold self-end">{r.price}</div>
                </div>
              </button>
            ))}
          </div>
        </Push>
      )}
      {ride && (
        <Push z={40}>
          <div className="bg-white" style={{ paddingTop: "var(--sat)" }}>
            <div className="h-[50px] flex items-center px-[10px]">
              <button data-back onClick={() => setRide(null)} aria-label="뒤로">
                <ChevronLeft size={28} />
              </button>
              <span className="flex-1 text-center text-[17px] font-bold mr-[28px]">이용 상세</span>
            </div>
          </div>
          <div className="flex-1 scroll pb-[40px]">
            <RideMap seed={ride.id + ride.to} />
            <div className="px-[18px] pt-[16px]">
              <div className="text-[13px] text-black/45">{ride.when}</div>
              <div className="text-[18px] font-bold mt-[2px]">{ride.kind}</div>
              <div className="mt-[14px] flex gap-[10px]">
                <div className="flex flex-col items-center pt-[7px]">
                  <span className="w-[8px] h-[8px] rounded-full bg-[#333]" />
                  <span className="w-px h-[26px] bg-black/15 my-[3px]" />
                  <span className="w-[8px] h-[8px] rounded-full bg-[#FFC800]" />
                </div>
                <div className="flex-1 text-[16px]">
                  <div>{ride.from}</div>
                  <div className="mt-[12px] font-semibold">{ride.to}</div>
                </div>
              </div>
              <div className="mt-[20px] rounded-[14px] bg-[#F5F6F7] p-[16px] text-[15px]">
                <div className="text-[16px] font-bold mb-[8px]">영수증</div>
                {(() => {
                  const f = fare(ride);
                  return (
                    <>
                      {[
                        ["기본요금", fmtWon(f.base)],
                        ["거리 · 시간 요금", fmtWon(f.dist)],
                        ["이동 거리", `${f.km}km`],
                        ["소요 시간", `${f.min}분`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-[3px]">
                          <span className="text-black/55">{k}</span>
                          <span>{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-[10px] mt-[6px] border-t border-black/10 text-[17px] font-bold">
                        <span>결제 금액</span>
                        <span>{ride.price}</span>
                      </div>
                      <div className="flex justify-between py-[3px] text-[14px] text-black/55">
                        <span>결제 수단</span>
                        <span>카카오페이</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Push>
      )}
    </div>
  );
}

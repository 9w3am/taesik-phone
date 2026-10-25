import type { Msg, PhoneData } from "./store";

/*
  기본 콘텐츠 — 최태식
  · 음지에서 혼자 일하는 해결사 / 청부업자. 회사·업체·조직·팀 없음. 수감 이력 없음.
  · 일은 소개로만 받고, 돈은 현금·남의 명의로 돈다. 합법 직장(경호업체, 행사 알바, 구인공고) 없음.
  · 이유노(남자) 전담 경호를 병행 중 — 경호업체 소속이 아님. 이유노 본인에 대한 설정·대화는 제작자가 /editor 에서 직접 작성 (여기서 지어내지 않음).
  · 가족 관련 내용 없음. 거주지·운동 장소 등 신상 특정 정보 없음 (은어·모호한 지명만)
  · 사진은 기본으로 넣지 않음 (에디터에서 직접 올린 사진만 표시)
*/

/** 기본 콘텐츠를 고치면 이 숫자를 올리세요 → 방문자 브라우저의 예전 저장본이 새 내용으로 바뀝니다 */
export const DATA_VERSION = 11;

let n = 0;
const id = () => `d${(n++).toString(36)}`;
const me = (text: string, x: Partial<Msg> = {}): Msg => ({ id: id(), from: "me", text, ...x });
const th = (text: string, x: Partial<Msg> = {}): Msg => ({ id: id(), from: "them", text, ...x });
const g = (who: string, text: string): Msg => ({ id: id(), from: "them", who, text });
const sys = (text: string): Msg => ({ id: id(), from: "system", text });
const day = (text: string): Msg => ({ id: id(), from: "system", kind: "date", text });
const pay = (from: "me" | "them", amount: number, text = ""): Msg => ({ id: id(), from, text, kind: "pay", amount });

export function defaultData(): PhoneData {
  n = 0;
  return {
    owner: "최태식",
    deviceName: "최태식의 iPhone",
    passcode: "0000",
    passcodeHint: "",
    carrier: "SKT",
    battery: 23,
    weather: { city: "서울", temp: 9, cond: "흐림", hi: 13, lo: 6 },
    allowSend: true,
    autoLockSec: 120,
    events: {
      incomingCall: {
        enabled: true,
        afterSec: 75,
        name: "알 수 없음",
        lines: ["……", "최태식 씨 맞죠.", "요즘 이유노 옆에 딱 붙어 계시던데.", "아니, 별말 아니고. 그냥 안부 전화예요.", "밤길 조심하시라고."],
      },
      banner: { enabled: false, afterSec: 30, app: "messages", title: "+82 10-****-4471", text: "아직 이 번호 쓰세요?" },
      lowBattery: { enabled: false, afterSec: 150 },
    },
    lockNotifs: [
      { app: "messages", title: "W", text: "새 번호로 다시 연락함. 이 방은 오늘 닫는다.", when: "지금" },
      { app: "kakao", title: "박 실장", text: "밤에 시간 되냐", when: "12분 전" },
      { app: "phone", title: "부재중 전화 (2)", text: "알 수 없음", when: "1시간 전" },
    ],

    /* ───────── 대화방 ───────── */
    threads: [
      /* ── 메시지 (iMessage / 문자) ── */
      {
        id: "yuno",
        app: "messages",
        name: "번호변경_이유노",
        unread: 0,
        pinned: true,
        last: "어제",
        messages: [sys("이 대화는 제작자가 직접 작성합니다. /editor 에서 수정하세요."), me("도착했습니다.")],
      },
      {
        id: "w",
        app: "messages",
        name: "W",
        unread: 1,
        pinned: true,
        last: "지금",
        unsendAfterRead: true,
        messages: [
          day("10월 19일 일요일"),
          th("물건 정리 확인."),
          th("잔금 들어감. 이번 건은 없던 일."),
          me("확인"),
          day("어제"),
          th("건 하나."),
          th("위치만. 손은 안 댐. 사흘."),
          me("자료"),
          th("평소 거기. 셋째 테이블 밑. 사진 두 장."),
          me("값"),
          th("평소의 두 배. 반은 지금."),
          me("왜 두 배"),
          th("묻지 않는 값까지."),
          me("확인"),
          th("끝나면 이 번호 버려."),
          th("새 번호로 다시 연락함. 이 방은 오늘 닫는다."),
        ],
      },
      {
        id: "park",
        app: "messages",
        name: "박 실장",
        unread: 0,
        last: "월요일",
        messages: [
          day("10월 20일 월요일"),
          th("너 요즘 낮엔 아예 안 된다며"),
          me("이유노 쪽 붙어 있습니다. 밤만 됩니다"),
          th("그거 얼마 받는다고 그렇게 붙어 있냐"),
          me("제 일입니다"),
          th("알았다. 밤에 하나 있으면 부를게. 이번엔 거절하지 마라"),
          me("조건 보고요"),
          th("전화 받아 좀"),
        ],
      },
      {
        id: "unknown",
        app: "messages",
        name: "+82 10-****-4471",
        unread: 2,
        last: "어제",
        messages: [
          th("소개받고 연락드립니다."),
          th("말씀하신 대로 현금으로 준비해놨어요. 반은 먼저 드릴 수 있습니다."),
          me("이 번호로 다시 연락하지 마세요. 연락은 제가 합니다."),
          th("알겠습니다. 죄송해요."),
          th("혹시 언제쯤 가능할까요"),
          th("아직 이 번호 쓰세요?"),
        ],
      },
      {
        id: "rat",
        app: "messages",
        name: "쥐 (새번호)",
        unread: 0,
        last: "토요일",
        messages: [
          me("요즘 그쪽 근처에 붙는 차 있는지 봐줘"),
          th("검은 세단 한 대. 사흘째 같은 자리"),
          th("번호 돌려보니 명의 따로 있음. 렌트 아님"),
          me("누구 쪽인지"),
          th("그건 값 따로"),
          me("보내"),
          th("오늘 밤에. 평소대로"),
        ],
      },
      {
        id: "debtor",
        app: "messages",
        name: "채무_ㅂ",
        unread: 0,
        last: "금요일",
        messages: [
          th("다음 주엔 진짜 꼭 드리겠습니다"),
          th("제발 집으로는 오지 마세요"),
          me("금요일"),
          th("금요일까지 반이라도"),
          me("전부"),
          th("……알겠습니다"),
        ],
      },
      {
        id: "wash",
        app: "messages",
        name: "세탁",
        unread: 0,
        last: "일요일",
        messages: [me("들어간다"), th("수수료 평소대로. 사흘."), th("한 번에 크게 넣지 말고"), me("알아서 해"), th("ㅇㅋ")],
      },
      {
        id: "oh",
        app: "messages",
        name: "오 원장 (뒷문)",
        unread: 0,
        last: "화요일",
        messages: [
          me("새벽에 문 엽니까"),
          th("뒷문으로 오세요. 접수는 안 합니다."),
          me("제 거 아닙니다. 거즈랑 소독약만"),
          th("현금만 받아요. 그리고 또 다쳐서 오면 그땐 안 봐줍니다."),
          me("네"),
          th("실밥은 열흘 뒤에 빼러 오시고"),
        ],
      },
      {
        id: "demo",
        app: "messages",
        name: "철거_김씨",
        unread: 0,
        last: "10. 19.",
        messages: [th("형님 그 건물 다음 주에 철거 들어갑니다"), th("안에 뭐 남은 거 있으면 그 전에 빼세요"), me("없어"), th("넵. 그럼 그냥 밀겠습니다")],
      },
      {
        id: "usim",
        app: "messages",
        name: "U",
        unread: 0,
        last: "10. 18.",
        messages: [me("하나 더"), th("월말에 들어옴"), th("받으면 기존 거 바로 버려요")],
      },
      {
        id: "deliv",
        app: "messages",
        name: "#1588",
        unread: 0,
        last: "어제",
        messages: [
          th("[Web발신]\n[OO택배] 고객님의 상품이 무인택배함에 보관되었습니다.\n보관함: 14번\n상품명: 차량용 블랙박스 메모리카드 128G 외 1건"),
        ],
      },
      {
        id: "card",
        app: "messages",
        name: "체크카드",
        unread: 0,
        last: "오늘",
        messages: [
          th("[Web발신]\n체크(2*4*) 승인\n최*식님\n82,000원\nOO셀프주유소\n잔액 8,212,600원"),
          th("[Web발신]\n체크(2*4*) 승인\n최*식님\n9,000원\n24시 OO국밥\n잔액 8,203,600원"),
          th("[Web발신]\n체크(2*4*) 승인\n최*식님\n38,500원\nOO철물\n잔액 8,165,100원"),
        ],
      },
      {
        id: "parking",
        app: "messages",
        name: "02-***-1290",
        unread: 1,
        last: "목요일",
        messages: [th("[Web발신]\n[주정차 위반 사전통지]\n차량번호 **너 **12\n위반장소: OO로 이면도로\n과태료 40,000원(자진납부 시 32,000원)")],
      },
      {
        id: "otp",
        app: "messages",
        name: "15990011",
        unread: 0,
        last: "10. 21.",
        messages: [th("[Web발신]\n[인증번호:482913] 본인확인을 위해 인증번호를 입력해 주세요. 타인 노출 금지")],
      },
      {
        id: "spam",
        app: "messages",
        name: "080-***-0021",
        unread: 0,
        last: "10. 20.",
        messages: [th("[Web발신]\n(광고) 무직자 OK 당일 승인 상담만 해도 OK\n무료거부 080-***-0021")],
      },


      /* ── 인스타그램 DM ── */
      {
        id: "ig_anon",
        app: "insta",
        name: "x_x.0217",
        unread: 1,
        last: "어제",
        messages: [th("혹시 최태식 씨 맞으세요?"), th("소개받은 사람인데 여기로 연락드려도 될까요")],
      },
      {
        id: "ig_car",
        app: "insta",
        name: "used_car.kim",
        unread: 0,
        last: "3일",
        messages: [me("그 세단 아직 있어요?"), th("네 형님 있습니다 ㅎㅎ 현금이면 더 빼드려요"), me("명의 이전은 나중에"), th("아 그런 건은 좀… 전화로 얘기하시죠")],
      },

      /* ── 카카오톡 ── */
      {
        id: "k_park",
        app: "kakao",
        name: "박 실장",
        unread: 1,
        last: "오후 9:12",
        messages: [
          day("2026년 10월 24일 토요일"),
          th("태식아"),
          th("국밥 한 그릇 하자"),
          me("이번 주는 어렵습니다"),
          th("너 요즘 얼굴 보기 힘들다"),
          th("밤에 시간 되냐"),
        ],
      },
      {
        id: "k_kim",
        app: "kakao",
        name: "김기사 (탁송)",
        unread: 0,
        last: "어제",
        messages: [
          me("차 하나 더. 사흘만"),
          th("렌트 말고 지인 명의로 하나 있습니다"),
          th("형님 차는 세차하고 빼놨습니다. 키는 늘 두던 데"),
          me("블박 메모리 빼놔"),
          th("넵"),
          pay("me", 150000, "기름값"),
          th("감사합니다 형님"),
        ],
      },
      {
        id: "k_garage",
        app: "kakao",
        name: "정비 형님",
        unread: 0,
        last: "화요일",
        messages: [
          th("타이어 앞 두 짝 갈았어. 뒤도 곧 갈아야 돼"),
          th("근데 조수석 문짝 긁힌 건 뭐냐"),
          me("주차하다가요"),
          th("주차를 칼로 하냐"),
          me("얼마예요"),
          th("이십오. 계좌로"),
          pay("me", 250000, "타이어"),
        ],
      },
      {
        id: "k_gukbap",
        app: "kakao",
        name: "24시 국밥 사장님",
        unread: 0,
        last: "10. 20.",
        messages: [th("총각 어제 두고 간 우산 카운터에 있어"), me("감사합니다 사장님"), th("요새 밥은 먹고 다녀? 얼굴이 반쪽이야"), me("먹고 다닙니다")],
      },
      {
        id: "k_pay",
        app: "kakao",
        name: "카카오페이",
        unread: 1,
        last: "오늘",
        messages: [pay("them", 150000, "송금 완료 · 김*기"), pay("them", 250000, "송금 완료 · 정비"), pay("them", 38500, "결제 완료 · OO철물")],
      },
      {
        id: "k_self",
        app: "kakao",
        name: "나와의 채팅",
        unread: 0,
        last: "어제",
        messages: [
          me("동선 A / B 매일 바꿔서"),
          me("차 교대는 공영주차장"),
          me("붙는 차 — 흰 SUV / 검은 세단 (번호 앞자리 다름)"),
          me("비 오는 날은 B"),
        ],
      },
    ],

    /* ───────── 통화 기록 (상대 대사만) ───────── */
    calls: [
      { id: id(), name: "알 수 없음", kind: "missed", label: "발신자 정보 없음", count: 2, when: "오후 8:51", lines: ["……", "(아무 말 없이 숨소리만 들리다 끊긴다)"] },
      {
        id: id(),
        name: "박 실장",
        number: "010-****-0004",
        kind: "in",
        label: "휴대전화",
        when: "오후 6:20",
        lines: ["어, 태식아. 바쁘냐.", "다른 게 아니고, 밤에 건 하나 있는데.", "니가 요즘 낮엔 안 된다는 거 알아. 그러니까 밤이라고.", "겁만 주면 돼. 손은 안 대는 걸로.", "생각해 보고 연락 줘. 끊는다."],
      },
      { id: id(), name: "번호변경_이유노", kind: "out", label: "휴대전화", when: "어제", lines: ["(제작자가 작성할 통화 내용)"] },
      { id: id(), name: "오 원장 (뒷문)", kind: "out", label: "휴대전화", when: "화요일", lines: ["또 다쳤어요?", "본인 거 아니라고요. 그 말 몇 번째예요.", "뒷문 열어둘 테니까 현금 챙겨 와요."] },
      { id: id(), name: "김기사 (탁송)", kind: "in", label: "휴대전화", when: "월요일", lines: ["형님, 차 빼놨습니다.", "번호판은 원래 걸로 다시 끼워놨고요.", "키는 늘 두던 데 있어요."] },
      { id: id(), name: "+82 10-****-4471", kind: "missed", label: "휴대전화", count: 3, when: "일요일", lines: ["저, 소개받고 연락드렸던…", "통화 가능하실 때 연락 부탁드려요."] },
      { id: id(), name: "쥐 (새번호)", kind: "in", label: "휴대전화", when: "토요일", lines: ["사진 보냈어요.", "그 세단, 생각보다 귀찮은 쪽 차 같은데.", "더 알아보려면 값 따로예요."] },
    ],

    /* ───────── 연락처 ───────── */
    contacts: [
      { id: id(), name: "번호변경_이유노", phone: "010-****-0417", label: "휴대전화", fav: true },
      { id: id(), name: "박 실장", phone: "010-****-0004", label: "휴대전화", fav: true, note: "일 물어오는 사람. 수수료 떼감" },
      { id: id(), name: "W", phone: "070-****-0319", label: "기타", note: "번호 자주 바뀜" },
      { id: id(), name: "오 원장 (뒷문)", phone: "010-****-8890", label: "휴대전화", note: "현금만. 새벽 가능." },
      { id: id(), name: "김기사 (탁송)", phone: "010-****-1123", label: "휴대전화" },
      { id: id(), name: "철거_김씨", phone: "010-****-6604", label: "휴대전화", note: "정리 필요할 때만" },
      { id: id(), name: "세탁", phone: "010-****-3017", label: "휴대전화", note: "통화 X. 문자만." },
      { id: id(), name: "쥐 (새번호)", phone: "010-****-5512", label: "휴대전화" },
      { id: id(), name: "쥐 (X)", phone: "010-****-0981", label: "휴대전화", note: "번호 버림" },
      { id: id(), name: "U", phone: "070-****-0001", label: "기타" },
      { id: id(), name: "열쇠 박사장", phone: "010-****-9201", label: "직장" },
      { id: id(), name: "정비 형님", phone: "010-****-7781", label: "직장" },
      { id: id(), name: "견인 24시", phone: "1577-****", label: "직장" },
      { id: id(), name: "24시 국밥 사장님", phone: "02-***-1124", label: "직장" },
      { id: id(), name: "흥신소 장 (하청)", phone: "010-****-2240", label: "휴대전화", note: "미행 하청 줄 때" },
      { id: id(), name: "의뢰_0927", phone: "010-****-4471", label: "휴대전화" },
      { id: id(), name: "의뢰_1103", phone: "010-****-7012", label: "휴대전화" },
      { id: id(), name: "채무_ㅂ", phone: "010-****-2288", label: "휴대전화", note: "잔금 남음" },
      { id: id(), name: "대상_ㅅ (두절)", phone: "010-****-0912", label: "휴대전화" },
      { id: id(), name: "장비_무전기", phone: "010-****-3355", label: "휴대전화" },
      { id: id(), name: "중고차 김 (현금)", phone: "010-****-6120", label: "휴대전화" },
      { id: id(), name: "대리운전", phone: "1588-****", label: "직장" },
      { id: id(), name: "Ahn 형", phone: "010-****-1987", label: "휴대전화" },
    ],

    /* ───────── 메모 ───────── */
    notes: [
      {
        id: id(),
        folder: "메모",
        title: "",
        pinned: true,
        when: "오후 9:02",
        body:
          "장부\n\n진행 중\n[ ] 이유노 — 전담\n[ ] ㅂ 수금 — 잔금 남음. 겁만\n[ ] 0927 소재 파악 — 착수금 받음. 사흘\n\n입금 대기\n[ ] 1103 — 잔금 (월말)\n[ ] 박 실장 소개 건 — 수수료 떼고 정산\n\n완료\n[x] ㄱ 수금 — 세탁 끝\n[x] 차 옮기기 (김기사) — 정리\n[x] 흥신소 하청 미행 3일 — 정산 완",
      },
      {
        id: id(),
        folder: "메모",
        title: "",
        pinned: true,
        when: "어제",
        body: "이유노 — 이동\n\n동선 매일 바꿀 것\n차 두 대 교대. 같은 자리 주차 X\n식당은 창가 X, 출입구 보이는 자리\n이동 전에 미리 한 바퀴",
      },
      { id: id(), folder: "메모", title: "", when: "10. 02.", body: "규칙\n\n1. 같은 번호 두 달 이상 안 씀\n2. 일 얘기는 전화 X. 문자도 짧게\n3. 현금은 나눠서\n4. 착수금 없으면 안 움직임" },
      { id: id(), folder: "메모", title: "", when: "10. 11.", body: "챙길 거\n\n[x] 장갑 (니트릴 / 가죽)\n[x] 손전등\n[ ] 여분 유심\n[x] 방수포\n[ ] 블박 메모리 교체\n[x] 구급 — 거즈, 지혈대, 봉합 테이프\n[ ] 셔츠 한 치수 큰 거" },
      { id: id(), folder: "메모", title: "", when: "어제", body: "0927 — 대상\n\n평일 밤 11시쯤 귀가\n편의점 들렀다 감 (같은 곳)\n차 없음. 택시 자주\n주말엔 거의 안 나옴\n\n→ 확인되면 W한테 보고" },
      { id: id(), folder: "메모", title: "", when: "10. 15.", body: "수금\n\nㄱ — 완\nㅂ — 잔금 남음. 다음 주\nㅅ — 연락 두절. 다시 확인\n\n세탁 수수료 빼고 계산" },
      { id: id(), folder: "메모", title: "", when: "9. 28.", body: "번호 바꿀 때 알릴 사람\n박 실장, 쥐, 김기사, 오 원장\n끝" },
      { id: id(), folder: "메모", title: "", lockCode: "0000", when: "9. 03.", body: "비상시\n\n현금 — 늘 두던 데\n차 키 — 김기사한테 하나 더\n오 원장 뒷문\n\n번호 버리고 일주일 잠수" },
      // ── '의뢰' 폴더: 일 들어오는 경로와 의뢰서 (전부 에디터에서 수정 가능) ──
      {
        id: id(),
        folder: "의뢰",
        title: "",
        pinned: true,
        when: "9. 01.",
        body: "의뢰 받는 경로\n\n1. 박 실장 — 소개. 수수료 떼감. 얼굴 보고 받음\n2. W — 번호 매번 바뀜. 문자로 건만 옴. 자료는 평소 거기\n3. 그 외 — 소개 없는 번호는 안 받음\n\n순서\n[x] 접수 (코드: 날짜 4자리)\n[x] 착수금 반\n[x] 자료 받기\n[ ] 진행\n[ ] 보고\n[ ] 잔금\n[ ] 번호 정리",
      },
      {
        id: id(),
        folder: "의뢰",
        title: "",
        when: "어제",
        body: "#0927\n\n경로: W\n내용: 소재 파악 (접촉 X)\n기한: 사흘\n보수: 평소의 두 배 · 착수금 반 입금 완료\n자료: 사진 두 장 (평소 거기)\n상태: 진행 중\n\n[x] 착수금 확인\n[x] 자료 회수\n[ ] 위치 확인\n[ ] W 보고",
      },
      {
        id: id(),
        folder: "의뢰",
        title: "",
        when: "10. 22.",
        body: "#1103\n\n경로: 박 실장 소개\n내용: 차 옮기기 + 정리\n보수: 착수금 입금 완료 · 잔금 월말\n상태: 잔금 대기\n\n[x] 착수금\n[x] 진행\n[ ] 잔금",
      },
      {
        id: id(),
        folder: "의뢰",
        title: "",
        when: "10. 05.",
        body: "#ㅂ (수금 대행)\n\n경로: 박 실장\n내용: 받을 돈 대신 받기\n조건: 받은 돈의 3할\n상태: 잔금 남음 · 금요일\n\n[x] 1차 수금\n[ ] 2차 수금",
      },
    ],

    /* ───────── 캘린더 (요일 반복) ───────── */
    calendar: [
      { id: id(), days: [1, 2, 3, 4, 5, 6], time: "", title: "이유노", color: "#FF3B30" },
      { id: id(), days: [3], time: "14:00", title: "정비 — 타이어 뒤", color: "#FF9500" },
      { id: id(), days: [4], time: "23:30", title: "평소 거기", color: "#8E8E93" },
      { id: id(), days: [6], time: "04:00", title: "뒷문 — 실밥", color: "#34C759" },
      { id: id(), days: [0], time: "", title: "장비 점검 · 번호 교체", color: "#007AFF" },
      { id: id(), days: [5], time: "22:00", title: "0927 확인", color: "#AF52DE" },
    ],
    dday: { title: "월말 정산", date: "" },

    /* ───────── 은행 ───────── */
    bank: {
      name: "입출금 통장",
      account: "1002-***-****41",
      balance: 8165100,
      txs: [
        { id: id(), when: "오늘", name: "OO철물", amount: -38500, memo: "체크카드" },
        { id: id(), when: "오늘", name: "24시 OO국밥", amount: -9000, memo: "체크카드" },
        { id: id(), when: "오늘", name: "OO셀프주유소", amount: -82000, memo: "체크카드" },
        { id: id(), when: "어제", name: "김*기", amount: -150000, memo: "카카오페이 송금" },
        { id: id(), when: "어제", name: "ATM 현금입금", amount: 900000, memo: "편의점" },
        { id: id(), when: "10. 22.", name: "(주)한**상사", amount: 3000000, memo: "1103 착수금" },
        { id: id(), when: "10. 22.", name: "ATM 현금입금", amount: 900000, memo: "편의점" },
        { id: id(), when: "10. 21.", name: "정*비", amount: -250000, memo: "카카오페이 송금" },
        { id: id(), when: "10. 20.", name: "이*정", amount: 700000, memo: "0927 착수금" },
        { id: id(), when: "10. 18.", name: "ATM 출금", amount: -2000000, memo: "편의점" },
        { id: id(), when: "10. 17.", name: "SKT 통신요금", amount: -68500, memo: "자동이체" },
        { id: id(), when: "10. 15.", name: "차량 할부", amount: -412000, memo: "자동이체" },
        { id: id(), when: "10. 15.", name: "자동차보험", amount: -96400, memo: "자동이체" },
        { id: id(), when: "10. 13.", name: "주차장 정기권", amount: -120000, memo: "체크카드" },
        { id: id(), when: "10. 10.", name: "월세", amount: -650000, memo: "자동이체" },
        { id: id(), when: "10. 08.", name: "약국", amount: -14200, memo: "체크카드" },
        { id: id(), when: "10. 05.", name: "박*수", amount: 1500000, memo: "ㅂ 1차" },
      ],
    },

    /* ───────── 음악 (곡 정보만, 링크 아웃) ───────── */
    songs: [
      { id: id(), title: "Nights", artist: "Frank Ocean", album: "Blonde", url: "", hue: 18 },
      { id: id(), title: "Redbone", artist: "Childish Gambino", album: "\"Awaken, My Love!\"", url: "", hue: 340 },
      { id: id(), title: "기다린 만큼, 더", artist: "검정치마", album: "Thirsty", url: "", hue: 210 },
      { id: id(), title: "Everybody Wants To Rule The World", artist: "Tears For Fears", album: "Songs from the Big Chair", url: "", hue: 45 },
      { id: id(), title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", url: "", hue: 0 },
      { id: id(), title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", url: "", hue: 260 },
      { id: id(), title: "Wicked Game", artist: "Chris Isaak", album: "Heart Shaped World", url: "", hue: 30 },
      { id: id(), title: "Ivy", artist: "Frank Ocean", album: "Blonde", url: "", hue: 120 },
    ],

    /* ───────── 사진 (원래 있던 사진 3장 + 에디터에서 업로드한 사진) ───────── */
    photos: [
      { id: "ph-parking", asset: "parking", caption: "", when: "어제" },
      { id: "ph-gukbap", asset: "gukbap", caption: "평소 거기", when: "화요일", fav: true },
      { id: "ph-alley", asset: "alley", caption: "", when: "10. 20." },
      // 최근 삭제된 항목 (지웠지만 30일 동안 남아 있는 사진)
      { id: "ph-del1", asset: "parking", caption: "", when: "10. 14.", deleted: true },
    ],

    /* ───────── 인스타그램 ───────── */
    ig: {
      me: { handle: "t.s_choi", name: "", bio: "", posts: 0, followers: 12, following: 31, private: true },
      users: [
        { handle: "seoul_incident", name: "서울 사건사고", bio: "제보 DM", posts: 3120, followers: 98000, following: 2 },
        { handle: "night.drive.seoul", name: "야간 드라이브", bio: "밤에만 찍습니다", posts: 412, followers: 18200, following: 80 },
        { handle: "used_car.kim", name: "중고차 김실장", bio: "현금 거래 환영 · 전국 탁송", posts: 230, followers: 5120, following: 301 },
        { handle: "gukbap_24h", name: "24시 국밥", bio: "새벽에도 끓입니다", posts: 96, followers: 2310, following: 12 },
        { handle: "x_x.0217", name: "", bio: "", posts: 0, followers: 3, following: 40, private: true },
      ],
      feed: [
        { id: id(), user: "seoul_incident", caption: "제보는 DM으로 받습니다", photo: "", likes: 342, comments: 57, when: "5시간 전" },
        { id: id(), user: "night.drive.seoul", caption: "비 오는 날 이면도로. 와이퍼 소리만", photo: "", likes: 1204, comments: 18, when: "어제" },
      ],
      stories: ["seoul_incident", "night.drive.seoul", "used_car.kim", "gukbap_24h"],
      // 스토리: 사진 없이 글자 스토리(인스타 만들기 텍스트 모드). photo에 사진 ID를 넣으면 사진 스토리
      storyItems: [
        { id: id(), user: "seoul_incident", text: "제보는 DM\n익명 보장", bg: "linear-gradient(160deg,#1c1c1e,#3a0d0d)", when: "2시간" },
        { id: id(), user: "seoul_incident", text: "오늘 밤 비 소식\n운전 조심", bg: "linear-gradient(160deg,#111,#2b2b2b)", when: "5시간", style: "box" },
        { id: id(), user: "night.drive.seoul", text: "비 오는 날은\n이면도로가 제일 조용함", bg: "linear-gradient(170deg,#0f1b2d,#273a55)", when: "8시간" },
        { id: id(), user: "used_car.kim", text: "그랜저 IG 블랙 입고\n현금 상담 DM\n명의 문의 X", bg: "linear-gradient(160deg,#2c2c2c,#000)", when: "11시간", style: "box" },
        { id: id(), user: "gukbap_24h", text: "오늘도 새벽까지\n끓입니다", bg: "linear-gradient(160deg,#3b2414,#120a05)", when: "15시간" },
      ],
      // DM 상단 노트
      notes: [
        { user: "used_car.kim", text: "현금 매입 상시" },
        { user: "x_x.0217", text: "답장 기다려요" },
        { user: "night.drive.seoul", text: "오늘 밤 비" },
      ],
    },

    /* ───────── 사파리 ───────── */
    safari: {
      favorites: [
        { title: "Google", url: "google.com" },
        { title: "NAVER", url: "m.naver.com" },
        { title: "YouTube", url: "m.youtube.com" },
        { title: "나무위키", url: "namu.wiki" },
        { title: "당근", url: "daangn.com" },
        { title: "번개장터", url: "m.bunjang.co.kr" },
        { title: "쿠팡", url: "m.coupang.com" },
        { title: "X", url: "x.com" },
      ],
      history: ["OO항 여객선 시간표", "단기 월세 현금", "그랜저 IG 현금", "아이폰 공기계", "오늘 밤 비", "검정 가죽 장갑"],
      tabs: [
        {
          id: id(),
          title: "OO항 여객선 시간표 - Google 검색",
          url: "google.com",
          page: {
            type: "search",
            engine: "google",
            query: "OO항 여객선 시간표",
            results: [
              { title: "OO항 여객선 운항 시간표 (동절기)", url: "island.example.kr", desc: "첫배 06:30 · 막배 17:40. 기상 악화 시 결항. 매표소 현장 발권 가능.", source: "여객선 예약" },
              { title: "섬 들어가는 배, 현장에서 표 살 수 있나요?", url: "m.blog.naver.com", desc: "신분증 확인은 하지만 현장 발권 가능합니다. 주말엔 차량 선적 일찍 마감돼요.", source: "네이버 블로그" },
            ],
          },
        },
        {
          id: id(),
          title: "원룸 단기 임대 | 당근",
          url: "daangn.com",
          page: {
            type: "market",
            site: "daangn",
            title: "원룸 단기 2주~ 가능 (보증금 없음)",
            price: "주 25만원",
            area: "OO동",
            seller: "집주인직거래",
            temp: 38.1,
            meta: "부동산 · 1일 전 · 관심 22 · 채팅 9",
            photo: "",
            body: "풀옵션 원룸. 단기 가능합니다.\n계약서 따로 안 쓰고 현금으로 하셔도 됩니다.\n주차 1대 가능. 입구 따로라 출입 편해요.",
          },
        },
        {
          id: id(),
          title: "그랜저 IG 2019 블랙 - 엔카",
          url: "m.encar.com",
          page: {
            type: "car",
            title: "현대 그랜저 IG 3.0 익스클루시브",
            price: "1,890만원",
            specs: [
              ["연식", "19/03식"],
              ["주행거리", "84,210km"],
              ["연료", "가솔린"],
              ["색상", "검정"],
              ["사고", "단순교환 1회"],
              ["압류·저당", "없음"],
            ],
            body: "1인 신조 차량, 정비 이력 확인 가능합니다.\n선팅 전면 포함 진하게 되어 있습니다.\n현금 구매 시 상담 가능.",
            dealer: "OO오토 · 김실장",
          },
        },
        {
          id: id(),
          title: "아이폰 공기계 2대 | 번개장터",
          url: "m.bunjang.co.kr",
          page: {
            type: "market",
            site: "bunjang",
            title: "아이폰 공기계 2대 일괄 (초기화 완료, 유심 X)",
            price: "260,000원",
            area: "직거래만",
            seller: "폰정리",
            temp: 0,
            meta: "4시간 전 · 찜 3 · 조회 87",
            photo: "",
            body: "둘 다 초기화 완료.\n공기계라 개통 이력 없음. 박스 없습니다.\n직거래만. 현금만.",
          },
        },
        {
          id: id(),
          title: "검정 가죽 장갑 : 쿠팡",
          url: "m.coupang.com",
          page: { type: "shop", name: "남성 양가죽 장갑 슬림핏 블랙, 1켤레", price: "29,800원", discount: "31%", rating: 4.5, reviews: 3812, delivery: "내일(월) 도착 보장", seller: "로켓배송" },
        },
        {
          id: id(),
          title: "오늘 밤 비 : 네이버 검색",
          url: "m.search.naver.com",
          page: {
            type: "search",
            engine: "naver",
            query: "오늘 밤 비",
            results: [
              { title: "오늘 밤부터 비… 새벽까지 이어져", url: "n.news.naver.com", desc: "밤부터 전국에 비가 내리겠고, 비는 내일 새벽까지 이어지겠습니다. 운전 시 시야 확보에 유의해야겠습니다.", source: "뉴스" },
              { title: "날씨 - 시간별 예보", url: "m.weather.naver.com", desc: "21시 비 70% · 00시 비 80% · 03시 흐림", source: "네이버 날씨" },
            ],
          },
        },
      ],
    },

    alarms: [
      { id: id(), time: "05:40", label: "기상", on: true },
      { id: id(), time: "06:30", label: "이유노", on: true },
      { id: id(), time: "23:10", label: "0927", on: false },
      { id: id(), time: "03:30", label: "뒷문", on: false },
    ],
    places: [
      { id: id(), name: "평소 거기", note: "24시 국밥", x: 0.32, y: 0.38 },
      { id: id(), name: "공영주차장", note: "3층. 차 교대", x: 0.62, y: 0.52 },
      { id: id(), name: "셀프세차장", note: "", x: 0.2, y: 0.7 },
      { id: id(), name: "뒷문", note: "오 원장", x: 0.75, y: 0.25 },
      { id: id(), name: "정비", note: "", x: 0.48, y: 0.8 },
    ],
    kakaoProfile: { status: "" },
    sounds: { muted: false, ringtone: "preset:ring-marimba3", notify: "preset:noti-clear" },
    triggers: [],
  };
}

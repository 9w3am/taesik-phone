/*
  AI 콘텐츠 생성 — 정적 사이트라 서버가 없으므로, 제작자 본인의 Anthropic API 키로 브라우저에서 직접 호출한다.
  · 키는 이 브라우저의 LocalStorage에만 저장되고, JSON 내보내기/게시 데이터에는 절대 포함되지 않는다.
  · 방문자 화면(폰)에서는 호출하지 않는다. /editor 에서만 사용.
*/
const KEY_STORE = "taesik-phone:ai";
export type AiConf = { apiKey: string; model: string };
export const DEFAULT_MODEL = "claude-sonnet-5-5";

export function loadAiConf(): AiConf {
  try {
    return { apiKey: "", model: DEFAULT_MODEL, ...JSON.parse(localStorage.getItem(KEY_STORE) || "{}") };
  } catch {
    return { apiKey: "", model: DEFAULT_MODEL };
  }
}
export function saveAiConf(c: AiConf) {
  localStorage.setItem(KEY_STORE, JSON.stringify(c));
}

export type AiTarget = "thread" | "notes" | "events" | "calls";

const SHAPES: Record<AiTarget, string> = {
  thread: `{"name": "대화 상대 저장명", "members": 숫자 또는 null(1:1이면 null), "messages": [{"from": "me" | "them" | "system", "who": "단체방일 때 발신자 이름(선택)", "text": "내용"}]}`,
  notes: `{"notes": [{"title": "제목", "body": "첫 줄은 제목과 같게. 체크리스트는 줄 앞에 [ ] 또는 [x]"}]}`,
  events: `{"events": [{"title": "일정명", "days": [요일 숫자 0=일~6=토], "time": "HH:MM 또는 빈 문자열"}]}`,
  calls: `{"calls": [{"name": "저장명", "kind": "missed" | "in" | "out", "lines": ["상대방 대사만, 한 문장씩"]}]}`,
};

export async function generate(conf: AiConf, opts: { target: AiTarget; app?: string; setting: string; relation: string; mood: string; extra: string }) {
  if (!conf.apiKey) throw new Error("API 키를 먼저 입력하세요");
  const system = [
    "너는 트위터 자캐 커뮤니티용 '남의 폰 훔쳐보기' 웹의 콘텐츠 작가다.",
    "폰 주인은 최태식. 음지에서 혼자 일하는 프로 해결사/청부업자(범법자). 조직·팀·업체 소속 없음, 수감 이력 없음. 최근 '이유노'의 전담 경호를 병행 중이다.",
    "이유노는 남자다.",
    "절대 규칙:",
    "- 제작자가 적지 않은 캐릭터 설정(성별·나이·외모·성격·과거·말투·직장·관계)은 절대 지어내지 않는다. 최태식과 이유노에 대해서는 주어진 사실만 쓴다.",
    "- 가족(부모/형제 등) 언급 금지.",
    "- 거주지 동·호수, 다니는 헬스장 등 신상을 특정하는 실제 위치 금지. 지명은 '평소 거기', 'OO동'처럼 모호하게.",
    "- 메시지에 시간 표기(오전/오후 00:00) 금지. 이모지 남발 금지. 실제 사람이 쓴 것처럼 짧고 건조하게.",
    "- 범죄를 실제로 따라 할 수 있는 구체적 방법(제조법, 해킹 절차 등)은 쓰지 않는다. 분위기와 관계만 묘사.",
    "- 관전자(독자)의 목소리는 넣지 않는다.",
    `반드시 다음 JSON 형식 하나만 출력하라. 설명 문장 금지:\n${SHAPES[opts.target]}`,
  ].join("\n");
  const user = [
    opts.app ? `앱: ${opts.app}` : "",
    `캐릭터/세계관 설정: ${opts.setting || "(기본 설정)"}`,
    `관계: ${opts.relation || "(자유)"}`,
    `원하는 분위기: ${opts.mood || "건조하고 현실적인 음지 분위기"}`,
    opts.extra ? `추가 요청: ${opts.extra}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": conf.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: conf.model || DEFAULT_MODEL, max_tokens: 4000, system, messages: [{ role: "user", content: user }] }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `요청 실패 (${r.status})`);
  const text: string = (j.content || []).map((c: { type: string; text?: string }) => (c.type === "text" ? c.text : "")).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("응답에서 JSON을 찾지 못했습니다");
  return JSON.parse(m[0]);
}

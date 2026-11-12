// ===== 욕 · 비방 걸러내기 (홈 board.js와 board.html의 boardpage.js가 같이 씀) =====
// 단어를 고칠 때는 이 파일과 firestore.rules의 clean() 두 곳을 같이 고치세요.
// 올릴 수 없는 말(욕 · 비방). 띄어쓰기나 기호를 끼워 넣어도(예: "시 발") 걸러냄. firestore.rules의 clean()에도 같은 단어를 둠
export const BAD_WORDS = [
  "시발", "씨발", "씨바", "시바", "ㅅㅂ", "ㅆㅂ", "병신", "븅신", "ㅂㅅ", "지랄", "ㅈㄹ", "존나", "졸라", "좆", "개새끼", "개세끼",
  "미친놈", "미친년", "미친새끼", "꺼져", "닥쳐", "엿먹", "느금마", "니미", "니애미", "애미", "창녀", "걸레같", "한남충", "김치녀",
  "사기꾼", "뒤져", "죽어버려", "죽여버", "자살해", "fuck", "shit", "bitch", "asshole", "bastard"
];
const NORMAL_BAD = BAD_WORDS.map((w) => w.toLowerCase());
export function isClean(...texts) {
  // 한글 · 영어 글자만 남기고(띄어쓰기 · 숫자 · 기호 제거) 소문자로 바꿔서 검사
  const t = texts.join(" ").toLowerCase().replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z]/g, "");
  return !NORMAL_BAD.some((w) => t.includes(w));
}
export const BAD_MSG = "욕이나 비방으로 보이는 말이 들어 있어서 올릴 수 없어요. 표현을 바꿔 주세요.";

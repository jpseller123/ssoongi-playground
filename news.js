// ===== 전체 소식 페이지 (news.html) =====
// 홈(board.js)과 같은 Firebase 프로젝트의 `news` 모음을 읽어 와서 최대 100개를 보여 줌.
// 읽기는 누구나, 삭제는 관리자만(진짜 막는 곳은 firestore.rules). firebaseConfig는 공개돼도 되는 값.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, query, where, documentId, orderBy, limit, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4ixsBuPodIqO3_utYpU_vXXok48vTNMM",
  authDomain: "ssoongi-playground.firebaseapp.com",
  projectId: "ssoongi-playground",
  storageBucket: "ssoongi-playground.firebasestorage.app",
  messagingSenderId: "36655522243",
  appId: "1:36655522243:web:373754b3ca179449275d76"
};
const ADMIN_EMAIL = "ilovejydh@gmail.com";   // board.js · firestore.rules와 같은 값

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const loginBtn = $("loginBtn"), newsList = $("newsList"), newsCount = $("newsCount"), newsForm = $("newsForm");
const FACES = [["ssoongi", "--pastel-yellow"], ["mongi", "--pastel-blue"], ["kongi", "--pastel-green"], ["byeoli", "--pastel-peach"]];
let isAdmin = false;
let me = null;
let news = null;   // 아직 못 불러왔으면 null

// ----- 맨 위 고정 (관리자가 최대 3개까지) -----
// 고정한 소식의 번호는 `meta/pins` 문서의 ids에 저장함(규칙에서도 3개까지로 제한). 오래된 소식도 고정할 수 있어서 따로 불러옴
const MAX_PINS = 3;
let pinIds = [];       // 고정된 소식 번호들(새로 고정한 것이 앞)
let pinnedNews = [];   // 실제로 있는 고정 소식들
let stopPinned = null;
function watchPinned() {
  if (stopPinned) { stopPinned(); stopPinned = null; }
  if (!pinIds.length) { pinnedNews = []; draw(); return; }
  stopPinned = onSnapshot(
    query(collection(db, "news"), where(documentId(), "in", pinIds)),
    (snap) => {
      const byId = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
      pinnedNews = pinIds.map((id) => byId.get(id)).filter(Boolean);   // 지워진 소식은 빠짐
      draw();
    },
    () => { pinnedNews = []; draw(); }
  );
}
onSnapshot(doc(db, "meta", "pins"), (snap) => {
  const ids = snap.exists() ? snap.data().ids : [];
  pinIds = Array.isArray(ids) ? ids.slice(0, MAX_PINS) : [];
  watchPinned();
}, () => { pinIds = []; watchPinned(); });

async function togglePin(n) {
  const isPinned = pinnedNews.some((x) => x.id === n.id);
  let ids;
  if (isPinned) ids = pinnedNews.map((x) => x.id).filter((id) => id !== n.id);
  else {
    if (pinnedNews.length >= MAX_PINS) { alert("고정은 " + MAX_PINS + "개까지예요. 다른 소식의 고정을 먼저 풀어 주세요."); return; }
    ids = [n.id, ...pinnedNews.map((x) => x.id)];
  }
  try { await setDoc(doc(db, "meta", "pins"), { ids }); }
  catch (err) { alert("고정을 바꾸지 못했어요. (" + err.code + ")"); }
}

async function login() {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) {
    if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request")
      alert("로그인에 실패했어요. 잠시 뒤 다시 해 주세요. (" + e.code + ")");
  }
}
loginBtn.addEventListener("click", () => (me ? signOut(auth) : login()));
onAuthStateChanged(auth, (user) => {
  me = user;
  isAdmin = !!user && user.emailVerified && user.email === ADMIN_EMAIL;
  loginBtn.textContent = user ? "로그아웃" : "로그인";
  newsForm.hidden = !isAdmin;   // 관리자에게만 소식 쓰기 칸이 보임
  draw();   // 관리자에게만 '삭제' 버튼이 보이게 다시 그림
});

// ----- 소식 쓰기 (관리자만) -----
newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) return;
  const title = $("newsTitle").value.trim(), body = $("newsBody").value.trim();
  if (!title) return;
  const btn = newsForm.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "news"), { title, body, createdAt: serverTimestamp() });
    newsForm.reset();
  } catch (err) {
    alert("소식을 올리지 못했어요. (" + err.code + ")");
  }
  btn.disabled = false;
});

function fmt(ts) {
  if (!ts) return "방금";
  const d = ts.toDate();
  return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
}
function message(text) {
  newsList.textContent = "";
  const p = document.createElement("p");
  p.className = "post-empty"; p.textContent = text;
  newsList.appendChild(p);
}
function draw() {
  if (news === null) return;
  const pinnedSet = new Set(pinnedNews.map((x) => x.id));
  const all = [...pinnedNews, ...news.filter((x) => !pinnedSet.has(x.id))];   // 고정 소식이 맨 위
  newsCount.textContent = all.length ? "소식 " + all.length + "개" : "";
  if (!all.length) { message("아직 올라온 소식이 없어요."); return; }
  newsList.textContent = "";
  all.forEach((n, i) => {
    const [face, color] = FACES[i % FACES.length];
    const row = document.createElement("div");
    row.className = "row" + (pinnedSet.has(n.id) ? " pinned" : "");
    const sq = document.createElement("span");
    sq.className = "sq"; sq.style.setProperty("--c", "var(" + color + ")");
    const img = document.createElement("img"); img.src = face + ".svg?v=4"; img.alt = "";
    sq.appendChild(img);
    const text = document.createElement("span");
    text.className = "row-text";
    // 글자는 textContent로만 넣어서 코드가 섞여도 실행되지 않음
    const strong = document.createElement("strong"); strong.textContent = n.title;
    text.appendChild(strong);
    if (n.body) { const p = document.createElement("p"); p.textContent = n.body; text.appendChild(p); }
    const small = document.createElement("small");
    if (pinnedSet.has(n.id)) {   // 고정 소식에는 코랄 '고정' 알약
      const badge = document.createElement("span"); badge.className = "pin-badge"; badge.textContent = "고정";
      small.append(badge, " ");
    }
    small.append(fmt(n.createdAt) + " · 소식");
    text.appendChild(small);
    row.append(sq, text);
    if (isAdmin) {
      const pin = document.createElement("button");   // 관리자에게만 '고정 / 고정 해제' 버튼
      pin.type = "button"; pin.className = "row-pin"; pin.textContent = pinnedSet.has(n.id) ? "고정 해제" : "고정";
      pin.addEventListener("click", () => togglePin(n));
      row.appendChild(pin);
      const del = document.createElement("button");
      del.type = "button"; del.className = "row-del"; del.textContent = "삭제";
      del.addEventListener("click", async () => {
        if (!confirm("이 소식을 지울까요?")) return;
        try {
          await deleteDoc(doc(db, "news", n.id));
          // 고정된 소식을 지우면 고정 목록에서도 뺌
          if (pinnedSet.has(n.id)) await setDoc(doc(db, "meta", "pins"), { ids: pinnedNews.map((x) => x.id).filter((id) => id !== n.id) });
        }
        catch (err) { alert("지우지 못했어요. (" + err.code + ")"); }
      });
      row.appendChild(del);
    }
    newsList.appendChild(row);
  });
}
onSnapshot(
  query(collection(db, "news"), orderBy("createdAt", "desc"), limit(100)),
  (snap) => { news = snap.docs.map((d) => ({ id: d.id, ...d.data() })); draw(); },
  (err) => { message("소식을 불러오지 못했어요. (" + err.code + ")"); }
);

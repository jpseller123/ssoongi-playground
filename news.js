// ===== 전체 소식 페이지 (news.html) =====
// 홈(board.js)과 같은 Firebase 프로젝트의 `news` 모음을 읽어 와서 최대 100개를 보여 줌.
// 읽기는 누구나, 삭제는 관리자만(진짜 막는 곳은 firestore.rules). firebaseConfig는 공개돼도 되는 값.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, deleteDoc, doc, query, orderBy, limit, onSnapshot }
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
const loginBtn = $("loginBtn"), newsList = $("newsList"), newsCount = $("newsCount");
const FACES = [["ssoongi", "--pastel-yellow"], ["mongi", "--pastel-blue"], ["kongi", "--pastel-green"], ["byeoli", "--pastel-peach"]];
let isAdmin = false;
let me = null;
let news = null;   // 아직 못 불러왔으면 null

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
  draw();   // 관리자에게만 '삭제' 버튼이 보이게 다시 그림
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
  newsCount.textContent = news.length ? "소식 " + news.length + "개" : "";
  if (!news.length) { message("아직 올라온 소식이 없어요."); return; }
  newsList.textContent = "";
  news.forEach((n, i) => {
    const [face, color] = FACES[i % FACES.length];
    const row = document.createElement("div");
    row.className = "row";
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
    const small = document.createElement("small"); small.textContent = fmt(n.createdAt) + " · 소식";
    text.appendChild(small);
    row.append(sq, text);
    if (isAdmin) {
      const del = document.createElement("button");
      del.type = "button"; del.className = "row-del"; del.textContent = "삭제";
      del.addEventListener("click", async () => {
        if (!confirm("이 소식을 지울까요?")) return;
        try { await deleteDoc(doc(db, "news", n.id)); }
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

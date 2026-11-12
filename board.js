// ===== 로그인 + 게시판 (Firebase 무료 Spark 요금제) =====
// - 로그인: 구글 로그인만
// - 게시판: 누구나 읽기, 관리자(ADMIN_EMAIL)만 글쓰기 · 삭제 (보안 규칙은 firestore.rules 참고)
// - 이 설정값(firebaseConfig)은 공개되어도 되는 값이에요. 진짜 보안은 Firestore 보안 규칙이 맡아요.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, limit, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4ixsBuPodIqO3_utYpU_vXXok48vTNMM",
  authDomain: "ssoongi-playground.firebaseapp.com",
  projectId: "ssoongi-playground",
  storageBucket: "ssoongi-playground.firebasestorage.app",
  messagingSenderId: "36655522243",
  appId: "1:36655522243:web:373754b3ca179449275d76"
};

// 관리자 이메일: 이 계정으로 로그인하면 ADMIN 구역이 보이고 글쓰기 · 삭제가 됨 (진짜 막는 곳은 firestore.rules)
const ADMIN_EMAIL = "ilovejydh@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const loginBtn = $("loginBtn"), boardLogin = $("boardLogin");
const form = $("postForm"), list = $("postList"), who = $("postWho");
const adminSection = $("admin"), adminLink = $("adminLink");
let me = null;       // 지금 로그인한 사람
let isAdmin = false; // 관리자인지

// ----- 로그인 / 로그아웃 -----
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
  adminSection.hidden = !isAdmin;   // 관리자에게만 ADMIN 구역 · 메뉴 링크가 보임
  adminLink.hidden = !isAdmin;
  who.textContent = isAdmin ? (user.displayName || "관리자") + " 이름으로 올라가요" : "";
  draw();   // 관리자에게만 '삭제' 버튼이 보이게 다시 그림
});

// ----- 글쓰기 -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!isAdmin) return;
  const title = $("postTitle").value.trim(), body = $("postBody").value.trim();
  if (!title || !body) return;
  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await addDoc(collection(db, "posts"), {
      title, body,
      uid: me.uid,
      name: (me.displayName || "이름 없음").slice(0, 40),
      createdAt: serverTimestamp()
    });
    form.reset();
  } catch (err) {
    alert("글을 올리지 못했어요. (" + err.code + ")");
  }
  btn.disabled = false;
});

// ----- 글 목록 (최신 30개, 실시간으로 바뀜) -----
let posts = [];
function fmt(ts) {
  if (!ts) return "방금";
  const d = ts.toDate();
  return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
}
function draw() {
  list.textContent = "";
  if (!posts.length) {
    const li = document.createElement("li");
    li.className = "post-empty";
    li.textContent = "아직 글이 없어요. 첫 글을 남겨 주세요!";
    list.appendChild(li);
    return;
  }
  for (const p of posts) {
    const li = document.createElement("li");
    li.className = "post";
    // 글자는 textContent로만 넣어서, 남이 쓴 글에 코드가 섞여도 실행되지 않음
    const h = document.createElement("h3"); h.textContent = p.title;
    const b = document.createElement("p"); b.textContent = p.body;
    const m = document.createElement("small"); m.textContent = p.name + " · " + fmt(p.createdAt);
    li.append(h, b, m);
    if (isAdmin) {
      const del = document.createElement("button");
      del.type = "button"; del.className = "post-del"; del.textContent = "삭제";
      del.addEventListener("click", async () => {
        if (!confirm("이 글을 지울까요?")) return;
        try { await deleteDoc(doc(db, "posts", p.id)); }
        catch (err) { alert("지우지 못했어요. (" + err.code + ")"); }
      });
      li.appendChild(del);
    }
    list.appendChild(li);
  }
}
onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(30)),
  (snap) => { posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })); draw(); },
  (err) => {
    list.textContent = "";
    const li = document.createElement("li");
    li.className = "post-empty";
    li.textContent = "게시판을 불러오지 못했어요. (" + err.code + ")";
    list.appendChild(li);
  }
);

// ===== 전체 게시글 페이지 (board.html) =====
// 홈(board.js)과 같은 Firebase 프로젝트의 `posts` 모음을 읽어 와서 최대 100개를 보여 줌.
// 읽기는 누구나, 삭제는 관리자(모든 글) · 글쓴이(내 글)만 (진짜 막는 곳은 firestore.rules). firebaseConfig는 공개돼도 되는 값.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, query, orderBy, limit, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { isClean, BAD_MSG } from "./filter.js?v=1";

const firebaseConfig = {
  apiKey: "AIzaSyC4ixsBuPodIqO3_utYpU_vXXok48vTNMM",
  authDomain: "ssoongi-playground.firebaseapp.com",
  projectId: "ssoongi-playground",
  storageBucket: "ssoongi-playground.firebasestorage.app",
  messagingSenderId: "36655522243",
  appId: "1:36655522243:web:373754b3ca179449275d76"
};
const ADMIN_EMAIL = "ilovejydh@gmail.com";   // board.js · news.js · firestore.rules와 같은 값

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const loginBtn = $("loginBtn"), list = $("postList"), postCount = $("postCount");
const form = $("postForm"), who = $("postWho"), boardLogin = $("boardLogin"), boardLoginBtn = $("boardLoginBtn");
const FACES = [["ssoongi", "--pastel-yellow"], ["mongi", "--pastel-blue"], ["kongi", "--pastel-green"], ["byeoli", "--pastel-peach"]];
let me = null;
let isAdmin = false;
let posts = null;   // 아직 못 불러왔으면 null

async function login() {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) {
    if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request")
      alert("로그인에 실패했어요. 잠시 뒤 다시 해 주세요. (" + e.code + ")");
  }
}
loginBtn.addEventListener("click", () => (me ? signOut(auth) : login()));
boardLoginBtn.addEventListener("click", login);
onAuthStateChanged(auth, (user) => {
  me = user;
  isAdmin = !!user && user.emailVerified && user.email === ADMIN_EMAIL;
  loginBtn.textContent = user ? "로그아웃" : "로그인";
  form.hidden = !user;              // 로그인한 누구나 글쓰기 칸이 보임
  boardLogin.hidden = !!user;
  who.textContent = user ? (user.displayName || "이름 없음") + " 이름으로 올라가요" : "";
  draw();   // 삭제 버튼이 보이는 사람이 바뀌므로 다시 그림
});

// ----- 글쓰기 (로그인한 누구나, 욕 · 비방은 못 올림. 홈 BOARD와 같은 방식) -----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!me) return;
  const title = $("postTitle").value.trim(), body = $("postBody").value.trim();
  if (!title || !body) return;
  if (!isClean(title, body)) { alert(BAD_MSG); return; }
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
    alert("글을 올리지 못했어요. 욕이나 비방이 들어 있지 않은지 확인해 주세요. (" + err.code + ")");
  }
  btn.disabled = false;
});

function fmt(ts) {
  if (!ts) return "방금";
  const d = ts.toDate();
  return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
}
function faceOf(key) {   // 글쓴이마다 같은 캐릭터 얼굴이 나오게 uid로 하나를 고름 (홈과 같은 방식)
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FACES[h % FACES.length];
}
function emptyRow(text) {
  const li = document.createElement("li");
  li.className = "post-empty";
  const img = document.createElement("img");
  img.src = "ssoongi.svg?v=4"; img.alt = "";
  const span = document.createElement("span");
  span.textContent = text;
  li.append(img, span);
  return li;
}

let animated = false;   // 처음 그릴 때만 차례로 올라오는 움직임
function draw() {
  if (posts === null) return;
  list.textContent = "";
  postCount.textContent = posts.length ? "글 " + posts.length + "개" : "";
  if (!posts.length) { list.appendChild(emptyRow("아직 글이 없어요.")); return; }
  posts.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "post" + (animated ? "" : " in");
    li.style.setProperty("--d", Math.min(i, 8) * 0.1 + "s");
    const [face, color] = faceOf(p.uid || p.name);
    const av = document.createElement("span");
    av.className = "avatar"; av.style.setProperty("--c", "var(" + color + ")");
    const img = document.createElement("img"); img.src = face + ".svg?v=4"; img.alt = "";
    av.appendChild(img);
    const main = document.createElement("div"); main.className = "post-main";
    // 글자는 textContent로만 넣어서, 남이 쓴 글에 코드가 섞여도 실행되지 않음
    const h = document.createElement("h3"); h.textContent = p.title;
    const b = document.createElement("p"); b.textContent = p.body;
    const meta = document.createElement("div"); meta.className = "post-meta";
    const nm = document.createElement("span"); nm.className = "post-name"; nm.textContent = p.name;
    const dt = document.createElement("small"); dt.textContent = fmt(p.createdAt);
    meta.append(nm, dt);
    main.append(h, b, meta);
    li.append(av, main);
    if (isAdmin || (me && me.uid === p.uid)) {   // 관리자는 모든 글, 글쓴이는 내 글만 삭제
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
  });
  animated = true;
}
onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100)),
  (snap) => { posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })); draw(); },
  (err) => { list.textContent = ""; list.appendChild(emptyRow("게시글을 불러오지 못했어요. (" + err.code + ")")); }
);

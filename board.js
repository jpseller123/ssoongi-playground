// ===== 로그인 + NEWS(관리자 전용) + BOARD(로그인한 누구나) (Firebase 무료 Spark 요금제) =====
// - 로그인: 구글 로그인만
// - NEWS(`news` 모음): 누구나 읽기, 관리자(ADMIN_EMAIL)만 쓰기 · 삭제 · 맨 위 고정(최대 3개, 고정 버튼은 news.html에 있음)
// - BOARD(`posts` 모음): 누구나 읽기, 로그인한 사람은 글쓰기(욕 · 비방은 못 올림), 삭제는 관리자(모든 글) · 글쓴이(내 글)
// - 보안 규칙은 firestore.rules 참고. 이 설정값(firebaseConfig)은 공개돼도 되는 값이에요.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, query, where, documentId, orderBy, limit, onSnapshot, serverTimestamp }
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

// 관리자 이메일: 이 계정으로 로그인하면 ADMIN 구역이 보이고 소식 쓰기 · 모든 글 삭제가 됨 (진짜 막는 곳은 firestore.rules)
const ADMIN_EMAIL = "ilovejydh@gmail.com";


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const loginBtn = $("loginBtn"), boardLoginBtn = $("boardLoginBtn"), boardLogin = $("boardLogin");
const form = $("postForm"), list = $("postList"), who = $("postWho");
const newsList = $("newsList");
const adminLink = $("adminLink");
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
boardLoginBtn.addEventListener("click", login);

onAuthStateChanged(auth, (user) => {
  me = user;
  isAdmin = !!user && user.emailVerified && user.email === ADMIN_EMAIL;
  loginBtn.textContent = user ? "로그아웃" : "로그인";
  adminLink.hidden = !isAdmin;   // 관리자에게만 헤더에 "관리자" 링크(전체 소식 페이지)가 보임
  form.hidden = !user;              // 로그인한 누구나 BOARD 글쓰기 칸이 보임
  boardLogin.hidden = !!user;
  who.textContent = user ? (user.displayName || "이름 없음") + " 이름으로 올라가요" : "";
  drawNews();
  drawPosts();   // 삭제 버튼이 보이는 사람이 바뀌므로 다시 그림
});

// ----- 공통 도우미 -----
function fmt(ts) {
  if (!ts) return "방금";
  const d = ts.toDate();
  return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
}
function emptyRow(text) {
  const li = document.createElement("li");
  li.className = "post-empty";
  const img = document.createElement("img");   // 빈 게시판에는 쑝이가 안내
  img.src = "ssoongi.svg?v=4"; img.alt = "";
  const span = document.createElement("span");
  span.textContent = text;
  li.append(img, span);
  return li;
}
// 글쓴이마다 같은 캐릭터 얼굴이 나오게 uid로 하나를 고름
const FACES = [["ssoongi", "--pastel-yellow"], ["mongi", "--pastel-blue"], ["kongi", "--pastel-green"], ["byeoli", "--pastel-peach"]];
function faceOf(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return FACES[h % FACES.length];
}

// ======================= NEWS (관리자만 쓰기 · 삭제) =======================
const newsFallback = newsList.innerHTML;   // 올라온 소식이 없을 때 보여 줄 기본 한 줄
const NEWS_FACES = [["ssoongi", "--pastel-yellow"], ["mongi", "--pastel-blue"], ["kongi", "--pastel-green"], ["byeoli", "--pastel-peach"]];
let news = null;   // 아직 못 불러왔으면 null
const NEWS_SHOWN = 3;   // 홈에 보이는 최근 소식 개수 (나머지는 화살표를 누르면 news.html에서 봄)
const newsMore = $("newsMore");

// ----- 맨 위 고정 소식 (관리자가 news.html에서 최대 3개까지 고정함) -----
// 고정한 소식의 번호는 `meta/pins` 문서의 ids에 저장됨. 오래된 소식도 고정할 수 있어서 따로 불러옴
let pinIds = [];         // 고정된 소식 번호들
let pinnedNews = [];     // 실제로 있는 고정 소식들
let stopPinned = null;
function watchPinned() {
  if (stopPinned) { stopPinned(); stopPinned = null; }
  if (!pinIds.length) { pinnedNews = []; drawNews(); return; }
  stopPinned = onSnapshot(
    query(collection(db, "news"), where(documentId(), "in", pinIds)),
    (snap) => {
      const byId = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
      pinnedNews = pinIds.map((id) => byId.get(id)).filter(Boolean);   // 지워진 소식은 빠짐
      drawNews();
    },
    () => { pinnedNews = []; drawNews(); }
  );
}
onSnapshot(doc(db, "meta", "pins"), (snap) => {
  const ids = snap.exists() ? snap.data().ids : [];
  pinIds = Array.isArray(ids) ? ids.slice(0, 3) : [];
  watchPinned();
}, () => { pinIds = []; watchPinned(); });

function drawNews() {
  if (news === null || !news.length) { newsMore.hidden = true; newsList.innerHTML = newsFallback; return; }   // 소식이 없으면 기본 한 줄
  // 4개 이상일 때만 화살표(전체 소식 페이지 링크)를 보여 주고, 홈에는 최근 3개만 그림
  const pinnedSet = new Set(pinnedNews.map((x) => x.id));
  const all = [...pinnedNews, ...news.filter((x) => !pinnedSet.has(x.id))];   // 고정 소식이 맨 위
  newsMore.hidden = all.length <= NEWS_SHOWN;
  newsList.textContent = "";
  all.slice(0, NEWS_SHOWN).forEach((n, i) => {
    const [face, color] = NEWS_FACES[i % NEWS_FACES.length];
    // .up 을 미리 붙여서(script.js의 fade-up 규칙) 새로 생긴 줄도 보이게 함
    const row = document.createElement("div");
    row.className = "row up" + (pinnedSet.has(n.id) ? " pinned" : "");
    row.style.setProperty("--d", (i * 0.12) + "s");
    const sq = document.createElement("span");
    sq.className = "sq"; sq.style.setProperty("--c", "var(" + color + ")");
    const img = document.createElement("img");
    img.src = face + ".svg?v=4"; img.alt = "";
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
  query(collection(db, "news"), orderBy("createdAt", "desc"), limit(20)),
  (snap) => { news = snap.docs.map((d) => ({ id: d.id, ...d.data() })); drawNews(); },
  () => { news = null; drawNews(); }   // 못 불러오면 기본 한 줄
);

// ======================= BOARD (로그인한 누구나 쓰기) =======================
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

let posts = [];
let postsAnimated = false;   // 처음 그릴 때만 차례로 올라오는 움직임(다시 그릴 때마다 깜빡이지 않게)
const postCount = $("postCount");
const POSTS_SHOWN = 5;   // 홈에 보이는 최근 글 개수 (나머지는 화살표를 누르면 board.html에서 봄)
const boardMore = $("boardMore");
function drawPosts() {
  list.textContent = "";
  postCount.textContent = "";                    // 홈은 5개만 보여서 전체 개수는 board.html에서 보여 줌
  boardMore.hidden = posts.length <= POSTS_SHOWN;   // 6개 이상일 때만 화살표(전체 게시글 페이지 링크)
  if (!posts.length) { list.appendChild(emptyRow("아직 글이 없어요. 첫 글을 남겨 주세요!")); return; }
  posts.slice(0, POSTS_SHOWN).forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "post" + (postsAnimated ? "" : " in");
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
  postsAnimated = true;
}
onSnapshot(
  query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_SHOWN + 1)),
  (snap) => { posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })); drawPosts(); },
  (err) => { list.textContent = ""; list.appendChild(emptyRow("게시판을 불러오지 못했어요. (" + err.code + ")")); }
);

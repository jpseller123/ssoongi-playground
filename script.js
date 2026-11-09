// 쑝이놀이터 움직임과 기능

// 자바스크립트가 켜져 있을 때만 '올라오며 나타나기'를 쓰도록 표시 (꺼져 있으면 그냥 다 보임)
document.documentElement.classList.add('js');

// 스크롤하면 각 구역이 아래에서 부드럽게 올라오며 나타난다 (0.6초는 style.css에서 정함)
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

// 맨 위 메뉴: 스크롤을 내리면 얇아진다(.slim 클래스, 모양은 style.css).
(function () {
  var nav = document.querySelector(".nav");
  if (!nav) return;
  function slim() { nav.classList.toggle("slim", window.scrollY > 40); }
  window.addEventListener("scroll", slim, { passive: true });
  slim();
})();

// 스크롤을 내리면 따라다니는 '연락하기'와 '맨 위로' 버튼이 나타난다.
(function () {
  var box = document.getElementById('float');
  var top = document.getElementById('toTop');
  if (!box || !top) return;
  function check() { box.classList.toggle('show', window.scrollY > 300); }
  window.addEventListener('scroll', check, { passive: true });
  check();
  top.addEventListener('click', function () {
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });
})();

// NEWS 옆 숫자: 화면에 보이면 한 번, 랜덤하게 돌다가 왼쪽부터 차례로 멈춰 오늘 날짜(YYYY.MM.DD)가 된다.
(function () {
  var box = document.getElementById('today');
  if (!box) return;
  var FIRST_STOP = 900;   // 처음 멈추기까지 걸리는 시간(ms)
  var STEP = 260;         // 숫자 하나씩 멈추는 간격(ms)

  var d = new Date();
  function two(n) { return (n < 10 ? '0' : '') + n; }
  var text = d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate());

  // 글자마다 칸을 만든다
  box.textContent = '';
  var cells = [];
  for (var i = 0; i < text.length; i++) {
    var s = document.createElement('span');
    s.className = 'ch' + (text.charAt(i) === '.' ? ' dot' : '');
    s.textContent = text.charAt(i);
    s.setAttribute('aria-hidden', 'true');
    box.appendChild(s);
    cells.push(s);
  }
  box.setAttribute('aria-label', '오늘 날짜 ' + text);

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;   // 움직임 줄이기: 바로 날짜 보여 줌

  function roll() {
    var start = Date.now();
    cells.forEach(function (c) { if (!c.classList.contains('dot')) c.classList.add('rolling'); });
    var timer = setInterval(function () {
      var t = Date.now() - start, left = 0;
      cells.forEach(function (c, i) {
        if (c.classList.contains('dot') || c.classList.contains('stop')) return;
        var stopAt = FIRST_STOP + i * STEP;
        if (t >= stopAt) {
          c.textContent = text.charAt(i);
          c.classList.remove('rolling'); c.classList.add('stop');
        } else {
          c.textContent = Math.floor(Math.random() * 10);
          left++;
        }
      });
      if (!left) clearInterval(timer);
    }, 60);
  }
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { io.disconnect(); roll(); }
  }, { threshold: 0.6 });
  io.observe(box);
})();

// 첫 화면 캐릭터: 각자 칸 안에서 랜덤하게 돌아다니고, 마우스를 올리면(휴대폰은 누르면) 랜덤하게 인사한다.
(function () {
  var arches = document.querySelectorAll('.arch');
  if (!arches.length) return;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GREETS = ['wave', 'jump', 'spin', 'squish', 'bow'];       // 인사 동작
  var WORDS = ['안녕!', '하이~', '반가워!', '놀자!'];            // 인사 말
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(list, not) {                                     // 직전과 같은 것은 피해서 고름
    var v; do { v = list[Math.floor(Math.random() * list.length)]; } while (v === not && list.length > 1);
    return v;
  }

  arches.forEach(function (arch, index) {
    var img = arch.querySelector('img');
    if (!img) return;
    var speed = [40, 55, 28, 45][index] || 40;                   // 캐릭터마다 걷는 속도(px/초)
    var greeting = false, lastGreet = '', lastWord = '', walkTimer = null, hideTimer = null;

    // 인사 말풍선
    var bubble = document.createElement('span');
    bubble.className = 'hi';
    bubble.setAttribute('aria-hidden', 'true');
    arch.appendChild(bubble);

    // ---- 랜덤 돌아다니기 ----
    function walk() {
      if (greeting) { walkTimer = setTimeout(walk, 600); return; }
      var room = Math.max(0, (arch.clientWidth - img.offsetWidth) / 2 - 4);
      if (Math.random() < 0.25 || room < 6) {                    // 가끔은 가만히 쉬기
        walkTimer = setTimeout(walk, rand(800, 2400));
        return;
      }
      var current = parseFloat(img.dataset.x || '0');
      var target = rand(-room, room);
      var dx = target - current;
      var dur = Math.min(4.5, Math.max(1.2, Math.abs(dx) / speed));
      img.dataset.x = target;
      img.style.transition = 'translate ' + dur + 's ease-in-out';
      img.style.scale = dx < 0 ? '-1 1' : '1 1';                 // 가는 쪽으로 몸 돌리기
      img.style.translate = target + 'px 0';
      img.classList.add('moving');
      walkTimer = setTimeout(function () {
        img.classList.remove('moving');
        walkTimer = setTimeout(walk, rand(400, 2200));
      }, dur * 1000);
    }

    // ---- 마우스를 올리면 인사 ----
    function greet() {
      if (greeting) return;
      greeting = true;
      var word = pick(WORDS, lastWord); lastWord = word;
      bubble.textContent = word;
      bubble.classList.add('show');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { bubble.classList.remove('show'); }, 1500);
      if (calm) { greeting = false; return; }                    // 움직임 줄이기: 말풍선만
      var g = pick(GREETS, lastGreet); lastGreet = g;
      img.classList.remove('moving');
      img.style.scale = '1 1';                                   // 인사할 땐 정면
      img.classList.add('g-' + g);
      img.addEventListener('animationend', function done() {
        img.removeEventListener('animationend', done);
        img.classList.remove('g-' + g);
        greeting = false;
      });
    }
    arch.addEventListener('pointerenter', greet);

    if (!calm) setTimeout(walk, rand(200, 1800));
  });
})();

// 첫 화면 캐릭터를 누르면 그 캐릭터가 마우스 포인터가 된다. 같은 캐릭터를 다시 누르거나 Esc를 누르면 원래대로.
(function () {
  var arches = document.querySelectorAll('.arch');
  var mouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!arches.length || !mouse) return;      // 휴대폰 · 터치는 포인터가 없으므로 쉬기

  var NAMES = ['쑝이', '몽이', '콩이', '별이'];
  var root = document.documentElement;
  var pet = document.createElement('div');
  pet.className = 'pet';
  pet.setAttribute('aria-hidden', 'true');
  var petImg = document.createElement('img');
  petImg.alt = '';
  pet.appendChild(petImg);
  document.body.appendChild(pet);

  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var toastTimer, moveTimer, picked = null, lastX = 0;

  function say(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }
  function place(x, y) { pet.style.transform = 'translate3d(' + (x - 28) + 'px,' + (y - 28) + 'px,0)'; }

  function choose(arch, index, x, y) {
    if (picked === arch) {                       // 같은 캐릭터를 다시 누르면 해제
      release(true);
      return;
    }
    if (picked) picked.classList.remove('picked');
    picked = arch;
    arch.classList.add('picked');
    arches.forEach(function (a) { a.setAttribute('aria-pressed', a === arch ? 'true' : 'false'); });
    petImg.src = arch.querySelector('img').getAttribute('src');
    if (typeof x === 'number') place(x, y);
    pet.classList.add('on');
    root.classList.add('has-pet');
    say((NAMES[index] || '캐릭터') + '가 포인터가 되었어요! 다시 누르거나 Esc를 누르면 원래대로');
  }
  function release(announce) {
    if (!picked) return;
    picked.classList.remove('picked');
    arches.forEach(function (a) { a.setAttribute('aria-pressed', 'false'); });
    picked = null;
    pet.classList.remove('on', 'moving');
    root.classList.remove('has-pet');
    if (announce) say('원래 포인터로 돌아왔어요');
  }

  arches.forEach(function (arch, index) {
    arch.setAttribute('role', 'button');
    arch.setAttribute('tabindex', '0');
    arch.setAttribute('aria-pressed', 'false');
    arch.setAttribute('aria-label', (NAMES[index] || '캐릭터') + '를 마우스 포인터로 쓰기');
    arch.addEventListener('click', function (e) { choose(arch, index, e.clientX, e.clientY); });
    arch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(arch, index); }
    });
  });

  document.addEventListener('mousemove', function (e) {
    if (!picked) return;
    place(e.clientX, e.clientY);
    pet.classList.add('on', 'moving');
    petImg.style.scale = e.clientX < lastX - 1 ? '-1 1' : (e.clientX > lastX + 1 ? '1 1' : petImg.style.scale);   // 가는 쪽으로 몸 돌리기
    lastX = e.clientX;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(function () { pet.classList.remove('moving'); }, 150);
  });
  document.addEventListener('mouseleave', function () { pet.classList.remove('on'); });
  document.addEventListener('mouseenter', function () { if (picked) pet.classList.add('on'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') release(true); });
})();

// 첫 화면 아치 칸: 높이가 랜덤하게 줄었다 늘었다 한다 (바닥은 그대로, 위쪽이 오르내림).
(function () {
  var box = document.querySelector('.arches');
  var arches = document.querySelectorAll('.arch');
  if (!box || !arches.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SHRINK = 0.72, GROW = 1.15;        // 처음 높이의 72% ~ 115% 사이에서 움직임
  var info = [], timers = [];
  function rand(a, b) { return a + Math.random() * (b - a); }

  // 처음(CSS가 정한) 높이를 읽고, 아래 글이 흔들리지 않도록 전체 높이를 고정한다.
  function measure() {
    timers.forEach(clearTimeout); timers = [];
    var tallest = 0;
    arches.forEach(function (arch, i) {
      arch.style.transition = 'none';
      arch.style.height = '';                              // 꾸밈 높이로 되돌려서 읽기
      var base = arch.offsetHeight;
      var mb = parseFloat(getComputedStyle(arch).marginBottom) || 0;
      var img = arch.querySelector('img');
      var floor = Math.max(base * SHRINK, (img ? img.offsetHeight : 0) + 30);   // 캐릭터가 잘리지 않을 만큼
      info[i] = { base: base, min: floor, max: base * GROW, now: base };
      tallest = Math.max(tallest, base * GROW + mb);
    });
    var pad = parseFloat(getComputedStyle(box).paddingBottom) || 0;
    box.style.height = Math.ceil(tallest + pad) + 'px';
    arches.forEach(function (arch, i) { arch.style.height = info[i].base + 'px'; });
    arches.forEach(function (arch, i) { timers.push(setTimeout(function () { change(arch, i); }, rand(300, 2500))); });
  }

  function change(arch, i) {
    var d = info[i], target;
    do { target = rand(d.min, d.max); } while (Math.abs(target - d.now) < (d.max - d.min) * 0.3);   // 눈에 띄게 달라지게
    var dur = rand(1.4, 3);
    arch.style.transition = 'height ' + dur + 's ease-in-out';
    arch.style.height = target + 'px';
    d.now = target;
    timers[i] = setTimeout(function () { change(arch, i); }, dur * 1000 + rand(300, 1800));
  }

  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(measure, 200); });
  window.addEventListener('load', measure);
  if (document.readyState === 'complete') measure();
})();

// 헤더 로고 '쑝이놀이터': 글자마다 글꼴이 랜덤하게, 천천히 바뀐다. (흐려졌다가 바뀌고 다시 또렷해짐)
(function () {
  var logo = document.querySelector('.logo');
  if (!logo) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // [글꼴 이름, 굵기, 크기 보정]
  var FONTS = [
    ['Noto Sans KR', 800, 1], ['Jua', 400, 1], ['Do Hyeon', 400, 1], ['Black Han Sans', 400, 0.95],
    ['Gamja Flower', 400, 1.2], ['Gaegu', 700, 1.2], ['Hi Melody', 400, 1.15], ['Gugi', 400, 0.95],
    ['Single Day', 400, 1.1], ['Cute Font', 400, 1.1]
  ];
  var MIN_WAIT = 3000, MAX_WAIT = 6500;   // 한 글자가 다시 바뀔 때까지 걸리는 시간(ms)
  function rand(a, b) { return a + Math.random() * (b - a); }

  // 글자마다 칸으로 나눈다
  var text = logo.textContent;
  logo.textContent = '';
  var letters = [];
  for (var i = 0; i < text.length; i++) {
    var s = document.createElement('span');
    s.textContent = text.charAt(i);
    s.setAttribute('aria-hidden', 'true');
    logo.appendChild(s);
    letters.push({ el: s, now: 0 });
  }

  function change(item) {
    var n;
    do { n = Math.floor(Math.random() * FONTS.length); } while (n === item.now);   // 직전과 다른 글꼴
    item.el.classList.add('fade');                                                 // 천천히 흐려지고
    setTimeout(function () {
      var f = FONTS[n];
      item.el.style.fontFamily = '"' + f[0] + '", sans-serif';                   // 글꼴 바꾸고
      item.el.style.fontWeight = f[1];
      item.el.style.fontSize = f[2] + 'em';
      item.now = n;
      item.el.classList.remove('fade');                                            // 다시 또렷해짐
    }, 850);
    setTimeout(function () { change(item); }, rand(MIN_WAIT, MAX_WAIT));
  }

  // 글꼴이 다 받아진 뒤에 시작 (받는 중에 깜빡이지 않도록)
  var loads = FONTS.map(function (f) { return document.fonts ? document.fonts.load(f[1] + ' 24px "' + f[0] + '"', text) : Promise.resolve(); });
  Promise.all(loads).catch(function () {}).then(function () {
    letters.forEach(function (item) { setTimeout(function () { change(item); }, rand(500, 4000)); });
  });
})();

// 첫 화면 PLAYGROUND 밑줄 물결: 물결마다 높이가 랜덤으로 다르게(열 때마다 새로 만듦).
(function () {
  var mark = document.querySelector(".hero mark");
  if (!mark) return;
  var HALF = 230, N = 10, d = "M0 10", x = 0, i, cy;       // 반 마디 230px(넓게), 10개 = 2300px 한 줄 → 화면에 봉우리 1~2개만 보임
  for (i = 0; i < N; i++) {
    cy = (i % 2 === 0) ? (-6 + Math.random() * 12) : (14 + Math.random() * 12);  // 위로 솟기 / 아래로 처지기 높이가 제각각
    d += " Q" + (x + HALF / 2) + " " + cy.toFixed(1) + " " + (x + HALF) + " 10";
    x += HALF;
  }
  d += " V20 H0 Z";
  var svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + x + " 20\" preserveAspectRatio=\"none\"><path d=\"" + d + "\" fill=\"#F29B8B\"/></svg>";
  mark.style.backgroundImage = "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
  mark.style.backgroundSize = x + "px 55%";
  mark.style.setProperty("--tile", x + "px");
  mark.style.animationDuration = (x / 20) + "s";           // 초당 20px로 천천히 흐름
})();

// 연락하기 · 맨 위로 버튼: 스크롤하면 내용과 함께 딸려 움직이다가 출렁이며 제자리로 돌아온다(스프링).
(function () {
  var box = document.getElementById("float");
  if (!box) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var lastY = window.scrollY, pos = 0, vel = 0, running = false;
  function tick() {
    vel += -pos * 0.1;            // 제자리로 끌어당기는 힘
    vel *= 0.82;                  // 출렁임이 잦아드는 정도
    pos += vel;
    box.style.transform = "translateY(" + pos.toFixed(2) + "px)";
    if (Math.abs(pos) < 0.05 && Math.abs(vel) < 0.05) {
      pos = 0; vel = 0; box.style.transform = ""; running = false; return;
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener("scroll", function () {
    var d = window.scrollY - lastY; lastY = window.scrollY;
    pos -= Math.max(-14, Math.min(14, d * 0.5));   // 내려가면 위로, 올라가면 아래로 살짝 딸려 감
    pos = Math.max(-60, Math.min(60, pos));
    if (!running) { running = true; requestAnimationFrame(tick); }
  }, { passive: true });
})();

// 스크롤 제목 모으기: 첫 화면은 작아지며 올라가고, HELLO!와 NEWS · WORKS · FRIENDS · ABOUT 제목이
// 차례로 작아지면서 헤더 밑에 한 줄로 쌓여 남는다. (글자 크기 · 간격은 아래 숫자에서 고침)
(function () {
  var hero = document.querySelector(".hero");
  var wrap = hero && hero.querySelector(".wrap");
  var word = hero && hero.querySelector(".hello-word");
  var dock = document.getElementById("helloDock");
  var nav = document.querySelector(".nav");
  // 작아지고 흐려지는 것은 글자뿐(제목 · 소개 · 안내 글). 캐릭터 칸과 집 · 나무 그림은 그대로 둠
  var texts = hero ? Array.prototype.slice.call(hero.querySelectorAll(".en-title, .lead, .hint")) : [];
  if (!wrap || !word || !dock) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var GAP = 28;                                   // 남은 제목들 사이 간격(px): 컴퓨터 28 · 휴대폰 10(measure에서 정함)
  var ids = ["news", "works", "friends", "about"];
  var items = [];                                 // 구역 제목들: { h, dock, T, L, fs, w, endLeft }
  ids.forEach(function (id) {
    var h = document.querySelector("#" + id + " h2.en-title");
    if (!h) return;
    var d = document.createElement("a");          // 눌러서 해당 구역으로 이동하는 링크
    d.className = "hello-dock"; d.href = "#" + id; d.tabIndex = -1;
    d.setAttribute("aria-label", h.textContent.trim() + " 구역으로 이동");
    d.textContent = h.textContent.trim();
    document.body.appendChild(d);
    items.push({ h: h, dock: d });
  });
  var ticking = false, m = null, endFs = 24;

  function docPos(el) { var t = 0, l = 0; while (el) { t += el.offsetTop; l += el.offsetLeft; el = el.offsetParent; } return { t: t, l: l }; }
  function textW(d, fs) { d.style.fontSize = fs + "px"; return d.getBoundingClientRect().width - 16; }   // 좌우 안쪽 여백 8px씩 뺌

  function measure() {                            // 제자리 크기 · 위치와 남았을 때의 자리를 미리 계산
    var saved = texts.map(function (e) { return [e.style.transform, e.style.opacity]; });
    texts.forEach(function (e) { e.style.transform = ""; e.style.opacity = ""; });
    var r = word.getBoundingClientRect();
    m = { left: r.left, top: r.top + window.scrollY, fs: parseFloat(getComputedStyle(word).fontSize) };
    texts.forEach(function (e, i) {
      e.style.transform = saved[i][0]; e.style.opacity = saved[i][1];
      // 글자들이 같은 점(첫 화면 맨 위 가운데)을 기준으로 줄어들게 맞춤
      e.style.transformOrigin = (hero.offsetWidth / 2 - e.offsetLeft) + "px " + (-e.offsetTop) + "px";
    });
    GAP = window.innerWidth <= 700 ? 10 : 28;
    endFs = window.innerWidth <= 700 ? 13 : 24;   // 남는 글자 크기: 컴퓨터 24px · 휴대폰 13px(헤더 로고보다 조금 큼)
    var x = m.left + textW(dock, m.fs) * endFs / m.fs + GAP;
    items.forEach(function (it) {
      var p = docPos(it.h);
      it.T = p.t; it.L = p.l; it.fs = parseFloat(getComputedStyle(it.h).fontSize);
      it.endLeft = x;
      x += textW(it.dock, it.fs) * endFs / it.fs + GAP;
    });
  }
  function setOn(d, on) {                         // on: 헤더 밑에 자리 잡음(통통 튀기 + 클릭 가능)
    if (d.classList.contains("on") === on) return;
    d.classList.toggle("on", on);
    if (d !== dock) d.classList.toggle("settle", on);
    if (on) d.removeAttribute("tabindex"); else d.tabIndex = -1;
  }
  function lerp(a, b, q) { return a + (b - a) * q; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function apply() {
    ticking = false;
    if (!m) measure();
    var y = window.scrollY, vh = window.innerHeight, h = Math.max(1, hero.offsetHeight);
    var endTop = (nav ? nav.offsetHeight : 50) + 6;

    // 구역 제목: 화면 위쪽 35%에 들어오면 작아지며 헤더 밑 자리로 이동
    items.forEach(function (it) {
      var vp = it.T - y;                          // 제목의 지금 화면 위치
      var trig = Math.min(vh * 0.35, 170);        // 제목 링크로 이동했을 때 제목이 제자리에 보이도록 너무 일찍 시작하지 않음
      var q = clamp01((trig - vp) / (trig - endTop));
      if (q <= 0) { it.h.style.visibility = ""; it.dock.style.opacity = 0; setOn(it.dock, false); return; }
      it.h.style.visibility = "hidden";
      it.dock.style.opacity = 1;
      it.dock.style.left = lerp(it.L, it.endLeft, q).toFixed(1) + "px";
      it.dock.style.top = lerp(vp, endTop, q).toFixed(1) + "px";
      it.dock.style.fontSize = lerp(it.fs, endFs, q).toFixed(1) + "px";
      setOn(it.dock, q >= 1);                       // 자리 잡는 순간 통통 튀고, 눌러서 이동할 수 있게 됨
    });

    // 첫 화면 글자: 작아지며 올라가 사라지고, 다 사라지면 작은 HELLO!가 헤더 밑에 통통 튀며 나타남
    var p = clamp01(y / h);
    var q0 = clamp01(y / (h * 0.6));
    texts.forEach(function (e) {
      if (p === 0) { e.style.transform = ""; e.style.opacity = ""; return; }
      e.style.transform = "translateY(" + (-p * 150).toFixed(1) + "px) scale(" + (1 - q0 * 0.4).toFixed(3) + ")";
      e.style.opacity = (1 - q0).toFixed(3);
    });
    if (q0 >= 1) {
      dock.style.left = m.left + "px"; dock.style.top = endTop + "px"; dock.style.fontSize = endFs + "px";
      dock.classList.add("pop"); setOn(dock, true);
    } else {
      dock.classList.remove("pop"); setOn(dock, false);
    }
  }
  function remeasure() { m = null; apply(); }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(apply); }
  }, { passive: true });
  window.addEventListener("resize", remeasure);
  window.addEventListener("load", remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  apply();
})();

// CONTACT 구역: 처음엔 바탕 띠가 얇다가 스크롤을 내리면 아래에서 위로 두꺼워진다.
(function () {
  var foot = document.getElementById("contact");
  if (!foot) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var ticking = false;
  function grow() {
    ticking = false;
    var r = foot.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh - r.top) / Math.max(1, r.height)));   // 구역이 화면에 올라온 정도
    foot.style.setProperty("--grow", (0.1 + 0.9 * p).toFixed(3));
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(grow); } }, { passive: true });
  window.addEventListener("resize", grow);
  grow();
})();

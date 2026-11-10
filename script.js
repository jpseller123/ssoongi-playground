// 쑝이놀이터 움직임과 기능

// 자바스크립트가 켜져 있을 때만 '올라오며 나타나기'를 쓰도록 표시 (꺼져 있으면 그냥 다 보임)
document.documentElement.classList.add('js');

// 부드러운 스크롤 값: 실제 스크롤 위치를 바로 쓰지 않고 천천히 따라가게(물 흐르듯) 만든 값(Flow.y).
// 제목 모으기 · 첫 화면 글자 · CONTACT 띠가 이 값을 써서 스크롤을 멈춰도 잠깐 더 흘러가다 멈춘다.
var Flow = (function () {
  var subs = [], y = window.scrollY, run = false, last = 0;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame(now) {
    var t = window.scrollY, dt = Math.min(64, now - (last || now - 16)); last = now;
    y += (t - y) * (calm ? 1 : 1 - Math.pow(1 - 0.12, dt / 16.7));   // 12%씩 따라감(프레임 속도와 상관없이 같은 느낌)
    if (Math.abs(t - y) < 0.2) y = t;
    for (var i = 0; i < subs.length; i++) subs[i]();
    if (y !== t) requestAnimationFrame(frame); else { run = false; last = 0; }
  }
  function kick() { if (!run) { run = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  return { add: function (f) { subs.push(f); }, get y() { return y; } };
})();

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

// NEWS 줄 · WORKS · FRIENDS 카드 · 첫 화면 제목 3줄 · 소개 문장 · 안내 글 · 집과 나무 띠 · 캐릭터 이름표 · 구역 제목(NEWS · WORKS · FRIENDS · ABOUT) · 첫 화면 캐릭터 · ABOUT · CONTACT 조각: 각 카드가 화면에 들어올 때 하나씩 아래에서 fade-up (같은 줄은 0.12초 간격으로 차례로)
(function () {
  var cards = document.querySelectorAll('.card, .friend, .row, .profile, .about-text, .tags li, .contact .wrap > *, .arch, #news .en-title, #works .en-title, #friends .en-title, #about .en-title, .hero .en-title > *, .hero .lead, .hero .hint, .hero .town, .arch-name');
  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (el) { el.classList.add('up'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.style.animationDelay = (n++ * 0.12) + 's';
      e.target.classList.add('up');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  cards.forEach(function (el) { io.observe(el); });
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
    var img = arch.querySelector('.cimg');
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
    petImg.src = arch.querySelector('.cimg').getAttribute('data-src');
    if (typeof x === 'number') place(x, y);
    pet.classList.add('on');
    root.classList.add('has-pet');
    say((NAMES[index] || '캐릭터') + '가 포인터가 되었어요! 다시 누르거나 Esc를 누르면 원래대로');
    document.dispatchEvent(new CustomEvent('pet-change', { detail: { index: index } }));   // 그 캐릭터의 배경음악으로 바뀜
  }
  function release(announce) {
    if (!picked) return;
    picked.classList.remove('picked');
    arches.forEach(function (a) { a.setAttribute('aria-pressed', 'false'); });
    picked = null;
    pet.classList.remove('on', 'moving');
    root.classList.remove('has-pet');
    if (announce) say('원래 포인터로 돌아왔어요');
    document.dispatchEvent(new CustomEvent('pet-change', { detail: { index: -1 } }));
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
      var img = arch.querySelector('.cimg');
      var floor = Math.max(base * SHRINK, (img ? img.offsetHeight : 0) + 60);   // 캐릭터가 잘리지 않을 만큼
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
    var y = Flow.y, vh = window.innerHeight, h = Math.max(1, hero.offsetHeight);   // 부드러운 스크롤 값
    var endTop = (nav ? nav.offsetHeight : 50) + 6;

    // 구역 제목: 화면 위쪽 35%에 들어오면 작아지며 헤더 밑 자리로 이동
    items.forEach(function (it) {
      var vp = it.T - y;                          // 제목의 지금 화면 위치
      var trig = Math.min(vh * 0.35, 170);        // 제목 링크로 이동했을 때 제목이 제자리에 보이도록 너무 일찍 시작하지 않음
      var q = clamp01((trig - vp) / (trig - endTop));
      if (q <= 0) { it.h.style.opacity = ""; it.dock.style.opacity = 0; setOn(it.dock, false); return; }
      var fade = Math.min(1, q / 0.2);               // 원래 제목은 흐려지고 작은 제목은 선명해지며 자연스럽게 바뀜
      it.h.style.opacity = (1 - fade).toFixed(3);
      it.dock.style.opacity = fade.toFixed(3);
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
  Flow.add(apply);
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
    var top = r.top + (window.scrollY - Flow.y);       // 부드러운 스크롤 기준 위치
    var p = Math.max(0, Math.min(1, (vh - top) / Math.max(1, r.height)));   // 구역이 화면에 올라온 정도
    foot.style.setProperty("--grow", (0.1 + 0.9 * p).toFixed(3));
  }
  Flow.add(grow);
  window.addEventListener("resize", grow);
  grow();
})();

// 첫 화면 캐릭터: 그림 파일(SVG)을 칸 안에 넣어서(스타일이 서로 섞이지 않게 shadow 안에), 눈이 마우스를 따라 움직이게 한다.
// 파일을 못 불러오면(컴퓨터에서 파일을 바로 열었을 때 등) 원래 그림 그대로 보인다.
(function () {
  var hosts = Array.prototype.slice.call(document.querySelectorAll(".arch .cimg"));
  if (!hosts.length || !hosts[0].attachShadow) return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var list = [];                                  // { host, eyes }
  hosts.forEach(function (host) {
    var src = host.getAttribute("data-src"), fallback = host.querySelector("img");
    var sr = host.attachShadow({ mode: "open" });
    var st = document.createElement("style");
    st.textContent = "svg, img { display: block; width: 100%; height: auto; }";
    sr.appendChild(st);
    var first = document.createElement("img");    // 불러오는 동안(또는 실패하면) 보이는 그림
    first.src = src; first.alt = fallback ? fallback.alt : "";
    sr.appendChild(first);
    if (calm || !window.fetch) return;
    fetch(src).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (txt) {
      var doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      var svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== "svg") return;
      var node = document.importNode(svg, true);
      sr.replaceChild(node, first);
      var eyes = node.querySelector(".eyes");
      if (eyes) { eyes.style.transition = "translate .15s ease-out"; list.push({ host: host, eyes: eyes }); }
    }).catch(function () {});
  });
  if (calm) return;

  var mx = null, my = null, ticking = false;
  function look() {
    ticking = false;
    if (mx === null) return;
    list.forEach(function (it) {
      var r = it.host.getBoundingClientRect();
      var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.4);
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var k = Math.min(dist / 220, 1);            // 가까우면 조금, 멀면 최대 4칸만큼
      var ux = dx / dist;
      if ((it.host.style.scale || "").indexOf("-1") === 0) ux = -ux;   // 몸이 돌아서 있을 땐 좌우 반대로
      it.eyes.style.translate = (ux * k * 4).toFixed(2) + "px " + ((dy / dist) * k * 3).toFixed(2) + "px";
    });
  }
  function move(e) { mx = e.clientX; my = e.clientY; if (!ticking) { ticking = true; requestAnimationFrame(look); } }
  document.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("scroll", function () { if (!ticking && mx !== null) { ticking = true; requestAnimationFrame(look); } }, { passive: true });
})();

// 배경음악: 직접 지은 쉬운 멜로디를 코드로 만든 악기 소리로 반복 연주한다. 파일이 없어서 저작권 걱정 없음.
// 기본 곡(신나고 우당탕한 리코더 + 북) + 캐릭터마다 다른 곡 4개(모두 신나고 엉뚱하게).
// 첫 화면 캐릭터를 눌러 포인터로 바꾸면 그 캐릭터의 곡으로 바뀐다.
// 브라우저 규칙상 소리는 사용자가 누르는 순간부터 시작할 수 있다(♪ 버튼 또는 캐릭터 누르기).
(function () {
  var btn = document.getElementById("bgm");
  if (!btn) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { btn.hidden = true; return; }

  var VOLUME = 0.22;

  // ----- 곡 정의 -----
  // melody = [음높이(MIDI 번호, null은 쉼), 박자, (악기 바꾸기: 엉뚱한 소리 넣을 때)]
  // bass(마디번호) / drums(마디번호) = [[박 위치, 음 또는 북 종류, 세기, (악기)], ...]
  var THEMES = {
    // 기본 곡: 빠르고(152BPM) 통통 튀는 리코더 + 북. 마디 끝마다 북이 와르르 굴러가는 우당탕 느낌
    base: { bpm: 152, barBeats: 4, tail: 0, voice: "recorder", bassVoice: "pluck",
      melody: [
        [72,.5],[76,.5],[79,.5],[76,.5],[84,1],[79,1],     [81,.5],[79,.5],[76,.5],[79,.5],[74,1],[null,1],
        [72,.5],[76,.5],[79,.5],[76,.5],[84,1],[81,1],     [79,.5],[76,.5],[74,.5],[72,.5],[72,2],
        [74,.5],[74,.5],[77,.5],[81,.5],[79,1],[76,1],     [76,.5],[76,.5],[79,.5],[83,.5],[81,1],[79,1],
        [84,.5],[83,.5],[81,.5],[79,.5],[76,.5],[74,.5],[72,.5],[74,.5],     [72,1],[null,1],[72,.5],[72,.5],[72,1]],
      bass: function (b) { var r = [48,48,48,43,50,52,48,48][b]; return [[0, r, .2], [1, r + 12, .1], [2, r + 7, .14], [3, r + 12, .1]]; },
      drums: function (b) {
        var d = [[0,"kick",.9],[1,"snare",.6],[2,"kick",.8],[3,"snare",.6]], i;
        for (i = 0; i < 8; i++) d.push([i * .5, "hat", i % 2 ? .22 : .32]);
        if (b === 0) d.push([0, "crash", .45]);
        if (b === 3) { d.pop(); d.pop(); d.push([3,"tom1",.7],[3.25,"tom1",.6],[3.5,"tom2",.7],[3.75,"tom3",.8]); }
        if (b === 7) { d.push([3,"snare",.5],[3.25,"snare",.55],[3.5,"snare",.65],[3.75,"snare",.75],[3.875,"tom3",.8]); }
        return d; } },

    // 쑝이(아기 새): 짹짹 떨리는 소리(트릴)와 갑자기 높이 치솟는 소리, 끝에 뿅! 소리
    0: { bpm: 144, barBeats: 4, tail: 0, voice: "chirp", bassVoice: "pluck",
      melody: [
        [79,.25],[83,.25],[79,.25],[83,.25],[86,1],[null,.5],[74,.5],[79,1],
        [83,.5],[81,.5],[79,.5],[76,.5],[74,1],[null,1],
        [79,.25],[83,.25],[79,.25],[83,.25],[88,1],[86,.5],[83,.5],[79,1],
        [81,.5],[79,.5],[76,.5],[74,.5],[79,1],[67,1,"boing"],
        [74,.5],[74,.5],[null,.5],[74,.5],[79,1],[83,1],
        [86,.5],[83,.5],[86,.5],[83,.5],[79,.5],[null,.5],[76,.5],[74,.5],
        [79,.25],[83,.25],[79,.25],[83,.25],[88,.5],[null,.5],[88,.5],[null,.5],[86,1],
        [83,.5],[81,.5],[79,.5],[76,.5],[79,1],[null,.5],[79,.5]],
      bass: function (b) { var r = [43,43,43,43,50,43,48,43][b]; return [[0, r, .18], [1, r + 12, .1], [2, r + 7, .14], [3, r + 12, .1]]; },
      drums: function (b) { return [[0,"kick",.7],[1,"wood",.5],[2,"kick",.6],[2.5,"kick",.5],[3,"wood",.5],[.5,"hat",.2],[1.5,"hat",.2],[3.5,"hat",.2]]; } },

    // 몽이(토끼): 어긋난 박자로 폴짝폴짝, 마림바 + 뿅뿅 튀는 소리 + 카우벨
    1: { bpm: 148, barBeats: 4, tail: 0, voice: "marimba", bassVoice: "pluck",
      melody: [
        [77,.5],[null,.5],[77,.5],[81,.5],[84,.5],[81,.5],[77,1],
        [74,.5],[null,.5],[74,.5],[77,.5],[81,1],[null,.5],[72,.5,"boing"],
        [72,.25],[74,.25],[76,.25],[77,.25],[79,.5],[81,.5],[84,1],[null,1],
        [81,.5],[79,.5],[77,.5],[76,.5],[77,1],[77,.5],[77,.5],
        [79,.5],[null,.5],[79,.5],[83,.5],[86,.5],[83,.5],[79,1],
        [77,.5],[null,.5],[77,.5],[81,.5],[84,1],[null,.5],[84,.5],
        [72,.25],[77,.25],[81,.25],[84,.25],[81,.25],[77,.25],[72,.25],[null,.25],[77,1],[null,1],
        [84,.5],[81,.5],[77,.5],[72,.5],[77,2,"boing"]],
      bass: function (b) { var r = [41,46,41,48,43,41,48,41][b]; return [[0, r, .2], [1.5, r + 7, .12], [2, r, .16], [3.5, r + 7, .12]]; },
      drums: function (b) { return [[0,"kick",.8],[1,"cow",.35],[2,"kick",.7],[3,"cow",.35],[.5,"hat",.2],[1.5,"hat",.2],[2.5,"hat",.2],[3.5,"hat",.2]]; } },

    // 콩이(곰): 3박자로 뒤뚱뒤뚱, 투바 쿵짝짝 + 카주 소리, 끝에 하품하듯 미끄러져 내려감
    2: { bpm: 120, barBeats: 3, tail: 0, voice: "kazoo", bassVoice: "pluck",
      melody: [
        [72,1],[76,1],[79,1],
        [81,1],[79,.5],[76,.5],[72,1],
        [74,1],[77,1],[81,1],
        [79,1.5],[76,.5],[72,1],
        [72,.5],[72,.5],[76,.5],[79,.5],[84,1],
        [83,1],[81,.5],[79,.5],[76,1],
        [77,.5],[79,.5],[81,.5],[79,.5],[77,.5],[76,.5],
        [72,2],[67,1,"slide"]],
      bass: function (b) { var r = [48,48,50,48,48,43,53,48][b]; return [[0, r - 12, .3, "tuba"], [1, r + 7, .13], [2, r + 7, .13]]; },
      drums: function (b) { return [[0,"kick",.8],[1,"wood",.45],[2,"wood",.45]]; } },

    // 별이(밤하늘 고양이): 톡톡 튀는 소리 + 야옹~ 하는 미끄러지는 소리, 수상하고 엉뚱한 분위기
    3: { bpm: 132, barBeats: 4, tail: 0, voice: "pizz", bassVoice: "harp",
      melody: [
        [81,.5],[null,.5],[81,.5],[79,.5],[76,.5],[null,.5],[72,1],
        [74,.5],[76,.5],[74,.5],[72,.5],[69,1],[null,.5],[null,.5],
        [72,.25],[76,.25],[81,.25],[76,.25],[72,.25],[76,.25],[81,.25],[76,.25],[84,1],[null,1],
        [83,.5],[81,.5],[79,.5],[76,.5],[81,1,"meow"],[null,1],
        [81,.5],[null,.5],[81,.5],[79,.5],[76,.5],[null,.5],[72,1],
        [74,.5],[76,.5],[77,.5],[76,.5],[74,.5],[72,.5],[69,1],
        [69,.25],[72,.25],[76,.25],[81,.25],[84,.5],[81,.5],[76,.5],[72,.5],[69,1],
        [76,.5],[null,.5],[76,.5],[null,.5],[81,1,"meow"],[null,1]],
      bass: function (b) { var r = [45,45,48,43,45,41,45,45][b]; return [[0, r, .12], [1, r + 7, .09], [2, r + 12, .09], [3, r + 7, .09]]; },
      drums: function (b) { return [[0,"kick",.6],[1.5,"wood",.4],[3.5,"wood",.4],[1,"hat",.2],[2,"hat",.2],[3,"hat",.2]]; } }
  };
  var PET_THEME = [0, 1, 2, 3];

  var ctx = null, master = null, waveR = null, waveF = null, noise = null;
  var on = false, timer = null, startedByPet = false, petIndex = -1, run = null, switching = null;

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function setup() {
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    waveR = ctx.createPeriodicWave(new Float32Array(6), new Float32Array([0, 1, 0.14, 0.3, 0.04, 0.07]));   // 리코더: 맑고 둥근 소리
    waveF = ctx.createPeriodicWave(new Float32Array(4), new Float32Array([0, 1, 0.2, 0.05]));              // 플루트: 더 부드러운 소리
    var len = ctx.sampleRate;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(type, f, t, dur, peak, atk, decayTau) {            // 기본 소리 한 개 (시작 → 줄어듦)
    var o = ctx.createOscillator();
    if (type === "R") o.setPeriodicWave(waveR); else if (type === "F") o.setPeriodicWave(waveF); else o.type = type;
    o.frequency.value = f;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.setTargetAtTime(0.0001, t + atk, decayTau);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
    return o;
  }
  function hiss(t, vol, ftype, freq, q, decay, dur) {               // 잡음 소리(북 · 심벌에 씀)
    var n = ctx.createBufferSource(); n.buffer = noise;
    var fl = ctx.createBiquadFilter(); fl.type = ftype; fl.frequency.value = freq; fl.Q.value = q;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(vol, t); ng.gain.exponentialRampToValueAtTime(0.002, t + decay);
    n.connect(fl); fl.connect(ng); ng.connect(master); n.start(t, rnd(0, 0.5), dur);
  }
  function breath(t, vol) {                                         // 리코더 숨소리
    var n = ctx.createBufferSource(); n.buffer = noise;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3000; bp.Q.value = 0.8;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(vol, t + 0.03); ng.gain.exponentialRampToValueAtTime(0.004, t + 0.22);
    n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t, rnd(0, 0.5), 0.3);
  }
  function sustained(wave, m, t, dur, peak, atkWant, vib) {         // 길게 끄는 관악기 소리
    var f = hz(m), end = t + dur, atk = Math.min(atkWant, dur * 0.35);
    var o = ctx.createOscillator(); o.setPeriodicWave(wave);
    o.detune.value = rnd(-8, 8);
    o.frequency.setValueAtTime(f * 0.972, t); o.frequency.linearRampToValueAtTime(f, t + 0.06);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    g.gain.setTargetAtTime(peak * 0.72, t + atk + 0.04, 0.1);
    g.gain.setValueAtTime(peak * 0.72, Math.max(t + atk + 0.05, end - 0.05));
    g.gain.linearRampToValueAtTime(0, end + 0.04);
    o.connect(g); g.connect(master);
    if (vib && dur > 0.9) {
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.004, t + dur * 0.8);
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(end + 0.1);
    }
    o.start(t); o.stop(end + 0.1);
  }
  function glide(m, t, peak, steps, total) {                        // 음이 미끄러지는 엉뚱한 소리(뿅 · 야옹 · 하품)
    var f = hz(m), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f * steps[0][1], t);
    steps.forEach(function (s) { o.frequency.exponentialRampToValueAtTime(f * s[1], t + s[0]); });
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.03);
    g.gain.setValueAtTime(peak, t + total * 0.7); g.gain.linearRampToValueAtTime(0, t + total);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + total + 0.05);
    var o2 = ctx.createOscillator(), g2 = ctx.createGain();           // 한 옥타브 위 소리를 살짝 섞어 코맹맹이 느낌
    o2.type = "triangle"; o2.frequency.setValueAtTime(f * 2 * steps[0][1], t);
    steps.forEach(function (s) { o2.frequency.exponentialRampToValueAtTime(f * 2 * s[1], t + s[0]); });
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(peak * 0.3, t + 0.03); g2.gain.linearRampToValueAtTime(0, t + total);
    o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + total + 0.05);
  }

  var VOICES = {                                                     // 멜로디 악기들
    recorder: function (m, t, d) { sustained(waveR, m, t, d, 0.85, 0.05, true); breath(t, 0.05); },
    flute:    function (m, t, d) { sustained(waveF, m, t, d, 0.7, 0.16, true); breath(t, 0.03); },
    chirp:    function (m, t, d) {                                   // 새소리: 짧게 위로 휙 올라가는 휘파람
      var f = hz(m), dd = Math.min(d, 0.26);
      var o = tone("sine", f, t, dd + 0.1, 0.8, 0.012, 0.07);
      o.frequency.setValueAtTime(f * 0.93, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      tone("sine", f * 2, t, dd + 0.1, 0.12, 0.012, 0.05);
    },
    marimba:  function (m, t, d) { var f = hz(m); tone("sine", f, t, 0.7, 0.9, 0.004, 0.11); tone("sine", f * 4, t, 0.3, 0.22, 0.003, 0.03); },
    pizz:     function (m, t, d) { var f = hz(m); var o = tone("triangle", f, t, 0.3, 0.85, 0.004, 0.06); o.frequency.setValueAtTime(f * 1.04, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03); tone("sine", f * 3, t, 0.15, 0.12, 0.003, 0.03); },
    kazoo:    function (m, t, d) {                                   // 카주: 코맹맹이 소리
      var f = hz(m), end = t + d * 0.95;
      var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = rnd(-10, 10);
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 1.4;
      var g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.03);
      g.gain.setValueAtTime(0.55, Math.max(t + 0.04, end - 0.05)); g.gain.linearRampToValueAtTime(0, end + 0.03);
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = f * 0.012;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(end + 0.1);
      o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(end + 0.1);
    },
    boing:    function (m, t, d) { glide(m, t, 0.6, [[0.09, 2.2], [0.3, 0.75]], 0.34); },        // 뿅~ (올라갔다 처짐)
    meow:     function (m, t, d) { glide(m, t, 0.5, [[0.12, 1.5], [0.4, 0.85]], 0.46); },        // 야옹~
    slide:    function (m, t, d) { glide(m, t, 0.6, [[0.9, 0.5]], 0.9); }                        // 하품하듯 주르륵 내려감
  };
  var BASSES = {                                                     // 받침 악기들
    pluck: function (m, t, v) { tone("triangle", hz(m), t, 0.7, v, 0.02, 0.16); },
    tuba:  function (m, t, v) { tone("triangle", hz(m), t, 0.5, v * 1.5, 0.02, 0.12); tone("sawtooth", hz(m), t, 0.4, v * 0.2, 0.02, 0.08); },
    pad:   function (m, t, v) { tone("sine", hz(m), t, 3.2, v, 0.5, 0.9); },
    harp:  function (m, t, v) { var f = hz(m); tone("sine", f, t, 1.2, v * 1.6, 0.006, 0.25); tone("sine", f * 2, t, 0.6, v * 0.5, 0.006, 0.1); }
  };
  function tom(f0, t, v) { var o = tone("sine", f0, t, 0.35, v, 0.003, 0.09); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.16); }
  var DRUMS = {                                                      // 북 소리들(우당탕 느낌)
    kick:  function (t, v) { var o = tone("sine", 150, t, 0.3, v, 0.002, 0.06); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); },
    snare: function (t, v) { hiss(t, v * 0.8, "bandpass", 1900, 0.7, 0.16, 0.25); tone("triangle", 190, t, 0.12, v * 0.4, 0.002, 0.04); },
    hat:   function (t, v) { hiss(t, v * 0.6, "highpass", 7500, 0.7, 0.05, 0.1); },
    wood:  function (t, v) { tone("triangle", 900, t, 0.1, v, 0.002, 0.025); tone("sine", 1350, t, 0.08, v * 0.4, 0.002, 0.02); },   // 딱딱 나무토막
    cow:   function (t, v) { tone("square", 560, t, 0.25, v * 0.35, 0.002, 0.08); tone("square", 845, t, 0.25, v * 0.35, 0.002, 0.08); },   // 땡땡 카우벨
    tom1:  function (t, v) { tom(220, t, v); },
    tom2:  function (t, v) { tom(165, t, v); },
    tom3:  function (t, v) { tom(120, t, v); },
    crash: function (t, v) { hiss(t, v * 0.7, "highpass", 3500, 0.5, 0.9, 1); }
  };

  // 곡 하나를 시간표(언제 · 어떤 음)로 바꿔 둠
  function build(th) {
    var mel = [], bas = [], drm = [], pos = 0, bars, b;
    th.melody.forEach(function (n) { if (n[0] !== null) mel.push({ at: pos, m: n[0], d: n[1], vo: n[2] }); pos += n[1]; });
    bars = Math.round(pos / th.barBeats);
    for (b = 0; b < bars; b++) {
      th.bass(b).forEach(function (x) { bas.push({ at: b * th.barBeats + x[0], m: x[1], v: x[2], vo: x[3] }); });
      if (th.drums) th.drums(b).forEach(function (x) { drm.push({ at: b * th.barBeats + x[0], k: x[1], v: x[2] }); });
    }
    drm.sort(function (p, q) { return p.at - q.at; });
    return { th: th, lists: { mel: mel, bas: bas, drm: drm }, loop: pos + th.tail, beat: 60 / th.bpm };
  }
  var BUILT = {};
  function getTheme(key) { return BUILT[key] || (BUILT[key] = build(THEMES[key])); }

  function pump() {                                                  // 앞으로 0.4초 안에 울릴 음들을 예약
    var now = ctx.currentTime, horizon = now + 0.4, T = run.t;
    Object.keys(T.lists).forEach(function (name) {
      var list = T.lists[name], st = run.s[name];
      if (!list.length) return;
      while (true) {
        var e = list[st.i];
        var t = st.start + e.at * T.beat + (name === "mel" ? rnd(-0.012, 0.02) : 0);   // 박자도 사람처럼 아주 조금 어긋남
        if (t > horizon) break;
        if (t >= now - 0.05) {
          t = Math.max(t, now);
          if (name === "mel") VOICES[e.vo || T.th.voice](e.m, t, e.d * T.beat * 0.9);
          else if (name === "bas") BASSES[e.vo || T.th.bassVoice](e.m, t, e.v);
          else DRUMS[e.k](t, e.v);
        }
        st.i++;
        if (st.i >= list.length) { st.i = 0; st.start += T.loop * T.beat; }
      }
    });
  }

  function begin(key) {                                              // 이 곡을 처음부터 연주 시작
    var T = getTheme(key), t0 = ctx.currentTime + 0.15;
    run = { t: T, s: { mel: { i: 0, start: t0 }, bas: { i: 0, start: t0 }, drm: { i: 0, start: t0 } } };
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(VOLUME, ctx.currentTime, 0.25);      // 천천히 커짐
    clearInterval(timer); timer = setInterval(pump, 80); pump();
  }
  function currentKey() { return petIndex >= 0 ? PET_THEME[petIndex] : "base"; }
  function paint() {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "배경음악 끄기" : "배경음악 켜기");
    btn.title = on ? "배경음악 끄기" : "배경음악 켜기";
  }
  function start() {
    if (!ctx) setup();
    ctx.resume(); on = true; begin(currentKey()); paint();
  }
  function stop() {
    on = false; clearInterval(timer); clearTimeout(switching);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);           // 천천히 작아짐
    setTimeout(function () { if (!on) ctx.suspend(); }, 700);
    paint();
  }
  function change() {                                                // 곡 바꾸기: 소리를 잠깐 줄였다가 새 곡으로
    clearTimeout(switching);
    clearInterval(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
    switching = setTimeout(function () { if (on) begin(currentKey()); }, 450);
  }

  btn.addEventListener("click", function () { startedByPet = false; if (on) stop(); else start(); });
  document.addEventListener("visibilitychange", function () {        // 다른 탭에서는 멈췄다가 돌아오면 이어서
    if (!on || !ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  // 첫 화면 캐릭터를 포인터로 고르거나(index 0~3) 돌려놓으면(-1) 알려 줌
  document.addEventListener("pet-change", function (e) {
    var idx = e.detail.index;
    if (idx >= 0) {
      petIndex = idx;
      if (!on) { startedByPet = true; start(); } else change();      // 꺼져 있었으면 캐릭터 곡으로 켬
    } else {
      petIndex = -1;
      if (startedByPet) { startedByPet = false; if (on) stop(); }    // 캐릭터 때문에 켠 거면 함께 끔
      else if (on) change();                                         // 원래 켜져 있었으면 기본 곡으로 돌아옴
    }
  });
})();

// ABOUT 소개: 구역이 화면에 보이면 '안녕하세요, 쑝이예요.'와 아래 소개글이 차례로 타이핑되듯 나타난다.
// (전체 글은 스크린 리더용으로 숨겨 두고, 아직 안 친 글자는 투명하게 자리만 잡아서 줄바꿈이 흔들리지 않게 한다)
(function () {
  var box = document.querySelector(".about-text");
  if (!box) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var parts = [box.querySelector("h3"), box.querySelector("p")].filter(Boolean).map(function (el, i) {
    var full = el.textContent.trim();
    el.textContent = "";
    var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = full;
    var typed = document.createElement("span"); typed.setAttribute("aria-hidden", "true");
    var caret = document.createElement("span"); caret.className = "type-caret"; caret.setAttribute("aria-hidden", "true");
    var rest = document.createElement("span"); rest.className = "type-rest"; rest.setAttribute("aria-hidden", "true"); rest.textContent = full;
    el.appendChild(sr); el.appendChild(typed); el.appendChild(caret); el.appendChild(rest);
    return { full: full, typed: typed, rest: rest, caret: caret, speed: i === 0 ? 85 : 38 };
  });
  var started = false;
  function typeNext(k) {
    if (k >= parts.length) return;
    var p = parts[k], n = 0;
    p.caret.style.display = "inline-block";
    (function tick() {
      n++;
      p.typed.textContent = p.full.slice(0, n);
      p.rest.textContent = p.full.slice(n);
      if (n < p.full.length) { setTimeout(tick, p.speed + Math.random() * 40); return; }
      if (k < parts.length - 1) { p.caret.style.display = "none"; setTimeout(function () { typeNext(k + 1); }, 350); }
    })();
  }
  parts.forEach(function (p) { p.caret.style.display = "none"; });
  function go() { if (started) return; started = true; setTimeout(function () { typeNext(0); }, 500); }
  if (!("IntersectionObserver" in window)) { go(); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { go(); io.disconnect(); } });
  }, { threshold: 0.6 });
  io.observe(box);
})();

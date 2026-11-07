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

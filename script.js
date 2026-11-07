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

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

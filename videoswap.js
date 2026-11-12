// ===== 작은 영상을 누르면 큰 화면으로 바꿔 재생 (홈 WORKS와 works.html 둘 다 씀) =====
// - 작은 영상(.clips 안)이 재생되려는 순간 막고, 큰 영상과 '영상 파일 · 이름'을 서로 바꾼 뒤 큰 화면에서 재생해요.
// - 큰 영상은 작은 영상이 있던 자리로 가요(처음 장면에서 멈춘 모습).
(function () {
  var card = document.querySelector(".video-card");
  if (!card) return;
  var big = card.querySelector(".card-img video");
  var title = card.querySelector(".card-body h3");
  var figs = card.querySelectorAll(".clips .clip");
  if (!big || !title || !figs.length) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var busy = false;

  function swapWith(fig) {
    var small = fig.querySelector("video");
    var cap = fig.querySelector("figcaption");
    if (busy || !small || !cap) return;
    busy = true;

    // 모든 영상을 멈추고(두 개가 동시에 소리 나지 않게)
    document.querySelectorAll("video").forEach(function (v) { v.pause(); });

    // 영상 파일 바꾸기 (주소 끝의 #t=0.1은 첫 장면을 보여 주려고 붙인 것이라 그대로 둠)
    var bigSrc = big.getAttribute("src"), smallSrc = small.getAttribute("src");
    big.setAttribute("src", smallSrc);
    small.setAttribute("src", bigSrc);
    // 이름 바꾸기 (큰 카드 제목 ↔ 작은 영상 이름)
    var bigName = title.textContent, smallName = cap.textContent;
    title.textContent = smallName;
    cap.textContent = bigName;
    big.setAttribute("aria-label", smallName);
    small.setAttribute("aria-label", bigName);
    big.load();
    small.load();

    // 큰 화면이 안 보이는 곳이면(휴대폰 등) 큰 화면이 보이게 스크롤
    var r = big.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      big.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }
    var p = big.play();
    if (p && p.catch) p.catch(function () {});   // 자동 재생이 막히면 큰 화면의 재생 버튼을 누르면 됨
    setTimeout(function () { busy = false; }, 400);
  }

  figs.forEach(function (fig) {
    var v = fig.querySelector("video");
    if (v) v.addEventListener("play", function () { swapWith(fig); });
  });
})();

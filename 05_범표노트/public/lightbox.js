/* ============================================================
   범표노트 - 이미지 확대(라이트박스)
   ------------------------------------------------------------
   * 글 목록 썸네일 · 표지 사진 · 본문 사진을 누르면 크게 확대해서 보여줍니다.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    var overlay = document.getElementById("lightbox-overlay");
    var img = document.getElementById("lightbox-img");
    var closeBtn = document.getElementById("lightbox-close");
    if (!overlay || !img || !closeBtn) return;

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      overlay.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function close() {
      overlay.hidden = true;
      img.src = "";
      document.body.style.overflow = "";
    }

    var selector = ".post-thumb img, .post-hero, article .content img";
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.add("zoomable");
      el.addEventListener("click", function () {
        open(el.currentSrc || el.src, el.alt);
      });
    });

    overlay.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

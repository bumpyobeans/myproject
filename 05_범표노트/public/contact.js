/* ============================================================
   범표노트 - 협업 문의 저장 (Supabase REST, fetch 직접 호출)
   ------------------------------------------------------------
   * config.js 의 window.NOTE_SUPABASE = { url, key } 를 읽습니다.
   * 이 표(inquiries)는 "쓰기만" 허용이라 여기서 읽어올 수는 없습니다.
   * 예외를 절대 밖으로 던지지 않고, 실패하면 {error} 를 리턴합니다.
   ============================================================ */
(function () {
  "use strict";

  function getCfg() {
    return (typeof window !== "undefined" && window.NOTE_SUPABASE) || {};
  }

  function enabled() {
    var cfg = getCfg();
    return !!(cfg.url && cfg.key) && typeof fetch === "function";
  }

  function postInquiry(data) {
    if (!enabled()) return Promise.resolve({ error: "문의 기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/rest/v1/inquiries";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Authorization": "Bearer " + cfg.key,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.ok ? true : { error: "문의 접수에 실패했어요." };
      }).catch(function () {
        return { error: "문의 접수에 실패했어요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "문의 접수에 실패했어요." });
    }
  }

  window.NOTE_CONTACT = {
    postInquiry: postInquiry
  };
})();

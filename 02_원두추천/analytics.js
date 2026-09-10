/* ============================================================
   범표원두 커피 추천 - 상담 기록 전송 (Supabase REST, fetch 직접 호출)
   ------------------------------------------------------------
   * config.js 의 window.BP_ANALYTICS = { url, key } 를 읽습니다.
   * url/key 가 없거나 fetch 를 못 쓰는 환경이면 아무 것도 하지 않습니다
     (상담 UI는 항상 정상 동작해야 하므로 예외를 절대 밖으로 던지지 않습니다).
   * index.html 에서 products.js 보다 먼저 불러옵니다.
   ============================================================ */
(function () {
  "use strict";

  var cfg = (typeof window !== "undefined" && window.BP_ANALYTICS) || {};
  var enabled = !!(cfg.url && cfg.key) && typeof fetch === "function";

  function uuid() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (e) {}
    // crypto.randomUUID 가 없을 때: Math.random 기반 v4 흉내
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      var key = "bp_visitor";
      var v = window.localStorage.getItem(key);
      if (v) return v;
      v = uuid();
      window.localStorage.setItem(key, v);
      return v;
    } catch (e) {
      // localStorage 를 못 쓰는 환경(시크릿 모드 등): 세션 한정 임시값
      return uuid();
    }
  }

  var visitorId = getVisitorId();
  var sessionId = null;

  function post(table, row) {
    if (!enabled) return;
    try {
      fetch(cfg.url + "/rest/v1/" + table, {
        method: "POST",
        keepalive: true,
        headers: {
          "apikey": cfg.key,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(row)
      }).catch(function () {});
    } catch (e) {}
  }

  function device() {
    try {
      return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "pc";
    } catch (e) {
      return "pc";
    }
  }

  var BP = {
    enabled: enabled,
    startSession: function () {
      try {
        sessionId = uuid();
        var q = new URLSearchParams(location.search);
        post("sessions", {
          id: sessionId,
          visitor_id: visitorId,
          src: q.get("src") || null,
          from_type: q.get("from") || null,
          referrer: (document.referrer || "").slice(0, 500) || null,
          device: device(),
          user_agent: navigator.userAgent.slice(0, 300),
          landing_url: location.href.slice(0, 500)
        });
        BP.track("start", {});
      } catch (e) {}
    },
    track: function (type, payload) {
      try {
        if (!sessionId) return;
        post("events", { session_id: sessionId, visitor_id: visitorId, type: type, payload: payload || {} });
      } catch (e) {}
    }
  };

  window.BP = BP;
})();

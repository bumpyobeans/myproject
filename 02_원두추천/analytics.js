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

  /* base36 무작위 문자열 (기본 10자). crypto.getRandomValues 가 있으면 그걸로, 없으면 Math.random */
  function newId(n) {
    n = n || 10;
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var s = "";
    try {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        var arr = new Uint8Array(n);
        crypto.getRandomValues(arr);
        for (var i = 0; i < n; i++) s += chars[arr[i] % chars.length];
        return s;
      }
    } catch (e) {}
    for (var j = 0; j < n; j++) s += chars[(Math.random() * chars.length) | 0];
    return s;
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
    },
    visitorId: function () { return visitorId; },
    newId: function (n) { return newId(n); },
    createMap: function (ownerType, ownerName) {
      if (!enabled) return Promise.resolve(null);
      try {
        var id = newId(10);
        var name = (ownerName || "").slice(0, 12);
        var row = { id: id, owner_visitor: visitorId, owner_type: ownerType, owner_name: name ? name : null };
        return fetch(cfg.url + "/rest/v1/maps", {
          method: "POST",
          headers: {
            "apikey": cfg.key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(row)
        }).then(function (res) {
          return res.status === 201 ? id : null;
        }).catch(function () { return null; });
      } catch (e) { return Promise.resolve(null); }
    },
    joinMap: function (mapId, friendType, friendName, pairName, pairScore) {
      if (!enabled) return Promise.resolve("fail");
      try {
        var name = (friendName || "").slice(0, 12);
        var row = {
          map_id: mapId,
          friend_visitor: visitorId,
          friend_type: friendType,
          friend_name: name ? name : null,
          pair_name: pairName || null,
          pair_score: (typeof pairScore === "number") ? pairScore : null
        };
        return fetch(cfg.url + "/rest/v1/map_friends", {
          method: "POST",
          headers: {
            "apikey": cfg.key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(row)
        }).then(function (res) {
          if (res.status === 201) return "ok";
          if (res.status === 409) return "dup";
          return "fail";
        }).catch(function () { return "fail"; });
      } catch (e) { return Promise.resolve("fail"); }
    },
    fetchMap: function (mapId) {
      if (!enabled) return Promise.resolve(null);
      try {
        var headers = { "apikey": cfg.key, "Accept": "application/json" };
        var mapReq = fetch(cfg.url + "/rest/v1/maps?id=eq." + encodeURIComponent(mapId) + "&select=*", { headers: headers })
          .then(function (res) { return res.ok ? res.json() : []; })
          .catch(function () { return []; });
        var friendsReq = fetch(cfg.url + "/rest/v1/map_friends?map_id=eq." + encodeURIComponent(mapId) + "&select=*&order=pair_score.desc,created_at.asc", { headers: headers })
          .then(function (res) { return res.ok ? res.json() : []; })
          .catch(function () { return []; });
        return Promise.all([mapReq, friendsReq]).then(function (results) {
          var maps = results[0] || [], friends = results[1] || [];
          if (!maps.length) return null;
          return { map: maps[0], friends: friends };
        }).catch(function () { return null; });
      } catch (e) { return Promise.resolve(null); }
    }
  };

  window.BP = BP;
})();

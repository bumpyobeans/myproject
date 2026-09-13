/* ============================================================
   범표노트 - 글 댓글 + 로그인 (Supabase REST, fetch 직접 호출)
   ------------------------------------------------------------
   * config.js 의 window.NOTE_SUPABASE = { url, key } 를 읽습니다.
   * url/key 가 없거나 fetch 를 못 쓰는 환경이면 조용히 빈 결과/에러를 리턴합니다
     (댓글 UI는 항상 정상 동작해야 하므로 예외를 절대 밖으로 던지지 않습니다).
   * [slug].astro 에서 config.js 다음에 불러옵니다.
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

  function fetchComments(postSlug) {
    if (!enabled()) return Promise.resolve([]);
    try {
      var cfg = getCfg();
      var url = cfg.url + "/rest/v1/note_comments?post_slug=eq." + encodeURIComponent(postSlug) +
        "&select=id,name,body,created_at,user_id&order=created_at.asc";
      return fetch(url, {
        headers: {
          "apikey": cfg.key,
          "Authorization": "Bearer " + cfg.key
        }
      }).then(function (res) {
        return res.ok ? res.json() : [];
      }).catch(function () {
        return [];
      });
    } catch (e) {
      return Promise.resolve([]);
    }
  }

  function postComment(postSlug, name, body, accessToken) {
    if (!enabled()) return Promise.resolve({ error: "댓글 기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/rest/v1/note_comments";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Authorization": "Bearer " + (accessToken || cfg.key),
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify({ post_slug: postSlug, name: name, body: body })
      }).then(function (res) {
        if (!res.ok) {
          return { error: "댓글 등록에 실패했어요." };
        }
        return res.json().then(function (rows) {
          return (rows && rows[0]) ? rows[0] : true;
        }).catch(function () {
          return true;
        });
      }).catch(function () {
        return { error: "댓글 등록에 실패했어요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "댓글 등록에 실패했어요." });
    }
  }

  function deleteComment(id, accessToken) {
    if (!accessToken) return Promise.resolve({ error: "로그인이 필요해요." });
    if (!enabled()) return Promise.resolve({ error: "댓글 기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/rest/v1/note_comments?id=eq." + encodeURIComponent(id);
      return fetch(url, {
        method: "DELETE",
        headers: {
          "apikey": cfg.key,
          "Authorization": "Bearer " + accessToken
        }
      }).then(function (res) {
        return res.ok ? true : { error: "삭제에 실패했어요." };
      }).catch(function () {
        return { error: "삭제에 실패했어요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "삭제에 실패했어요." });
    }
  }

  function parseAuthError(json, fallback) {
    if (json && (json.error_description || json.msg)) {
      return json.error_description || json.msg;
    }
    return fallback;
  }

  function toSession(json) {
    return {
      session: {
        access_token: json.access_token,
        refresh_token: json.refresh_token,
        expires_in: json.expires_in,
        user: json.user
      }
    };
  }

  function signUp(email, password) {
    if (!enabled()) return Promise.resolve({ error: "기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/auth/v1/signup";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) {
            return { error: parseAuthError(json, "가입에 실패했어요.") };
          }
          if (json && json.access_token) {
            return toSession(json);
          }
          return { needsConfirmation: true };
        }).catch(function () {
          return { error: "가입에 실패했어요." };
        });
      }).catch(function () {
        return { error: "가입에 실패했어요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "가입에 실패했어요." });
    }
  }

  function signIn(email, password) {
    if (!enabled()) return Promise.resolve({ error: "기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/auth/v1/token?grant_type=password";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) {
            return { error: parseAuthError(json, "이메일 또는 비밀번호가 올바르지 않아요.") };
          }
          return toSession(json);
        }).catch(function () {
          return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
        });
      }).catch(function () {
        return { error: "이메일 또는 비밀번호가 올바르지 않아요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "이메일 또는 비밀번호가 올바르지 않아요." });
    }
  }

  function refreshSession(refreshToken) {
    if (!enabled()) return Promise.resolve({ error: "기능을 사용할 수 없어요." });
    try {
      var cfg = getCfg();
      var url = cfg.url + "/auth/v1/token?grant_type=refresh_token";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      }).then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) {
            return { error: parseAuthError(json, "세션 갱신에 실패했어요.") };
          }
          return toSession(json);
        }).catch(function () {
          return { error: "세션 갱신에 실패했어요." };
        });
      }).catch(function () {
        return { error: "세션 갱신에 실패했어요." };
      });
    } catch (e) {
      return Promise.resolve({ error: "세션 갱신에 실패했어요." });
    }
  }

  function signOut(accessToken) {
    try {
      var cfg = getCfg();
      if (!enabled() || !accessToken) return Promise.resolve();
      var url = cfg.url + "/auth/v1/logout";
      return fetch(url, {
        method: "POST",
        headers: {
          "apikey": cfg.key,
          "Authorization": "Bearer " + accessToken
        }
      }).then(function () {
        return undefined;
      }).catch(function () {
        return undefined;
      });
    } catch (e) {
      return Promise.resolve();
    }
  }

  window.NOTE_COMMENTS = {
    fetchComments: fetchComments,
    postComment: postComment,
    deleteComment: deleteComment,
    signUp: signUp,
    signIn: signIn,
    refreshSession: refreshSession,
    signOut: signOut
  };
})();

/* ============================================================
   범표원두 커피 추천 - 대화 흐름 + 추천 로직 + 화면 그리기
   ------------------------------------------------------------
   * ES 모듈을 쓰지 않습니다. index.html 에서 <script src> 로만 불러옵니다.
   * products.js 의 전역변수 PRODUCTS 를 그대로 사용합니다.
   * 파일을 더블클릭(file://)해서 열어도 그대로 동작해야 합니다.
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. 질문 정의
     각 선택지(option)
     - label  : 버튼에 보이는 글자
     - value  : 내부에서 쓰는 값
     - phrase : 추천 이유 문장에 끼워 넣을 표현
     ---------------------------------------------------------- */
  var QUESTIONS = {
    q1: {
      text: "평소 커피를 어떻게 즐기세요?",
      options: [
        { label: "핸드드립으로 직접 내려요", value: "핸드드립", phrase: "핸드드립으로 직접 내려 드신다고 하셔서" },
        { label: "아메리카노를 간편하게 마셔요", value: "아메리카노간편", phrase: "아메리카노를 간편하게 즐기신다고 하셔서" },
        { label: "라떼·베리에이션을 즐겨요", value: "라떼", phrase: "라떼나 베리에이션을 즐기신다고 하셔서" },
        { label: "캡슐머신이 있어요", value: "캡슐", phrase: "캡슐머신을 쓰신다고 하셔서" },
        { label: "콜드브루를 마셔요", value: "콜드브루", phrase: "콜드브루를 찾으신다고 하셔서" },
        { label: "선물할 거예요", value: "선물", phrase: "선물용으로 찾으신다고 하셔서" },
        { label: "여행·캠핑에서 마실 거예요", value: "여행캠핑", phrase: "여행이나 캠핑에서 즐기실 거라 하셔서" }
      ]
    },
    q2: {
      text: "어떤 맛을 좋아하세요?",
      options: [
        { label: "고소하고 묵직한 맛", value: "고소", phrase: "고소하고 묵직한 맛을 좋아하신다고 하셨죠" },
        { label: "균형잡힌 잔잔한 맛", value: "균형", phrase: "균형잡힌 잔잔한 맛을 좋아하신다고 하셨죠" },
        { label: "산뜻하고 상큼한 맛", value: "산뜻", phrase: "산뜻하고 상큼한 맛을 좋아하신다고 하셨죠" },
        { label: "잘 모르겠어요", value: "모름", phrase: "맛 취향을 잘 모르겠다고 하셔서" }
      ]
    },
    q3: {
      text: "부담스러운 맛이 있나요?",
      options: [
        { label: "신맛은 좀...", value: "신맛회피", phrase: "신맛이 부담스럽다고 하셔서" },
        { label: "쓴맛은 좀...", value: "쓴맛회피", phrase: "쓴맛이 부담스럽다고 하셔서" },
        { label: "없어요", value: "없음", phrase: "" }
      ]
    },
    q4: {
      text: "카페인은 어떠세요?",
      options: [
        { label: "상관없어요", value: "상관없음", phrase: "" },
        { label: "디카페인으로 주세요", value: "디카페인", phrase: "카페인은 디카페인으로 원하셔서" }
      ]
    },
    q5: {
      text: "그럼 이런 커피는 어떠세요?",
      options: [
        { label: "부드럽고 편안한 커피", value: "부드러움", phrase: "부드럽고 편안한 커피를 원하셔서" },
        { label: "개성있고 특별한 커피", value: "개성", phrase: "개성있고 특별한 커피를 원하셔서" }
      ]
    }
  };

  /* 질문 진행 순서. q5 는 조건부(q2 가 "모름" 일 때만) */
  var FLOW = ["q1", "q2", "q3", "q4", "q5", "result"];

  /* q1 답 -> 좁힐 제품군 */
  var LINE_BY_Q1 = {
    "핸드드립": ["원두"],
    "아메리카노간편": ["드립백", "티백"],
    "라떼": ["파우더"],
    "캡슐": ["캡슐"],
    "콜드브루": ["콜드브루"],
    "선물": ["드립백", "티백", "파우더"],
    "여행캠핑": ["드립백", "티백", "파우더"]
  };

  /* q1 답 -> 이유 문장에 붙일 "제품군 선택" 설명 */
  var LINE_REASON_BY_Q1 = {
    "핸드드립": "직접 내려 드시기 좋은 원두로 골랐어요.",
    "아메리카노간편": "머신 없이 간편하게 즐기는 제품으로 골랐어요.",
    "라떼": "우유와 잘 어울리는 파우더 제품으로 골랐어요.",
    "캡슐": "가지고 계신 캡슐머신에 바로 쓰는 캡슐로 골랐어요.",
    "콜드브루": "차갑게 바로 즐기는 콜드브루로 골랐어요.",
    "선물": "장비가 없어도 누구나 즐길 수 있는 제품으로 골랐어요.",
    "여행캠핑": "가볍게 챙겨 가서 즐기는 제품으로 골랐어요."
  };

  /* q2(+q5) 답 -> 점수표 (맛 키워드에 가중치) */
  function getScoreMap(a) {
    if (a.q2 === "고소") return { "고소": 2, "묵직": 2 };
    if (a.q2 === "균형") return { "균형": 2, "잔잔한산미": 2 };
    if (a.q2 === "산뜻") return { "산뜻한산미": 2, "과실감": 1 };
    if (a.q2 === "모름" && a.q5 === "부드러움") return { "균형": 2, "깔끔": 1 };
    if (a.q2 === "모름" && a.q5 === "개성") return { "과실감": 2, "산뜻한산미": 1 };
    return {};
  }

  /* 취향의 "대표 맛" (새로운 경험 계산에 사용) */
  function getPrimaryTaste(a) {
    if (a.q2 === "고소") return "고소";
    if (a.q2 === "균형") return "균형";
    if (a.q2 === "산뜻") return "산뜻한산미";
    if (a.q2 === "모름" && a.q5 === "부드러움") return "균형";
    if (a.q2 === "모름" && a.q5 === "개성") return "과실감";
    return "균형";
  }

  /* 대표 맛 -> 한 단계 옆으로 이동한 맛 */
  var SHIFT_MAP = {
    "고소": "균형",
    "묵직": "균형",
    "균형": "산뜻한산미",
    "잔잔한산미": "산뜻한산미",
    "산뜻한산미": "과실감",
    "과실감": "단맛"
  };

  /* 이유 문장용 라벨 */
  var PRIMARY_LABEL = {
    "고소": "고소하고 묵직한",
    "균형": "균형잡힌 잔잔한",
    "산뜻한산미": "산뜻하고 상큼한",
    "과실감": "과일 같은 산미의"
  };
  var SHIFT_LABEL = {
    "균형": "균형이 잡힌",
    "산뜻한산미": "산뜻한 산미가 살아있는",
    "과실감": "과일 같은 산미가 뚜렷한",
    "단맛": "단맛이 은은하게 도는",
    "고소": "고소한"
  };

  /* ----------------------------------------------------------
     1. 한국어 조사(을/를, 은/는) 붙이기
     ---------------------------------------------------------- */
  function hasJong(word) {
    if (!word) return false;
    var c = word.charCodeAt(word.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return false; // 한글이 아니면 받침 없음으로 처리
    return (c - 0xAC00) % 28 !== 0;
  }
  function eunNeun(word) { return word + (hasJong(word) ? "은" : "는"); }
  function eulReul(word) { return word + (hasJong(word) ? "을" : "를"); }

  /* ----------------------------------------------------------
     2. 추천 로직 (설계서 5절·7절 순서)
     ---------------------------------------------------------- */
  function recommend(a) {
    var lines = LINE_BY_Q1[a.q1] || [];
    // (1) 제품군으로 좁히기
    var pool = PRODUCTS.filter(function (p) { return lines.indexOf(p.line) !== -1; });

    // (3) 회피 조건: 신맛 회피 -> 산미 강한 제품 제외
    if (a.q3 === "신맛회피") {
      pool = pool.filter(function (p) {
        return p.taste.indexOf("산뜻한산미") === -1 && p.taste.indexOf("과실감") === -1;
      });
    }

    // (4) 디카페인이면 decaf 제품만
    var decafReq = (a.q4 === "디카페인");
    if (decafReq) {
      pool = pool.filter(function (p) { return p.decaf === true; });
    }

    // (2) 맛 취향 점수
    var scoreMap = getScoreMap(a);
    function tasteScore(p) {
      var s = 0;
      for (var k in scoreMap) {
        if (scoreMap.hasOwnProperty(k) && p.taste.indexOf(k) !== -1) s += scoreMap[k];
      }
      // (3) 쓴맛 회피 -> 묵직 위주 제품 감점
      if (a.q3 === "쓴맛회피" && p.taste.indexOf("묵직") !== -1) s -= 3;
      return s;
    }

    // (7) 남는 제품이 하나도 없으면 대체 제품(대표) 사용
    var fallback = false;
    var chosen;
    if (pool.length === 0) {
      fallback = true;
      chosen = PRODUCTS.slice().sort(function (x, y) {
        return y.priority - x.priority || (x.id < y.id ? -1 : 1);
      })[0];
    } else {
      // (5) 점수 최고 1개 (동점이면 priority 높은 것)
      chosen = pool.slice().sort(function (x, y) {
        var sx = tasteScore(x), sy = tasteScore(y);
        if (sy !== sx) return sy - sx;
        return y.priority - x.priority || (x.id < y.id ? -1 : 1);
      })[0];
    }

    // (6) 새로운 경험 커피: 취향에서 한 단계 옆으로
    var shiftTarget = SHIFT_MAP[getPrimaryTaste(a)] || "균형";

    function newExpScore(p) {
      var s = (p.taste.indexOf(shiftTarget) !== -1) ? 3 : 0;
      // 가능하면 같은 제품군에서 (동점 시 우선)
      if (p.line === chosen.line) s += 0.5;
      return s;
    }

    // 후보군: 기본은 chosen 과 같은 조건의 pool, 부족하면 넓힌다.
    var candidates = pool.filter(function (p) { return p.id !== chosen.id; });
    if (candidates.length === 0) {
      // pool 이 chosen 하나뿐이면 -> 전체에서 (디카페인 조건은 유지)
      candidates = PRODUCTS.filter(function (p) {
        return p.id !== chosen.id && (!decafReq || p.decaf === true);
      });
    }
    if (candidates.length === 0) {
      // 그래도 없으면 -> 정말 전체에서
      candidates = PRODUCTS.filter(function (p) { return p.id !== chosen.id; });
    }

    var newProduct = candidates.slice().sort(function (x, y) {
      var sx = newExpScore(x), sy = newExpScore(y);
      if (sy !== sx) return sy - sx;
      return y.priority - x.priority || (x.id < y.id ? -1 : 1);
    })[0];

    // 안전장치: 추천 제품과 새로운 경험 제품은 절대 같으면 안 된다
    if (!newProduct || newProduct.id === chosen.id) {
      newProduct = PRODUCTS.filter(function (p) { return p.id !== chosen.id; })
        .sort(function (x, y) { return y.priority - x.priority; })[0];
    }

    return {
      chosen: chosen,
      newProduct: newProduct,
      fallback: fallback,
      shiftTarget: shiftTarget
    };
  }

  /* ----------------------------------------------------------
     3. 추천 이유 문장 만들기 (고객이 고른 답을 실제로 넣는다)
     ---------------------------------------------------------- */
  function phraseOf(qKey, value) {
    var opts = QUESTIONS[qKey].options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === value) return opts[i].phrase;
    }
    return "";
  }

  function buildMainReason(a, p, fallback) {
    var parts = [];

    if (fallback) {
      parts.push("조건에 딱 맞는 제품이 없어 대표 제품을 보여드려요.");
    }

    // 상황(q1) + 제품군 선택 이유
    var p1 = phraseOf("q1", a.q1);
    if (p1) parts.push(p1 + " " + (LINE_REASON_BY_Q1[a.q1] || ""));

    // 맛 취향(q2 / q5)
    if (a.q2 === "모름") {
      var p5 = phraseOf("q5", a.q5);
      parts.push((p5 ? p5 + " " : "") + eulReul(p.name) + " 골랐어요. " + p.desc + " 느낌이라 편하게 즐기기 좋아요.");
    } else {
      parts.push(phraseOf("q2", a.q2) + ". " + eunNeun(p.name) + " " + p.desc + ", 그래서 지금 취향에 잘 맞아요.");
    }

    // 회피(q3)
    if (a.q3 === "신맛회피") parts.push("신맛이 부담스럽다고 하셔서 산미가 튀지 않는 제품으로 맞췄어요.");
    if (a.q3 === "쓴맛회피") parts.push("쓴맛이 부담스럽다고 하셔서 너무 묵직하지 않은 쪽으로 맞췄어요.");

    // 카페인(q4)
    if (a.q4 === "디카페인") parts.push("카페인은 디카페인으로 원하셔서 디카페인 제품만 골랐어요.");

    return parts.join(" ");
  }

  function buildNewReason(a, np, shiftTarget) {
    var primary = getPrimaryTaste(a);
    var pLabel = PRIMARY_LABEL[primary] || "지금";
    // 새 경험 제품이 실제로 목표 맛을 가졌으면 그 표현을, 아니면 부드러운 표현을 쓴다
    var sLabel = (np.taste.indexOf(shiftTarget) !== -1)
      ? (SHIFT_LABEL[shiftTarget] || "조금 다른 결의")
      : "조금 다른 결의";
    return "평소 " + pLabel + " 맛을 좋아하시니, 한 걸음만 옆으로 옮겨서 "
      + sLabel + " " + eunNeun(np.name) + " 어떠세요? "
      + np.desc + " 느낌이라 부담 없이 새로운 맛을 경험할 수 있어요.";
  }

  /* ----------------------------------------------------------
     4. 화면 그리기
     ---------------------------------------------------------- */
  // Node 환경(테스트)에서는 document 가 없으므로 화면 관련 코드는 건너뜁니다.
  var HAS_DOM = (typeof document !== "undefined" && document.getElementById);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { recommend: recommend, buildMainReason: buildMainReason, buildNewReason: buildNewReason };
  }
  if (!HAS_DOM) return;

  var introScreen = document.getElementById("screen-intro");
  var chatScreen = document.getElementById("screen-chat");
  var chatLog = document.getElementById("chat-log");
  var choiceBox = document.getElementById("choice-box");
  var startBtn = document.getElementById("start-btn");
  var restartBtn = document.getElementById("restart-btn");

  var answers = {};       // 고객 답 저장
  var flowIndex = 0;      // 지금 몇 번째 단계인지

  function scrollToBottom() {
    // 새 말풍선이 그려진 뒤 맨 아래로
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  /* 오른쪽(고객) 말풍선 */
  function addUserBubble(text) {
    var row = document.createElement("div");
    row.className = "row row-user";
    var bubble = document.createElement("div");
    bubble.className = "bubble bubble-user";
    bubble.textContent = text;
    row.appendChild(bubble);
    chatLog.appendChild(row);
    scrollToBottom();
  }

  /* 왼쪽(시스템) 말풍선 - "입력 중..." 을 먼저 보여준 뒤 문장 표시 */
  function addSystemBubble(text, done) {
    var row = document.createElement("div");
    row.className = "row row-sys";

    var typing = document.createElement("div");
    typing.className = "bubble bubble-sys typing";
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    row.appendChild(typing);
    chatLog.appendChild(row);
    scrollToBottom();

    setTimeout(function () {
      typing.classList.remove("typing");
      typing.innerHTML = "";
      typing.textContent = text;
      scrollToBottom();
      if (typeof done === "function") done();
    }, 400);
  }

  /* 아래쪽 선택지 버튼 */
  function renderChoices(options, onPick) {
    choiceBox.innerHTML = "";
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        onPick(opt);
      });
      choiceBox.appendChild(btn);
    });
  }

  function clearChoices() {
    choiceBox.innerHTML = "";
  }

  /* 다음 단계로 이동 */
  function nextStep() {
    flowIndex++;
    var key = FLOW[flowIndex];

    // q5 는 q2 가 "모름" 일 때만
    if (key === "q5" && answers.q2 !== "모름") {
      flowIndex++;
      key = FLOW[flowIndex];
    }

    if (key === "result") {
      showResult();
      return;
    }
    askQuestion(key);
  }

  function askQuestion(key) {
    var q = QUESTIONS[key];
    clearChoices();
    addSystemBubble(q.text, function () {
      renderChoices(q.options, function (opt) {
        answers[key] = opt.value;
        addUserBubble(opt.label);
        clearChoices();
        nextStep();
      });
    });
  }

  /* ----------------------------------------------------------
     5. 추천 결과 카드
     ---------------------------------------------------------- */
  function productImageEl(p) {
    var box = document.createElement("div");
    if (p.image) {
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.className = "prod-img";
      box.appendChild(img);
    } else {
      // 이미지가 아직 없으면 커피잔 이모지 자리표시자
      box.className = "prod-img prod-img-empty";
      box.textContent = "☕"; // ☕
    }
    return box;
  }

  function shopButtonEl(p) {
    if (p.url) {
      var a = document.createElement("a");
      a.className = "shop-btn";
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "상품 보러가기";
      return a;
    }
    var btn = document.createElement("button");
    btn.className = "shop-btn shop-btn-disabled";
    btn.type = "button";
    btn.disabled = true;
    btn.textContent = "상품 링크 준비 중";
    return btn;
  }

  function buildResultCard(rec) {
    var card = document.createElement("div");
    card.className = "result-card";

    /* (a) 오늘의 추천 */
    var t1 = document.createElement("div");
    t1.className = "result-label";
    t1.textContent = "오늘의 추천";
    card.appendChild(t1);

    card.appendChild(productImageEl(rec.chosen));

    var name1 = document.createElement("div");
    name1.className = "prod-name";
    name1.textContent = rec.chosen.name;
    card.appendChild(name1);

    var line1 = document.createElement("div");
    line1.className = "prod-line";
    line1.textContent = rec.chosen.line + " · " + rec.chosen.desc;
    card.appendChild(line1);

    var why1 = document.createElement("div");
    why1.className = "prod-why";
    why1.textContent = buildMainReason(answers, rec.chosen, rec.fallback);
    card.appendChild(why1);

    card.appendChild(shopButtonEl(rec.chosen));

    /* (b) 새로운 커피 경험 */
    var divider = document.createElement("div");
    divider.className = "result-divider";
    card.appendChild(divider);

    var t2 = document.createElement("div");
    t2.className = "result-label";
    t2.textContent = "새로운 커피 경험";
    card.appendChild(t2);

    card.appendChild(productImageEl(rec.newProduct));

    var name2 = document.createElement("div");
    name2.className = "prod-name";
    name2.textContent = rec.newProduct.name;
    card.appendChild(name2);

    var line2 = document.createElement("div");
    line2.className = "prod-line";
    line2.textContent = rec.newProduct.line + " · " + rec.newProduct.desc;
    card.appendChild(line2);

    var why2 = document.createElement("div");
    why2.className = "prod-why";
    why2.textContent = buildNewReason(answers, rec.newProduct, rec.shiftTarget);
    card.appendChild(why2);

    card.appendChild(shopButtonEl(rec.newProduct));

    return card;
  }

  function showResult() {
    clearChoices();
    var rec = recommend(answers);

    addSystemBubble("이야기 잘 들었어요. 지금 취향에 맞는 커피를 찾았어요!", function () {
      var row = document.createElement("div");
      row.className = "row row-sys";
      row.appendChild(buildResultCard(rec));
      chatLog.appendChild(row);
      scrollToBottom();

      restartBtn.hidden = false;
      scrollToBottom();
    });
  }

  /* ----------------------------------------------------------
     6. 시작 / 다시하기
     ---------------------------------------------------------- */
  function startConsult() {
    answers = {};
    flowIndex = 0;
    chatLog.innerHTML = "";
    clearChoices();
    restartBtn.hidden = true;
    introScreen.hidden = true;
    chatScreen.hidden = false;
    askQuestion(FLOW[0]);
  }

  function restart() {
    introScreen.hidden = false;
    chatScreen.hidden = true;
    chatLog.innerHTML = "";
    clearChoices();
    restartBtn.hidden = true;
    answers = {};
    flowIndex = 0;
  }

  startBtn.addEventListener("click", startConsult);
  restartBtn.addEventListener("click", restart);

})();

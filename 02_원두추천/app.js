/* ============================================================
   범표원두 커피 추천 - 대화 흐름 + 추천 로직 + 화면 그리기
   ------------------------------------------------------------
   * ES 모듈을 쓰지 않습니다. index.html 에서 <script src> 로만 불러옵니다.
   * products.js 의 전역변수 PRODUCTS 를 그대로 사용합니다. (실제 스마트스토어
     상품 51개 - tools/build_products.py 가 자동 생성)
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
     - ack    : 답변 직후 시스템이 짧게 맞장구치는 말 (다음 질문 전에 보여줌)
     ---------------------------------------------------------- */
  var QUESTIONS = {
    q1: {
      text: "평소 커피를 어떻게 즐기세요?",
      options: [
        { label: "원두를 사서 직접 내려요 (핸드드립, 모카포트 등)", value: "핸드드립", phrase: "원두를 사서 직접 내려 드신다고 하셔서", ack: "오, 원두를 직접 내려 드시는군요. 진짜 커피 좋아하시는 분이네요." },
        { label: "아메리카노를 간편하게 마셔요", value: "아메리카노간편", phrase: "아메리카노를 간편하게 즐기신다고 하셔서", ack: "네, 간편하게 즐기시는 스타일이시군요." },
        { label: "라떼·베리에이션을 즐겨요", value: "라떼", phrase: "라떼나 베리에이션을 즐기신다고 하셔서", ack: "라떼파시군요, 좋아요." },
        { label: "캡슐머신이 있어요", value: "캡슐", phrase: "캡슐머신을 쓰신다고 하셔서", ack: "캡슐머신 있으시면 그거에 맞춰서 골라드려야겠네요." },
        { label: "콜드브루를 마셔요", value: "콜드브루", phrase: "콜드브루를 찾으신다고 하셔서", ack: "시원하게 콜드브루로 즐기시는군요." },
        { label: "선물할 거예요", value: "선물", phrase: "선물용으로 찾으신다고 하셔서", ack: "선물용이시군요, 받는 분이 부담 없이 좋아할 걸로 찾아볼게요." },
        { label: "여행·캠핑에서 마실 거예요", value: "여행캠핑", phrase: "여행이나 캠핑에서 즐기실 거라 하셔서", ack: "여행이나 캠핑에서 마실 커피라니, 낭만 있네요." }
      ]
    },
    q2: {
      text: "어떤 맛을 좋아하세요?",
      options: [
        { label: "고소하고 묵직한 맛", value: "고소", phrase: "고소하고 묵직한 맛을 좋아하신다고 하셨죠", ack: "고소하고 묵직한 맛, 든든하게 좋죠." },
        { label: "균형잡힌 잔잔한 맛", value: "균형", phrase: "균형잡힌 잔잔한 맛을 좋아하신다고 하셨죠", ack: "균형 잡힌 맛을 좋아하시는군요, 부담 없이 좋은 선택이에요." },
        { label: "산뜻하고 상큼한 맛", value: "산뜻", phrase: "산뜻하고 상큼한 맛을 좋아하신다고 하셨죠", ack: "산뜻하고 상큼한 산미파시네요." },
        { label: "잘 모르겠어요", value: "모름", phrase: "맛 취향을 잘 모르겠다고 하셔서", ack: "아직 잘 모르실 수 있어요, 몇 가지만 더 여쭤볼게요." }
      ]
    },
    q3: {
      text: "부담스러운 맛이 있나요?",
      options: [
        { label: "신맛은 좀...", value: "신맛회피", phrase: "신맛이 부담스럽다고 하셔서", ack: "네, 신맛은 튀지 않게 골라드릴게요." },
        { label: "쓴맛은 좀...", value: "쓴맛회피", phrase: "쓴맛이 부담스럽다고 하셔서", ack: "쓴맛 부담스러우신 거, 확인했어요." },
        { label: "없어요", value: "없음", phrase: "", ack: "특별히 가리는 맛은 없으시네요, 좋아요." }
      ]
    },
    q4: {
      text: "카페인은 어떠세요?",
      options: [
        { label: "상관없어요", value: "상관없음", phrase: "", ack: "카페인은 상관없으시다니 고를 수 있는 폭이 넓어지네요." },
        { label: "디카페인으로 주세요", value: "디카페인", phrase: "카페인은 디카페인으로 원하셔서", ack: "디카페인으로 편하게 즐기실 수 있게 챙겨드릴게요." }
      ]
    },
    q5: {
      text: "그럼 이런 커피는 어떠세요?",
      options: [
        { label: "부드럽고 편안한 커피", value: "부드러움", phrase: "부드럽고 편안한 커피를 원하셔서", ack: "부드럽고 편안한 쪽을 좋아하시는군요." },
        { label: "개성있고 특별한 커피", value: "개성", phrase: "개성있고 특별한 커피를 원하셔서", ack: "개성있고 특별한 쪽이시군요, 재밌는 선택이에요." }
      ]
    }
  };

  /* 질문 진행 순서. q5 는 조건부(q2 가 "모름" 일 때만) */
  var FLOW = ["q1", "q2", "q3", "q4", "q5", "result"];

  /* q1 답 -> method 또는 scene 필터 */
  var FILTER_BY_Q1 = {
    "핸드드립": { field: "method", value: "핸드드립" },
    "아메리카노간편": { field: "method", value: "아메리카노간편" },
    "라떼": { field: "method", value: "라떼" },
    "캡슐": { field: "method", value: "캡슐" },
    "콜드브루": { field: "method", value: "콜드브루" },
    "선물": { field: "scene", value: "선물" },
    "여행캠핑": { field: "scene", value: "여행캠핑" }
  };

  /* q1 답 -> 이유 문장에 붙일 "제품군 선택" 설명 */
  var LINE_REASON_BY_Q1 = {
    "핸드드립": "직접 내려 드시기 좋은 상품으로 골랐어요.",
    "아메리카노간편": "머신 없이 간편하게 즐기는 상품으로 골랐어요.",
    "라떼": "우유와 잘 어울리는 상품으로 골랐어요.",
    "캡슐": "가지고 계신 캡슐머신에 바로 쓰는 캡슐로 골랐어요.",
    "콜드브루": "차갑게 바로 즐기는 콜드브루로 골랐어요.",
    "선물": "누구나 부담 없이 받을 수 있는 상품으로 골랐어요.",
    "여행캠핑": "가볍게 챙겨 가서 즐기는 상품으로 골랐어요."
  };

  /* 맛 키워드 -> 사람이 읽는 표현 */
  var TASTE_LABEL = {
    "고소": "고소하고 묵직한",
    "균형": "균형 잡힌 부드러운",
    "산뜻한산미": "산뜻하고 상큼한",
    "과실감": "과일 같은 산미가 있는"
  };

  /* q2(+q5) 답 -> 목표 맛 키워드 */
  function getTasteTarget(a) {
    if (a.q2 === "고소") return "고소";
    if (a.q2 === "균형") return "균형";
    if (a.q2 === "산뜻") return "산뜻한산미";
    if (a.q2 === "모름" && a.q5 === "부드러움") return "균형";
    if (a.q2 === "모름" && a.q5 === "개성") return "과실감";
    return "균형";
  }

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

  /* 가격을 "9,900원" 형태로 */
  function formatPrice(n) {
    var s = String(Math.round(n || 0));
    s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return s + "원";
  }

  /* taste 가 정확히 ["다양"] 인지 */
  function isDayang(p) {
    return !!p && p.taste && p.taste.length === 1 && p.taste[0] === "다양";
  }

  function sameTasteSet(t1, t2) {
    if (t1.length !== t2.length) return false;
    var s1 = t1.slice().sort().join(",");
    var s2 = t2.slice().sort().join(",");
    return s1 === s2;
  }

  function passesQ1(p, q1) {
    var f = FILTER_BY_Q1[q1];
    if (!f) return true;
    return p[f.field] && p[f.field].indexOf(f.value) !== -1;
  }

  /* ----------------------------------------------------------
     2. 추천 로직
     ---------------------------------------------------------- */

  /* 기본 후보: 제외 상품/품절 상품/샘플 상품 뺀 전체.
     샘플은 "처음이라 부담되시면" 전용이라 메인 추천 후보에서는 뺀다(pickSample 이 따로 고름). */
  function baseCandidates() {
    return PRODUCTS.filter(function (p) {
      return !p.exclude && !p.sample && p.stock > 0;
    });
  }

  function filterByQ1(list, a) {
    return list.filter(function (p) { return passesQ1(p, a.q1); });
  }

  function filterByDecaf(list, a) {
    if (a.q4 !== "디카페인") return list;
    return list.filter(function (p) { return p.decaf === true; });
  }

  /* 신맛 회피: 산뜻한산미/과실감 제외 (단, "다양" 상품은 그대로 둠) */
  function filterByAcidAvoid(list, a) {
    if (a.q3 !== "신맛회피") return list;
    return list.filter(function (p) {
      if (isDayang(p)) return true;
      return p.taste.indexOf("산뜻한산미") === -1 && p.taste.indexOf("과실감") === -1;
    });
  }

  /* 점수 계산: 맛 일치(+3) 또는 "다양"(+1), 쓴맛회피 보정(+1), priority*0.5 */
  function scoreOf(p, a, tasteTarget) {
    var s = 0;
    if (p.taste.indexOf(tasteTarget) !== -1) {
      s += 3;
    } else if (isDayang(p)) {
      s += 1;
    }
    if (a.q3 === "쓴맛회피") {
      if (p.taste.indexOf("균형") !== -1 || p.taste.indexOf("산뜻한산미") !== -1) s += 1;
    }
    s += p.priority * 0.5;
    return s;
  }

  /* 점수 내림차순, 동점이면 priority 내림차순, 그래도 같으면 가격 오름차순 */
  function sortByScore(list, a, tasteTarget) {
    return list.slice().sort(function (x, y) {
      var sx = scoreOf(x, a, tasteTarget), sy = scoreOf(y, a, tasteTarget);
      if (sy !== sx) return sy - sx;
      if (y.priority !== x.priority) return y.priority - x.priority;
      return x.price - y.price;
    });
  }

  /* priority 내림차순, 동점이면 가격 오름차순 (대표 상품 뽑을 때 사용) */
  function sortByPriority(list) {
    return list.slice().sort(function (x, y) {
      if (y.priority !== x.priority) return y.priority - x.priority;
      return x.price - y.price;
    });
  }

  /* 새로운 커피 경험 후보 선택
     (a) line 이 다른 것 중 최고점
     (b) 없으면 taste 구성이 다른 것 중 최고점
     (c) 그래도 없으면 후보 중 최고점(=2등) */
  function selectNewExperience(chosen, pool, a, tasteTarget) {
    if (!pool || pool.length === 0) return null;

    var diffLine = pool.filter(function (p) { return p.line !== chosen.line; });
    if (diffLine.length > 0) return sortByScore(diffLine, a, tasteTarget)[0];

    var diffTaste = pool.filter(function (p) { return !sameTasteSet(p.taste, chosen.taste); });
    if (diffTaste.length > 0) return sortByScore(diffTaste, a, tasteTarget)[0];

    return sortByScore(pool, a, tasteTarget)[0];
  }

  function pickSample(a, chosen, newProduct) {
    var candidates = PRODUCTS.filter(function (p) {
      return p.sample === true && !p.exclude && p.stock > 0 && passesQ1(p, a.q1);
    });
    if (candidates.length === 0) return null;

    var top = sortByPriority(candidates)[0];
    if (top.id === chosen.id || (newProduct && top.id === newProduct.id)) return null;
    return top;
  }

  function recommend(a) {
    var tasteTarget = getTasteTarget(a);
    var base = baseCandidates();
    var afterQ1 = filterByQ1(base, a);
    var afterDecaf = filterByDecaf(afterQ1, a);
    var finalPool = filterByAcidAvoid(afterDecaf, a);

    var fallback = false;
    var chosen;
    var candidatesForNew;

    if (finalPool.length === 0) {
      // (7) 후보가 하나도 없으면 -> 대표 상품(priority 최고) + 안내 문구
      fallback = true;
      var repPool = base.length > 0 ? base : PRODUCTS;
      chosen = sortByPriority(repPool)[0];
      candidatesForNew = base.filter(function (p) { return p.id !== chosen.id; });
    } else {
      chosen = sortByScore(finalPool, a, tasteTarget)[0];
      candidatesForNew = finalPool.filter(function (p) { return p.id !== chosen.id; });
    }

    // 새로운 커피 경험: 후보를 단계적으로 넓혀가며 반드시 하나를 찾는다.
    var newProduct = selectNewExperience(chosen, candidatesForNew, a, tasteTarget);

    if (!newProduct) {
      var broaden1 = afterDecaf.filter(function (p) { return p.id !== chosen.id; });
      newProduct = selectNewExperience(chosen, broaden1, a, tasteTarget);
    }
    if (!newProduct) {
      var broaden2 = filterByDecaf(base, a).filter(function (p) { return p.id !== chosen.id; });
      newProduct = selectNewExperience(chosen, broaden2, a, tasteTarget);
    }
    if (!newProduct) {
      var broaden3 = base.filter(function (p) { return p.id !== chosen.id; });
      newProduct = selectNewExperience(chosen, broaden3, a, tasteTarget);
    }
    if (!newProduct) {
      // 최후 안전장치 (이 코드에 도달할 일은 사실상 없음: 상품이 51개나 있으므로)
      var any = PRODUCTS.filter(function (p) { return p.id !== chosen.id; });
      newProduct = any.length > 0 ? any[0] : chosen;
    }

    var sampleProduct = pickSample(a, chosen, newProduct);

    return {
      chosen: chosen,
      newProduct: newProduct,
      sampleProduct: sampleProduct,
      fallback: fallback,
      tasteTarget: tasteTarget
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

  function tasteLabelOf(p) {
    if (isDayang(p)) return "여러 맛 중 골라 즐기는";
    var labels = [];
    for (var i = 0; i < p.taste.length; i++) {
      labels.push(TASTE_LABEL[p.taste[i]] || p.taste[i]);
    }
    return labels.join(", ");
  }

  function buildMainReason(a, p, fallback) {
    var parts = [];

    if (fallback) {
      parts.push("지금 조건에 딱 맞는 상품이 없어서, 그래도 잘 어울릴 만한 인기 상품을 보여드려요.");
    }

    // 상황(q1) + 제품군 선택 이유
    var p1 = phraseOf("q1", a.q1);
    if (p1) parts.push(p1 + " " + (LINE_REASON_BY_Q1[a.q1] || ""));

    // 맛 취향(q2 / q5)
    if (a.q2 === "모름") {
      var p5 = phraseOf("q5", a.q5);
      if (p5) parts.push(p5 + ".");
    } else {
      var p2 = phraseOf("q2", a.q2);
      if (p2) parts.push(p2 + ".");
    }

    if (isDayang(p)) {
      parts.push(eulReul(p.name) + " 골랐어요. 여러 맛이 옵션으로 들어있어서 취향에 맞는 맛을 고르시면 돼요.");
    } else {
      parts.push(eunNeun(p.name) + " " + tasteLabelOf(p) + " 맛이라 지금 취향에 잘 맞아요.");
    }

    // 회피(q3)
    if (a.q3 === "신맛회피") parts.push("신맛이 부담스럽다고 하셔서 산미가 튀지 않는 상품으로 맞췄어요.");
    if (a.q3 === "쓴맛회피") parts.push("쓴맛이 부담스럽다고 하셔서 너무 진하지 않은 쪽으로 맞췄어요.");

    // 카페인(q4)
    if (a.q4 === "디카페인") parts.push("카페인은 디카페인으로 원하셔서 디카페인 상품만 골랐어요.");

    return parts.join(" ");
  }

  function buildNewReason(a, np, chosen) {
    var opener;
    if (np.line !== chosen.line) {
      opener = "오늘의 추천과는 결이 다른 " ;
    } else {
      opener = "오늘의 추천과 비슷하면서도 조금 다른 ";
    }

    var tasteText = isDayang(np)
      ? "여러 맛 중 골라 즐기는"
      : (tasteLabelOf(np) + " 맛의");

    return opener + tasteText + " " + eunNeun(np.name) + " 어떠세요? "
      + "부담 없이 새로운 커피를 경험해 보실 수 있어요.";
  }

  /* taste 가 ["다양"] 인 상품에 붙일 안내 문구 (예: "4종 중 취향에 맞는...") */
  function buildOptionHint(p) {
    if (!isDayang(p)) return "";
    var m = p.name.match(/(\d+)\s*종/);
    var countLabel = m ? (m[1] + "종") : "여러 가지";
    return countLabel + " 중 취향에 맞는 맛을 상품 페이지에서 고르시면 됩니다.";
  }

  /* p.flavors 가 있으면 맛 칩 버튼들을 만든다. 고객 답변과 맞는 맛을 기본 선택으로 표시.
     클릭하면 선택 표시만 바뀐다 (다른 로직에는 영향 없음). */
  function buildFlavorPicker(p, rec) {
    if (!p.flavors || p.flavors.length === 0) return null;

    var box = document.createElement("div");
    box.className = "flavor-picker";

    var label = document.createElement("div");
    label.className = "flavor-picker-label";
    label.textContent = "맛을 골라보세요";
    box.appendChild(label);

    var chipRow = document.createElement("div");
    chipRow.className = "flavor-chips";

    var decafWanted = answers.q4 === "디카페인";
    var defaultIndex = 0;
    for (var i = 0; i < p.flavors.length; i++) {
      if (decafWanted && p.flavors[i].taste === "디카페인") { defaultIndex = i; break; }
      if (!decafWanted && p.flavors[i].taste === rec.tasteTarget) { defaultIndex = i; break; }
    }

    p.flavors.forEach(function (flavor, i) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "flavor-chip" + (i === defaultIndex ? " active" : "");
      chip.textContent = flavor.name;
      chip.addEventListener("click", function () {
        var chips = chipRow.querySelectorAll(".flavor-chip");
        for (var j = 0; j < chips.length; j++) chips[j].classList.remove("active");
        chip.classList.add("active");
      });
      chipRow.appendChild(chip);
    });

    box.appendChild(chipRow);
    return box;
  }

  /* 상품에 flavors 가 있으면 맛 칩을, 없으면 기존 텍스트 안내를 프래그먼트에 붙인다. */
  function appendTasteOption(frag, p, rec) {
    var picker = buildFlavorPicker(p, rec);
    if (picker) {
      frag.appendChild(picker);
      return;
    }
    var hint = buildOptionHint(p);
    if (hint) {
      var hintEl = document.createElement("div");
      hintEl.className = "prod-hint";
      hintEl.textContent = hint;
      frag.appendChild(hintEl);
    }
  }

  /* ----------------------------------------------------------
     4. 화면 그리기
     ---------------------------------------------------------- */
  // Node 환경(테스트)에서는 document 가 없으므로 화면 관련 코드는 건너뜁니다.
  var HAS_DOM = (typeof document !== "undefined" && document.getElementById);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      recommend: recommend,
      buildMainReason: buildMainReason,
      buildNewReason: buildNewReason,
      buildOptionHint: buildOptionHint,
      formatPrice: formatPrice
    };
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
        if (opt.ack) {
          addSystemBubble(opt.ack, function () { nextStep(); });
        } else {
          nextStep();
        }
      });
    });
  }

  /* ----------------------------------------------------------
     5. 추천 결과 카드
     ---------------------------------------------------------- */
  function productImageEl(p, small) {
    var box = document.createElement("div");
    box.className = small ? "prod-img prod-img-small" : "prod-img";

    var img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";
    img.onerror = function () {
      // 이미지가 깨지면 커피잔 이모지 자리표시자로 교체
      box.classList.add("prod-img-empty");
      box.innerHTML = "";
      box.textContent = "☕";
    };
    box.appendChild(img);
    return box;
  }

  function shopButtonEl(p, label) {
    if (p && p.url) {
      var a = document.createElement("a");
      a.className = "shop-btn";
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = label || "상품 보러가기";
      return a;
    }
    var btn = document.createElement("button");
    btn.className = "shop-btn shop-btn-disabled";
    btn.type = "button";
    btn.disabled = true;
    btn.textContent = "상품 링크 준비 중";
    return btn;
  }

  function priceLineEl(p) {
    var el = document.createElement("div");
    el.className = "prod-price";
    el.textContent = formatPrice(p.price);
    return el;
  }

  function buildMainBlock(rec) {
    var frag = document.createDocumentFragment();
    var chosen = rec.chosen;

    var t1 = document.createElement("div");
    t1.className = "result-label";
    t1.textContent = "오늘의 추천";
    frag.appendChild(t1);

    frag.appendChild(productImageEl(chosen));

    var name1 = document.createElement("div");
    name1.className = "prod-name";
    name1.textContent = chosen.name;
    frag.appendChild(name1);

    frag.appendChild(priceLineEl(chosen));

    var why1 = document.createElement("div");
    why1.className = "prod-why";
    why1.textContent = buildMainReason(answers, chosen, rec.fallback);
    frag.appendChild(why1);

    appendTasteOption(frag, chosen, rec);

    frag.appendChild(shopButtonEl(chosen, "상품 보러가기"));

    return frag;
  }

  function buildNewExpBlock(rec) {
    var frag = document.createDocumentFragment();
    var np = rec.newProduct;

    var divider = document.createElement("div");
    divider.className = "result-divider";
    frag.appendChild(divider);

    var t2 = document.createElement("div");
    t2.className = "result-label";
    t2.textContent = "새로운 커피 경험";
    frag.appendChild(t2);

    frag.appendChild(productImageEl(np));

    var name2 = document.createElement("div");
    name2.className = "prod-name";
    name2.textContent = np.name;
    frag.appendChild(name2);

    frag.appendChild(priceLineEl(np));

    var why2 = document.createElement("div");
    why2.className = "prod-why";
    why2.textContent = buildNewReason(answers, np, rec.chosen);
    frag.appendChild(why2);

    appendTasteOption(frag, np, rec);

    frag.appendChild(shopButtonEl(np, "상품 보러가기"));

    return frag;
  }

  function buildSampleBlock(rec) {
    if (!rec.sampleProduct) return null;
    var sp = rec.sampleProduct;

    var box = document.createElement("div");
    box.className = "sample-card";

    var t3 = document.createElement("div");
    t3.className = "result-label sample-label";
    t3.textContent = "처음이라 부담되시면";
    box.appendChild(t3);

    var row = document.createElement("div");
    row.className = "sample-row";

    var imgBox = productImageEl(sp, true);
    row.appendChild(imgBox);

    var infoBox = document.createElement("div");
    infoBox.className = "sample-info";

    var name3 = document.createElement("div");
    name3.className = "prod-name sample-name";
    name3.textContent = sp.name;
    infoBox.appendChild(name3);

    var price3 = document.createElement("div");
    price3.className = "prod-price";
    price3.textContent = formatPrice(sp.price);
    infoBox.appendChild(price3);

    infoBox.appendChild(shopButtonEl(sp, "먼저 맛보기"));

    row.appendChild(infoBox);
    box.appendChild(row);

    return box;
  }

  function buildResultCard(rec) {
    var card = document.createElement("div");
    card.className = "result-card";

    card.appendChild(buildMainBlock(rec));
    card.appendChild(buildNewExpBlock(rec));

    var sampleEl = buildSampleBlock(rec);
    if (sampleEl) {
      var divider2 = document.createElement("div");
      divider2.className = "result-divider";
      card.appendChild(divider2);
      card.appendChild(sampleEl);
    }

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

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

  var BP = (typeof window !== "undefined" && window.BP) || { startSession: function () {}, track: function () {} };

  var T = (typeof BP_TYPES !== "undefined") ? BP_TYPES
        : (typeof require === "function" ? require("./types.js") : null);
  if (!T) { if (typeof console !== "undefined") console.error("types.js 가 먼저 로드되어야 합니다 (index.html 의 script 순서 확인)"); return; }
  var TIGER_TYPES = T.TIGER_TYPES, TIGER_GROUP = T.TIGER_GROUP, SAME_TYPE_PRODUCT = T.SAME_TYPE_PRODUCT, DRIPBAG_SET = T.DRIPBAG_SET, PAIR_RULES = T.PAIR_RULES;
  function getTasteTarget(a) { return T.getTasteTarget(a); }
  function tigerTypeOf(a) { return T.tigerTypeOf(a); }
  /* q1(디카페인 형태 선택) 또는 q4(일반 흐름 카페인 질문) 어느 쪽으로 디카페인을 원했든 true */
  function wantsDecaf(a) { return T.wantsDecaf(a); }

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
        { label: "원두를 사서 직접 내려요 (핸드드립, 모카포트 등) ☕", value: "핸드드립", phrase: "원두를 사서 직접 내려 드신다고 하셔서", ack: "오, 원두를 직접 내려 드시는군요. 진짜 커피 좋아하시는 분이네요." },
        { label: "아메리카노를 간편하게 마셔요 🥤", value: "아메리카노간편", phrase: "아메리카노를 간편하게 즐기신다고 하셔서", ack: "네, 간편하게 즐기시는 스타일이시군요." },
        { label: "라떼·베리에이션을 즐겨요 🥛", value: "라떼", phrase: "라떼나 베리에이션을 즐기신다고 하셔서", ack: "라떼파시군요, 좋아요." },
        { label: "캡슐머신이 있어요 💊", value: "캡슐", phrase: "캡슐머신을 쓰신다고 하셔서", ack: "캡슐머신 있으시면 그거에 맞춰서 골라드려야겠네요." },
        { label: "콜드브루를 마셔요 🧊", value: "콜드브루", phrase: "콜드브루를 찾으신다고 하셔서", ack: "시원하게 콜드브루로 즐기시는군요." },
        { label: "디카페인을 찾고 있어요 🌙", value: "디카페인", phrase: "디카페인을 찾으신다고 하셔서", ack: "요즘 디카페인 찾으시는 분이 정말 많아요. 원두·드립백·티백·파우더·콜드브루·캔라떼까지 전부 디카페인이 있으니 편한 형태로 골라드릴게요." },
        { label: "선물할 거예요 🎁", value: "선물", phrase: "선물용으로 찾으신다고 하셔서", ack: "선물용이시군요, 받는 분이 부담 없이 좋아할 걸로 찾아볼게요." },
        { label: "여행·캠핑에서 마실 거예요 🏕️", value: "여행캠핑", phrase: "여행이나 캠핑에서 즐기실 거라 하셔서", ack: "여행이나 캠핑에서 마실 커피라니, 낭만 있네요." }
      ]
    },
    q_decaf_form: {
      text: "디카페인은 어떤 형태가 편하세요?",
      options: [
        { label: "원두를 사서 직접 내려요 ☕", value: "원두", phrase: "원두로 직접 내려 드신다고 하셔서", ack: "그럼 디카페인 원두로 골라드릴게요." },
        { label: "컵에 걸쳐 바로 내리는 드립백 🫗", value: "드립백", phrase: "드립백으로 편하게 드신다고 하셔서", ack: "드립백으로 편하게 내려 드시게 준비할게요." },
        { label: "물에 우려 마시는 커피티백 🫖", value: "티백", phrase: "티백으로 편하게 우려 드신다고 하셔서", ack: "티백으로 간편하게 즐기실 수 있게 챙겨드릴게요." },
        { label: "물에 타서 바로 마시는 파우더 🥄", value: "파우더", phrase: "파우더로 간편하게 타 드신다고 하셔서", ack: "파우더는 물에 타기만 하면 돼서 정말 간편해요." },
        { label: "시원하게 콜드브루 🧊", value: "콜드브루", phrase: "콜드브루로 시원하게 드신다고 하셔서", ack: "시원한 콜드브루로 준비해드릴게요." },
        { label: "수제 캔라떼로 마실래요 🥛", value: "캔커피", phrase: "캔라떼로 편하게 드신다고 하셔서", ack: "캔라떼는 냉장고에 두고 바로 드시면 돼요." },
        { label: "캡슐머신이 있어요 💊", value: "캡슐", phrase: "캡슐머신에 쓰신다고 하셔서", ack: "캡슐머신에 바로 쓰실 수 있게 골라드릴게요." },
        { label: "골고루 맛보고 싶어요 🎁", value: "골고루", phrase: "골고루 맛보고 싶다고 하셔서", ack: "여러 형태가 한 상자에 담긴 컬렉션으로 골라드릴게요." }
      ]
    },
    q_amount: {
      text: "원두는 어느 정도로 준비해드릴까요?",
      options: [
        { label: "처음이라 여러 맛을 조금씩 맛보고 싶어요 🥄", value: "100", phrase: "처음이라 여러 맛을 조금씩 맛보고 싶다고 하셔서", ack: "그럼 여러 맛을 조금씩 즐길 수 있는 양으로 준비해드릴게요." },
        { label: "혼자 마셔요, 신선하게 오래 즐기고 싶어요 🙋", value: "200", phrase: "혼자서 신선하게 오래 즐기고 싶다고 하셔서", ack: "1인 기준 일주일 정도 신선하게 드시기 좋은 양으로 준비해드릴게요." },
        { label: "2~3명이 같이 마셔요 👥", value: "500", phrase: "2~3명이 함께 드신다고 하셔서", ack: "여러 명이 일주일 정도 나눠 드시기 좋은 양으로 준비해드릴게요." },
        { label: "커피값 아끼게 넉넉히 준비해주세요 💰", value: "1000", phrase: "넉넉하게 오래 두고 드시고 싶다고 하셔서", ack: "요즘 1kg으로 넉넉히 챙기시는 분들이 많아요. 그렇게 준비해드릴게요." }
      ]
    },
    q_milk: {
      text: "라떼에 우유는 어떠세요?",
      options: [
        { label: "일반 우유 괜찮아요 🥛", value: "우유", phrase: "", ack: "네, 우유 베이스로 골라드릴게요." },
        { label: "유당불내증이 있어요, 두유로 주세요 🌱", value: "두유", phrase: "유당불내증이 있어 두유로 원하셔서", ack: "두유라떼로 편하게 드실 수 있게 챙겨드릴게요." },
        { label: "상관없어요 😊", value: "상관없음", phrase: "", ack: "그럼 가장 잘 맞는 걸로 골라드릴게요." }
      ]
    },
    q_latte: {
      text: "어떤 라떼가 끌리세요?",
      options: [
        { label: "궁극의 고소함, 범표라떼 🐯", value: "범표라떼", phrase: "고소한 범표라떼를 원하셔서", ack: "범표라떼, 저희를 알린 시그니처예요. 잘 고르셨어요." },
        { label: "덜 단 바닐라, 온아바라 🏐", value: "온아바라", phrase: "덜 단 바닐라라떼를 원하셔서", ack: "온아바라, 사연이 있는 메뉴예요. 이따 이야기해드릴게요." },
        { label: "시그니처로 골라주세요 ✨", value: "시그니처", phrase: "시그니처로 골라달라고 하셔서", ack: "그럼 저희 대표 메뉴로 골라드릴게요." }
      ]
    },
    q2: {
      text: "어떤 맛을 좋아하세요?",
      textGift: "받으실 분은 어떤 맛을 좋아하실까요?",
      options: [
        { label: "고소하고 묵직한 맛 🌰", value: "고소", phrase: "고소하고 묵직한 맛을 좋아하신다고 하셨죠", ack: "고소하고 묵직한 맛, 든든하게 좋죠." },
        { label: "균형잡힌 잔잔한 맛 ⚖️", value: "균형", phrase: "균형잡힌 잔잔한 맛을 좋아하신다고 하셨죠", ack: "균형 잡힌 맛을 좋아하시는군요, 부담 없이 좋은 선택이에요." },
        { label: "산뜻하고 상큼한 맛 🍋", value: "산뜻", phrase: "산뜻하고 상큼한 맛을 좋아하신다고 하셨죠", ack: "산뜻하고 상큼한 산미파시네요." },
        { label: "잘 모르겠어요 🤔", value: "모름", phrase: "맛 취향을 잘 모르겠다고 하셔서", ack: "아직 잘 모르실 수 있어요, 몇 가지만 더 여쭤볼게요." }
      ]
    },
    q3: {
      text: "부담스러운 맛이 있나요?",
      textGift: "받으실 분이 부담스러워하는 맛이 있을까요?",
      options: [
        { label: "신맛이 강한 건 피하고 싶어요 😝", value: "신맛회피", phrase: "신맛이 부담스럽다고 하셔서", ack: "네, 신맛은 튀지 않게 골라드릴게요." },
        { label: "쓴맛이 강한 건 피하고 싶어요 😣", value: "쓴맛회피", phrase: "쓴맛이 부담스럽다고 하셔서", ack: "쓴맛 부담스러우신 거, 확인했어요." },
        { label: "특별히 없어요, 다 괜찮아요 😊", value: "없음", phrase: "", ack: "특별히 가리는 맛은 없으시네요, 좋아요." }
      ]
    },
    q4: {
      text: "카페인은 어떠세요?",
      options: [
        { label: "카페인 충전이 필요해요 ⚡", value: "상관없음", phrase: "", ack: "카페인 충전이 필요하시군요, 든든하게 챙겨드릴게요." },
        { label: "디카페인으로 주세요 🌙", value: "디카페인", phrase: "카페인은 디카페인으로 원하셔서", ack: "디카페인으로 편하게 즐기실 수 있게 챙겨드릴게요." }
      ]
    },
    q5: {
      text: "그럼 이런 커피는 어떠세요?",
      textGift: "그럼 받으실 분께는 이런 커피가 어떨까요?",
      options: [
        { label: "부드럽고 편안한 커피 ☁️", value: "부드러움", phrase: "부드럽고 편안한 커피가 좋겠다고 하셨죠", ack: "부드럽고 편안한 쪽을 좋아하시는군요." },
        { label: "개성있고 특별한 커피 ✨", value: "개성", phrase: "개성있고 특별한 커피가 좋겠다고 하셨죠", ack: "개성있고 특별한 쪽이시군요, 재밌는 선택이에요." }
      ]
    }
  };

  /* 질문 진행 순서. q_decaf_form 은 조건부(q1 이 "디카페인" 일 때만),
     q_amount 는 조건부(q1 이 "핸드드립" 이거나 디카페인+원두일 때만),
     q5 는 조건부(q2 가 "모름" 일 때만, 디카페인 경로는 항상 건너뜀). 자세한 조건은 shouldSkip() 참고 */
  var FLOW = ["q1", "q_decaf_form", "q_amount", "q_milk", "q_latte", "q2", "q3", "q4", "q5", "result"];

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

  /* 제품군(line) -> 사람이 읽는 짧은 설명 (오늘의 추천과 새로운 경험이 다를 때 비교 문장에 사용) */
  var LINE_DESC = {
    "원두": "직접 갈아 내리는 원두",
    "드립백": "컵에 걸쳐 바로 내리는 드립백",
    "티백": "물에 우려 마시는 커피티백",
    "파우더": "물에 타서 바로 마시는 동결건조 파우더",
    "캡슐": "캡슐머신에 넣는 캡슐",
    "콜드브루": "차갑게 바로 마시는 콜드브루",
    "캔커피": "바로 마시는 수제 캔커피",
    "선물세트": "포장까지 된 선물세트",
    "골고루": "여러 형태를 골고루 담은 컬렉션"
  };

  /* 맛 키워드 -> 사람이 읽는 표현 */
  var TASTE_LABEL = {
    "고소": "고소하고 묵직한",
    "균형": "균형 잡힌 부드러운",
    "산뜻한산미": "산뜻하고 상큼한",
    "과실감": "과일 같은 산미가 있는"
  };

  function productById(id) {
    for (var i = 0; i < PRODUCTS.length; i++) { var p = PRODUCTS[i]; if (p.id === id && !p.exclude && p.stock > 0) return p; }
    return null;
  }
  /* 내 유형 × 친구 유형 -> { key, name, score, desc, product } 또는 null(친구 유형이 모르는 값이면) */
  function pairOf(mine, friend) {
    var r = T.pairRule(mine, friend);
    if (!r) return null;
    var product = productById(r.productId) || productById(DRIPBAG_SET);
    return { key: r.key, name: r.name, score: r.score, desc: r.desc, product: product };
  }

  /* ----------------------------------------------------------
     1. 한국어 조사(을/를, 은/는) 붙이기
     ---------------------------------------------------------- */
  function hasJong(word) {
    if (!word) return false;
    if (/g$/i.test(word)) return true; // "200g", "1kg" 등은 "그램"으로 읽어 받침이 있다고 처리
    var c = word.charCodeAt(word.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return false; // 한글이 아니면 받침 없음으로 처리
    return (c - 0xAC00) % 28 !== 0;
  }
  function eunNeun(word) { return word + (hasJong(word) ? "은" : "는"); }
  function eulReul(word) { return word + (hasJong(word) ? "을" : "를"); }
  /* "로/으로" 조사: 받침이 없거나 받침이 ㄹ이면 "로", 그 외엔 "으로" (은/는·을/를 과 달리 ㄹ 받침 예외가 있음) */
  function roEuro(word) {
    if (!hasJong(word)) return "로";
    var c = word.charCodeAt(word.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 === 8) return "로"; // ㄹ 받침
    return "으로";
  }

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

  /* 상품명/스토어명에 "N종" 또는 "외 N종" 형태의 옵션 안내가 있는지 */
  function hasFlavorOptions(p) {
    return /(\d+)\s*종|외\s*\d*\s*종/.test(p.name + " " + (p.storeName || ""));
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

  /* p.flavors 중 taste 가 "디카페인" 인 첫 항목 (없으면 null) */
  function decafFlavorOf(p) {
    if (!p.flavors) return null;
    for (var i = 0; i < p.flavors.length; i++) {
      if (p.flavors[i].taste === "디카페인") return p.flavors[i];
    }
    return null;
  }

  /* 상품 자체가 디카페인이거나, 디카페인 맛 옵션(칩)이 있거나, 주문 옵션에 디카페인이 있으면 디카페인 조건 통과.
     q1="디카페인" 전용 흐름과 일반 흐름(q4) 모두 이 판정을 쓴다. */
  function isDecafOk(p) {
    return p.decaf === true || !!p.decafOption || !!decafFlavorOf(p);
  }

  function filterByDecaf(list, a) {
    if (!wantsDecaf(a)) return list;
    return list.filter(function (p) { return isDecafOk(p); });
  }

  /* 상품명에서 g/kg 용량을 읽어온다 (예: "500g" -> 500, "1kg" -> 1000). 없으면 null. */
  function extractWeightG(p) {
    var m = p.name.match(/(\d+(?:\.\d+)?)\s*kg/i);
    if (m) return Math.round(parseFloat(m[1]) * 1000);
    m = p.name.match(/(\d+)\s*g\b/i);
    if (m) return parseInt(m[1], 10);
    return null;
  }

  /* 원두 구매 용량 취향(q_amount): 정확히 맞는 용량이 있으면 그것만, 없으면 그대로 둔다 */
  function filterByAmount(list, a) {
    if (!a.q_amount) return list;
    var target = parseInt(a.q_amount, 10);
    var matched = list.filter(function (p) { return extractWeightG(p) === target; });
    return matched.length > 0 ? matched : list;
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
    // 실제 후기가 있으면 약간 가점 - 비슷한 조건이면 신뢰 신호가 있는 상품을 보여준다
    if (typeof REVIEWS !== "undefined" && REVIEWS[p.id] && REVIEWS[p.id].length > 0) {
      s += 1;
    }
    if (p.signature === true) s += 2;
    // 디카페인을 찾을 때, 고른 음용 방식에 맞는 "전용 디카페인 상품"(옵션이 아니라 상품 전체가 디카페인)을 우선
    if (wantsDecaf(a) && p.decaf === true && passesQ1(p, a.q1)) s += 2;
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
    // 이미 카드에 나온 상품은 제외. 디카페인을 찾으면 디카페인 샘플(컬렉션 등)을 우선
    candidates = candidates.filter(function (p) { return p.id !== chosen.id && !(newProduct && p.id === newProduct.id); });
    if (wantsDecaf(a)) {
      var decafSamples = candidates.filter(isDecafOk);
      if (decafSamples.length > 0) candidates = decafSamples;
    }
    if (candidates.length === 0) return null;
    return sortByPriority(candidates)[0];
  }

  function canByFlavor(name) {
    return PRODUCTS.filter(function (p) { return p.canFlavor === name && !p.exclude && p.stock > 0; })[0] || null;
  }
  function recommendLatte(a) {
    var beompyo = canByFlavor("범표라떼"), soy = canByFlavor("두유라떼"), onabara = canByFlavor("온아바라"), sample = canByFlavor("맛보기");
    var chosen, newProduct;
    if (a.q_milk === "두유") { chosen = soy || beompyo; newProduct = (beompyo && (!chosen || beompyo.id !== chosen.id)) ? beompyo : onabara; }
    else if (a.q_latte === "온아바라") { chosen = onabara || beompyo; newProduct = (beompyo && (!chosen || beompyo.id !== chosen.id)) ? beompyo : soy; }
    else { chosen = beompyo; newProduct = onabara; }
    if (!chosen) return null;
    var sampleProduct = (sample && sample.id !== chosen.id && (!newProduct || sample.id !== newProduct.id)) ? sample : null;
    return { chosen: chosen, newProduct: newProduct, sampleProduct: sampleProduct, fallback: false, relaxedQ1: false, tasteTarget: getTasteTarget(a), tiger: tigerTypeOf(a) };
  }

  /* 디카페인 후보: 제외/품절 뺀 전체 중 isDecafOk (샘플 상품도 포함 - 컬렉션/캡슐이 여기 걸림) */
  function decafCandidates() {
    return PRODUCTS.filter(function (p) { return !p.exclude && p.stock > 0 && isDecafOk(p); });
  }

  /* q_decaf_form(제형) 값 -> "새로운 커피 경험"으로 보여줄 제형 우선순위 */
  var DECAF_NEW_LINE_BY_FORM = {
    "원두": "드립백",
    "드립백": "티백",
    "티백": "드립백",
    "파우더": "티백",
    "콜드브루": "캔커피",
    "캔커피": "콜드브루",
    "캡슐": "드립백",
    "골고루": "원두"
  };

  /* 디카페인 컬렉션(동결건조 스틱·캡슐·드립백·티백·콜드브루가 한 상자) 상품 id */
  var DECAF_COLLECTION_ID = "12738150675";

  /* list 중 line 이 일치하는 것에서 sample 아닌 것 우선, 없으면 sample 포함, priority 1등 */
  function pickFromLinePreferNonSample(list, line, excludeId) {
    var pool = list.filter(function (p) { return p.line === line && p.id !== excludeId; });
    if (pool.length === 0) return null;
    var nonSample = pool.filter(function (p) { return !p.sample; });
    var finalPool = nonSample.length > 0 ? nonSample : pool;
    return sortByPriority(finalPool)[0];
  }

  /* q1="디카페인" 전용 추천: 형태(q_decaf_form)에 맞는 디카페인 상품을 오늘의 추천으로,
     다른 형태의 디카페인 상품을 새로운 경험으로, 디카페인 컬렉션을 샘플로 보여준다. */
  function recommendDecaf(a) {
    var candidates = decafCandidates();
    if (candidates.length === 0) return null;

    var form = a.q_decaf_form;
    var chosen;
    if (form === "골고루") {
      chosen = productById(DECAF_COLLECTION_ID) || sortByPriority(candidates)[0];
    } else {
      chosen = pickFromLinePreferNonSample(candidates, form, null) || sortByPriority(candidates)[0];
    }

    var newLine = DECAF_NEW_LINE_BY_FORM[form];
    var newProduct = newLine ? pickFromLinePreferNonSample(candidates, newLine, chosen.id) : null;
    if (!newProduct) {
      var others = candidates.filter(function (p) { return p.line !== chosen.line && p.id !== chosen.id; });
      var nonSampleOthers = others.filter(function (p) { return !p.sample; });
      var pool = nonSampleOthers.length > 0 ? nonSampleOthers : others;
      newProduct = pool.length > 0 ? sortByPriority(pool)[0] : null;
    }
    if (!newProduct) {
      var any = candidates.filter(function (p) { return p.id !== chosen.id; });
      newProduct = any.length > 0 ? sortByPriority(any)[0] : chosen;
    }

    var collection = productById(DECAF_COLLECTION_ID);
    var sampleProduct = (collection && collection.id !== chosen.id && (!newProduct || collection.id !== newProduct.id)) ? collection : null;

    return {
      chosen: chosen,
      newProduct: newProduct,
      sampleProduct: sampleProduct,
      fallback: false,
      relaxedQ1: false,
      tasteTarget: getTasteTarget(a),
      tiger: tigerTypeOf(a),
      decafForm: form
    };
  }

  function recommend(a) {
    if (a.q1 === "라떼") { var _r = recommendLatte(a); if (_r) return _r; }
    if (a.q1 === "디카페인") { var _dr = recommendDecaf(a); if (_dr) return _dr; }
    var tasteTarget = getTasteTarget(a);
    var base = baseCandidates();
    var afterQ1 = filterByQ1(base, a);
    var afterAmount = filterByAmount(afterQ1, a);
    var afterDecaf = filterByDecaf(afterAmount, a);
    if (afterDecaf.length === 0 && wantsDecaf(a)) {
      // 디카페인은 용량 종류가 적어서(원두는 500g 뿐) 용량 조건을 풀고 다시 찾는다
      var decafAnyAmount = filterByDecaf(afterQ1, a);
      if (decafAnyAmount.length > 0) {
        afterDecaf = decafAnyAmount;
      } else {
        // 샘플 상품만 디카페인인 제형(예: 캡슐 6종 10개입)은 샘플도 오늘의 추천 후보로 올린다
        var decafSamples = PRODUCTS.filter(function (p) {
          return p.sample === true && !p.exclude && p.stock > 0 && passesQ1(p, a.q1) && isDecafOk(p) && p.id !== DECAF_COLLECTION_ID;
        });
        if (decafSamples.length > 0) afterDecaf = decafSamples;
      }
    }
    var finalPool = filterByAcidAvoid(afterDecaf, a);

    var fallback = false;
    var relaxedQ1 = false;
    var chosen;
    var candidatesForNew;

    if (finalPool.length === 0) {
      // q1·용량 조건만 풀고 디카페인·신맛회피는 유지한 채로 한 번 더 시도
      var relaxedPool = filterByAcidAvoid(filterByDecaf(base, a), a);
      if (relaxedPool.length > 0) {
        relaxedQ1 = true;
        chosen = sortByScore(relaxedPool, a, tasteTarget)[0];
        candidatesForNew = relaxedPool.filter(function (p) { return p.id !== chosen.id; });
      } else {
        // (7) 후보가 하나도 없으면 -> 대표 상품(priority 최고) + 안내 문구
        fallback = true;
        var repPool = base.length > 0 ? base : PRODUCTS;
        chosen = sortByPriority(repPool)[0];
        candidatesForNew = base.filter(function (p) { return p.id !== chosen.id; });
      }
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
      relaxedQ1: relaxedQ1,
      tasteTarget: tasteTarget,
      tiger: tigerTypeOf(a)
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
    if (isDayang(p)) {
      return hasFlavorOptions(p) ? "여러 맛 중 골라 즐기는" : "누구나 무난하게 즐기기 좋은";
    }
    var labels = [];
    for (var i = 0; i < p.taste.length; i++) {
      labels.push(TASTE_LABEL[p.taste[i]] || p.taste[i]);
    }
    return labels.join(", ");
  }

  /* q1="디카페인" 전용 추천 이유 (제형 설명 + 옵션 안내 + 원두/그 외 제형 설명 + 골고루 설명) */
  function buildDecafMainReason(a, p) {
    var parts = [];
    var formDesc = LINE_DESC[a.q_decaf_form] || a.q_decaf_form || "";
    if (formDesc) {
      parts.push("디카페인을 찾으신다고 하셔서 " + formDesc + roEuro(formDesc) + " 골랐어요.");
    } else {
      parts.push("디카페인을 찾으신다고 하셔서 골랐어요.");
    }

    if (p.decafOption) {
      parts.push("주문할 때 옵션에서 '디카페인'을 골라 주세요.");
    }

    var decafFlavor = decafFlavorOf(p);
    if (decafFlavor) {
      parts.push("범표원두 디카페인 원두는 CO₂ 공법(초임계 이산화탄소 추출)으로 카페인을 빼서 향미가 살아 있어요. 과테말라와 브라질 중 고를 수 있어요.");
      if (a.q2 === "고소") {
        parts.push("고소하고 묵직한 맛을 좋아하셔서 조청의 단맛과 옥수수염차의 고소함이 있는 브라질을 골라 두었어요. 산미가 거의 없어요.");
      } else {
        parts.push("호밀 같은 고소함에 은은한 산미가 있는 과테말라를 골라 두었어요. 추출 세팅을 맞출수록 매력이 살아나는 원두예요.");
      }
      if (a.q_amount && a.q_amount !== "500") {
        parts.push("디카페인 원두는 500g 으로 준비돼요.");
      }
    } else {
      parts.push("모든 디카페인 제품은 과테말라 디카페인 원두로 만들어요. 호밀 같은 고소함에 은은한 산미가 있어요.");
    }

    if (a.q_decaf_form === "골고루") {
      parts.push("동결건조 스틱·캡슐·드립백·티백·콜드브루가 한 상자에 들어 있어 어떤 형태가 나한테 맞는지 찾기 좋아요.");
    }

    return parts.join(" ");
  }

  function buildMainReason(a, p, fallback, relaxedQ1) {
    var parts = [];
    var gift = a.q1 === "선물";
    var latte = a.q1 === "라떼";

    if (a.q1 === "디카페인") {
      return buildDecafMainReason(a, p);
    }

    if (latte) {
      var lparts = ["라떼를 즐기신다고 하셔서 저희 수제 캔커피로 골랐어요."];
      if (a.q_milk === "두유") {
        lparts.push("유당불내증이 있으시다고 해서 두유라떼로 준비했어요. 우유 대신 두유라 속이 편하고, 두유 특유의 고소함이 잘 어울려요.");
      } else {
        var lq = phraseOf("q_latte", a.q_latte);
        if (lq) lparts.push(lq + " " + eulReul(p.name) + " 골랐어요.");
      }
      if (p.signature === true) lparts.push("범표원두를 세상에 알린 시그니처 메뉴예요. 궁극의 고소함이 그대로 담겨 있어요.");
      if (p.story) lparts.push(p.story);
      lparts.push("용량은 350ml 두 샷, 500ml 세 샷이에요. 용량이 커지면 샷도 그만큼 늘어서 진하기는 비슷하니, 마실 양으로 고르시면 돼요. 상품 페이지 옵션에서 선택할 수 있어요.");
      if (wantsDecaf(a)) {
        lparts.push("카페인은 디카페인으로 원하셔서요. 범표원두 캔커피는 전부 디카페인으로도 주문할 수 있어요. 상품 페이지 옵션에서 디카페인을 고르시면 돼요.");
        if (p.signature === true) lparts.push("디카페인만 찾으시던 단골손님도 이 고소함에 반해 다시 오시더라고요.");
      }
      return lparts.join(" ");
    }

    if (fallback) {
      parts.push("지금 조건에 딱 맞는 상품이 없어서, 그래도 잘 어울릴 만한 인기 상품을 보여드려요.");
    }

    // 상황(q1) + 제품군 선택 이유
    var p1 = phraseOf("q1", a.q1);
    if (relaxedQ1) {
      if (p1) parts.push(p1 + " 알아봤는데, 딱 맞는 상품이 아직 없어 조건을 조금 넓혀 가장 잘 어울리는 상품으로 골랐어요.");
    } else if (fallback) {
      // fallback 일 때는 q1 문장을 넣지 않는다 (위 첫 문장만 유지)
    } else {
      if (p1) parts.push(p1 + " " + (LINE_REASON_BY_Q1[a.q1] || ""));
    }

    // 원두 구매 용량(q_amount) - 실제로 그 용량 상품일 때만
    if (a.q_amount && extractWeightG(p) === parseInt(a.q_amount, 10)) {
      var pAmt = phraseOf("q_amount", a.q_amount);
      if (pAmt) parts.push(pAmt + " 그에 맞는 용량으로 준비했어요.");
    } else if (a.q_amount && wantsDecaf(a) && p.decaf === true && extractWeightG(p)) {
      // 디카페인 원두는 500g 한 가지뿐이라 원하신 용량과 다를 수 있음을 솔직하게
      parts.push("디카페인 원두는 " + extractWeightG(p) + "g 으로 준비돼요.");
    }

    // 맛 취향(q2 / q5)
    if (a.q2 === "모름") {
      var p5 = phraseOf("q5", a.q5);
      if (p5) parts.push((gift ? "받으실 분께는 " : "") + p5 + ".");
    } else {
      var p2 = phraseOf("q2", a.q2);
      if (p2) parts.push((gift ? "받으실 분이 " : "") + p2 + ".");
    }

    if (isDayang(p)) {
      var hasOptions = hasFlavorOptions(p);
      if (hasOptions) {
        var whoText = gift ? "받으실 분 취향에 맞는 맛을" : "취향에 맞는 맛을";
        parts.push(eulReul(p.name) + " 골랐어요. 여러 맛이 옵션으로 들어있어서 " + whoText + " 고르시면 돼요.");
      } else {
        parts.push(eulReul(p.name) + " 골랐어요. 어떤 취향에도 무난하게 잘 맞는 상품이에요.");
      }
    } else {
      parts.push(eunNeun(p.name) + " " + tasteLabelOf(p) + " 맛이라 지금 취향에 잘 맞아요.");
    }

    // 회피(q3)
    if (a.q3 === "신맛회피") {
      var acidOk = isDayang(p) || (p.taste.indexOf("산뜻한산미") === -1 && p.taste.indexOf("과실감") === -1);
      if (acidOk) {
        parts.push(gift
          ? "받으실 분이 신맛을 부담스러워하신다고 하셔서 산미가 튀지 않는 상품으로 맞췄어요."
          : "신맛이 부담스럽다고 하셔서 산미가 튀지 않는 상품으로 맞췄어요.");
      }
    }
    if (a.q3 === "쓴맛회피") {
      parts.push(gift
        ? "받으실 분이 쓴맛을 부담스러워하신다고 하셔서 너무 진하지 않은 쪽으로 맞췄어요."
        : "쓴맛이 부담스럽다고 하셔서 너무 진하지 않은 쪽으로 맞췄어요.");
    }

    // 카페인(q4)
    if (wantsDecaf(a)) {
      if (p.decaf === true) {
        parts.push("카페인은 디카페인으로 원하셔서 디카페인 상품만 골랐어요.");
      } else {
        var decafFlavor2 = decafFlavorOf(p);
        if (decafFlavor2) {
          parts.push("카페인은 디카페인으로 원하셔서 " + decafFlavor2.name + " 맛을 골라 두었어요.");
        } else if (p.decafOption) {
          parts.push("카페인은 디카페인으로 원하셔서 주문할 때 옵션에서 '디카페인'을 골라 주세요.");
        } else {
          parts.push("디카페인으로 원하셨는데 이 조건에 맞는 디카페인 상품은 아직 없어요.");
        }
      }
    }

    return parts.join(" ");
  }

  /* 제품군 설명. 디카페인 컬렉션은 line 이 드립백이지만 여러 형태가 섞인 상품이라 따로 설명 */
  function lineDescOf(p) {
    if (p.id === DECAF_COLLECTION_ID) return "여러 형태를 골고루 담은 컬렉션";
    return LINE_DESC[p.line] || p.line;
  }

  function buildNewReason(a, np, chosen) {
    if (a.q1 === "라떼") {
      var nt;
      if (np.canFlavor === "온아바라") nt = "이건 덜 단 바닐라 향이 나는 온아바라예요. 사연이 있는 메뉴라 더 특별하고요.";
      else if (np.canFlavor === "범표라떼") nt = "이건 저희 시그니처 범표라떼예요. 궁극의 고소함이 담겨 있어요.";
      else if (np.canFlavor === "두유라떼") nt = "이건 두유로 만든 두유라떼예요. 속이 편하고 더 고소해요.";
      else nt = "색다르게 즐겨보실 수 있어요.";
      return eunNeun(np.name) + " 어떠세요? " + nt + " 부담 없이 새로운 커피를 경험해 보실 수 있어요.";
    }
    if (a.q1 === "디카페인") {
      var dd1 = lineDescOf(chosen), dd2 = lineDescOf(np);
      var dtext = eunNeun(np.name) + " 어떠세요? 오늘의 추천이 " + dd1 + (hasJong(dd1) ? "이라면" : "라면") + ", 이건 " + dd2 + (hasJong(dd2) ? "이에요." : "예요.") + " 똑같이 카페인 걱정 없어요.";
      if (np.decafOption) {
        dtext += " 주문할 때 옵션에서 '디카페인'을 골라 주세요.";
      }
      return dtext;
    }
    var diff;
    if (np.line !== chosen.line) {
      var d1 = lineDescOf(chosen), d2 = lineDescOf(np);
      diff = "오늘의 추천이 " + d1 + (hasJong(d1) ? "이라면" : "라면") + ", 이건 " + d2 + (hasJong(d2) ? "이에요." : "예요.");
    } else if (!sameTasteSet(np.taste, chosen.taste)) {
      diff = "오늘의 추천이 " + tasteLabelOf(chosen) + " 커피라면, 이건 " + tasteLabelOf(np) + " 커피예요.";
    } else {
      diff = "오늘의 추천과 같은 계열이지만 구성이 달라서 색다르게 즐길 수 있어요.";
    }
    var text = eunNeun(np.name) + " 어떠세요? " + diff + " 부담 없이 새로운 커피를 경험해 보실 수 있어요.";

    if (wantsDecaf(a) && np.decaf !== true) {
      var decafFlavor = decafFlavorOf(np);
      if (decafFlavor) {
        text += " " + decafFlavor.name + " 맛으로 골라 두었어요.";
      } else if (np.decafOption) {
        text += " 주문할 때 옵션에서 '디카페인'을 골라 주세요.";
      }
    }

    return text;
  }

  /* taste 가 ["다양"] 인 상품에 붙일 안내 문구 (예: "4종 중 취향에 맞는...") */
  function buildOptionHint(p) {
    if (!isDayang(p) || !hasFlavorOptions(p)) return "";
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

    var decafWanted = wantsDecaf(answers);
    var hasBrazilGuatemala = false;
    for (var gi = 0; gi < p.flavors.length; gi++) {
      if (p.flavors[gi].name.indexOf("브라질") !== -1 || p.flavors[gi].name.indexOf("과테말라") !== -1) { hasBrazilGuatemala = true; break; }
    }

    var defaultIndex = 0;
    if (decafWanted && hasBrazilGuatemala) {
      // 디카페인 원두(과테말라/브라질) - 고소하거나 신맛을 피하고 싶으면 브라질, 그 외엔 과테말라
      var preferBrazil = (answers.q2 === "고소" || answers.q3 === "신맛회피");
      var wantName = preferBrazil ? "브라질" : "과테말라";
      for (var i = 0; i < p.flavors.length; i++) {
        if (p.flavors[i].name.indexOf(wantName) !== -1) { defaultIndex = i; break; }
      }
    } else {
      for (var j2 = 0; j2 < p.flavors.length; j2++) {
        if (decafWanted && p.flavors[j2].taste === "디카페인") { defaultIndex = j2; break; }
        if (!decafWanted && p.flavors[j2].taste === rec.tasteTarget) { defaultIndex = j2; break; }
      }
    }

    var descEl = document.createElement("div");
    descEl.className = "flavor-desc";

    p.flavors.forEach(function (flavor, i) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "flavor-chip" + (i === defaultIndex ? " active" : "");
      chip.textContent = flavor.name;
      chip.addEventListener("click", function () {
        var chips = chipRow.querySelectorAll(".flavor-chip");
        for (var j = 0; j < chips.length; j++) chips[j].classList.remove("active");
        chip.classList.add("active");
        descEl.textContent = flavor.desc || "";
        descEl.hidden = !flavor.desc;
        BP.track("chip", { product_id: p.id, flavor: flavor.name });
      });
      chipRow.appendChild(chip);
    });

    box.appendChild(chipRow);

    var defaultFlavor = p.flavors[defaultIndex];
    descEl.textContent = (defaultFlavor && defaultFlavor.desc) || "";
    descEl.hidden = !(defaultFlavor && defaultFlavor.desc);
    box.appendChild(descEl);

    return box;
  }

  /* 상품에 flavors 가 있으면 맛 칩을, 없으면 기존 텍스트 안내(또는 디카페인 옵션 안내)를 프래그먼트에 붙인다. */
  function appendTasteOption(frag, p, rec) {
    var picker = buildFlavorPicker(p, rec);
    if (picker) {
      frag.appendChild(picker);
      return;
    }
    if (p.decafOption && wantsDecaf(answers)) {
      var decafHintEl = document.createElement("div");
      decafHintEl.className = "prod-hint";
      decafHintEl.textContent = "🌙 주문 옵션에서 '디카페인'을 골라 주세요";
      frag.appendChild(decafHintEl);
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

  /* q1="디카페인" 일 때, 제형(q_decaf_form)에 맞춰 일반 흐름의 q1 값과 같은 성격의 태그로 바꿔준다 */
  var DECAF_FORM_TO_Q1_TAG = {
    "원두": "핸드드립",
    "드립백": "아메리카노간편",
    "티백": "아메리카노간편",
    "파우더": "아메리카노간편",
    "콜드브루": "콜드브루",
    "캔커피": "라떼",
    "캡슐": "캡슐"
    /* "골고루" 는 대응하는 태그 없음 */
  };

  /* 지금 고객 답변을 리뷰 태그와 같은 값으로 정리 (q1/q2 목표맛/디카페인 여부/q_amount) */
  function currentSituationTags(a) {
    var tags = [];
    if (a.q1 === "디카페인") {
      var formTag = DECAF_FORM_TO_Q1_TAG[a.q_decaf_form];
      if (formTag) tags.push(formTag);
    } else if (a.q1) {
      tags.push(a.q1);
    }
    var tasteTarget = getTasteTarget(a);
    if (tasteTarget) tags.push(tasteTarget);
    if (wantsDecaf(a)) tags.push("디카페인");
    if (a.q_milk === "두유") tags.push("두유");
    if (a.q_amount) tags.push(a.q_amount);
    return tags;
  }

  /* p.id 에 달린 실제 후기 중, 지금 상황과 가장 많이 겹치는 후기 하나를 고른다.
     겹치는 태그가 없어도(matched=false) 후기 자체는 보여준다 - 사회적 증거는 있는게 낫다. */
  function pickReview(p, a) {
    var reviews = (typeof REVIEWS !== "undefined" && REVIEWS[p.id]) || [];
    if (reviews.length === 0) return null;

    var situationTags = currentSituationTags(a);
    var best = null;
    var bestScore = -1;

    for (var i = 0; i < reviews.length; i++) {
      var r = reviews[i];
      var score = 0;
      for (var j = 0; j < situationTags.length; j++) {
        if (r.tags.indexOf(situationTags[j]) !== -1) score++;
      }
      if (score > bestScore) {
        best = r;
        bestScore = score;
      }
    }

    return { review: best, matched: bestScore > 0 };
  }

  /* 실제 구매자 후기 카드: 별점 + 사진 + 후기 본문 */
  function buildReviewBlock(p, a) {
    var picked = pickReview(p, a);
    if (!picked || !picked.review) return null;
    var r = picked.review;

    var box = document.createElement("div");
    box.className = "review-card";

    var label = document.createElement("div");
    label.className = "result-label review-label";
    label.textContent = picked.matched ? "나와 비슷한 분의 후기" : "실제 구매자 후기";
    box.appendChild(label);

    var row = document.createElement("div");
    row.className = "review-row";

    if (r.photo) {
      var imgWrap = document.createElement("div");
      imgWrap.className = "review-photo-thumb";
      var img = document.createElement("img");
      img.src = r.photo;
      img.alt = "구매자 후기 사진";
      img.loading = "lazy";
      img.onerror = function () { imgWrap.hidden = true; };
      imgWrap.appendChild(img);
      row.appendChild(imgWrap);
    }

    var content = document.createElement("div");
    content.className = "review-content";

    var stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent = "★★★★★".slice(0, r.rating) + "☆☆☆☆☆".slice(0, 5 - r.rating);
    content.appendChild(stars);

    var text = document.createElement("div");
    text.className = "review-text";
    text.textContent = r.text;
    content.appendChild(text);

    var meta = document.createElement("div");
    meta.className = "review-meta";
    meta.textContent = r.author + " · " + r.date;
    content.appendChild(meta);

    row.appendChild(content);
    box.appendChild(row);

    return box;
  }

  /* "디카페인, 이런 형태로도 있어요" 타일에 쓸 대표 상품들.
     line 순서(원두→드립백→티백→파우더→콜드브루→캔커피→캡슐)로 각 1개씩,
     이미 오늘의 추천/새로운 경험/샘플로 나온 상품은 뺀다. */
  var DECAF_TILE_LINES = ["원두", "드립백", "티백", "파우더", "콜드브루", "캔커피", "캡슐"];
  function decafFormProducts(rec, a) {
    var excludeIds = {};
    if (rec.chosen) excludeIds[rec.chosen.id] = true;
    if (rec.newProduct) excludeIds[rec.newProduct.id] = true;
    if (rec.sampleProduct) excludeIds[rec.sampleProduct.id] = true;

    var candidates = decafCandidates();
    var tiles = [];
    for (var i = 0; i < DECAF_TILE_LINES.length; i++) {
      var line = DECAF_TILE_LINES[i];
      var pool = candidates.filter(function (p) { return p.line === line && !excludeIds[p.id]; });
      if (pool.length === 0) continue;
      var nonSample = pool.filter(function (p) { return !p.sample; });
      var finalPool = nonSample.length > 0 ? nonSample : pool;
      tiles.push(sortByPriority(finalPool)[0]);
    }
    return tiles;
  }

  /* ----------------------------------------------------------
     4. 화면 그리기
     ---------------------------------------------------------- */
  // Node 환경(테스트)에서는 document 가 없으므로 화면 관련 코드는 건너뜁니다.
  var HAS_DOM = (typeof document !== "undefined" && document.getElementById);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      recommend: recommend,
      recommendDecaf: recommendDecaf,
      decafFormProducts: decafFormProducts,
      buildMainReason: buildMainReason,
      buildNewReason: buildNewReason,
      buildOptionHint: buildOptionHint,
      formatPrice: formatPrice,
      tigerTypeOf: tigerTypeOf,
      pairOf: pairOf
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

  var mapId = null, mapName = "";
  try { mapId = localStorage.getItem("bp_map") || null; mapName = localStorage.getItem("bp_map_name") || ""; } catch (e) {}

  var friendType = null;
  var joinMapId = null;
  try {
    var _ft = new URLSearchParams(location.search).get("from");
    if (_ft && TIGER_TYPES[_ft]) friendType = _ft;
    var _mid = new URLSearchParams(location.search).get("map");
    if (_mid && /^[a-zA-Z0-9]{1,10}$/.test(_mid)) joinMapId = _mid;
  } catch (e) {}
  if (friendType) {
    var _introSub = document.querySelector(".intro-sub");
    if (_introSub) _introSub.textContent = TIGER_TYPES[friendType].emoji + " " + friendType + "형 친구가 보낸 테스트예요. 나는 무슨 호랑이일까요?";
  }

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

  /* 이 질문을 건너뛸지 결정 */
  function shouldSkip(key) {
    var decaf = answers.q1 === "디카페인";
    if (key === "q_decaf_form") return !decaf;
    if (key === "q_amount") return !(answers.q1 === "핸드드립" || (decaf && answers.q_decaf_form === "원두"));
    if (key === "q_milk") return answers.q1 !== "라떼";
    if (key === "q_latte") return answers.q1 !== "라떼" || answers.q_milk === "두유";
    if (key === "q2") {
      if (answers.q1 === "라떼") return true;
      if (decaf) return answers.q_decaf_form !== "원두";
      return false;
    }
    if (key === "q3") return answers.q1 === "라떼" || decaf;
    if (key === "q4") return decaf;
    if (key === "q5") return answers.q2 !== "모름" || decaf;
    return false;
  }

  /* 다음 단계로 이동 */
  function nextStep() {
    flowIndex++;
    var key = FLOW[flowIndex];
    while (shouldSkip(key)) { flowIndex++; key = FLOW[flowIndex]; }
    if (key === "result") { showResult(); return; }
    askQuestion(key);
  }

  function askQuestion(key) {
    var q = QUESTIONS[key];
    clearChoices();
    var text = (answers.q1 === "선물" && q.textGift) ? q.textGift : q.text;
    addSystemBubble(text, function () {
      renderChoices(q.options, function (opt) {
        answers[key] = opt.value;
        BP.track("answer", { q: key, value: opt.value });
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
  /* 섹션 헤더: 아이콘 + 제목 + 한 줄 설명 */
  function sectionHeaderEl(icon, title, sub, extraClass) {
    var head = document.createElement("div");
    head.className = "result-head" + (extraClass ? " " + extraClass : "");

    var label = document.createElement("div");
    label.className = "result-label";
    label.textContent = icon + " " + title;
    head.appendChild(label);

    var subEl = document.createElement("div");
    subEl.className = "result-sub";
    subEl.textContent = sub;
    head.appendChild(subEl);

    return head;
  }

  function productImageEl(p, small) {
    var box = document.createElement("div");
    box.className = small ? "prod-img prod-img-small" : "prod-img";

    var img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = small ? "cover" : "contain";
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

  function shopButtonEl(p, label, position) {
    if (p && p.url) {
      var a = document.createElement("a");
      a.className = "shop-btn";
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = label || "상품 보러가기";
      a.addEventListener("click", function () {
        BP.track("shop_click", { product_id: p.id, name: p.name, position: position || "main" });
      });
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

  function buildTypeCard(rec, a) {
    var name = rec.tiger, info = TIGER_TYPES[name] || { emoji: "🐯", tag: "", desc: "" };
    var gift = a.q1 === "선물";
    var box = document.createElement("div"); box.className = "type-card";
    var label = document.createElement("div"); label.className = "type-label"; label.textContent = gift ? "받으실 분의 커피 유형" : "당신의 커피 유형"; box.appendChild(label);
    var nm = document.createElement("div"); nm.className = "type-name"; nm.textContent = info.emoji + " " + name + "형"; box.appendChild(nm);
    if (info.tag) { var tg = document.createElement("div"); tg.className = "type-tag"; tg.textContent = info.tag; box.appendChild(tg); }
    if (info.desc) { var ds = document.createElement("div"); ds.className = "type-desc"; ds.textContent = info.desc; box.appendChild(ds); }
    return box;
  }

  function buildPairCard(rec, a) {
    if (!friendType) return null;
    var pair = pairOf(rec.tiger, friendType);
    if (!pair) return null;
    var mine = TIGER_TYPES[rec.tiger], theirs = TIGER_TYPES[friendType];
    var who = a.q1 === "선물" ? "받으실 분" : "당신";
    var box = document.createElement("div"); box.className = "pair-card";
    var label = document.createElement("div"); label.className = "type-label"; label.textContent = "링크 보낸 친구와의 궁합"; box.appendChild(label);
    var types = document.createElement("div"); types.className = "pair-types";
    types.textContent = theirs.emoji + " " + friendType + "형  ×  " + mine.emoji + " " + rec.tiger + "형"; box.appendChild(types);
    var nameRow = document.createElement("div"); nameRow.className = "pair-name";
    nameRow.textContent = "\"" + pair.name + "\"";
    var score = document.createElement("span"); score.className = "pair-score"; score.textContent = "궁합 " + pair.score + "점"; nameRow.appendChild(score);
    box.appendChild(nameRow);
    var desc = document.createElement("div"); desc.className = "type-desc"; desc.textContent = pair.desc; box.appendChild(desc);
    // "둘이 같이 마시면" 상품이 바로 아래 오늘의 추천과 같으면 중복이므로 대안(드립백 4종 → 30개 대용량)으로 바꾼다
    var pairProduct = pair.product;
    if (pairProduct && rec.chosen && pairProduct.id === rec.chosen.id) {
      var alts = [DRIPBAG_SET, "8084877243"];
      pairProduct = null;
      for (var ai = 0; ai < alts.length; ai++) {
        var cand = productById(alts[ai]);
        if (cand && cand.id !== rec.chosen.id) { pairProduct = cand; break; }
      }
    }
    if (pairProduct) {
      var pl = document.createElement("div"); pl.className = "pair-product-label"; pl.textContent = "둘이 같이 마시면"; box.appendChild(pl);
      var row = document.createElement("div"); row.className = "sample-row";
      row.appendChild(productImageEl(pairProduct, true));
      var info = document.createElement("div"); info.className = "sample-info";
      var nm = document.createElement("div"); nm.className = "prod-name sample-name"; nm.textContent = pairProduct.name; info.appendChild(nm);
      var pr = document.createElement("div"); pr.className = "prod-price"; pr.textContent = formatPrice(pairProduct.price); info.appendChild(pr);
      info.appendChild(shopButtonEl(pairProduct, "같이 마실 커피 보기", "pair"));
      row.appendChild(info); box.appendChild(row);
    } else if (pair.product) {
      var pl2 = document.createElement("div"); pl2.className = "pair-product-label"; pl2.textContent = "바로 아래 오늘의 추천이 둘이 나눠 마시기에도 딱이에요."; box.appendChild(pl2);
    }
    return box;
  }

  function buildMainBlock(rec) {
    var frag = document.createDocumentFragment();
    var chosen = rec.chosen;

    frag.appendChild(sectionHeaderEl("🎯", "오늘의 추천", "답해주신 취향에 가장 잘 맞는 커피예요", ""));

    frag.appendChild(productImageEl(chosen));

    var name1 = document.createElement("div");
    name1.className = "prod-name";
    name1.textContent = chosen.name;
    frag.appendChild(name1);

    frag.appendChild(priceLineEl(chosen));

    var whyLabel1 = document.createElement("div");
    whyLabel1.className = "why-label";
    whyLabel1.textContent = "이렇게 추천했어요";
    frag.appendChild(whyLabel1);

    var why1 = document.createElement("div");
    why1.className = "prod-why";
    why1.textContent = buildMainReason(answers, chosen, rec.fallback, rec.relaxedQ1);
    frag.appendChild(why1);

    appendTasteOption(frag, chosen, rec);

    var reviewEl1 = buildReviewBlock(chosen, answers);
    if (reviewEl1) frag.appendChild(reviewEl1);

    frag.appendChild(shopButtonEl(chosen, "상품 보러가기", "main"));

    return frag;
  }

  function buildNewExpBlock(rec) {
    var frag = document.createDocumentFragment();
    var np = rec.newProduct;

    var divider = document.createElement("div");
    divider.className = "result-divider";
    frag.appendChild(divider);

    frag.appendChild(sectionHeaderEl("🌱", "새로운 커피 경험", "평소 취향에서 한 발짝 벗어나, 새로 시도해볼 만한 커피예요", ""));

    frag.appendChild(productImageEl(np));

    var name2 = document.createElement("div");
    name2.className = "prod-name";
    name2.textContent = np.name;
    frag.appendChild(name2);

    frag.appendChild(priceLineEl(np));

    var whyLabel2 = document.createElement("div");
    whyLabel2.className = "why-label";
    whyLabel2.textContent = "이런 점이 새로워요";
    frag.appendChild(whyLabel2);

    var why2 = document.createElement("div");
    why2.className = "prod-why";
    why2.textContent = buildNewReason(answers, np, rec.chosen);
    frag.appendChild(why2);

    appendTasteOption(frag, np, rec);

    var reviewEl2 = buildReviewBlock(np, answers);
    if (reviewEl2) frag.appendChild(reviewEl2);

    frag.appendChild(shopButtonEl(np, "상품 보러가기", "new"));

    return frag;
  }

  function buildSampleBlock(rec) {
    if (!rec.sampleProduct) return null;
    var sp = rec.sampleProduct;

    var box = document.createElement("div");
    box.className = "sample-card";

    box.appendChild(sectionHeaderEl("🍬", "처음이라 부담되시면", "적은 양으로 먼저 맛볼 수 있는 상품이에요", "sample-label"));

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

    infoBox.appendChild(shopButtonEl(sp, "먼저 맛보기", "sample"));

    row.appendChild(infoBox);
    box.appendChild(row);

    return box;
  }

  /* "디카페인, 이런 형태로도 있어요" - 형태별 대표 상품을 2열 타일로 보여준다 */
  function buildDecafFormsBlock(rec) {
    if (!wantsDecaf(answers)) return null;
    var tiles = decafFormProducts(rec, answers);
    if (tiles.length === 0) return null;

    var box = document.createElement("div");
    box.className = "decaf-forms-card";

    box.appendChild(sectionHeaderEl("🌙", "디카페인, 이런 형태로도 있어요", "형태만 다르고 전부 카페인 걱정 없는 커피예요", ""));

    var grid = document.createElement("div");
    grid.className = "decaf-grid";

    tiles.forEach(function (p) {
      var tile = document.createElement("a");
      tile.className = "decaf-tile";
      tile.href = p.url || "#";
      tile.target = "_blank";
      tile.rel = "noopener";

      tile.appendChild(productImageEl(p, true));

      var lineEl = document.createElement("div");
      lineEl.className = "decaf-tile-line";
      lineEl.textContent = p.line;
      tile.appendChild(lineEl);

      var nameEl = document.createElement("div");
      nameEl.className = "decaf-tile-name";
      nameEl.textContent = p.name;
      tile.appendChild(nameEl);

      var priceEl = document.createElement("div");
      priceEl.className = "decaf-tile-price";
      priceEl.textContent = formatPrice(p.price);
      tile.appendChild(priceEl);

      tile.addEventListener("click", function () {
        BP.track("shop_click", { product_id: p.id, name: p.name, position: "decaf_form" });
      });

      grid.appendChild(tile);
    });

    box.appendChild(grid);
    return box;
  }

  function buildShareBlock(rec) {
    var box = document.createElement("div");
    box.className = "share-card";

    box.appendChild(sectionHeaderEl("🔗", "친구는 무슨 호랑이일까요?", "링크를 보내면 친구의 커피 유형도 알 수 있어요.", ""));

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "share-btn";
    btn.textContent = "친구에게 유형 테스트 보내기";
    box.appendChild(btn);

    var doneEl = document.createElement("div");
    doneEl.className = "share-done";
    doneEl.textContent = "";
    box.appendChild(doneEl);

    btn.addEventListener("click", function () {
      var url = location.origin + location.pathname;
      if (location.protocol === "file:") {
        url = "https://coffee.bumpyobeans.shop";
      }
      url += (url.indexOf("?") === -1 ? "?" : "&") + "src=friend";
      url += "&from=" + encodeURIComponent(rec.tiger);
      if (mapId) url += "&map=" + encodeURIComponent(mapId);
      var tInfo = TIGER_TYPES[rec.tiger] || { emoji: "🐯" };
      var mine = (answers.q1 === "선물" ? "선물 받을 분은 " : "나는 ") + rec.tiger + "형!";
      var text = tInfo.emoji + " " + mine + " 너는 무슨 호랑이?\n범표원두 커피 취향 테스트 — 몇 가지 질문에 답하면 내 호랑이 유형과 딱 맞는 커피를 알려줘요.";
      if (mapId) text += "\n내 커피 친구 지도에 별로 떠줘 ⭐";

      if (navigator.share) {
        navigator.share({ title: "범표원두 커피 추천 상담", text: text, url: url }).then(function () {
          doneEl.textContent = "친구에게 전달했어요 🙌";
          BP.track("share", { method: "share", ok: true });
        }).catch(function () {
          // 취소 등 실패 시 아무것도 하지 않음
          BP.track("share", { method: "share", ok: false });
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + "\n" + url).then(function () {
          doneEl.textContent = "링크를 복사했어요. 카톡이나 문자에 붙여넣어 보내세요 📋";
          BP.track("share", { method: "clipboard", ok: true });
        }).catch(function () {
          doneEl.textContent = "복사가 안 되면 이 주소를 길게 눌러 복사하세요: " + url;
          BP.track("share", { method: "text", ok: true });
        });
        return;
      }

      doneEl.textContent = "복사가 안 되면 이 주소를 길게 눌러 복사하세요: " + url;
      BP.track("share", { method: "text", ok: true });
    });

    return box;
  }

  /* 지도 카드 (주인 흐름): 지도가 있으면 "지도 보기" 안내, 없으면 지도 만들기 CTA */
  /* 지도 페이지로 가는 버튼 (상품 클릭과 구분해서 map_open 으로 기록) */
  function mapLinkEl(id, label) {
    var a = document.createElement("a");
    a.className = "shop-btn";
    a.href = "map.html?id=" + encodeURIComponent(id);
    a.textContent = label;
    a.addEventListener("click", function () { BP.track("map_open", { map_id: id }); });
    return a;
  }

  function buildMapBlock(rec) {
    var box = document.createElement("div");
    box.className = "map-card";

    if (mapId) {
      box.appendChild(sectionHeaderEl("🗺️", "내 커피 친구 지도", "가까울수록, 밝을수록 궁합이 좋은 친구예요.", ""));

      var countEl = document.createElement("div");
      countEl.className = "map-count";
      countEl.textContent = "친구를 불러오는 중…";
      box.appendChild(countEl);

      box.appendChild(mapLinkEl(mapId, "지도 보기"));

      var shareText = document.createElement("div");
      shareText.className = "share-text";
      shareText.textContent = "아래 공유 버튼으로 링크를 더 뿌려보세요.";
      box.appendChild(shareText);

      BP.fetchMap(mapId).then(function (r) {
        countEl.textContent = r ? "친구 " + r.friends.length + "명이 별로 떠 있어요" : "지도를 불러오지 못했어요";
      });

      return box;
    }

    box.className = "map-card map-cta";
    box.appendChild(sectionHeaderEl("🐯", "내 커피 친구 지도 만들어보세요", "내 링크를 뿌리면, 친구들이 테스트하고 나와 어떤 커피 사이인지 지도에 떠요.", ""));

    var nameInput = document.createElement("input");
    nameInput.className = "map-name";
    nameInput.maxLength = 12;
    nameInput.placeholder = "지도에 표시될 내 별명 (선택)";
    box.appendChild(nameInput);

    var createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "shop-btn map-create";
    createBtn.textContent = "내 커피 친구 지도 만들기";
    box.appendChild(createBtn);

    var doneEl = document.createElement("div");
    doneEl.className = "share-done";
    box.appendChild(doneEl);

    createBtn.addEventListener("click", function () {
      createBtn.disabled = true;
      createBtn.textContent = "만드는 중…";
      var name = nameInput.value || "";
      BP.createMap(rec.tiger, name).then(function (id) {
        if (id) {
          try { localStorage.setItem("bp_map", id); localStorage.setItem("bp_map_name", name.slice(0, 12)); } catch (e) {}
          mapId = id;
          mapName = name.slice(0, 12);
          BP.track("map_create", { map_id: id });
          var newBox = buildMapBlock(rec);
          box.parentNode.replaceChild(newBox, box);
        } else {
          doneEl.textContent = "지금은 만들 수 없어요. 잠시 후 다시 시도해 주세요.";
          createBtn.disabled = false;
          createBtn.textContent = "내 커피 친구 지도 만들기";
        }
      });
    });

    return box;
  }

  /* 친구 지도에 올리기 카드 (친구 흐름): joinMapId && friendType 일 때만 사용 */
  function buildJoinBlock(rec) {
    if (!joinMapId || !friendType) return null;

    var box = document.createElement("div");
    box.className = "map-card map-join";
    box.appendChild(sectionHeaderEl("⭐", "친구 지도에 내 별을 띄울까요?", "친구가 나와 어떤 커피 사이인지 볼 수 있어요.", ""));

    if (mapId === joinMapId) {
      var mineEl = document.createElement("div");
      mineEl.className = "share-text";
      mineEl.textContent = "내 지도예요 😊";
      box.appendChild(mineEl);
      box.appendChild(mapLinkEl(joinMapId, "지도 보기"));
      return box;
    }

    var nameInput = document.createElement("input");
    nameInput.className = "map-name";
    nameInput.maxLength = 12;
    nameInput.placeholder = "지도에 표시될 내 별명 (선택)";
    box.appendChild(nameInput);

    var joinBtn = document.createElement("button");
    joinBtn.type = "button";
    joinBtn.className = "shop-btn map-join-btn";
    joinBtn.textContent = "지도에 올리기";
    box.appendChild(joinBtn);

    var doneEl = document.createElement("div");
    doneEl.className = "share-done";
    box.appendChild(doneEl);

    joinBtn.addEventListener("click", function () {
      joinBtn.disabled = true;
      joinBtn.textContent = "올리는 중…";
      var name = nameInput.value || "";
      var pr = pairOf(rec.tiger, friendType);
      BP.joinMap(joinMapId, rec.tiger, name, pr ? pr.name : null, pr ? pr.score : null).then(function (result) {
        if (result === "ok" || result === "dup") {
          doneEl.textContent = (result === "ok" ? "올라갔어요! 🌟" : "이미 올라가 있어요 😊");
          doneEl.appendChild(document.createElement("br"));
          doneEl.appendChild(mapLinkEl(joinMapId, "친구 지도 보기"));
          nameInput.hidden = true;
          joinBtn.hidden = true;
          if (result === "ok") BP.track("map_join", { map_id: joinMapId });
        } else {
          doneEl.textContent = "지금은 올릴 수 없어요. 잠시 후 다시 시도해 주세요.";
          joinBtn.disabled = false;
          joinBtn.textContent = "지도에 올리기";
        }
      });
    });

    return box;
  }

  function buildResultCard(rec) {
    var card = document.createElement("div");
    card.className = "result-card";

    card.appendChild(buildTypeCard(rec, answers));
    var pairEl = buildPairCard(rec, answers);
    if (pairEl) card.appendChild(pairEl);
    var joinEl = buildJoinBlock(rec);
    if (joinEl) card.appendChild(joinEl);
    var divider0 = document.createElement("div");
    divider0.className = "result-divider";
    card.appendChild(divider0);

    card.appendChild(buildMainBlock(rec));
    card.appendChild(buildNewExpBlock(rec));

    var sampleEl = buildSampleBlock(rec);
    if (sampleEl) {
      var divider2 = document.createElement("div");
      divider2.className = "result-divider";
      card.appendChild(divider2);
      card.appendChild(sampleEl);
    }

    var decafFormsEl = buildDecafFormsBlock(rec);
    if (decafFormsEl) {
      var divider3 = document.createElement("div");
      divider3.className = "result-divider";
      card.appendChild(divider3);
      card.appendChild(decafFormsEl);
    }

    card.appendChild(buildMapBlock(rec));
    card.appendChild(buildShareBlock(rec));

    return card;
  }

  function showResult() {
    clearChoices();
    var rec = recommend(answers);
    BP.track("result", {
      answers: answers,
      chosen: rec.chosen.id, chosen_name: rec.chosen.name,
      new_product: rec.newProduct ? rec.newProduct.id : null,
      sample: rec.sampleProduct ? rec.sampleProduct.id : null,
      fallback: !!rec.fallback, relaxedQ1: !!rec.relaxedQ1,
      tiger: rec.tiger,
      friend_type: friendType,
      pair: (friendType && pairOf(rec.tiger, friendType) || {}).name || null,
      map_id: joinMapId || null,
      decaf_form: answers.q_decaf_form || null
    });

    var tInfo = TIGER_TYPES[rec.tiger] || { emoji: "🐯" };
    var who = answers.q1 === "선물" ? "받으실 분은" : "당신은";
    var bubble = "이야기 잘 들었어요. " + who + " " + tInfo.emoji + " " + rec.tiger + "형이에요! 딱 맞는 커피도 찾았어요.";

    addSystemBubble(bubble, function () {
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
    BP.startSession();
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
  restartBtn.addEventListener("click", function () { BP.track("restart", {}); restart(); });

})();

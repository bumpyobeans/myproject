/* 호랑이 유형·궁합 규칙 (index.html 과 map.html 이 같이 씀. 상품 조회는 없음) */
var BP_TYPES = (function () {
  "use strict";

  /* 호랑이 유형: 답변으로 정하는 "당신의 커피 유형". 이름은 실제 원두 이름 그대로. */
  var TIGER_TYPES = {
    "인도호랑이":   { emoji: "🌰", tag: "든든한 고소파",       desc: "호밀 같은 고소함에 묵직한 바디감. 진한 한 잔으로 하루를 여는 분이에요." },
    "조선호랑이":   { emoji: "🍫", tag: "고소한데 위트 있는",   desc: "고소하고 묵직한데 산미가 살짝 위트처럼 스쳐요. 쓴맛은 싫지만 밍밍한 것도 싫은 분이에요." },
    "호랑이형님":   { emoji: "⚖️", tag: "밸런스 장인",         desc: "잔잔한 산미에 굿 밸런스. 누구와 마셔도 무난하게 잘 맞는 분이에요." },
    "역삼동호랑이": { emoji: "🍋", tag: "상큼한 산미파",       desc: "자몽의 새콤함, 살구 같은 과실의 산미. 커피에서 과일 향을 찾는 분이에요." },
    "아프리카호랑이": { emoji: "🍇", tag: "개성 있는 모험가",   desc: "리치 같은 달콤한 산미에 와인 같은 바디감. 새로운 맛에 먼저 손이 가는 분이에요." },
    "디카페인호랑이": { emoji: "🌙", tag: "밤에도 편안한",     desc: "호밀 같은 고소함에 브라운 슈거의 단맛. 카페인 없이도 커피의 즐거움을 놓치지 않는 분이에요." }
  };
  /* 유형을 4그룹으로: G 고소 / B 균형 / S 산미 / D 디카페인 */
  var TIGER_GROUP = { "인도호랑이": "G", "조선호랑이": "G", "호랑이형님": "B", "역삼동호랑이": "S", "아프리카호랑이": "S", "디카페인호랑이": "D" };
  /* 같은 유형일 때 "둘이 같이 마시면" 상품 (취향 원두 500g) */
  var SAME_TYPE_PRODUCT = { "G": "13623193339", "B": "13623204620", "S": "13623213996", "D": "13623229799" };
  var DRIPBAG_SET = "5215355668"; /* 드립백 4종 7개입 - 네 맛이 다 들어 있어 취향이 갈릴 때 */
  var PAIR_RULES = {
    "same": { name: "같은 잔 나누는 사이",     score: 96, desc: "취향이 똑같아요. 원두 하나 넉넉히 사서 나눠 마시면 딱이에요." },
    "D":    { name: "밤에도 함께 마시는 사이", score: 90, desc: "한 분은 카페인 없이, 한 분은 진하게. 같은 세트 안에서 각자 골라 마실 수 있어요.", product: DRIPBAG_SET },
    "GG":   { name: "고소한 형제",             score: 92, desc: "둘 다 고소파. 쓴맛의 세기만 살짝 달라요. 고소한 원두 세트로 비교하며 마셔보세요.", product: "13623193339" },
    "SS":   { name: "산미 탐험대",             score: 92, desc: "둘 다 산미파. 자몽이냐 리치냐, 산미의 결이 달라 비교하는 재미가 있어요.", product: "13623213996" },
    "GS":   { name: "한 잔씩 바꿔 마시는 사이", score: 84, desc: "정반대 취향이에요. 서로의 커피를 한 모금씩 바꿔 마시면 커피 세계가 두 배로 넓어져요.", product: DRIPBAG_SET },
    "BG":   { name: "든든한 짝꿍",             score: 88, desc: "고소파와 밸런스파. 호랑이형님이 중간에서 다 받아줘요. 같은 세트에서 각자 골라 마시면 돼요.", product: DRIPBAG_SET },
    "BS":   { name: "산뜻한 콤비",             score: 88, desc: "산미파와 밸런스파. 가볍고 산뜻한 쪽으로 취향이 모여요.", product: DRIPBAG_SET }
  };

  /* q2(+q5) 답 -> 목표 맛 키워드 */
  function getTasteTarget(a) {
    if (a.q1 === "라떼") { return a.q_latte === "온아바라" ? "균형" : "고소"; }
    if (a.q2 === "고소") return "고소";
    if (a.q2 === "균형") return "균형";
    if (a.q2 === "산뜻") return "산뜻한산미";
    if (a.q2 === "모름" && a.q5 === "부드러움") return "균형";
    if (a.q2 === "모름" && a.q5 === "개성") return "과실감";
    return "균형";
  }

  /* q1(디카페인 형태 선택 흐름) 또는 q4(일반 흐름의 카페인 질문) 어느 쪽이든
     디카페인을 원하면 true. app.js 와 types.js 양쪽에서 같은 기준으로 쓴다. */
  function wantsDecaf(a) {
    return a.q1 === "디카페인" || a.q4 === "디카페인";
  }

  function tigerTypeOf(a) {
    if (wantsDecaf(a)) return "디카페인호랑이";
    var t = getTasteTarget(a);
    if (t === "고소") return a.q3 === "쓴맛회피" ? "조선호랑이" : "인도호랑이";
    if (t === "균형") return "호랑이형님";
    if (t === "산뜻한산미") return "역삼동호랑이";
    if (t === "과실감") return "아프리카호랑이";
    return "호랑이형님";
  }

  /* 내 유형 × 친구 유형 -> { key, name, score, desc, productId } 또는 null. 상품 존재 여부는 여기서 안 봄 */
  function pairRule(mine, friend) {
    if (!TIGER_TYPES[mine] || !TIGER_TYPES[friend]) return null;
    var g1 = TIGER_GROUP[mine], g2 = TIGER_GROUP[friend], key, rule, productId;
    if (mine === friend) { key = "same"; rule = PAIR_RULES.same; productId = SAME_TYPE_PRODUCT[g1]; }
    else if (g1 === "D" || g2 === "D") { key = "D"; rule = PAIR_RULES.D; productId = rule.product; }
    else { key = [g1, g2].sort().join(""); rule = PAIR_RULES[key]; productId = rule && rule.product; }
    if (!rule) return null;
    return { key: key, name: rule.name, score: rule.score, desc: rule.desc, productId: productId };
  }

  return { TIGER_TYPES: TIGER_TYPES, TIGER_GROUP: TIGER_GROUP, SAME_TYPE_PRODUCT: SAME_TYPE_PRODUCT, DRIPBAG_SET: DRIPBAG_SET, PAIR_RULES: PAIR_RULES, getTasteTarget: getTasteTarget, tigerTypeOf: tigerTypeOf, pairRule: pairRule, wantsDecaf: wantsDecaf };
})();
if (typeof module !== "undefined" && module.exports) { module.exports = BP_TYPES; }

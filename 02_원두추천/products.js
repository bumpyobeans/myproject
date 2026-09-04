/* ============================================================
   범표원두 커피 추천 - 제품 데이터
   ------------------------------------------------------------
   * 이미지 주소(image)와 상품 URL(url)은 나중에 여기에 채웁니다.
     지금은 전부 빈 문자열 "" 로 두었습니다.
   * 제품 목록/맛 설명은 docs/01_설계.md 6절을 그대로 옮긴 것입니다.
     문서에 없는 제품을 임의로 추가하지 않습니다.

   각 제품 필드 설명
   - id      : 내부 구분용 고유 값
   - name    : 화면에 보여줄 제품명
   - line    : 제품군 ("원두" | "드립백" | "티백" | "캡슐" | "파우더" | "콜드브루")
   - desc    : 설계서에 적힌 맛 설명
   - taste   : 맛 키워드 배열
               ("고소","묵직","균형","잔잔한산미","산뜻한산미","과실감","단맛","깔끔")
   - method  : 음용 방식 배열
               ("핸드드립","아메리카노","라떼","캡슐머신","콜드브루","간편")
   - scene   : 추천 상황 배열 ("집","여행캠핑","선물","사무실")
   - decaf   : 디카페인 여부 (true / false)
   - image   : 대표 이미지 주소 (나중에 채움)
   - url     : 상품 페이지 주소 (나중에 채움)
   - priority: 대표 제품일수록 높은 숫자 (1~5)
   ============================================================ */

const PRODUCTS = [

  /* ---------- 원두 · 블렌딩 라인업 (6종) ---------- */
  {
    id: "bean-india",
    name: "인도호랑이",
    line: "원두",
    desc: "호밀 같은 고소함과 묵직한 바디감",
    taste: ["고소", "묵직"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "bean-beompresso",
    name: "범프레소",
    line: "원두",
    desc: "다크 초콜릿의 묵직한 쌉쌀함과 단맛, 구운 아몬드의 고소함과 깊은 바디",
    taste: ["고소", "묵직", "단맛"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "bean-joseon",
    name: "조선호랑이",
    line: "원두",
    desc: "고소하고 묵직하면서 위트 있는 산미가 살짝 감도는 맛",
    taste: ["고소", "묵직", "균형"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 5
  },
  {
    id: "bean-hyungnim",
    name: "호랑이형님",
    line: "원두",
    desc: "잔잔한 산미와 좋은 밸런스",
    taste: ["균형", "잔잔한산미", "단맛"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "bean-yeoksam",
    name: "역삼동호랑이",
    line: "원두",
    desc: "자몽의 씁쓸 새콤함과 살구 같은 과실의 산미",
    taste: ["산뜻한산미", "과실감", "깔끔"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "bean-africa",
    name: "아프리카호랑이",
    line: "원두",
    desc: "리치 같은 달콤한 산미와 와인 같은 바디감",
    taste: ["과실감", "단맛", "묵직"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 원두 · 싱글오리진 라인업 (3종) ---------- */
  {
    id: "single-decaf",
    name: "디카페인호랑이",
    line: "원두",
    desc: "호밀 같은 고소함과 브라운 슈거의 단맛 (디카페인)",
    taste: ["고소", "단맛", "깔끔"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: true,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "single-ethiopia",
    name: "에티오피아 모모라 G1",
    line: "원두",
    desc: "잘 익은 딸기와 꿀 같은 바디, 마신 후 긴 여운",
    taste: ["과실감", "단맛", "산뜻한산미"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "single-kenya",
    name: "케냐 AA 카루만디",
    line: "원두",
    desc: "깔끔한 단맛과 자몽의 주시함, 풍부한 바디감",
    taste: ["산뜻한산미", "과실감", "단맛", "묵직"],
    method: ["핸드드립", "아메리카노", "라떼"],
    scene: ["집"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 드립백 (4종) ---------- */
  {
    id: "drip-joseon",
    name: "조선호랑이 드립백",
    line: "드립백",
    desc: "고소하고 묵직하면서 위트 있는 산미가 살짝 감도는 맛",
    taste: ["고소", "묵직", "균형"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 5
  },
  {
    id: "drip-hyungnim",
    name: "호랑이형님 드립백",
    line: "드립백",
    desc: "잔잔한 산미와 좋은 밸런스",
    taste: ["균형", "잔잔한산미", "단맛"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "drip-yeoksam",
    name: "역삼동호랑이 드립백",
    line: "드립백",
    desc: "자몽의 씁쓸 새콤함과 살구 같은 과실의 산미",
    taste: ["산뜻한산미", "과실감", "깔끔"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "drip-decaf",
    name: "디카페인호랑이 드립백",
    line: "드립백",
    desc: "호밀 같은 고소함과 브라운 슈거의 단맛 (디카페인)",
    taste: ["고소", "단맛", "깔끔"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: true,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 티백 커피 (4종) ---------- */
  {
    id: "tea-joseon",
    name: "조선호랑이 티백",
    line: "티백",
    desc: "고소하고 묵직하면서 위트 있는 산미가 살짝 감도는 맛",
    taste: ["고소", "묵직", "균형"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "tea-hyungnim",
    name: "호랑이형님 티백",
    line: "티백",
    desc: "잔잔한 산미와 좋은 밸런스",
    taste: ["균형", "잔잔한산미", "단맛"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "tea-yeoksam",
    name: "역삼동호랑이 티백",
    line: "티백",
    desc: "자몽의 씁쓸 새콤함과 살구 같은 과실의 산미",
    taste: ["산뜻한산미", "과실감", "깔끔"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "tea-decaf",
    name: "디카페인호랑이 티백",
    line: "티백",
    desc: "호밀 같은 고소함과 브라운 슈거의 단맛 (디카페인)",
    taste: ["고소", "단맛", "깔끔"],
    method: ["아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: true,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 캡슐 (6종) ---------- */
  {
    id: "cap-purple-india",
    name: "퍼플_인도호랑이 캡슐",
    line: "캡슐",
    desc: "호밀 같은 고소함과 묵직한 바디감",
    taste: ["고소", "묵직"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "cap-silver-beompresso",
    name: "실버_범프레소 캡슐",
    line: "캡슐",
    desc: "다크 초콜릿의 묵직한 쌉쌀함과 단맛, 구운 아몬드의 고소함과 깊은 바디",
    taste: ["고소", "묵직", "단맛"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "cap-red-joseon",
    name: "레드_조선호랑이 캡슐",
    line: "캡슐",
    desc: "고소하고 묵직하면서 위트 있는 산미가 살짝 감도는 맛",
    taste: ["고소", "묵직", "균형"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 5
  },
  {
    id: "cap-gold-hyungnim",
    name: "골드_호랑이형님 캡슐",
    line: "캡슐",
    desc: "잔잔한 산미와 좋은 밸런스",
    taste: ["균형", "잔잔한산미", "단맛"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "cap-green-yeoksam",
    name: "그린_역삼동호랑이 캡슐",
    line: "캡슐",
    desc: "자몽의 씁쓸 새콤함과 살구 같은 과실의 산미",
    taste: ["산뜻한산미", "과실감", "깔끔"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "cap-blue-decaf",
    name: "블루_디카페인호랑이 캡슐",
    line: "캡슐",
    desc: "호밀 같은 고소함과 브라운 슈거의 단맛 (디카페인)",
    taste: ["고소", "단맛", "깔끔"],
    method: ["캡슐머신", "아메리카노", "라떼"],
    scene: ["집", "사무실"],
    decaf: true,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 파우더 커피 (5종) ---------- */
  {
    id: "pow-india",
    name: "인도호랑이 파우더",
    line: "파우더",
    desc: "진하고 고소한 진한 맛",
    taste: ["고소", "묵직"],
    method: ["라떼", "아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "pow-joseon",
    name: "조선호랑이 파우더",
    line: "파우더",
    desc: "부드럽고 산뜻한 밸런스",
    taste: ["균형", "산뜻한산미", "깔끔"],
    method: ["라떼", "아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 4
  },
  {
    id: "pow-hyungnim",
    name: "호랑이형님 파우더",
    line: "파우더",
    desc: "달콤 고소한 데일리 맛",
    taste: ["고소", "단맛", "균형"],
    method: ["라떼", "아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 5
  },
  {
    id: "pow-yeoksam",
    name: "역삼동호랑이 파우더",
    line: "파우더",
    desc: "상큼하고 깔끔한 산미 라인",
    taste: ["산뜻한산미", "깔끔", "과실감"],
    method: ["라떼", "아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 3
  },
  {
    id: "pow-decaf",
    name: "디카페인호랑이 파우더",
    line: "파우더",
    desc: "밤에도 편안한 깔끔 고소 (디카페인)",
    taste: ["고소", "깔끔"],
    method: ["라떼", "아메리카노", "간편"],
    scene: ["집", "여행캠핑", "선물", "사무실"],
    decaf: true,
    image: "",
    url: "",
    priority: 3
  },

  /* ---------- 콜드브루 (2종) ---------- */
  {
    id: "cold-joseon",
    name: "조선호랑이 콜드브루",
    line: "콜드브루",
    desc: "고소하고 묵직한 조선호랑이를 차갑게 내린 콜드브루",
    taste: ["고소", "묵직", "균형"],
    method: ["콜드브루", "간편"],
    scene: ["집", "여행캠핑", "사무실"],
    decaf: false,
    image: "",
    url: "",
    priority: 5
  },
  {
    id: "cold-decaf",
    name: "디카페인 콜드브루",
    line: "콜드브루",
    desc: "밤에도 부담 없는 디카페인 콜드브루",
    taste: ["고소", "깔끔", "단맛"],
    method: ["콜드브루", "간편"],
    scene: ["집", "여행캠핑", "사무실"],
    decaf: true,
    image: "",
    url: "",
    priority: 4
  }

];

"""범표캡슐 6종 — 기본 캐러셀 스타일 버전 (10장).

usage: python3 make_capsule_clean.py OUT_DIR PHOTO_DIR   (PHOTO_DIR holds 9.jpg ... 13.jpg)
Capsule colours: 역삼동호랑이 = green, 인도호랑이 = purple.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carousel_kit as k  # noqa: E402

OUT, PH = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
LABEL, HANDLE, N = "범표원두 캡슐 리포트", "@bumpyobeans", 10

slides = [
    k.cover(PH / "9.jpg", "범표캡슐 이야기 · No.01",
            ["새벽 4시까지", "20캡슐 내려본", "로스터의 캡슐 가이드"],
            "6종 중에 내 취향 찾기", HANDLE, "2004년부터 · 범표원두", focus=0.5),
    k.stats(LABEL, 2, N, HANDLE, PH / "13.jpg", "이 캡슐의 숫자",
            [("6종", "범표캡슐", "고소함부터 디카페인까지"),
             ("20캡슐", "하룻밤 테스트", "추출 세팅 맞추기"),
             ("4시", "새벽까지", "프리인퓨징 · 압력 · 온도"),
             ("2알씩", "멀티팩", "5종을 맛보는 방법")],
            focus=0.5),
    k.item(LABEL, 3, N, HANDLE, 1, "조선호랑이",
           ["범표원두의 기본, **묵직한 고소함**.",
            "매일 마셔도 질리지 않는 고소한 맛의 정석이에요.",
            "**경복궁, 덕수궁** 안 카페에 들어가는 바로 그 원두예요."],
           "고민되면 조선호랑이부터.", PH / "11.jpg", photo_top=True, focus=0.5),
    k.item(LABEL, 4, N, HANDLE, 2, "역삼동호랑이",
           ["예가체프의 **산뜻한 산미**가 매력적인 캡슐.",
            "모닝 캡슐머신 담당자님 **최애**!!",
            "에스프레소 그대로, 아이스 아메리카노로."],
           "산미 좋아한다면 초록색 캡슐.", PH / "9.jpg", photo_top=False, focus=0.0),
    k.item(LABEL, 5, N, HANDLE, 3, "범프레소",
           ["다크 로스팅으로 **진하고 쌉쌀하게**. 산미는 적게.",
            "다크초콜릿, 카카오닙, 구운 아몬드.",
            "라떼, 아포가토, 바닐라라떼에 딱이에요."],
           "우유와 섞을수록 더 맛있다.", PH / "11.jpg", photo_top=True, focus=0.0),
    k.item(LABEL, 6, N, HANDLE, 4, "호랑이형님",
           ["범표원두 **매장에서 쓰는 메인 원두**예요.",
            "따뜻한 아메리카노로 마시면 **단맛이 풍부**하게 느껴져요."],
           "매장 그 맛을 집에서.", PH / "12.jpg", photo_top=False, focus=1.0),
    k.item(LABEL, 7, N, HANDLE, 5, "인도호랑이",
           ["**인도 원두**가 블렌딩된 캡슐이에요.",
            "누룽지처럼 구수하고, **산미가 없어요**."],
           "산미 없는 커피를 원한다면 보라색 캡슐.", PH / "10.jpg", photo_top=True, focus=0.25),
    k.item(LABEL, 8, N, HANDLE, 6, "디카페인",
           ["카페인은 **97% 빼고**. 커피 맛은 그대로.",
            "저녁 라떼, 밤 아메리카노로 즐겨보세요."],
           "밤에도 커피가 생각날 때.", PH / "10.jpg", photo_top=False, focus=1.0),
    k.quote("로스터의 한 줄",
            ["이 정도면 됐지가", "아니라,", "이 정도까지."],
            "— 김현정 · 범표원두 · 2004년부터",
            ["고소함 · 산미 · 진함 · 매장 맛 · 구수함 · 디카페인", "= 내 취향 한 잔"],
            "저장해두고 캡슐 고를 때 꺼내 보세요", HANDLE),
    k.item(LABEL, 10, N, HANDLE, None, ["멀티팩으로", "내 취향 찾기"],
           ["5종 캡슐을 **2알씩** 맛볼 수 있는 멀티팩.",
            "마셔보고 고르면 실패가 없어요.",
            "주문은 **프로필 링크**에서."],
           "여러분은 몇 번이에요? 댓글로!", PH / "13.jpg", photo_top=True, focus=0.3,
           dark=True, tag="범표원두의 추천", card_h=420),
]
for i, im in enumerate(slides, 1):
    im.save(OUT / f"캡슐가이드_{i:02d}.png", optimize=True)
print("ok", len(slides))

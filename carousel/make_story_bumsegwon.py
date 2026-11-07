"""스토리 캐러셀 "범세권" 11장 (원고: .claude/instagram/story_범세권.md).

usage: python3 make_story_bumsegwon.py OUT_DIR PHOTO_DIR FRAME_DIR
PHOTO_DIR holds 9.jpg ... 18.jpg, FRAME_DIR holds cake.png / dish.png (video frames).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carousel_kit as k  # noqa: E402

k.OUT_SCALE = 2
OUT, PH, FR = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)


def B(text, x, y, size=40, **kw):
    return dict(text=text, x=x, y=y, size=size, **kw)


slides = [
    (FR / "dish.png", 0.5, 0.15, [
        B("카페를 처음 열었을 때요...", .07, .10, 58),
        B("하루 [[12시간]]씩 일했어요", .30, .21, 44),
        B("바 안에서 하루가 다 갔어요 ㅎㅎ", .07, .80, 40),
    ]),
    (PH / "17.jpg", 0.5, 0, [
        B("몸을 갈아 넣는 카페가 아니라\n퇴근하고도 [[저녁이 있는]] 카페", .07, .08, 42, align="center"),
        B("그런 카페를 만들고 싶어서\n[[범표원두 가맹]]을 시작했어요", .07, .76, 42, fill="lime"),
    ]),
    (PH / "15.jpg", 0.5, 0, [
        B("2004년, 대학교 후문 작은 카페", .07, .08, 44),
        B("손님들과 케이크 자르고\n라떼아트 하던 그 시절", .40, .70, 40),
        B("그땐 그게 다인 줄 알았거든요", .07, .86, 40),
    ]),
    (PH / "10.jpg", 0.4, 0.45, [
        B("20년이면 강산이 두 번 변한다는데..", .07, .10, 42),
        B("경기가 바뀌고, 문화가 바뀌고\n정책도 계속 바뀌고", .30, .22, 40),
        B("[[폐업]]까지 고민한 날도 있었어요", .07, .40, 44),
        B("그런데도..", .07, .78, 90, fill="none"),
    ]),
    (FR / "cake.png", 0.5, 0, [
        B("직영 매장 [[3곳]]", .07, .08, 58),
        B("지금까지 버틸 수 있었던 건", .30, .19, 42),
        B("[[변함없이 변화한다]]\n이 한 문장 덕분이었어요", .07, .76, 44, fill="lime"),
    ]),
    (PH / "9.jpg", 0.5, 0.1, [
        B("손님 입맛에 맞는 커피는\n그대로 지키고", .07, .08, 44),
        B("손님이 [[지금]] 원하는 건\n매일 다시 고민했어요", .32, .74, 44),
    ]),
    (PH / "16.jpg", 0.42, 0, [
        B("직접 볶은 원두로", .07, .08, 46),
        B("드립백, 캡슐, 콜드브루, 캔커피까지", .20, .18, 40),
        B("동네에서 마시는 맛있는 커피 +\n[[내 취향 원두를 집에서도]]", .07, .76, 42, fill="lime"),
    ]),
    (PH / "18.jpg", 0.5, 0, [
        B("메뉴 사진 한 장 찍으려고\n[[사진]]을 배우러 다니고", .07, .08, 42),
        B("영상 편집하려고\n[[영상]]도 배우러 다녔어요", .40, .26, 42),
        B("사진 한 장에 2~3시간\n걸린 날도 많았어요 ㅎㅎ", .07, .78, 42),
    ]),
    (PH / "14.jpg", 0.5, 0, [
        B("그 시간을", .07, .08, 60),
        B("이제 대표님들께는\n[[줄여드리고]] 싶어요", .40, .18, 44),
        B("커피는 맛있게, 손님과는 즐겁게\n그 일에만 집중할 수 있도록", .07, .78, 42, fill="lime"),
    ]),
    (PH / "12.jpg", 0.6, 0.15, [
        B("그래서..", .07, .08, 90, fill="none"),
        B("[[범세권]]이 생기면 좋겠어요", .07, .24, 54),
        B("다른 동네에도 범표원두가 생기고\n행복하게 커피 마시는 사람들이\n그런 매장을 운영하는 대표님들이\n더 많아지길 바라요", .20, .62, 40, align="center"),
    ]),
    (PH / "13.jpg", 0.3, 0.25, [
        B("부끄럽지만 제 진심이에요", .22, .08, 44, align="center"),
        B("몸을 갈아 넣는 카페가 아니라\n저녁이 있는 카페\n직접 볶은 커피로\n동네마다 행복한 [[범세권]]", .10, .40, 46, fill="lime", align="center", width=.80),
        B("2004년부터, 범표원두 김현정", .25, .84, 40, align="center"),
    ]),
]
for i, (photo, focus, dim, boxes) in enumerate(slides, 1):
    im = k.story_slide(photo, boxes, focus=focus, dim=dim)
    im.convert("RGB").save(OUT / f"범세권_{i:02d}.jpg", quality=93, subsampling=0)
print("ok", len(slides))

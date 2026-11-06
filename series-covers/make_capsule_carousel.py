"""8-slide carousel (1080x1350): 범표캡슐 6종, 내 취향 찾기."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
S = 2
W, H = 1080 * S, 1350 * S
BG = (28, 45, 47)
CARD = (37, 58, 60)
TAN = (175, 128, 88)
CREAM = (243, 235, 221)
MUTED = (184, 172, 156)
L = 90 * S

CAPSULES = [
    ("조선호랑이", "묵직한 고소함",
     ["범표원두의 기본, 고소한 맛의 정석.", "묵직하고 고소해서 매일 마셔도 질리지 않아요.",
      "경복궁, 덕수궁 안 카페에 들어가는", "바로 그 원두예요!!"],
     "아메리카노, 라떼 모두 OK", "뭘 골라야 할지 모르겠다면 이거부터"),
    ("역삼동호랑이", "산뜻한 산미",
     ["예가체프의 산뜻한 산미가", "매력적인 캡슐이에요.", "모닝 캡슐머신 담당자님 최애!!"],
     "에스프레소 그대로, 아이스 아메리카노", "산미 좋아하는 분, 상큼한 커피 찾는 분"),
    ("범프레소", "다크초콜릿 · 카카오닙 · 구운 아몬드",
     ["다크 로스팅으로 진하고 쌉쌀하게.", "산미는 적게.", "묵직한 바디감에 끝에 단맛이 남아요."],
     "라떼, 아포가토, 바닐라라떼", "진한 커피, 우유와 섞어 마시는 분"),
    ("호랑이형님", "마일드한 커피",
     ["범표원두 매장에서 쓰는 메인 원두예요.", "따뜻한 아메리카노로 마시면",
      "단맛이 풍부하게 느껴져요."],
     "따뜻한 아메리카노", "매장에서 마시던 그 맛을 집에서 찾는 분"),
    ("인도호랑이", "구수한 누룽지",
     ["인도 원두가 블렌딩된 캡슐이에요.", "누룽지처럼 구수하고,", "산미가 없어요."],
     "아메리카노, 라떼", "산미 없는 커피를 원하는 분"),
    ("디카페인", "카페인 97% 제거",
     ["카페인은 97% 빼고.", "커피 맛은 그대로."],
     "저녁 라떼, 밤 아메리카노", "카페인에 예민한 분, 밤에도 커피 생각나는 분"),
]

PICK = [("고소한 맛", "1 조선호랑이"), ("산미 없이 구수하게", "5 인도호랑이"),
        ("산뜻한 산미", "2 역삼동호랑이"), ("진하고 쌉쌀하게", "3 범프레소"),
        ("매장 그 맛, 단맛 풍부하게", "4 호랑이형님"), ("밤에도", "6 디카페인")]


def f(size):
    return ImageFont.truetype(FONT, size * S)


def t(d, xy, s, size, fill, bold=False, anchor="la"):
    d.text(xy, s, font=f(size), fill=fill, anchor=anchor,
           stroke_width=(2 * S) if bold else 0, stroke_fill=fill)


def fit(d, s, size, maxw):
    while d.textlength(s, font=f(size)) > maxw and size > 30:
        size -= 2
    return size


def base(page):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    t(d, (L, 70 * S), "범표캡슐 6종 · 내 취향 찾기", 34, TAN)
    t(d, (W - L, 70 * S), f"{page}/8", 34, TAN, anchor="ra")
    d.line((L, 126 * S, W - L, 126 * S), fill=TAN, width=3 * S)
    return im, d


def capsule_icon(d, cx, cy, r, num):
    # top view of an aluminium capsule: rim, lid, number
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=TAN, width=10 * S)
    r2 = int(r * 0.72)
    d.ellipse((cx - r2, cy - r2, cx + r2, cy + r2), fill=CARD, outline=TAN, width=4 * S)
    t(d, (cx, cy), str(num), int(r * 0.9 / S), TAN, bold=True, anchor="mm")


def cover():
    im, d = base(1)
    t(d, (L, 260 * S), "새벽 4시까지 20캡슐 넘게 내려보고", 40, MUTED)
    t(d, (L, 340 * S), "내 취향", 150, CREAM, bold=True)
    t(d, (L, 520 * S), "캡슐 찾기", 150, CREAM, bold=True)
    t(d, (L, 720 * S), "범표캡슐 6종", 70, TAN, bold=True)
    for i in range(6):
        cx = L + 70 * S + i * 160 * S
        capsule_icon(d, cx, 1000 * S, 62 * S, i + 1)
    t(d, (L, 1170 * S), "옆으로 넘겨보세요 →", 40, CREAM)
    return im


def capsule_slide(i, cap):
    name, tag, lines, how, who = cap
    im, d = base(i + 2)
    capsule_icon(d, W - L - 110 * S, 300 * S, 110 * S, i + 1)
    t(d, (L, 210 * S), name, fit(d, name, 120, 640 * S), CREAM, bold=True)
    t(d, (L, 380 * S), tag, fit(d, tag, 54, 640 * S), TAN, bold=True)
    y = 500 * S
    for line in lines:
        t(d, (L, y), line, fit(d, line, 46, W - 2 * L), CREAM)
        y += 72 * S
    y = max(y + 40 * S, 860 * S)
    for label, text in (("이렇게 드세요", how), ("이런 분께", who)):
        d.rounded_rectangle((L - 24 * S, y, W - L + 24 * S, y + 170 * S), radius=28 * S, fill=CARD)
        t(d, (L, y + 26 * S), label, 34, TAN, bold=True)
        t(d, (L, y + 84 * S), text, fit(d, text, 44, W - 2 * L), CREAM)
        y += 196 * S
    return im


def pick_slide():
    im, d = base(8)
    t(d, (L, 190 * S), "한눈에 고르기", 96, CREAM, bold=True)
    y = 360 * S
    for want, cap in PICK:
        d.rounded_rectangle((L - 24 * S, y, W - L + 24 * S, y + 112 * S), radius=24 * S, fill=CARD)
        t(d, (L, y + 32 * S), want, 42, CREAM)
        t(d, (W - L, y + 28 * S), cap, 46, TAN, bold=True, anchor="ra")
        y += 128 * S
    t(d, (L, y + 50 * S), "범표캡슐 주문은 프로필 링크에서", 48, TAN, bold=True)
    t(d, (L, y + 130 * S), "알루미늄 캡슐 · @bumpyobeans", 36, MUTED)
    return im


OUT.mkdir(parents=True, exist_ok=True)
slides = [cover()] + [capsule_slide(i, c) for i, c in enumerate(CAPSULES)] + [pick_slide()]
for n, im in enumerate(slides, 1):
    im.resize((1080, 1350), Image.LANCZOS).save(OUT / f"캡슐6종_{n}.png", optimize=True)
print("ok", len(slides))

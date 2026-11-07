"""8-slide carousel (1080x1350): 범표캡슐 6종, 내 취향 찾기."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

OUT = Path(sys.argv[1])
PHOTOS = Path(sys.argv[2]) if len(sys.argv) > 2 else None   # folder with 9.jpg ... 13.jpg
# (photo, horizontal focus 0..1) per slide; None keeps the plain background
# capsule colours: 역삼동호랑이 = green, 인도호랑이 = purple. Other slides avoid
# showing a green or purple capsule so no colour points at the wrong flavour.
BACKS = [("9.jpg", 0.5),            # cover: all colours
         ("11.jpg", 0.5),           # 조선호랑이
         ("9.jpg", 0.0),            # 역삼동호랑이: green capsule + iced americano
         ("11.jpg", 0.0),           # 범프레소: tiramisu
         ("12.jpg", 1.0),           # 호랑이형님: no capsule in view
         ("10.jpg", 0.25),          # 인도호랑이: purple capsule + espresso
         ("10.jpg", 1.0),           # 디카페인: no capsule in view
         ("13.jpg", 0.3)]           # pick list, blurred
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


def photo_bg(name, focus, blur=0, clear_top=0.0):
    """Photo fills the slide; the brand colour washes over it.

    clear_top: fraction of the height (from the top) kept nearly clear so the
    photo itself shows; below it the wash ramps up to near-solid for text.
    """
    img = ImageOps.exif_transpose(Image.open(PHOTOS / name)).convert("RGB")
    s = max(W / img.width, H / img.height)
    img = img.resize((int(img.width * s) + 1, int(img.height * s) + 1), Image.LANCZOS)
    x = int((img.width - W) * focus)
    y = (img.height - H) // 2
    img = img.crop((x, y, x + W, y + H))
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur * S))
    shade = Image.new("L", (W, H))
    sd = ImageDraw.Draw(shade)
    for yy in range(H):
        if clear_top:
            a0, ramp = H * clear_top, H * 0.12
            v = 30 if yy < a0 else 30 + 215 * min(1, (yy - a0) / ramp)
            v = max(v, 190 * (1 - yy / (200 * S)))   # keep the header line readable
        else:
            v = 170
        sd.line((0, yy, W, yy), fill=int(v))
    return Image.composite(Image.new("RGB", (W, H), BG), img, shade)


def base(page):
    if PHOTOS:
        name, focus = BACKS[page - 1]
        clear = 0.36 if 2 <= page <= 7 else 0.0
        im = photo_bg(name, focus, blur=6 if page == 8 else 0, clear_top=clear)
    else:
        im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im, "RGBA")
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
    top = 560 * S                                   # photo shows above this
    capsule_icon(d, W - L - 80 * S, top + 70 * S, 80 * S, i + 1)
    t(d, (L, top), name, fit(d, name, 110, 700 * S), CREAM, bold=True)
    t(d, (L, top + 140 * S), tag, fit(d, tag, 50, 760 * S), TAN, bold=True)
    y = top + 230 * S
    for line in lines:
        t(d, (L, y), line, fit(d, line, 40, W - 2 * L), CREAM)
        y += 58 * S
    y = H - 300 * S
    d.rounded_rectangle((L - 24 * S, y, W - L + 24 * S, y + 250 * S), radius=28 * S, fill=CARD + (215,))
    for k, (label, text) in enumerate((("이렇게 드세요", how), ("이런 분께", who))):
        yy = y + 24 * S + k * 116 * S
        t(d, (L, yy), label, 30, TAN, bold=True)
        t(d, (L, yy + 44 * S), text, fit(d, text, 40, W - 2 * L), CREAM)
    return im


def pick_slide():
    im, d = base(8)
    t(d, (L, 190 * S), "한눈에 고르기", 96, CREAM, bold=True)
    y = 360 * S
    for want, cap in PICK:
        d.rounded_rectangle((L - 24 * S, y, W - L + 24 * S, y + 112 * S), radius=24 * S, fill=CARD + (215,))
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

"""Reel covers for the "드립백 일기" daily series, 1080x1920.

Everything that matters sits inside the centre 1080x1350 band, which is what the
profile grid shows. Run with an output folder; it writes one cover per day in
DAYS plus a blank template with no day or title.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"

S = 2                                  # supersample
W, H = 1080 * S, 1920 * S
BG = (28, 45, 47)
TAN = (175, 128, 88)
CREAM = (243, 235, 221)
GRID_TOP, GRID_BOTTOM = 285 * S, 1635 * S   # 4:5 band the grid shows

DAYS = [
    "오늘부터, 매일.",
    "드립백을 처음 만든 날",
    "그냥 붓지 마세요",
    "드립백 포장하는 날",
    "이 후기 보고 울컥",
    "10g인 이유",
    "한 봉지에 한 줄",
    "망쳤던 첫 드립백",
    "드립백 vs 캡슐 vs 가루",
    "드립백 들고 어디까지",
    "내일, 수서역점 오픈",
    "수서역점 첫날",
    "두 번 우려도 돼요?",
    "수능 보는 너에게",
]


def font(size):
    return ImageFont.truetype(FONT, size * S)


def fit(d, text, size, maxw):
    while d.textlength(text, font=font(size)) > maxw and size > 40:
        size -= 2
    return font(size)


def dripbag(d, cx, top, scale=1.0):
    """Line drawing: a drip bag hung on a cup, coffee dripping."""
    u = S * scale
    lw = int(16 * u)
    # cup
    cl, cr, ct, cb = cx - 150 * u, cx + 150 * u, top + 260 * u, top + 470 * u
    d.rounded_rectangle((cl, ct, cr, cb), radius=int(40 * u), outline=TAN, width=lw)
    d.rectangle((cl - lw, ct - lw, cr + lw, ct + 20 * u), fill=BG)
    d.line((cl - 25 * u, ct, cr + 25 * u, ct), fill=TAN, width=lw)
    d.arc((cr - 30 * u, ct + 40 * u, cr + 90 * u, ct + 160 * u), -90, 90, fill=TAN, width=lw)
    # filter bag
    bag = [(cx - 120 * u, top + 40 * u), (cx + 120 * u, top + 40 * u),
           (cx + 95 * u, top + 230 * u), (cx - 95 * u, top + 230 * u)]
    d.polygon(bag, outline=CREAM, width=lw)
    d.line((cx - 120 * u, top + 100 * u, cx + 120 * u, top + 100 * u), fill=CREAM, width=lw // 2)
    # hanger arms over the rim
    for sgn in (-1, 1):
        x0 = cx + sgn * 110 * u
        d.line((x0, top + 60 * u, cx + sgn * 175 * u, ct - 10 * u), fill=CREAM, width=lw)
    # drops
    for k, y in enumerate((top + 258 * u, top + 300 * u)):
        r = (9 - 3 * k) * u
        d.ellipse((cx - r, y - r, cx + r, y + r), fill=TAN)


def cover(day, title):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    L = 90 * S

    y = GRID_TOP + 70 * S
    d.text((L, y), "범표원두 · 드립백 일기", font=font(44), fill=TAN)
    d.line((L, y + 76 * S, W - L, y + 76 * S), fill=TAN, width=3 * S)

    y += 130 * S
    if day is not None:
        d.text((L, y), "Day", font=font(90), fill=CREAM, stroke_width=2 * S, stroke_fill=CREAM)
        d.text((L, y + 90 * S), f"{day:02d}", font=font(260), fill=TAN,
               stroke_width=4 * S, stroke_fill=TAN)

    dripbag(d, W - 300 * S, GRID_TOP + 260 * S, scale=1.05)

    if title:
        f = fit(d, title, 110, W - 2 * L)
        ty = GRID_BOTTOM - 330 * S
        d.text((L, ty), title, font=f, fill=CREAM, stroke_width=2 * S, stroke_fill=CREAM)

    d.text((L, GRID_BOTTOM - 120 * S), "@bumpyobeans", font=font(40), fill=TAN)
    return im.resize((1080, 1920), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
cover(None, "").save(OUT / "00_빈템플릿.png", optimize=True)
for i, title in enumerate(DAYS, 1):
    cover(i, title).save(OUT / f"day{i:02d}.png", optimize=True)
print("ok", len(DAYS) + 1, "covers")

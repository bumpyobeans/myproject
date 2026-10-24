"""One-page store guide story for @bumpyobeans, 1080x1920."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(sys.argv[1])
FONT = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"

BG = (28, 45, 47)
CARD = (37, 58, 60)
TAN = (175, 128, 88)
CREAM = (243, 235, 221)
MUTED = (184, 172, 156)

W, H = 1080, 1920
SAFE_TOP, SAFE_BOTTOM = 250, 1670     # story UI covers outside this band
PAD = 72

STORES = [
    ("역삼점", "서울 강남", "테헤란로 뒷골목 숨은 라떼집",
     ["월–금 10:00–19:00 · 토 휴무"]),
    ("갈매점", "경기 구리", "로스팅 공장 바로 옆, 원두는 여기 다 있음",
     ["월–금 10:00–18:00 · 토 휴무"]),
    ("별내 하나로마트점", "경기 남양주", "연중무휴 · 주차 250대 · 음료 사면 2시간 무료",
     ["매일 10:00–19:00"]),
    ("다산 정약용도서관점", "경기 남양주", "가맹 1호점 · 일요일은 점주님도 쉽니다",
     ["월–금 08:00–19:00", "토·공휴일 10:00–19:00 · 일 휴무"]),
]


def f(size):
    return ImageFont.truetype(FONT, size)


def text(d, xy, s, size, fill, bold=False, anchor="la"):
    d.text(xy, s, font=f(size), fill=fill, anchor=anchor,
           stroke_width=1 if bold else 0, stroke_fill=fill)


im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)

y = SAFE_TOP + 10
text(d, (PAD, y), "@bumpyobeans", 34, TAN)
y += 62
text(d, (PAD, y), "범표원두, 어디서 마실까?", 76, CREAM, bold=True)
y += 130

NAME, SUB, DESC, HOURS = 48, 30, 31, 34
for name, region, desc, hours in STORES:
    h = 34 + NAME + 22 + DESC + 20 + len(hours) * (HOURS + 14) + 26
    d.rounded_rectangle((PAD - 20, y, W - PAD + 20, y + h), radius=28, fill=CARD)
    cy = y + 32
    text(d, (PAD + 12, cy), name, NAME, TAN, bold=True)
    nw = d.textlength(name, font=f(NAME))
    text(d, (PAD + 12 + nw + 18, cy + NAME - SUB - 2), region, SUB, MUTED)
    cy += NAME + 22
    text(d, (PAD + 12, cy), desc, DESC, CREAM)
    cy += DESC + 20
    for line in hours:
        text(d, (PAD + 12, cy), line, HOURS, CREAM, bold=True)
        cy += HOURS + 14
    y += h + 22

# nationwide delivery
y += 8
d.line((PAD, y, W - PAD, y), fill=TAN, width=3)
y += 30
text(d, (PAD, y), "전국 택배", 44, TAN, bold=True)
text(d, (PAD + 220, y + 6), "오후 2시 전 주문 → 당일 로스팅 출고", 34, CREAM, bold=True)
y += 70
text(d, (PAD, y), "주문은 프로필 링크에서", 32, MUTED)

assert y + 40 <= SAFE_BOTTOM, f"content runs into the bottom UI: {y}"
im.save(OUT, optimize=True)
print("ok", OUT, im.size, "last y", y + 40)

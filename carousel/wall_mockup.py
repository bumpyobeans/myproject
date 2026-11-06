"""Put four posters into the A1 frames of the wall elevation drawing.

usage: python3 wall_mockup.py DRAWING OUT P1 P2 P3 P4
A poster path may be "story" to draw the brand-story text poster.
Posters fill only the white area of each frame, so the seated figures in the
drawing stay in front of them.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

FONTS = Path(__file__).resolve().parent.parent / "fonts"
DRAW, OUT = sys.argv[1], sys.argv[2]
POSTERS = sys.argv[3:7]
FRAMES_X = [(121, 350), (492, 721), (864, 1094), (1238, 1468)]
TOP = 135
BROWN = (150, 112, 80)
CREAM = (250, 244, 236)


def font(w, s):
    return ImageFont.truetype(str(FONTS / f"Pretendard-{w}.otf"), s)


def story_poster(w=1189, h=1682):
    """Brand story, A1 ratio. Important lines in the top two thirds."""
    im = Image.new("RGB", (w, h), BROWN)
    d = ImageDraw.Draw(im)
    d.text((w // 2, 230), "S I N C E   2 0 0 4", font=font("Regular", 54), fill=CREAM, anchor="mm")
    d.text((w // 2, 420), "대학교 후문", font=font("ExtraBold", 150), fill=CREAM, anchor="mm")
    d.text((w // 2, 600), "작은 카페에서", font=font("ExtraBold", 150), fill=CREAM, anchor="mm")
    d.line((w // 2 - 80, 740, w // 2 + 80, 740), fill=CREAM, width=4)
    for i, line in enumerate(["2005년부터 직접 볶은 원두로", "경복궁 · 덕수궁 · 창경궁", "4년 연속 원두 납품"]):
        d.text((w // 2, 830 + i * 82), line, font=font("Regular", 56), fill=CREAM, anchor="mm")
    d.text((w // 2, h - 140), "범표원두  COFFEE FACTORY", font=font("Bold", 52), fill=CREAM, anchor="mm")
    return im


def menu3_poster(photo, w=1189, h=1682):
    """Wide 3-menu photo kept whole, with a line above and the names below."""
    im = Image.new("RGB", (w, h), BROWN)
    d = ImageDraw.Draw(im)
    d.text((w // 2, 200), "한 잔?  두 잔?", font=font("ExtraBold", 120), fill=CREAM, anchor="mm")
    d.text((w // 2, 350), "그럼, 세 잔!", font=font("ExtraBold", 120), fill=CREAM, anchor="mm")
    ph = Image.open(photo).convert("RGB")
    ph = ImageOps.fit(ph, (w, int(w * 0.72)), Image.LANCZOS)
    im.paste(ph, (0, 470))
    y = 470 + ph.height + 90
    d.text((w // 2, y), "범표라떼 · 흑당카페라떼 · 아이스크림라떼", font=font("Bold", 56), fill=CREAM, anchor="mm")
    d.text((w // 2, h - 140), "범표원두  COFFEE FACTORY", font=font("Bold", 52), fill=CREAM, anchor="mm")
    return im


def frame_mask(gray, x0, x1):
    """White region connected to the top of the frame, bounded by drawn lines."""
    bw = gray.point(lambda v: 255 if v > 170 else 0)
    # wipe the placeholder text so it does not punch holes in the poster
    ImageDraw.Draw(bw).rectangle((x0 + 4, 240, x1 - 4, 330), fill=255)
    seed = ((x0 + x1) // 2, TOP + 20)
    ImageDraw.floodfill(bw, seed, 128)
    m = bw.point(lambda v: 255 if v == 128 else 0)
    m = m.filter(ImageFilter.MaxFilter(3))              # cover anti-aliased edges
    return m


base = Image.open(DRAW).convert("RGB")
gray = base.convert("L")
out = base.copy()
for (x0, x1), src in zip(FRAMES_X, POSTERS):
    m = frame_mask(gray, x0, x1)
    bbox = m.getbbox()
    fx0, fy0, fx1, fy1 = x0, TOP, x1 + 1, bbox[3]
    if src == "story":
        poster = story_poster()
    elif src.startswith("menu3:"):
        poster = menu3_poster(src[6:])
    else:
        poster = Image.open(src).convert("RGB")
    poster = ImageOps.fit(poster, (fx1 - fx0, fy1 - fy0), Image.LANCZOS, centering=(0.5, 0.4))
    layer = Image.new("RGB", base.size)
    layer.paste(poster, (fx0, fy0))
    out = Image.composite(layer, out, m)
out = out.resize((out.width * 2, out.height * 2), Image.LANCZOS)
out.save(OUT)
print("ok", OUT)

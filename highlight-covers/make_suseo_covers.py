"""Highlight covers for @bumpyobeans_suseo, reusing the main account's icon set."""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

src = (Path(__file__).parent / "make_covers.py").read_text(encoding="utf-8")
sys.argv = [sys.argv[0], sys.argv[1]]
exec(src[:src.index("COVERS = [")])          # canvas, line, rrect, pin_icon, gift_icon, ...


def cup_icon():
    im, d = canvas()
    l, r, t, b = CX - 190 * U, CX + 150 * U, CY - 120 * U, CY + 200 * U
    d.rounded_rectangle((l, t, r, b), radius=40 * U, outline=FG, width=LW)
    d.rectangle((l - LW, t - LW // 2, r + LW, t + 30 * U), fill=BG)   # open top
    line(d, [(l - 30 * U, t), (r + 30 * U, t)])
    d.arc((r - 40 * U, CY - 60 * U, r + 130 * U, CY + 110 * U), -90, 90, fill=FG, width=LW)
    for dx in (-90, 0, 90):                      # steam
        x = CX - 20 * U + dx * U
        pts = [(x + 22 * U * math.sin(k / 10 * math.pi), t - 60 * U - k * 13 * U) for k in range(11)]
        line(d, pts, w=LW * 2 // 3)
    line(d, [(l - 60 * U, b + 60 * U), (r + 90 * U, b + 60 * U)])   # saucer
    return im


def open_icon():
    im, d = canvas()
    # a hanging OPEN sign
    l, r, t, b = CX - 260 * U, CX + 260 * U, CY - 40 * U, CY + 200 * U
    rrect(d, (l, t, r, b), 30 * U)
    line(d, [(l + 80 * U, t), (CX, CY - 230 * U), (r - 80 * U, t)])
    r0 = 26 * U
    d.ellipse((CX - r0, CY - 230 * U - r0, CX + r0, CY - 230 * U + r0), fill=FG)
    from PIL import ImageFont
    f = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 150 * U)
    d.text((CX, (t + b) // 2), "OPEN", font=f, fill=FG, anchor="mm",
           stroke_width=6 * U, stroke_fill=FG)
    return im


OUT.mkdir(parents=True, exist_ok=True)
for name, fn in [("수서_1_오픈소식", open_icon), ("수서_2_위치", pin_icon), ("수서_3_메뉴", cup_icon)]:
    fn().resize((1080, 1920), Image.LANCZOS).save(OUT / f"{name}.png", optimize=True)
print("ok")

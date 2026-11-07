"""Highlight covers for @bumpyobeans: 1080x1920, icon inside the centre circle."""
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

S = 4                      # supersample for smooth edges
W, H = 1080 * S, 1920 * S
CX, CY = W // 2, H // 2
BG = (28, 45, 47)          # logo dark
FG = (175, 128, 88)        # logo tan
LW = 30 * S                # stroke width
U = S                      # 1px at output scale


def canvas():
    im = Image.new("RGB", (W, H), BG)
    return im, ImageDraw.Draw(im)


def line(d, pts, w=LW):
    d.line(pts, fill=FG, width=w, joint="curve")
    r = w // 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=FG)


def rrect(d, box, r, w=LW):
    d.rounded_rectangle(box, radius=r, outline=FG, width=w)


def teardrop(cx, cy, R, tip_y):
    a = math.asin(R / (tip_y - cy))
    pts = [(cx + R * math.cos(math.pi / 2 + a + (2 * math.pi - 2 * a) * i / 360),
            cy + R * math.sin(math.pi / 2 + a + (2 * math.pi - 2 * a) * i / 360))
           for i in range(361)]
    return pts + [(cx, tip_y)]


def box_icon():
    im, d = canvas()
    l, t, r, b = CX - 240 * U, CY - 190 * U, CX + 240 * U, CY + 220 * U
    rrect(d, (l, t, r, b), 28 * U)
    # lid seam and tape across it
    line(d, [(l, t + 120 * U), (r, t + 120 * U)])
    d.rectangle((CX - 50 * U, t, CX + 50 * U, t + 120 * U), fill=FG)
    # shipping label
    rrect(d, (r - 190 * U, b - 140 * U, r - 50 * U, b - 50 * U), 10 * U, w=LW * 2 // 3)
    return im


def pin_icon():
    im, d = canvas()
    R, cy, tip = 200 * U, CY - 70 * U, CY + 300 * U
    d.polygon(teardrop(CX, cy, R, tip), fill=FG)
    d.polygon(teardrop(CX, cy, R - LW, tip - int(LW * 1.9)), fill=BG)
    r2 = 72 * U
    d.ellipse((CX - r2, cy - r2, CX + r2, cy + r2), outline=FG, width=LW)
    return im


def gift_icon():
    im, d = canvas()
    l, r = CX - 220 * U, CX + 220 * U
    lid_t, lid_b = CY - 90 * U, CY + 10 * U
    rrect(d, (l - 25 * U, lid_t, r + 25 * U, lid_b), 18 * U)
    rrect(d, (l, lid_b, r, CY + 250 * U), 18 * U)
    line(d, [(CX, lid_t), (CX, CY + 250 * U)])
    # bow
    for sgn in (-1, 1):
        x0 = CX + sgn * 10 * U
        x1 = CX + sgn * 150 * U
        bx = (min(x0, x1), lid_t - 150 * U, max(x0, x1), lid_t)
        d.ellipse(bx, outline=FG, width=LW)
    return im


def bean_icon():
    im, d = canvas()
    rot = math.radians(-35)
    a, b = 175 * U, 255 * U

    def tf(x, y):
        return (CX + x * math.cos(rot) - y * math.sin(rot),
                CY + x * math.sin(rot) + y * math.cos(rot))

    outline = [tf(a * math.cos(t), b * math.sin(t))
               for t in [2 * math.pi * i / 400 for i in range(401)]]
    d.line(outline, fill=FG, width=LW, joint="curve")
    crease = [tf(45 * U * math.sin(math.pi * k / 60 * 2), -b * 0.82 + (2 * b * 0.82) * k / 60)
              for k in range(61)]
    line(d, crease)
    return im


def review_icon():
    im, d = canvas()
    l, t, r, b = CX - 260 * U, CY - 230 * U, CX + 260 * U, CY + 130 * U
    d.rounded_rectangle((l, t, r, b), radius=70 * U, fill=FG)
    d.polygon([(CX - 150 * U, b - 40 * U), (CX - 170 * U, b + 140 * U), (CX + 10 * U, b - 40 * U)], fill=FG)
    d.rounded_rectangle((l + LW, t + LW, r - LW, b - LW), radius=70 * U - LW, fill=BG)
    d.polygon([(CX - 120 * U, b - LW - 2 * U), (CX - 135 * U, b + 55 * U), (CX - 40 * U, b - LW - 2 * U)], fill=BG)
    cy = (t + b) // 2
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rr = 110 * U if i % 2 == 0 else 46 * U
        pts.append((CX + rr * math.cos(ang), cy + 8 * U + rr * math.sin(ang)))
    d.polygon(pts, fill=FG)
    return im


def store_icon():
    im, d = canvas()
    l, r = CX - 250 * U, CX + 250 * U
    top = CY - 200 * U
    awn_b = CY - 60 * U
    # awning band and scallops
    line(d, [(l - 20 * U, top), (r + 20 * U, top)])
    n = 5
    step = (r - l + 40 * U) / n
    for i in range(n):
        x0 = l - 20 * U + i * step
        d.arc((x0, awn_b - step / 2 - 10 * U, x0 + step, awn_b + step / 2 - 10 * U),
              0, 180, fill=FG, width=LW)
        line(d, [(x0, top), (x0, awn_b - 10 * U)], w=LW)
    line(d, [(r + 20 * U, top), (r + 20 * U, awn_b - 10 * U)])
    # walls, floor
    base = CY + 260 * U
    line(d, [(l, awn_b + 60 * U), (l, base), (r, base), (r, awn_b + 60 * U)])
    # door
    rrect(d, (CX - 75 * U, CY + 70 * U, CX + 75 * U, base), 12 * U)
    # plus sign (opening a new store)
    px, py = r - 90 * U, CY + 120 * U
    line(d, [(px - 50 * U, py), (px + 50 * U, py)])
    line(d, [(px, py - 50 * U), (px, py + 50 * U)])
    return im


COVERS = [
    ("1_택배주문", box_icon),
    ("2_매장안내", pin_icon),
    ("3_선물단체", gift_icon),
    ("4_원두소개", bean_icon),
    ("5_후기", review_icon),
    ("6_가맹문의", store_icon),
]

thumbs = []
for name, fn in COVERS:
    im = fn().resize((1080, 1920), Image.LANCZOS)
    im.save(OUT / f"{name}.png", optimize=True)
    # what the circle shows: centre square
    sq = im.crop((0, 420, 1080, 1500)).resize((300, 300), Image.LANCZOS)
    mask = Image.new("L", (300 * 4, 300 * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 1199, 1199), fill=255)
    mask = mask.resize((300, 300), Image.LANCZOS)
    thumbs.append((name.split("_", 1)[1], sq, mask))

# preview sheet, roughly as the profile shows them
sheet = Image.new("RGB", (6 * 340 + 40, 420), (255, 255, 255))
from PIL import ImageFont
font = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 34)
sd = ImageDraw.Draw(sheet)
for i, (label, sq, mask) in enumerate(thumbs):
    x = 40 + i * 340
    sd.ellipse((x - 8, 32, x + 308, 348), outline=(210, 210, 210), width=4)
    sheet.paste(sq, (x, 40), mask)
    w = sd.textlength(label, font=font)
    sd.text((x + 150 - w / 2, 362), label, fill=(20, 20, 20), font=font)
sheet.save(OUT / "미리보기.png")
print("ok", sorted(p.name for p in OUT.iterdir()))

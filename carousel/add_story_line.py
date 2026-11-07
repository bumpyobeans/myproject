"""Add one story line (on a soft dark band) to a poster, in its upper part.

usage: python3 add_story_line.py IN OUT Y "line one" ["line two"]
Y is the top of the band as a fraction of the poster height.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FONTS = Path(__file__).resolve().parent.parent / "fonts"
src, out, y_frac, lines = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4:]
im = Image.open(src).convert("RGB")
W, H = im.size
f = ImageFont.truetype(str(FONTS / "Pretendard-Bold.otf"), int(W * 0.055))
lh = int(f.size * 1.4)
pad = int(W * 0.04)
x0 = int(W * 0.09)
y0 = int(H * y_frac)
d = ImageDraw.Draw(im, "RGBA")
tw = max(d.textlength(t, font=f) for t in lines)
d.rounded_rectangle((x0 - pad, y0 - pad // 2, x0 + tw + pad, y0 + lh * len(lines) + pad // 2),
                    radius=pad, fill=(20, 20, 20, 150))
for i, t in enumerate(lines):
    d.text((x0, y0 + i * lh), t, font=f, fill=(250, 244, 236))
im.save(out)
print("ok", out)

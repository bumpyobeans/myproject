"""Three pinned-post covers: "다산정약용도서관점 잘 이용하는 법" (2160x2700).

usage: python3 make_dasan_pins.py OUT_DIR UPLOAD_DIR PHOTO_DIR
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carousel_kit as k  # noqa: E402

k.OUT_SCALE = 2

OUT, UP, PH = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
TMP = OUT / "_src"
TMP.mkdir(exist_ok=True)
HANDLE = "@bumpyobeans_dasan"
TAG = "다산정약용도서관점 잘 이용하는 법 · {:02d}"


def crop(src, box, name):
    p = TMP / name
    Image.open(src).convert("RGB").crop(box).save(p)
    return p


# photo areas only, away from text printed on the source images


def cup_on_brown(cutout, name):
    """Brand drip-coffee cup (from Google Drive, transparent PNG) on a warm brown backdrop."""
    W, H = 1800, 2250
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / H
        d.line((0, y, W, y), fill=(int(176 - 60 * t), int(134 - 50 * t), int(96 - 38 * t)))
    cup = Image.open(cutout).convert("RGBA")
    cw = 1350
    cup = cup.resize((cw, cw), Image.LANCZOS)
    x, y = (W - cw) // 2, 330
    shadow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shadow).ellipse((x + 120, y + cw - 260, x + cw - 120, y + cw + 40), fill=150)
    bg.paste((40, 25, 15), (0, 0), shadow.filter(ImageFilter.GaussianBlur(60)))
    bg.paste(cup, (x, y), cup)
    p = TMP / name
    bg.save(p)
    return p


handdrip = cup_on_brown(Path(__file__).resolve().parent / "assets" / "drive_드립커피.png", "handdrip.png")
latte = crop(UP / "013a501a-image.jpg", (0, 2300, 2268, 5135), "latte.png")

pins = [
    k.cover(PH / "12.jpg", TAG.format(1), ["책 한 권,", "커피 한 잔,", "오늘은 여유!!"],
            "도서관 바로 길 건너, 맞은편 카페", HANDLE, "월–금 08–19 · 주말 10–19",
            focus=0.5, underline=()),
    k.cover(handdrip, TAG.format(2), ["핸드드립", "맛집이라", "소문났어요!!"],
            "드립 커피 손님이 가장 많은 매장", HANDLE, "직접 볶으니까, 원두도 라떼도 맛있어요",
            focus=0.5, underline=()),
    k.cover(latte, TAG.format(3), ["원두 사면,", "음료 한 잔", "2,000원 할인!!"],
            "원두 1봉당 음료 1잔", HANDLE, "주말 · 공휴일에도 10–19 열어요",
            focus=0.5, underline=()),
]
for i, im in enumerate(pins, 1):
    im.save(OUT / f"다산_고정_{i}.png", optimize=True)
    im.convert("RGB").save(OUT / f"다산_고정_{i}.jpg", quality=95, subsampling=0)
print("ok", len(pins))

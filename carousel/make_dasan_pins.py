"""Three pinned-post covers: "다산정약용도서관점 잘 이용하는 법" (2160x2700).

usage: python3 make_dasan_pins.py OUT_DIR UPLOAD_DIR PHOTO_DIR
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carousel_kit as k  # noqa: E402

k.OUT_SCALE = 2

OUT, UP, PH = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
TMP = OUT / "_src"
TMP.mkdir(exist_ok=True)
HANDLE = "@bumpyobeans"
TAG = "다산정약용도서관점 잘 이용하는 법 · {:02d}"


def crop(src, box, name):
    p = TMP / name
    Image.open(src).convert("RGB").crop(box).save(p)
    return p


# photo areas only, away from text printed on the source images
dripbags = crop(UP / "12f86e0d-image.jpg", (390, 345, 1044, 1163), "dripbags.png")
latte = crop(UP / "013a501a-image.jpg", (0, 2300, 2268, 5135), "latte.png")

pins = [
    k.cover(PH / "12.jpg", TAG.format(1), ["책 한 권,", "커피 한 잔,", "오늘은 여유!!"],
            "도서관 안 카페, 범표원두", HANDLE, "월–금 08–19 · 주말 10–19",
            focus=0.5, underline=()),
    k.cover(dripbags, TAG.format(2), ["핸드드립", "맛집이라", "소문났어요!!"],
            "드립 커피 손님이 가장 많은 매장", HANDLE, "범표원두 가맹 1호점",
            focus=0.5, underline=()),
    k.cover(latte, TAG.format(3), ["주말에도", "문 열어요!!"],
            "토 · 일 · 공휴일 10:00–19:00", HANDLE, "평일 08:00–19:00",
            focus=0.5, underline=()),
]
for i, im in enumerate(pins, 1):
    im.save(OUT / f"다산_고정_{i}.png", optimize=True)
    im.convert("RGB").save(OUT / f"다산_고정_{i}.jpg", quality=95, subsampling=0)
print("ok", len(pins))

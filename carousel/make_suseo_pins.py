"""Three pinned-post covers for @bumpyobeans_suseo: "수서역점 잘 이용하는 법".

usage: python3 make_suseo_pins.py OUT_DIR UPLOAD_DIR PHOTO_DIR
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import carousel_kit as k  # noqa: E402

k.OUT_SCALE = 2                          # 2160x2700, download quality

OUT, UP, PH = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
TMP = OUT / "_src"
TMP.mkdir(exist_ok=True)
HANDLE = "@bumpyobeans_suseo"
TAG = "수서역점 잘 이용하는 법 · {:02d}"


def crop(src, box, name):
    p = TMP / name
    Image.open(src).convert("RGB").crop(box).save(p)
    return p


# photos cropped away from the text already printed on the source posters
bag = crop(UP / "5afba0ff-image.png", (445, 668, 1876, 2456), "bag.png")
cans = crop(UP / "e033888f-image.png", (366, 1113, 1956, 3100), "cans.png")

pins = [
    (k.cover(bag, TAG.format(1), ["사무실 원두,", "이제 걱정마!!"],
             "원두 1봉 사면 음료 1잔 2,000원 할인", HANDLE,
             "범딱지 5개 = 200g 1봉 무료", focus=0.5, underline=(0,)), True),
    (k.cover(cans, TAG.format(2), ["라떼맛집", "기다렸어?!", "이제 걱정마!!"],
             "궁극의 고소함, 범표라떼", HANDLE,
             "평일 07–20 · 주말 09–20", focus=0.5, underline=(0,)), False),
    (k.cover(PH / "13.jpg", TAG.format(3), ["내 취향 원두,", "집에서도!!", "이제 걱정마!!"],
             "원두 · 드립백 · 캡슐 6종", HANDLE,
             "오후 2시 전 주문 당일 로스팅", focus=0.5, underline=()), False),
]

sticker = Image.open(UP / "490650c6-image.png").convert("RGBA")
sw = 300 * k.OUT_SCALE
sticker = sticker.resize((sw, int(sw * sticker.height / sticker.width)), Image.LANCZOS)
for i, (im, with_sticker) in enumerate(pins, 1):
    if with_sticker:
        im.paste(sticker, (im.width - sw - 50 * k.OUT_SCALE, 120 * k.OUT_SCALE), sticker)
    im.save(OUT / f"수서_고정_{i}.png", optimize=True)
    im.convert("RGB").save(OUT / f"수서_고정_{i}.jpg", quality=95, subsampling=0)
print("ok", len(pins))

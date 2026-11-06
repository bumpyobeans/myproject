"""범표원두 기본 캐러셀 스타일: 깔끔한 크림 배경 + 사진 카드 (1080x1350).

Style notes live in .claude/instagram/carousel_style.md. Every slide builder
returns a PIL image at 1080x1350. Body text accepts **bold** markup and an
optional highlight line (yellow marker underneath).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

FONTS = Path(__file__).resolve().parent.parent / "fonts"
S = 2                                   # supersample
W, H = 1080 * S, 1350 * S
M = 64 * S                              # side margin

CREAM = (246, 241, 235)
INK = (22, 22, 22)
SUB = (92, 92, 92)
LINE = (226, 220, 212)
ACCENT = (175, 128, 88)                 # 범표 갈색 (header square)
MARK = (251, 227, 160)                  # highlighter yellow
DARK = (28, 45, 47)                     # 범표 진한 색 (bottom bar, dark slides)
WHITE = (255, 255, 255)


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f"Pretendard-{weight}.otf"), size * S)


def _canvas(bg=CREAM):
    im = Image.new("RGB", (W, H), bg)
    return im, ImageDraw.Draw(im, "RGBA")


def _finish(im):
    return im.resize((1080, 1350), Image.LANCZOS)


def _cover_crop(img, w, h, focus=0.5):
    img = ImageOps.exif_transpose(img).convert("RGB")
    s = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * s) + 1, int(img.height * s) + 1), Image.LANCZOS)
    x = int((img.width - w) * focus)
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def _photo_card(im, path, box, focus=0.5, credit=None):
    x0, y0, x1, y1 = box
    ph = _cover_crop(Image.open(path), x1 - x0, y1 - y0, focus)
    mask = Image.new("L", ph.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *ph.size), radius=30 * S, fill=255)
    im.paste(ph, (x0, y0), mask)
    if credit:
        d = ImageDraw.Draw(im, "RGBA")
        f = font("Bold", 22)
        d.text((x1 - 26 * S, y1 - 22 * S), credit, font=f, fill=WHITE, anchor="rd",
               stroke_width=2 * S, stroke_fill=(0, 0, 0, 120))


def _header(d, label, page, total, dark=False):
    fg = WHITE if dark else INK
    d.rectangle((M, 74 * S, M + 22 * S, 96 * S), fill=ACCENT)
    d.text((M + 36 * S, 85 * S), label, font=font("Bold", 30), fill=fg, anchor="lm")
    if page:
        d.text((W - M, 85 * S), f"{page:02d} / {total:02d}", font=font("Bold", 30),
               fill=(150, 150, 150) if dark else SUB, anchor="rm")


def _footer(d, handle, nxt=True, dark=False):
    c = (150, 150, 150) if dark else SUB
    d.text((M, H - 72 * S), handle, font=font("Bold", 28), fill=c, anchor="lm")
    if nxt:
        d.text((W - M, H - 72 * S), "옆으로 넘기기 →", font=font("Bold", 28), fill=c, anchor="rm")


def _runs(text):
    """Split '**bold**' markup into (chunk, is_bold) runs."""
    parts = text.split("**")
    return [(p, i % 2 == 1) for i, p in enumerate(parts) if p]


def _wrap(d, text, size, maxw):
    """Word-wrap a paragraph with **bold** runs; returns lines of runs."""
    words = []
    for chunk, bold in _runs(text):
        for k, w in enumerate(chunk.split(" ")):
            if k:
                words.append((" ", bold))
            if w:
                words.append((w, bold))
    lines, cur, cw = [], [], 0
    for w, bold in words:
        f = font("Bold" if bold else "Regular", size)
        ww = d.textlength(w, font=f)
        if w != " " and cur and cw + ww > maxw:
            while cur and cur[-1][0] == " ":
                cw -= d.textlength(" ", font=font("Regular", size))
                cur.pop()
            lines.append(cur)
            cur, cw = [], 0
        if w == " " and not cur:
            continue
        cur.append((w, bold))
        cw += ww
    if cur:
        lines.append(cur)
    return lines


def _body(d, x, y, paragraphs, size=34, maxw=None, color=INK, lead=1.75, highlight=None):
    maxw = maxw or (W - 2 * M)
    step = int(size * S * lead)
    for para in paragraphs:
        for line in _wrap(d, para, size, maxw):
            cx = x
            for w, bold in line:
                f = font("Bold" if bold else "Regular", size)
                d.text((cx, y), w, font=f, fill=color)
                cx += d.textlength(w, font=f)
            y += step
    if highlight:
        f = font("Regular", size)
        tw = d.textlength(highlight, font=f)
        light_text = sum(color) > 600            # dark slide: thin olive underline instead
        top = 0.95 if light_text else 0.55
        mark = (128, 112, 46, 255) if light_text else MARK + (230,)
        d.rectangle((x - 4 * S, y + int(size * S * top), x + tw + 4 * S, y + int(size * S * 1.18)),
                    fill=mark)
        d.text((x, y), highlight, font=f, fill=color)
        y += step
    return y


# ---------------------------------------------------------------- slide types

def cover(photo, tag, title_lines, subtitle, handle, role, focus=0.5, credit=None,
          underline=(0, 1)):
    """Full-bleed photo, outlined tag box, huge white title, black bottom bar."""
    im = _cover_crop(Image.open(photo), W, H, focus)
    shade = Image.new("L", (W, H))
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        sd.line((0, y, W, y), fill=int(110 + 120 * max(0, (y - H * 0.35) / (H * 0.65))))
    im = Image.composite(Image.new("RGB", (W, H), (12, 12, 12)), im, shade)
    d = ImageDraw.Draw(im, "RGBA")
    if credit:
        d.text((W - 40 * S, 44 * S), credit, font=font("Bold", 22), fill=WHITE, anchor="rt")
    ft = font("Bold", 34)
    tw = d.textlength(tag, font=ft)
    d.rectangle((M, 96 * S, M + tw + 60 * S, 170 * S), outline=WHITE, width=3 * S)
    d.text((M + 30 * S, 133 * S), tag, font=ft, fill=WHITE, anchor="lm")
    bar = 150 * S
    fsz = 96
    y = H - bar - 140 * S - len(title_lines) * int(fsz * S * 1.22)
    for i, line in enumerate(title_lines):
        f = font("ExtraBold", fsz)
        d.text((M, y), line, font=f, fill=WHITE)
        if i in underline:
            lw = d.textlength(line.split(" ")[0], font=f)
            d.line((M, y + int(fsz * S * 1.12), M + lw, y + int(fsz * S * 1.12)), fill=WHITE, width=5 * S)
        y += int(fsz * S * 1.22)
    d.text((M, y + 20 * S), subtitle, font=font("Regular", 38), fill=WHITE)
    d.rectangle((0, H - bar, W, H), fill=DARK)
    d.text((M, H - bar // 2), handle, font=font("Bold", 34), fill=WHITE, anchor="lm")
    d.text((W - M, H - bar // 2), role, font=font("Bold", 30), fill=(200, 200, 200), anchor="rm")
    return _finish(im)


def stats(label, page, total, handle, photo, title, cards, note=None, focus=0.5, credit=None):
    """Photo on top, title, 2x2 number cards, one line under them."""
    im, d = _canvas()
    _header(d, label, page, total)
    _photo_card(im, photo, (M, 160 * S, W - M, 560 * S), focus, credit)
    d.text((M, 600 * S), title, font=font("ExtraBold", 70), fill=INK)
    cw, ch, gap = (W - 2 * M - 26 * S) // 2, 240 * S, 24 * S
    for k, (big, line1, line2) in enumerate(cards):
        x = M + (k % 2) * (cw + gap)
        y = 715 * S + (k // 2) * (ch + gap)
        d.rounded_rectangle((x, y, x + cw, y + ch), radius=24 * S, fill=WHITE, outline=LINE, width=3 * S)
        d.text((x + 36 * S, y + 26 * S), big, font=font("ExtraBold", 84), fill=INK)
        d.text((x + 36 * S, y + 140 * S), line1, font=font("Regular", 30), fill=SUB)
        d.text((x + 36 * S, y + 184 * S), line2, font=font("Regular", 30), fill=SUB)
    if note:
        _body(d, M, 1240 * S - 20 * S, [note], size=32)
    _footer(d, handle)
    return _finish(im)


def item(label, page, total, handle, num, title, paragraphs, highlight, photo,
         photo_top=True, focus=0.5, credit=None, dark=False, tag=None, card_h=580):
    """Numbered item: big light number + bold title, body, marker line, photo card."""
    im, d = _canvas(DARK if dark else CREAM)
    fg = WHITE if dark else INK
    _header(d, label, page, total, dark)
    card_h = card_h * S
    if photo_top:
        _photo_card(im, photo, (M, 160 * S, W - M, 160 * S + card_h), focus, credit)
        y = 160 * S + card_h + 60 * S
    else:
        y = 170 * S
    if tag:
        ft = font("Bold", 32)
        tw = d.textlength(tag, font=ft)
        d.rectangle((M, y, M + tw + 50 * S, y + 64 * S), outline=fg, width=3 * S)
        d.text((M + 25 * S, y + 32 * S), tag, font=ft, fill=fg, anchor="lm")
        y += 100 * S
    if num is not None:
        fnum = font("Thin", 190)
        d.text((M - 8 * S, y - 30 * S), f"{num:02d}", font=fnum, fill=fg)
        nx = M + d.textlength(f"{num:02d}", font=fnum) + 30 * S
        tl = title if isinstance(title, list) else [title]
        ty = y + (130 * S if len(tl) == 1 else 40 * S)
        for t in tl:
            d.text((nx, ty), t, font=font("ExtraBold", 66), fill=fg)
            ty += 84 * S
        y += 230 * S
    else:
        for t in (title if isinstance(title, list) else [title]):
            d.text((M, y), t, font=font("ExtraBold", 84), fill=fg)
            y += 104 * S
        y += 30 * S
    _body(d, M, y, paragraphs, size=34, color=(225, 225, 225) if dark else INK,
          highlight=highlight)
    if not photo_top and photo:
        _photo_card(im, photo, (M, H - 140 * S - card_h, W - M, H - 140 * S), focus, credit)
    _footer(d, handle, dark=dark)
    return _finish(im)


def quote(kicker, lines, byline, formula, save_line, handle):
    """Text-only: kicker, huge bold quote, byline, rule, formula, dark bottom bar."""
    im, d = _canvas()
    d.text((M, 200 * S), kicker, font=font("Bold", 34), fill=SUB)
    y = 300 * S
    for line in lines:
        d.text((M, y), line, font=font("ExtraBold", 96), fill=INK)
        y += 124 * S
    d.text((M, y + 30 * S), byline, font=font("Bold", 34), fill=SUB)
    bar = 150 * S
    d.line((M, H - bar - 230 * S, W - M, H - bar - 230 * S), fill=INK, width=3 * S)
    fy = H - bar - 190 * S
    for line in formula:
        d.text((M, fy), line, font=font("ExtraBold", 50), fill=INK)
        fy += 72 * S
    d.rectangle((0, H - bar, W, H), fill=DARK)
    d.text((M, H - bar // 2), save_line, font=font("Bold", 34), fill=WHITE, anchor="lm")
    d.text((W - M, H - bar // 2), handle, font=font("Bold", 34), fill=WHITE, anchor="rm")
    return _finish(im)

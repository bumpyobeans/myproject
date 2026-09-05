# -*- coding: utf-8 -*-
"""
범표원두 커피 추천 - 상품 이미지 다운로드 스크립트
------------------------------------------------
CSV(스마트스토어 상품 목록)에 있는 '대표이미지 URL'을 내려받아
images/p_{상품번호}.jpg 로 저장합니다.

규칙
    - Pillow 로 긴 변 800px 이하로 축소
    - JPEG, quality 82
    - RGB로 변환 (PNG 투명 배경은 흰색으로 합성)
    - 이미 파일이 있으면 건너뜀
    - 실패한 건은 목록으로 모아서 마지막에 출력하고 계속 진행

실행 방법
    python tools\\fetch_images.py
"""

import csv
import io
import os
import sys
import urllib.request

try:
    import requests  # 있으면 사용, 없으면 urllib 로 대체
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 02_원두추천
CSV_PATH = r"C:\Users\bebeb\Desktop\Product_20260905_150247.csv"
TAGS_PATH = os.path.join(BASE_DIR, "data", "tags.json")
IMAGES_DIR = os.path.join(BASE_DIR, "images")

MAX_SIDE = 800
JPEG_QUALITY = 82

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def load_target_ids():
    """data/tags.json 에 있는 상품번호 목록 (밑줄 시작 키 제외)."""
    import json
    with open(TAGS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    return [k for k in raw.keys() if not k.startswith("_")]


def load_image_urls():
    """CSV에서 {상품번호: 대표이미지URL} 딕셔너리."""
    urls = {}
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = (row.get("상품번호(스마트스토어)") or "").strip()
            url = (row.get("대표이미지 URL") or "").strip()
            if pid and url:
                urls[pid] = url
    return urls


def download_bytes(url):
    """URL에서 바이트를 받아온다. requests 있으면 그걸로, 없으면 urllib."""
    if HAS_REQUESTS:
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
        resp.raise_for_status()
        return resp.content
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def save_as_jpeg(raw_bytes, dest_path):
    """이미지를 열어서 RGB 변환(투명배경은 흰색 합성) + 리사이즈 + JPEG 저장."""
    img = Image.open(io.BytesIO(raw_bytes))

    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    else:
        img = img.convert("RGB")

    w, h = img.size
    longest = max(w, h)
    if longest > MAX_SIDE:
        scale = MAX_SIDE / float(longest)
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)

    img.save(dest_path, "JPEG", quality=JPEG_QUALITY)


def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)

    target_ids = load_target_ids()
    image_urls = load_image_urls()

    ok_count = 0
    skip_count = 0
    failed = []

    for pid in target_ids:
        dest_path = os.path.join(IMAGES_DIR, "p_{}.jpg".format(pid))
        if os.path.exists(dest_path):
            skip_count += 1
            continue

        url = image_urls.get(pid)
        if not url:
            failed.append((pid, "CSV에 이미지 URL 없음"))
            continue

        try:
            raw = download_bytes(url)
            save_as_jpeg(raw, dest_path)
            ok_count += 1
            print("다운로드 완료: {} <- {}".format(os.path.basename(dest_path), url))
        except Exception as e:
            failed.append((pid, str(e)))

    print("")
    print("완료: 새로 받음 {}개 / 이미 있어서 건너뜀 {}개 / 실패 {}개".format(
        ok_count, skip_count, len(failed)))

    if failed:
        print("[실패 목록]")
        for pid, reason in failed:
            print("   - {} : {}".format(pid, reason))


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""
범표원두 커피 추천 - products.js 생성 스크립트
------------------------------------------------
스마트스토어에서 내려받은 CSV(상품 목록)와 data/tags.json(직접 만든 분류표)를
합쳐서 products.js 를 새로 만듭니다.

나중에 CSV만 새로 받아서 이 폴더에 넣고 CSV_PATH 를 바꾼 뒤 다시 실행하면
products.js 가 최신 상태로 갱신됩니다.

실행 방법
    python tools\\build_products.py

입력 (읽기만 함, 절대 수정하지 않음)
    - CSV_PATH  : 스마트스토어 상품 목록 (utf-8-sig)
    - TAGS_PATH : data/tags.json (사람이 직접 관리하는 분류표)

출력
    - products.js (전역변수 PRODUCTS 를 담은 파일. 이 스크립트가 자동 생성하므로
      직접 고치지 말고 data/tags.json 을 고쳐서 다시 실행할 것)
"""

import csv
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 02_원두추천
CSV_PATH = r"C:\Users\bebeb\Desktop\Product_20260905_150247.csv"
TAGS_PATH = os.path.join(BASE_DIR, "data", "tags.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "products.js")

# tags.json 의 설명용 키(밑줄로 시작) - 상품번호가 아니므로 건너뜀
SKIP_PREFIX = "_"


def load_tags():
    """data/tags.json 을 읽어서 {상품번호: 분류정보} 딕셔너리로 돌려준다."""
    with open(TAGS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    tags = {}
    for key, value in raw.items():
        if key.startswith(SKIP_PREFIX):
            continue
        tags[key] = value
    return tags


def load_csv_rows():
    """CSV를 읽어서 상품번호를 키로 하는 딕셔너리로 돌려준다."""
    rows = {}
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pid = (row.get("상품번호(스마트스토어)") or "").strip()
            if not pid:
                continue
            rows[pid] = row
    return rows


def parse_int(text):
    """'46,900' 같은 문자열을 정수로. 비어있으면 0."""
    if text is None:
        return 0
    text = text.replace(",", "").strip()
    if text == "":
        return 0
    try:
        return int(float(text))
    except ValueError:
        return 0


def js_string(text):
    """파이썬 문자열을 JS 문자열 리터럴로 안전하게 이스케이프."""
    return json.dumps(text, ensure_ascii=False)


def js_array_of_strings(items):
    return "[" + ", ".join(js_string(x) for x in items) + "]"


def js_array_of_flavors(flavors):
    """[{name, taste}, ...] 를 JS 배열 리터럴 문자열로."""
    if not flavors:
        return "[]"
    items = []
    for f in flavors:
        items.append("{{ name: {}, taste: {} }}".format(
            js_string(f.get("name", "")), js_string(f.get("taste", ""))))
    return "[" + ", ".join(items) + "]"


def build_product_entries():
    tags = load_tags()
    csv_rows = load_csv_rows()

    entries = []
    missing_in_csv = []
    skipped_status = []

    for pid, tag in tags.items():
        row = csv_rows.get(pid)
        if row is None:
            missing_in_csv.append(pid)
            continue

        sale_status = (row.get("판매상태") or "").strip()
        display_status = (row.get("전시상태") or "").strip()
        if sale_status != "판매중" or display_status != "전시중":
            skipped_status.append((pid, sale_status, display_status))
            continue

        store_name = (row.get("상품명") or "").strip()
        discount_price = parse_int(row.get("할인가"))
        sale_price = parse_int(row.get("판매가"))
        price = discount_price if discount_price > 0 else sale_price
        stock = parse_int(row.get("재고수량"))

        entry = {
            "id": pid,
            "name": tag.get("short", store_name),
            "storeName": store_name,
            "line": tag.get("line", ""),
            "method": tag.get("method", []),
            "scene": tag.get("scene", []),
            "taste": tag.get("taste", []),
            "decaf": bool(tag.get("decaf", False)),
            "sample": bool(tag.get("sample", False)),
            "exclude": bool(tag.get("exclude", False)),
            "flavors": tag.get("flavors", []),
            "signature": bool(tag.get("signature", False)),
            "soyMilk": bool(tag.get("soyMilk", False)),
            "canFlavor": tag.get("canFlavor", ""),
            "story": tag.get("story", ""),
            "priority": tag.get("priority", 1),
            "price": price,
            "stock": stock,
            "image": "images/p_{}.jpg".format(pid),
            "url": "https://brand.naver.com/bumpyobeans/products/{}".format(pid),
        }
        entries.append(entry)

    return entries, missing_in_csv, skipped_status


def render_js(entries):
    lines = []
    lines.append("/* ============================================================")
    lines.append("   범표원두 커피 추천 - 제품 데이터")
    lines.append("   ------------------------------------------------------------")
    lines.append("   이 파일은 tools/build_products.py 가 자동 생성합니다.")
    lines.append("   직접 고치지 말고 data/tags.json 을 고친 뒤 스크립트를 다시")
    lines.append("   실행하세요. (python tools\\build_products.py)")
    lines.append("")
    lines.append("   각 제품 필드 설명")
    lines.append("   - id        : 상품번호(스마트스토어)")
    lines.append("   - name      : 화면에 보여줄 짧은 이름 (data/tags.json 의 short)")
    lines.append("   - storeName : 스마트스토어 상품명 원본 (검색/디버그용)")
    lines.append("   - line      : 제품군")
    lines.append("   - method    : 음용 방식 배열")
    lines.append("   - scene     : 추천 상황 배열")
    lines.append("   - taste     : 맛 키워드 배열 (['다양']이면 옵션에서 여러 맛 중 선택)")
    lines.append("   - flavors   : 맛 옵션 배열 ([{name, taste}, ...]) — 여러 맛 중 고를 수 있는 상품에만 있음")
    lines.append("   - signature : 시그니처 메뉴 여부 (범표라떼)")
    lines.append("   - soyMilk   : 두유 베이스 여부 (두유라떼)")
    lines.append("   - canFlavor : 수제 캔커피 맛 이름 (범표라떼 / 두유라떼 / 온아바라 / 맛보기)")
    lines.append("   - story     : 메뉴에 얽힌 이야기 (있을 때만)")
    lines.append("   - decaf     : 디카페인 여부")
    lines.append("   - sample    : 샘플/체험 상품 여부")
    lines.append("   - exclude   : 추천 대상에서 제외할지 여부 (업소용 등)")
    lines.append("   - priority  : 동점일 때 우선순위 (1~5, 클수록 우선)")
    lines.append("   - price     : 판매가(할인가 있으면 할인가), 정수, 원 단위")
    lines.append("   - stock     : 재고수량")
    lines.append("   - image     : 대표 이미지 경로 (images/p_{상품번호}.jpg)")
    lines.append("   - url       : 스마트스토어 구매 페이지 주소")
    lines.append("   ============================================================ */")
    lines.append("")
    lines.append("var PRODUCTS = [")

    for e in entries:
        lines.append("  {")
        lines.append("    id: {},".format(js_string(e["id"])))
        lines.append("    name: {},".format(js_string(e["name"])))
        lines.append("    storeName: {},".format(js_string(e["storeName"])))
        lines.append("    line: {},".format(js_string(e["line"])))
        lines.append("    method: {},".format(js_array_of_strings(e["method"])))
        lines.append("    scene: {},".format(js_array_of_strings(e["scene"])))
        lines.append("    taste: {},".format(js_array_of_strings(e["taste"])))
        lines.append("    decaf: {},".format("true" if e["decaf"] else "false"))
        lines.append("    sample: {},".format("true" if e["sample"] else "false"))
        lines.append("    exclude: {},".format("true" if e["exclude"] else "false"))
        lines.append("    flavors: {},".format(js_array_of_flavors(e["flavors"])))
        lines.append("    signature: {},".format("true" if e["signature"] else "false"))
        lines.append("    soyMilk: {},".format("true" if e["soyMilk"] else "false"))
        lines.append("    canFlavor: {},".format(js_string(e["canFlavor"])))
        if e["story"]:
            lines.append("    story: {},".format(js_string(e["story"])))
        lines.append("    priority: {},".format(e["priority"]))
        lines.append("    price: {},".format(e["price"]))
        lines.append("    stock: {},".format(e["stock"]))
        lines.append("    image: {},".format(js_string(e["image"])))
        lines.append("    url: {}".format(js_string(e["url"])))
        lines.append("  },")

    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main():
    entries, missing_in_csv, skipped_status = build_product_entries()

    if not entries:
        print("[오류] 조건을 만족하는 상품이 하나도 없습니다. CSV/tags.json 경로를 확인하세요.")
        sys.exit(1)

    js_text = render_js(entries)
    with open(OUTPUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(js_text)

    print("products.js 생성 완료: {}개 상품".format(len(entries)))
    if missing_in_csv:
        print("[안내] tags.json 에는 있지만 CSV에 없는 상품번호 {}개: {}".format(
            len(missing_in_csv), ", ".join(missing_in_csv)))
    if skipped_status:
        print("[안내] 판매중/전시중이 아니라서 제외한 상품 {}개:".format(len(skipped_status)))
        for pid, sale_status, display_status in skipped_status:
            print("   - {} (판매상태={}, 전시상태={})".format(pid, sale_status, display_status))


if __name__ == "__main__":
    main()

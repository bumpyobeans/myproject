# -*- coding: utf-8 -*-
"""
범표원두 커피 추천 - reviews.js 생성 스크립트
------------------------------------------------
스마트스토어센터에서 내려받은 후기 엑셀(포토리뷰 export)을 읽어서
reviews.js 를 새로 만듭니다.

리뷰 텍스트에서 상황 키워드(캠핑/선물/혼자/1kg/산미 등)를 찾아
app.js 의 질문 답변 값(q1/q2/q4/q_amount)과 같은 태그로 자동 분류합니다.
사람이 직접 태그를 붙이는 과정 없이, 엑셀만 새로 받아서 다시 실행하면
reviews.js 가 갱신됩니다.

실행 방법
    python tools\\build_reviews.py

입력 (읽기만 함, 절대 수정하지 않음)
    - XLSX_PATH : 스마트스토어센터 리뷰 관리 > 엑셀 다운로드 파일

출력
    - reviews.js (전역변수 REVIEWS 를 담은 파일. 이 스크립트가 자동 생성하므로
      직접 고치지 말고 새 엑셀을 받아서 다시 실행할 것)
"""

import html
import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # 02_원두추천
XLSX_PATH = r"C:\Users\bebeb\Desktop\review_20260906_003018.xlsx"
OUTPUT_PATH = os.path.join(BASE_DIR, "reviews.js")

MAX_PER_PRODUCT = 8
MIN_RATING = 4

# 리뷰 텍스트 -> app.js 질문 답변 값과 같은 태그로 분류하는 키워드 사전
TAG_KEYWORDS = {
    # q1 (음용 방식 / 상황)
    "핸드드립": ["핸드드립", "직접 내려", "직접내려", "그라인더", "갈아서", "갈아먹", "드립커피", "브루잉", "홀빈", "원두 구매"],
    "아메리카노간편": ["드립백", "티백", "간편하게", "인스턴트"],
    "라떼": ["라떼", "우유", "두유"],
    "캡슐": ["캡슐", "네스프레소"],
    "콜드브루": ["콜드브루", "더치"],
    "선물": ["선물"],
    "여행캠핑": ["캠핑", "여행", "차박", "등산"],
    # q2 (맛 취향)
    "고소": ["고소", "구수", "묵직", "진한", "찐하"],
    "균형": ["부드럽", "균형", "데일리", "잔잔"],
    "산뜻한산미": ["산미", "상큼", "새콤", "산뜻"],
    "과실감": ["과일", "베리", "자몽", "살구", "리치"],
    # q4 (카페인)
    "디카페인": ["디카페인", "카페인 없", "카페인이 없"],
    # q_amount (원두 구매 용량)
    "100": ["조금씩", "맛보기", "체험"],
    "200": ["혼자", "1인", "한잔씩", "나만"],
    "500": ["가족", "나눠", "둘이", "부부"],
    "1000": ["1키로", "1kg", "넉넉", "대용량"],
}


def load_rows():
    import openpyxl

    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    return [r for r in rows if r and r[0]]


def tag_text(text):
    tags = []
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                tags.append(tag)
                break
    return tags


def short_date(raw):
    # '2026.09.05. 20:47:57' -> '2026.09.05'
    if not raw:
        return ""
    m = re.match(r"(\d{4}\.\d{2}\.\d{2})", str(raw))
    return m.group(1) if m else str(raw)


def build_reviews():
    rows = load_rows()

    by_product = {}
    for r in rows:
        pid = str(r[0]).strip()
        rating = r[3]
        photo = (r[4] or "").strip()
        text = html.unescape((r[5] or "").strip())
        author = (r[7] or "").strip()
        date = short_date(r[8])
        status = (r[13] or "").strip()

        if status != "정상":
            continue
        if not text or rating is None or rating < MIN_RATING:
            continue

        entry = {
            "rating": int(rating),
            "author": author,
            "date": date,
            "photo": photo,
            "text": text,
            "tags": tag_text(text),
        }
        by_product.setdefault(pid, []).append(entry)

    # 상품별로 상황 태그가 많은 후기, 평점 높은 후기 순으로 골라 상한 개수만 남긴다
    final = {}
    for pid, entries in by_product.items():
        seen_text = set()
        deduped = []
        for e in entries:
            if e["text"] in seen_text:
                continue
            seen_text.add(e["text"])
            deduped.append(e)
        deduped.sort(key=lambda e: (len(e["tags"]), e["rating"], len(e["text"])), reverse=True)
        final[pid] = deduped[:MAX_PER_PRODUCT]

    return final


def js_string(text):
    return json.dumps(text, ensure_ascii=False)


def js_array_of_strings(items):
    return "[" + ", ".join(js_string(x) for x in items) + "]"


def render_js(final):
    lines = []
    lines.append("/* ============================================================")
    lines.append("   범표원두 커피 추천 - 실제 구매자 후기 데이터")
    lines.append("   ------------------------------------------------------------")
    lines.append("   이 파일은 tools/build_reviews.py 가 스마트스토어센터 후기 엑셀에서")
    lines.append("   자동 생성합니다. 직접 고치지 말고 새 엑셀을 받아서 다시 실행하세요.")
    lines.append("   (python tools\\build_reviews.py)")
    lines.append("")
    lines.append("   상품번호(id)를 키로 하는 객체이며, 값은 후기 배열입니다.")
    lines.append("   각 후기 필드 설명")
    lines.append("   - rating : 별점 (1~5)")
    lines.append("   - author : 작성자 (스마트스토어에서 이미 마스킹된 값)")
    lines.append("   - date   : 작성일 (YYYY.MM.DD)")
    lines.append("   - photo  : 후기 사진 URL (네이버 공개 CDN, 그대로 사용)")
    lines.append("   - text   : 후기 본문")
    lines.append("   - tags   : 리뷰 텍스트에서 찾은 상황 키워드")
    lines.append("              (app.js 의 q1/q2/q4/q_amount 답변 값과 같은 값)")
    lines.append("   ============================================================ */")
    lines.append("")
    lines.append("var REVIEWS = {")

    for pid in sorted(final.keys()):
        entries = final[pid]
        if not entries:
            continue
        lines.append("  {}: [".format(js_string(pid)))
        for e in entries:
            lines.append("    {")
            lines.append("      rating: {},".format(e["rating"]))
            lines.append("      author: {},".format(js_string(e["author"])))
            lines.append("      date: {},".format(js_string(e["date"])))
            lines.append("      photo: {},".format(js_string(e["photo"])))
            lines.append("      text: {},".format(js_string(e["text"])))
            lines.append("      tags: {}".format(js_array_of_strings(e["tags"])))
            lines.append("    },")
        lines.append("  ],")

    lines.append("};")
    lines.append("")
    return "\n".join(lines)


def main():
    final = build_reviews()
    total = sum(len(v) for v in final.values())

    if total == 0:
        print("[오류] 조건을 만족하는 후기가 하나도 없습니다. XLSX_PATH를 확인하세요.")
        sys.exit(1)

    js_text = render_js(final)
    with open(OUTPUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write(js_text)

    print("reviews.js 생성 완료: 상품 {}개, 후기 {}건".format(len(final), total))


if __name__ == "__main__":
    main()

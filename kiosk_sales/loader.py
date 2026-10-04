"""키오스크 '상품별 매출' 엑셀을 읽어 표준 형태로 정리한다.

엑셀 양식 (키오스크 관리자 페이지 내보내기):
    1행  "<매장명>의 2026-09-01 ~ 2026-09-30 상품별 매출"
    3행  번호 | 대분류 | 상품코드 | 상품명 | 판매수 | 결제 합계 | 현금 | 카드 | 포인트 | 외상 | 기타 | 할인 합계
    4행  합계
    5행~ 상품별 행
"""
from __future__ import annotations

import json
import re
import warnings
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

HEADER_MAP = {
    "번호": "no",
    "대분류": "category",
    "상품코드": "code",
    "상품명": "name",
    "판매수": "qty",
    "결제 합계": "amount",
    "현금": "cash",
    "카드": "card",
    "포인트": "point",
    "외상": "credit",
    "기타": "etc",
    "할인 합계": "discount",
}
NUMERIC = ["qty", "amount", "cash", "card", "point", "credit", "etc", "discount"]
PAYMENT_LABELS = {"cash": "현금", "card": "카드", "point": "포인트", "credit": "외상", "etc": "기타"}
TITLE_RE = re.compile(r"^(?P<venue>.*?)의\s*(?P<start>\d{4}-\d{2}-\d{2})\s*~\s*(?P<end>\d{4}-\d{2}-\d{2})")
SUFFIXES = {".xlsx", ".xls"}


def load_config(path: str | Path = "config.json") -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@dataclass
class SalesFile:
    venue: str          # 엑셀 제목의 매장명
    start: pd.Timestamp
    end: pd.Timestamp
    items: pd.DataFrame  # 상품별 행 (표준 컬럼)

    @property
    def month(self) -> str:
        return self.start.strftime("%Y-%m")


def _norm(v) -> str:
    return re.sub(r"\s+", " ", str(v)).strip() if v is not None and not pd.isna(v) else ""


def read_sales_file(path: str | Path) -> SalesFile:
    path = Path(path)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # "Workbook contains no default style" 경고 무시
        raw = pd.read_excel(path, header=None, dtype=object)

    venue, start, end = "", None, None
    for v in raw.head(3).to_numpy().ravel():
        m = TITLE_RE.match(_norm(v))
        if m:
            venue = m["venue"].strip()
            start, end = pd.Timestamp(m["start"]), pd.Timestamp(m["end"])
            break
    if start is None:
        raise ValueError(f"{path.name}: 제목 행에서 기간(YYYY-MM-DD ~ YYYY-MM-DD)을 찾지 못했습니다.")
    if (start.year, start.month) != (end.year, end.month):
        raise ValueError(f"{path.name}: 한 달 단위 파일만 지원합니다. (기간 {start.date()} ~ {end.date()})")

    header_row = next(
        (i for i, row in raw.iterrows() if {"상품명", "결제 합계"} <= {_norm(v) for v in row}), None
    )
    if header_row is None:
        raise ValueError(f"{path.name}: '상품명', '결제 합계' 헤더 행을 찾지 못했습니다.")
    header = [_norm(v) for v in raw.iloc[header_row]]
    missing = [h for h in HEADER_MAP if h not in header]
    if missing:
        raise ValueError(f"{path.name}: 헤더에 {missing} 컬럼이 없습니다. (헤더: {[h for h in header if h]})")

    body = raw.iloc[header_row + 1:].copy()
    body.columns = header
    body = body[list(HEADER_MAP)].rename(columns=HEADER_MAP)
    for c in NUMERIC:
        body[c] = pd.to_numeric(body[c], errors="coerce").fillna(0)

    is_total = body["no"].map(_norm) == "합계"
    items = body[pd.to_numeric(body["no"], errors="coerce").notna()].copy()
    for c in ("category", "code", "name"):
        items[c] = items[c].map(_norm)
    items = items.drop(columns="no").reset_index(drop=True)

    # 파일의 합계 행과 상품 행 합계가 맞는지 검증
    if is_total.any():
        total = body[is_total].iloc[0]
        for c in ("qty", "amount"):
            if abs(items[c].sum() - total[c]) > 0.5:
                raise ValueError(
                    f"{path.name}: 상품 행 {c} 합계({items[c].sum():,.0f})가 "
                    f"파일 합계 행({total[c]:,.0f})과 다릅니다."
                )
    return SalesFile(venue=venue, start=start, end=end, items=items)


def resolve_store(venue: str, config: dict) -> str | None:
    """엑셀 제목의 매장명으로 config 에 등록된 가맹점 이름을 찾는다."""
    for store, conf in config.get("stores", {}).items():
        if venue == store or venue in conf.get("aliases", []):
            return store
    return None


def load_all(raw_dir: str | Path) -> pd.DataFrame:
    """data/raw/<가맹점>/<YYYY-MM>.xlsx 를 모두 읽어 하나의 표로 합친다."""
    frames, seen = [], {}
    for store_dir in sorted(p for p in Path(raw_dir).iterdir() if p.is_dir()):
        for f in sorted(store_dir.iterdir()):
            if f.suffix.lower() not in SUFFIXES or f.name.startswith("~$"):
                continue
            sf = read_sales_file(f)
            key = (store_dir.name, sf.month)
            if key in seen:  # 같은 가맹점·월 파일이 두 개면 이중 집계되므로 중단
                raise ValueError(f"{store_dir.name} {sf.month} 파일이 중복됩니다: {seen[key]}, {f.name}")
            seen[key] = f.name
            df = sf.items.copy()
            df.insert(0, "store", store_dir.name)
            df.insert(1, "month", sf.month)
            frames.append(df)
    if not frames:
        raise FileNotFoundError(f"{raw_dir} 아래에 가맹점별 매출 파일이 없습니다. (data/raw/<가맹점>/<YYYY-MM>.xlsx)")
    return pd.concat(frames, ignore_index=True)

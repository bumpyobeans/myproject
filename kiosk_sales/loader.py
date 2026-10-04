"""엑셀(.xlsx/.xls)·CSV 매출 파일을 읽어 표준 컬럼으로 정리한다."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

REQUIRED = ("date", "store", "amount")
SUPPORTED_SUFFIXES = {".xlsx", ".xls", ".csv"}


def load_config(path: str | Path = "config.json") -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _normalize_columns(df: pd.DataFrame, aliases: dict[str, list[str]]) -> pd.DataFrame:
    """실제 컬럼명을 config 의 별칭 목록으로 찾아 표준 이름으로 바꾼다."""
    lookup = {str(c).strip().lower(): c for c in df.columns}
    rename = {}
    for std, names in aliases.items():
        for name in names:
            original = lookup.get(name.strip().lower())
            if original is not None:
                rename[original] = std
                break
    return df.rename(columns=rename)[list(rename.values())]


def read_file(path: Path, aliases: dict[str, list[str]]) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        try:
            raw = pd.read_csv(path, encoding="utf-8-sig")
        except UnicodeDecodeError:
            raw = pd.read_csv(path, encoding="cp949")
    else:
        raw = pd.read_excel(path)

    df = _normalize_columns(raw, aliases)
    # 가맹점별로 파일을 따로 받는 경우: 가맹점 컬럼이 없으면 파일명을 가맹점명으로 사용
    if "store" not in df.columns:
        df["store"] = path.stem

    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise ValueError(
            f"{path.name}: 필수 컬럼 {missing} 을(를) 찾지 못했습니다. "
            f"config.json 의 columns 에 실제 컬럼명을 추가하세요. (파일 컬럼: {list(raw.columns)})"
        )

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["amount"] = pd.to_numeric(
        df["amount"].astype(str).str.replace(r"[,원\s]", "", regex=True), errors="coerce"
    )
    if "quantity" in df.columns:
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)
    df = df.dropna(subset=["date", "amount"])
    df["store"] = df["store"].astype(str).str.strip()
    df["source_file"] = path.name
    return df


def load_sales(raw_dir: str | Path, config: dict) -> pd.DataFrame:
    """raw_dir 아래 모든 매출 파일을 읽어 하나로 합친다."""
    files = sorted(
        p for p in Path(raw_dir).rglob("*")
        if p.suffix.lower() in SUPPORTED_SUFFIXES and not p.name.startswith("~$")
    )
    if not files:
        raise FileNotFoundError(f"{raw_dir} 에 엑셀/CSV 매출 파일이 없습니다.")
    df = pd.concat([read_file(p, config["columns"]) for p in files], ignore_index=True)
    # 같은 파일을 두 번 넣었을 때 이중 집계되지 않도록 완전 중복 행 제거
    df = df.drop_duplicates(subset=[c for c in df.columns if c != "source_file"])
    df["month"] = df["date"].dt.to_period("M").astype(str)
    return df

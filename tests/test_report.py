import pandas as pd
import pytest
from openpyxl import load_workbook

from kiosk_sales.__main__ import main
from kiosk_sales.loader import load_config, load_sales
from kiosk_sales.report import store_summary

CONFIG = load_config("config.json")


def _write(path, rows, columns):
    path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows, columns=columns).to_excel(path, index=False)


@pytest.fixture
def raw_dir(tmp_path):
    raw = tmp_path / "raw"
    cols = ["거래일시", "가맹점명", "주문번호", "메뉴명", "수량", "결제금액", "결제수단"]
    _write(raw / "2026-08" / "본사통합.xlsx", [
        ["2026-08-10 12:00", "강남점", "A1", "아메리카노", 2, 8000, "카드"],
        ["2026-08-11 12:00", "홍대점", "B1", "라떼", 1, 5000, "카드"],
    ], cols)
    _write(raw / "2026-09" / "본사통합.xlsx", [
        ["2026-09-01 09:00", "강남점", "A2", "아메리카노", 1, 4000, "카드"],
        ["2026-09-01 09:00", "강남점", "A2", "쿠키", 1, "2,000", "카드"],
        ["2026-09-02 10:00", "강남점", "A3", "라떼", 2, 10000, "현금"],
        ["2026-09-03 11:00", "홍대점", "B2", "라떼", 1, 5000, "카드"],
    ], cols)
    # 가맹점 컬럼 없이 가맹점별로 따로 받은 파일 → 파일명이 가맹점명
    _write(raw / "2026-09" / "부산점.xlsx", [
        ["2026-09-05", 7000],
    ], ["판매일자", "매출액"])
    return raw


def test_load_and_summary(raw_dir):
    df = load_sales(raw_dir, CONFIG)
    assert set(df["store"]) == {"강남점", "홍대점", "부산점"}

    s = store_summary(df, "2026-09").set_index("가맹점")
    assert s.loc["강남점", "매출합계"] == 16000
    assert s.loc["강남점", "거래건수"] == 2          # 주문번호 기준
    assert s.loc["강남점", "객단가"] == 8000
    assert s.loc["강남점", "전월대비(%)"] == 100.0   # 8000 → 16000
    assert s.loc["합계", "매출합계"] == 28000


def test_duplicate_files_not_double_counted(raw_dir):
    src = raw_dir / "2026-09" / "본사통합.xlsx"
    (raw_dir / "2026-09" / "본사통합_사본.xlsx").write_bytes(src.read_bytes())
    df = load_sales(raw_dir, CONFIG)
    assert df[df["month"] == "2026-09"]["amount"].sum() == 28000


def test_missing_column_error(tmp_path):
    _write(tmp_path / "x.xlsx", [[1, 2]], ["알수없음", "금액"])
    with pytest.raises(ValueError, match="date"):
        load_sales(tmp_path, CONFIG)


def test_cli_writes_report(raw_dir, tmp_path):
    out = tmp_path / "reports"
    assert main(["--raw-dir", str(raw_dir), "--out-dir", str(out), "report"]) == 0
    wb = load_workbook(out / "2026-09_월별매출리포트.xlsx")
    assert wb.sheetnames == ["가맹점별 요약", "일별 매출", "메뉴별", "결제수단별", "월별 추이"]

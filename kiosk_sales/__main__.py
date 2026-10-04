"""사용법:
    python -m kiosk_sales months            # 데이터에 있는 월 목록
    python -m kiosk_sales report 2026-09    # 해당 월 리포트 생성
    python -m kiosk_sales report            # 가장 최근 월 리포트 생성
"""
from __future__ import annotations

import argparse
import sys

from .loader import load_config, load_sales
from .report import write_report


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="kiosk_sales", description="가맹점 키오스크 월별 매출 관리")
    p.add_argument("--config", default="config.json")
    p.add_argument("--raw-dir", default="data/raw")
    p.add_argument("--out-dir", default="reports")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("months", help="데이터에 있는 월 목록")
    r = sub.add_parser("report", help="월별 리포트 엑셀 생성")
    r.add_argument("month", nargs="?", help="YYYY-MM (생략 시 최근 월)")
    args = p.parse_args(argv)

    config = load_config(args.config)
    try:
        df = load_sales(args.raw_dir, config)
    except (FileNotFoundError, ValueError) as e:
        print(f"오류: {e}", file=sys.stderr)
        return 1

    months = sorted(df["month"].unique())
    if args.cmd == "months":
        for m in months:
            sub_df = df[df["month"] == m]
            print(f"{m}  가맹점 {sub_df['store'].nunique()}곳  매출 {sub_df['amount'].sum():,.0f}원")
        return 0

    month = args.month or months[-1]
    try:
        path = write_report(df, month, args.out_dir, config.get("royalty_rate", 0.0))
    except ValueError as e:
        print(f"오류: {e}", file=sys.stderr)
        return 1
    print(f"리포트 생성: {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

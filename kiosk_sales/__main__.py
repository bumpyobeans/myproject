"""사용법:
    python -m kiosk_sales add <엑셀파일> [--store 별내점]   # 매출 파일 등록 → data/raw/<가맹점>/<YYYY-MM>.xlsx
    python -m kiosk_sales list                              # 가맹점 × 월 등록 현황
    python -m kiosk_sales report [YYYY-MM] [--store 별내점]  # 가맹점별 리포트 + 전체 요약 생성
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from .loader import load_all, load_config, read_sales_file, resolve_store
from .report import write_all_stores_report, write_store_report


def cmd_add(args, config) -> int:
    src = Path(args.file)
    sf = read_sales_file(src)
    store = args.store or resolve_store(sf.venue, config)
    if not store:
        print(f"오류: 엑셀 제목의 매장명 '{sf.venue}' 이(가) config.json 에 없습니다. "
              f"--store 로 가맹점명을 지정하거나 config.json 의 aliases 에 추가하세요.", file=sys.stderr)
        return 1
    dest = Path(args.raw_dir) / store / f"{sf.month}.xlsx"
    if dest.exists() and not args.force:
        print(f"오류: {dest} 가 이미 있습니다. 교체하려면 --force 를 붙이세요.", file=sys.stderr)
        return 1
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dest)
    it = sf.items
    print(f"등록: {store} {sf.month} → {dest}")
    print(f"  상품 {len(it)}행, 판매수량 {it['qty'].sum():,.0f}개, 매출 {it['amount'].sum():,.0f}원")
    return 0


def cmd_list(args, config) -> int:
    df = load_all(args.raw_dir)
    t = df.pivot_table(index="store", columns="month", values="amount", aggfunc="sum")
    print(t.map(lambda v: f"{v:,.0f}" if v == v else "-").to_string())
    return 0


def cmd_report(args, config) -> int:
    df = load_all(args.raw_dir)
    month = args.month or max(df["month"])
    stores = [args.store] if args.store else sorted(df.loc[df["month"] == month, "store"].unique())
    if not stores:
        print(f"오류: {month} 매출 데이터가 없습니다.", file=sys.stderr)
        return 1
    for store in stores:
        rate = config.get("stores", {}).get(store, {}).get("royalty_rate", 0.0)
        print(f"리포트 생성: {write_store_report(df, store, month, args.out_dir, rate)}")
    if not args.store:
        print(f"리포트 생성: {write_all_stores_report(df, month, args.out_dir, config)}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="kiosk_sales", description="가맹점 키오스크 월별 매출 관리")
    p.add_argument("--config", default="config.json")
    p.add_argument("--raw-dir", default="data/raw")
    p.add_argument("--out-dir", default="reports")
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("add", help="매출 엑셀 등록")
    a.add_argument("file")
    a.add_argument("--store", help="가맹점명 (생략 시 엑셀 제목으로 자동 판별)")
    a.add_argument("--force", action="store_true", help="같은 가맹점·월 파일이 있으면 교체")
    sub.add_parser("list", help="가맹점 × 월 등록 현황")
    r = sub.add_parser("report", help="월별 리포트 생성")
    r.add_argument("month", nargs="?", help="YYYY-MM (생략 시 최근 월)")
    r.add_argument("--store", help="특정 가맹점만")
    args = p.parse_args(argv)

    config = load_config(args.config)
    handler = {"add": cmd_add, "list": cmd_list, "report": cmd_report}[args.cmd]
    try:
        return handler(args, config)
    except (FileNotFoundError, ValueError) as e:
        print(f"오류: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

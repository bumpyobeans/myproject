"""가맹점별·전체 월별 리포트 집계와 엑셀 출력."""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from .loader import PAYMENT_LABELS


def prev_month(month: str) -> str:
    return str(pd.Period(month, "M") - 1)


def _change(cur, prev):
    return round((cur - prev) / prev * 100, 1) if prev else pd.NA


def products(df: pd.DataFrame) -> pd.DataFrame:
    """상품코드 기준으로 합친다. 월 중 대분류·상품명이 바뀐 경우 판매수가 가장 많은 쪽을 대표로 쓴다."""
    if df.empty:
        return pd.DataFrame(columns=["code", "name", "category", "qty", "amount"]).set_index("code")
    rep = df.sort_values("qty", ascending=False).drop_duplicates("code").set_index("code")[["name", "category"]]
    sums = df.groupby("code")[["qty", "amount"]].sum()
    return rep.join(sums)


def store_overview(cur: pd.DataFrame, prev: pd.DataFrame, royalty_rate: float = 0.0) -> pd.DataFrame:
    """가맹점 한 곳의 월 요약 (항목 | 금액 | 비고)."""
    sales, prev_sales = cur["amount"].sum(), prev["amount"].sum()
    rows = [
        ("총매출(결제 합계)", sales, ""),
        ("판매수량", cur["qty"].sum(), ""),
        ("판매 상품 수", cur["code"].nunique(), ""),
        ("할인 합계", cur["discount"].sum(), ""),
        ("전월 총매출", prev_sales if not prev.empty else pd.NA, ""),
        ("전월대비(%)", _change(sales, prev_sales) if not prev.empty else pd.NA, ""),
    ]
    for key, label in PAYMENT_LABELS.items():
        amt = cur[key].sum()
        rows.append((f"결제-{label}", amt, f"{amt / sales * 100:.1f}%" if sales else ""))
    if royalty_rate:
        rows.append(("로열티", round(sales * royalty_rate), f"{royalty_rate * 100:g}%"))
    return pd.DataFrame(rows, columns=["항목", "값", "비고"])


def by_category(cur: pd.DataFrame, prev: pd.DataFrame) -> pd.DataFrame:
    t = cur.groupby("category")[["qty", "amount"]].sum()
    t["prev"] = prev.groupby("category")["amount"].sum()
    t = t.sort_values("amount", ascending=False)
    out = pd.DataFrame({
        "판매수량": t["qty"],
        "매출": t["amount"],
        "비중(%)": (t["amount"] / t["amount"].sum() * 100).round(1),
        "전월매출": t["prev"],
        "전월대비(%)": [_change(a, p) if pd.notna(p) else pd.NA for a, p in zip(t["amount"], t["prev"])],
    })
    out.index.name = "대분류"
    return out


def by_product(cur: pd.DataFrame, prev: pd.DataFrame) -> pd.DataFrame:
    t = products(cur)
    p = products(prev)
    t = t.join(p[["qty", "amount"]].rename(columns={"qty": "pqty", "amount": "pamount"}))
    t = t.sort_values("amount", ascending=False)
    out = pd.DataFrame({
        "순위": range(1, len(t) + 1),
        "상품코드": t.index,
        "상품명": t["name"].values,
        "대분류": t["category"].values,
        "판매수량": t["qty"].values,
        "매출": t["amount"].values,
        "비중(%)": (t["amount"] / t["amount"].sum() * 100).round(1).values,
        "전월수량": t["pqty"].values,
        "전월매출": t["pamount"].values,
        "전월대비(%)": [_change(a, p) if pd.notna(p) else pd.NA for a, p in zip(t["amount"], t["pamount"])],
    })
    return out


def store_trend(df: pd.DataFrame) -> pd.DataFrame:
    """가맹점 한 곳의 월별 추이 (월 × 총매출·수량·대분류별 매출)."""
    base = df.groupby("month").agg(총매출=("amount", "sum"), 판매수량=("qty", "sum"))
    base["전월대비(%)"] = [
        _change(v, p) if pd.notna(p) else pd.NA for v, p in zip(base["총매출"], base["총매출"].shift())
    ]
    cats = df.pivot_table(index="month", columns="category", values="amount", aggfunc="sum", fill_value=0)
    out = base.join(cats)
    out.index.name = "월"
    return out


def all_stores_summary(df: pd.DataFrame, month: str, config: dict) -> pd.DataFrame:
    cur, prev = df[df["month"] == month], df[df["month"] == prev_month(month)]
    prev_sales = prev.groupby("store")["amount"].sum()
    rows = []
    for store, g in cur.groupby("store"):
        sales = g["amount"].sum()
        p = prev_sales.get(store)
        rate = config.get("stores", {}).get(store, {}).get("royalty_rate", 0.0)
        row = {
            "가맹점": store,
            "총매출": sales,
            "판매수량": g["qty"].sum(),
            "전월매출": p if p is not None else pd.NA,
            "전월대비(%)": _change(sales, p) if p is not None else pd.NA,
            "할인 합계": g["discount"].sum(),
        }
        for key, label in PAYMENT_LABELS.items():
            row[label] = g[key].sum()
        row["로열티"] = round(sales * rate)
        rows.append(row)
    out = pd.DataFrame(rows).sort_values("총매출", ascending=False).reset_index(drop=True)
    out.insert(0, "순위", range(1, len(out) + 1))
    total = out.drop(columns=["순위", "가맹점", "전월대비(%)"]).sum(numeric_only=True).to_dict()
    total.update({"순위": "", "가맹점": "합계", "전월대비(%)": pd.NA})
    if out["전월매출"].isna().all():
        total["전월매출"] = pd.NA
    return pd.concat([out, pd.DataFrame([total])], ignore_index=True)


def all_stores_trend(df: pd.DataFrame) -> pd.DataFrame:
    t = df.pivot_table(index="store", columns="month", values="amount", aggfunc="sum")
    t.loc["합계"] = t.sum()
    t.index.name = "가맹점"
    return t


def _write(path: Path, sheets: dict[str, tuple[pd.DataFrame, bool]]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        for name, (table, index) in sheets.items():
            table.to_excel(xw, sheet_name=name, index=index)
            ws = xw.sheets[name]
            for col in ws.columns:
                header = str(col[0].value or "")
                width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
                ws.column_dimensions[col[0].column_letter].width = min(max(10, width * 1.7), 45)
                for c in col[1:]:
                    if isinstance(c.value, (int, float)) and not isinstance(c.value, bool):
                        c.number_format = "0.0" if "%" in header else "#,##0"
            ws.freeze_panes = "B2"
    return path


def write_store_report(df: pd.DataFrame, store: str, month: str, out_dir: str | Path,
                       royalty_rate: float = 0.0) -> Path:
    sdf = df[df["store"] == store]
    cur, prev = sdf[sdf["month"] == month], sdf[sdf["month"] == prev_month(month)]
    if cur.empty:
        raise ValueError(f"{store} {month} 매출 데이터가 없습니다.")
    return _write(Path(out_dir) / store / f"{store}_{month}_매출리포트.xlsx", {
        "요약": (store_overview(cur, prev, royalty_rate), False),
        "대분류별": (by_category(cur, prev), True),
        "상품별": (by_product(cur, prev), False),
        "월별 추이": (store_trend(sdf), True),
    })


def write_all_stores_report(df: pd.DataFrame, month: str, out_dir: str | Path, config: dict) -> Path:
    cur = df[df["month"] == month]
    if cur.empty:
        raise ValueError(f"{month} 매출 데이터가 없습니다.")
    top = by_product(cur, df[df["month"] == prev_month(month)])
    return _write(Path(out_dir) / "전체" / f"{month}_가맹점별요약.xlsx", {
        "가맹점별 요약": (all_stores_summary(df, month, config), False),
        "대분류별(전체)": (by_category(cur, df[df["month"] == prev_month(month)]), True),
        "상품별(전체)": (top, False),
        "월별 추이": (all_stores_trend(df), True),
    })

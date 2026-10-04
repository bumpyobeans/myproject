"""월별 리포트 집계와 엑셀 출력."""
from __future__ import annotations

from pathlib import Path

import pandas as pd


def _orders(g: pd.DataFrame) -> int:
    # 주문번호가 있으면 주문 단위로, 없으면 행 단위로 거래건수를 센다
    return g["order_id"].nunique() if "order_id" in g.columns else len(g)


def store_summary(df: pd.DataFrame, month: str, royalty_rate: float = 0.0) -> pd.DataFrame:
    cur = df[df["month"] == month]
    prev_month = str(pd.Period(month, "M") - 1)
    prev_sales = df[df["month"] == prev_month].groupby("store")["amount"].sum()

    rows = []
    for store, g in cur.groupby("store"):
        sales = g["amount"].sum()
        orders = _orders(g)
        days = g["date"].dt.date.nunique()
        prev = prev_sales.get(store)
        row = {
            "가맹점": store,
            "매출합계": sales,
            "거래건수": orders,
            "객단가": round(sales / orders) if orders else 0,
            "영업일수": days,
            "일평균매출": round(sales / days) if days else 0,
            "전월매출": prev if prev is not None else pd.NA,
            "전월대비(%)": round((sales - prev) / prev * 100, 1) if prev else pd.NA,
        }
        if royalty_rate:
            row["로열티"] = round(sales * royalty_rate)
        rows.append(row)

    out = pd.DataFrame(rows)
    if out.empty:
        return out
    out = out.sort_values("매출합계", ascending=False).reset_index(drop=True)
    out.insert(0, "순위", range(1, len(out) + 1))
    total = {"순위": "", "가맹점": "합계", "매출합계": out["매출합계"].sum(),
             "거래건수": out["거래건수"].sum(), "영업일수": "", "전월대비(%)": pd.NA}
    total["객단가"] = round(total["매출합계"] / total["거래건수"]) if total["거래건수"] else 0
    total["일평균매출"] = ""
    prev_total = out["전월매출"].dropna().sum()
    total["전월매출"] = prev_total if prev_total else pd.NA
    if royalty_rate:
        total["로열티"] = out["로열티"].sum()
    return pd.concat([out, pd.DataFrame([total])], ignore_index=True)


def daily_sales(df: pd.DataFrame, month: str) -> pd.DataFrame:
    cur = df[df["month"] == month]
    t = cur.pivot_table(index=cur["date"].dt.date, columns="store",
                        values="amount", aggfunc="sum", fill_value=0)
    t["합계"] = t.sum(axis=1)
    t.index.name = "일자"
    return t


def breakdown(df: pd.DataFrame, month: str, key: str, label: str) -> pd.DataFrame | None:
    if key not in df.columns:
        return None
    cur = df[df["month"] == month]
    agg = {"amount": "sum"}
    if "quantity" in cur.columns:
        agg["quantity"] = "sum"
    t = cur.groupby(key).agg(agg).sort_values("amount", ascending=False)
    t = t.rename(columns={"amount": "매출", "quantity": "수량"})
    t["비중(%)"] = (t["매출"] / t["매출"].sum() * 100).round(1)
    t.index.name = label
    return t


def monthly_trend(df: pd.DataFrame) -> pd.DataFrame:
    t = df.pivot_table(index="store", columns="month", values="amount",
                       aggfunc="sum", fill_value=0)
    t.loc["합계"] = t.sum()
    t.index.name = "가맹점"
    return t


def write_report(df: pd.DataFrame, month: str, out_dir: str | Path,
                 royalty_rate: float = 0.0) -> Path:
    if month not in set(df["month"]):
        raise ValueError(f"{month} 매출 데이터가 없습니다. (있는 월: {sorted(df['month'].unique())})")
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{month}_월별매출리포트.xlsx"

    sheets = {
        "가맹점별 요약": store_summary(df, month, royalty_rate),
        "일별 매출": daily_sales(df, month),
        "메뉴별": breakdown(df, month, "menu", "메뉴"),
        "결제수단별": breakdown(df, month, "payment", "결제수단"),
        "월별 추이": monthly_trend(df),
    }
    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        for name, table in sheets.items():
            if table is None:
                continue
            table.to_excel(xw, sheet_name=name, index=name != "가맹점별 요약")
            ws = xw.sheets[name]
            for col in ws.columns:
                width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
                ws.column_dimensions[col[0].column_letter].width = min(max(10, width * 1.6), 40)
                for c in col[1:]:
                    if isinstance(c.value, (int, float)) and not isinstance(c.value, bool):
                        c.number_format = "#,##0.0" if "%" in str(col[0].value) else "#,##0"
            ws.freeze_panes = "B2"
    return path

"""Merge and validate extracted rows across multiple sources."""

from ..models.schema import ColumnDef, ColumnType


def merge_rows(all_rows: list[list[dict]], columns: list[ColumnDef]) -> list[dict]:
    merged: list[dict] = []
    for source_rows in all_rows:
        for row in source_rows:
            merged.append(_validate_row(row, columns))
    return merged


def _validate_row(row: dict, columns: list[ColumnDef]) -> dict:
    validated: dict = {}
    for col in columns:
        val = row.get(col.name)
        if val is None:
            validated[col.name] = None
            continue
        validated[col.name] = _coerce(val, col.column_type)
    return validated


def _coerce(value, col_type: ColumnType):
    if value is None:
        return None
    if col_type == ColumnType.NUMBER:
        try:
            s = str(value).replace(",", "").strip()
            return float(s) if "." in s else int(s)
        except (ValueError, TypeError):
            return value
    if col_type == ColumnType.BOOLEAN:
        if isinstance(value, bool):
            return value
        return str(value).lower() in ("true", "yes", "1")
    return str(value) if value is not None else None


def filter_required(rows: list[dict], columns: list[ColumnDef]) -> list[dict]:
    required_cols = [c.name for c in columns if c.required]
    if not required_cols:
        return rows
    return [r for r in rows if all(r.get(c) is not None for c in required_cols)]

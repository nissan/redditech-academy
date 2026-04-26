import pandas as pd

def anomaly_flags(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    score = pd.to_numeric(df["score"], errors="coerce")
    ts = pd.to_datetime(df["submitted_at"], errors="coerce", utc=True)
    reasons = []
    dup = df.duplicated("run_id", keep="first")
    for i, row in df.iterrows():
        r = []
        if dup.iloc[i]: r.append("duplicate run_id")
        if pd.isna(score.iloc[i]): r.append("missing score" if row["score"] == "" else "non-numeric score")
        if pd.notna(score.iloc[i]) and not 0 <= score.iloc[i] <= 10: r.append("score outside expected 0-10 range")
        if pd.isna(ts.iloc[i]): r.append("invalid timestamp")
        if r: reasons.append({"run_id": row["run_id"], "model": row["model"], "score": row["score"], "reason": "; ".join(r)})
    return pd.DataFrame(reasons)

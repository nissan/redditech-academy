import json
import pandas as pd

def groupby_provider(path: str) -> pd.DataFrame:
    rows = json.load(open(path))
    df = pd.DataFrame(rows)
    return (df.groupby("provider", dropna=False)
        .agg(count=("model", "count"), avg_quality_score=("quality_score", "mean"), median_ttft_ms=("ttft_ms", "median"))
        .reset_index()
        .sort_values("avg_quality_score", ascending=False)
        .round(2))

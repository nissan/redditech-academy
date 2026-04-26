import json
import pandas as pd

def blended_price(path: str) -> dict:
    df = pd.DataFrame(json.load(open(path)))
    summary = df.groupby("model").agg(price=("cost_per_1k_tokens", "mean"))
    return {k: round(float(v), 6) for k, v in summary["price"].items()}

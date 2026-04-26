import pandas as pd

def provider_report(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["success"] = df["status_code"].between(200, 299)
    df["timeout"] = df["error_type"].eq("timeout")
    out = df.groupby("provider").agg(
        request_count=("request_id", "count"),
        success_count=("success", "sum"),
        timeout_count=("timeout", "sum"),
        p95_latency_ms=("latency_ms", lambda s: s.quantile(0.95)),
    ).reset_index()
    out["success_rate"] = (out["success_count"] / out["request_count"]).round(3)
    out["timeout_rate"] = (out["timeout_count"] / out["request_count"]).round(3)
    return out[["provider", "request_count", "success_count", "timeout_count", "success_rate", "timeout_rate", "p95_latency_ms"]]

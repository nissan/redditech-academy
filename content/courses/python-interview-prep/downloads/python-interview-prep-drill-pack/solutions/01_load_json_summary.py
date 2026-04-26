import json
from pathlib import Path

def load_json_summary(path: str) -> dict:
    with open(Path(path)) as f:
        data = json.load(f)
    fields = sorted(data[0].keys()) if data else []
    return {"total_records": len(data), "fields": fields, "sample": data[:2]}

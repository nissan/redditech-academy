import json
from pathlib import Path

def parse_jsonl(path: str) -> dict:
    rows = []
    bad = 0
    blank = 0
    for line in Path(path).read_text().splitlines():
        if not line.strip():
            blank += 1
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            bad += 1
    return {"valid_rows": len(rows), "bad_line_count": bad, "blank_line_count": blank, "models": [r.get("model") for r in rows]}

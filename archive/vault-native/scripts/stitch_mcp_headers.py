#!/usr/bin/env python3
"""Supply the Stitch MCP API key from this project's ignored .env file."""

import json
import sys
from pathlib import Path


ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
HEADER_NAME = "X-Goog-Api-Key"


def main() -> int:
    try:
        lines = ENV_FILE.read_text(encoding="utf-8").splitlines()
    except OSError:
        print(f"Unable to read Stitch credentials from {ENV_FILE}", file=sys.stderr)
        return 1

    api_key = None
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = (part.strip() for part in line.split("=", 1))
        if name.removeprefix("export ").strip('"\'') != HEADER_NAME:
            continue
        if value.startswith('"'):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                print(f"Invalid {HEADER_NAME} value in {ENV_FILE}", file=sys.stderr)
                return 1
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1]
        api_key = value
        break

    if not isinstance(api_key, str) or not api_key.strip():
        print(f"Missing {HEADER_NAME} in {ENV_FILE}", file=sys.stderr)
        return 1

    # Codex consumes this JSON as request headers; never log the value elsewhere.
    print(json.dumps({HEADER_NAME: api_key}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

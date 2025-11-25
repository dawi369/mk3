#!/usr/bin/env python3

import requests
import os
import sys
from datetime import datetime
import json

# === Configuration ===
API_BASE = "https://api.massive.com/futures/vX"  # adjust version/vX as needed
API_KEY = "OFppwBA23w4CTOjMNUm02eeNLziPtIMc"  # set your Massive API key in env
API_SECRET = ""  # if required
OUTPUT_DIR = "./schedules_out"


# === Helpers ===
def fetch_schedules(session_end_date=None, trading_venue=None, limit=100, sort=None):
    url = f"{API_BASE}/schedules"
    params = {}
    if session_end_date:
        params["session_end_date"] = session_end_date
    if trading_venue:
        params["trading_venue"] = trading_venue
    if limit:
        params["limit"] = limit
    if sort:
        params["sort"] = sort

    print(f"Fetching schedules for date={session_end_date} venue={trading_venue} …")
    resp = requests.get(
        url, params=params, headers={"Authorization": f"Bearer {API_KEY}"}
    )
    resp.raise_for_status()
    data = resp.json()
    return data


def save_response(data, session_end_date):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    fname = f"schedules_{session_end_date}.json"
    path = os.path.join(OUTPUT_DIR, fname)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved data to {path}")


# === Main logic ===
def main():
    # Example: use today’s date if not provided
    if len(sys.argv) > 1:
        session_end_date = sys.argv[1]
    else:
        session_end_date = datetime.utcnow().strftime("%Y-%m-%d")

    # Optionally pass trading_venue as second arg
    trading_venue = sys.argv[2] if len(sys.argv) > 2 else None

    data = fetch_schedules(
        session_end_date=session_end_date, trading_venue=trading_venue
    )
    save_response(data, session_end_date)


if __name__ == "__main__":
    main()

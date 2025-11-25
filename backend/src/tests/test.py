url = "https://api.massive.com/futures/vX/contracts?product_code=HG&active=true&type=all&limit=1000&sort=product_code.asc&apiKey=OFppwBA23w4CTOjMNUm02eeNLziPtIMc"

import requests


def get_unique_tickers(api_url):
    tickers = set()
    current_url = api_url
    while current_url:
        print(f"Fetching: {current_url}")
        response = requests.get(current_url)
        response.raise_for_status()
        data = response.json()

        for contract in data.get("results", []):
            tickers.add(contract["ticker"][2])

        current_url = data.get("next_url")
        if current_url and "apiKey" not in current_url:
            current_url += "&apiKey=OFppwBA23w4CTOjMNUm02eeNLziPtIMc"

    return sorted(tickers)


if __name__ == "__main__":
    unique_tickers = get_unique_tickers(url)
    print("Unique tickers:")
    for t in unique_tickers:
        print(t)

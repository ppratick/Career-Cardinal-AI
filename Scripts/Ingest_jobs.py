import argparse
import sys 
import time
from urllib.parse import urlencode 
import requests


def build_url(base_url: str, query: str, page: int, country: str, date_posted: str) -> str:
    params = {
        "query": query, 
        "page": page, 
        "country": country, 
        "date_posted": date_posted,
    }
    return f"{base_url}/api/jobs/search?{urlencode(params)}"

def ingest_queries(
        base_url,
        queries,
        start_page,
        pages,
        country,
        date_posted,
        delay_sec,
):
    total = 0
    for query in queries:
        for page in range(start_page, start_page + pages):
            url = build_url(base_url, query, page, country, date_posted)
            print(f"Ingesting: query='{query}', page={page}, country={country}, date_posted={date_posted}") 
            try:
                response = requests.get(url, timeout=30)
                if response.status_code != 200:
                    print(f"HTTP {response.status_code}: {response.text[:200]}") 
                    continue
                data = response.json()
                count = int(data.get("count", 0))
                print(f"Upserted/processed {count} jobs")
                total += count
            except Exception as e:
                print(f"Error: {e}")
            if delay_sec > 0:
                time.sleep(delay_sec)
    return total


def main(argv):
    parser = argparse.ArgumentParser(description="Batch-ingest jobs via backend ingest endpoint")
    parser.add_argument("--api-base", default="http://localhost:3000", help="Backend base URL")
    parser.add_argument("--query", action="append")
    parser.add_argument("--start-page", type = int, default = 1)
    parser.add_argument("--pages", type = int, default = 3)
    parser.add_argument("--country", default="us", help="Country code")
    parser.add_argument("--date-posted", default="week", help="Date filter")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between calls")

    args = parser.parse_args(argv)


    queries = args.query if args.query else [
        "software engineer",
        "software developer",
        "SWE",
    ]


    print(f"Backend: {args.api_base} | queries={queries}")

    total = ingest_queries(
        base_url=args.api_base, 
        queries=queries,
        start_page=args.start_page,
        pages=args.pages,
        country=args.country,
        date_posted=args.date_posted,
        delay_sec=args.delay, 
    )

    print(f"Done. Processed {total} jobs across all calls.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

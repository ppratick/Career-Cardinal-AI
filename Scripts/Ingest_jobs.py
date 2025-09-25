import argparse #Parse cmnd line args
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
    for q in queries:
        for p in range(start_page, (start_page + pages)):
            url = build_url(base_url, q, p, country, date_posted)
            print(f"Ingesting: query='{q}") # Fill this in later 
            try:
                resp = requests.get(url, timeout=30)
                if resp.status_code != 200:
                    # print("FILL IN later") print error with first 200 chars opf response 
                    continue
                data = resp.json()
                count = int(data.get("count", 0))
                # print success message with count
                total += count
            except Exception as e:
                print("fill in later, error message")
            if delay_sec > 0:
                time.sleep(delay_sec)
    return total


def main(argv):
    parser = argparse.ArgumentParser(description="Batch-ingest jobs via backend injest endpoint")
    parser.add_argument("--api-base", default="http://localhost:3000", help="Backend base URL")
    parser.add_argument("--query", action="append")
    parser.add_argument("--start-page", type = int, default = 1)
    parser.add_argument("--pages", type = int, default = 3)
    #
    #

    args = parser.parse_args(argv)


    queries = args.query if args.query else [
        "software engineer",
        "software developer",
        "SWE",
    ]


    # print(f"Backend: {args.api_base} | queries={queries}")

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





# name = "Ethan"
# age = 25
# float_num = 3.14
# is_student = True
# text = 'single quotes works too'
# fruits = ["apple", "banaana"]
# numbers = [1, 2, 3, 4, 5]

# result = build_url()

# if age >= 18:
#     print("Adult")
# elif age >= 13:
#     print("Tennager")
# else:
#     print("Child")

# for i in fruits:
#     print(i)


# for i in range(len(fruits)):
#     print(i)

# for i in range(5):
#     print(i)

# for i in range(1, 6):
#     print(i)



# name = "Ethan"
# age = 17

# message = f"Hi {name}, you are {age} years old"
# print(message)

# first_fruit = fruits[0]
# last_fruit = fruits[-1]

# fruits.append("grape")


# person = {"name": "Ethan", "age": 17}

# name = person["name"]
# age = person.get("age", 0)
# person["age"] = 20
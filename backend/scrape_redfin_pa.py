import csv
import random
import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

PA_ZIP_CODES = [
    "19038", "19104", "19111", "19124", "19128",
    "15213", "15217", "15222", "15232",
    "16801", "16803",
    "17101", "17102", "17601",
    "18018", "18102",
    "18503", "19601",
    "19380", "19406",
    "19020", "19067",
]

OUTPUT_FILE = "housing_data.csv"


def parse_price(text):
    match = re.search(r"\$([\d,]+)", text)
    if not match:
        return None
    return float(match.group(1).replace(",", ""))


def parse_beds_baths_sqft(text):
    pattern = r"(\d+\.?\d*)\s*beds?\s+(\d+\.?\d*)\s*baths?\s+([\d,]+)\s*sq\s*ft"
    match = re.search(pattern, text, re.IGNORECASE)

    if not match:
        return None, None, None

    beds = float(match.group(1))
    baths = float(match.group(2))
    sqft = float(match.group(3).replace(",", ""))

    return beds, baths, sqft


def save_rows(rows):
    file_exists = Path(OUTPUT_FILE).exists()

    with open(OUTPUT_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["Beds", "Baths", "SQFT", "Price", "Zip_Code", "Address"]
        )

        if not file_exists:
            writer.writeheader()

        writer.writerows(rows)


def scrape_zip(page, zip_code):
    url = f"https://www.redfin.com/zipcode/{zip_code}"
    print(f"\nScraping {zip_code}: {url}")

    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(random.randint(4000, 7000))

    for _ in range(5):
        page.mouse.wheel(0, random.randint(900, 1400))
        page.wait_for_timeout(random.randint(1000, 2500))

    try:
        page.wait_for_selector("body", timeout=15000)
    except PlaywrightTimeoutError:
        print(f"Page did not load for {zip_code}")
        return []

    body_text = page.locator("body").inner_text(timeout=15000)

    if "Access Denied" in body_text or "verify" in body_text.lower():
        print(f"Blocked or verification page for {zip_code}")
        page.screenshot(path=f"blocked_{zip_code}.png", full_page=True)
        return []

    lines = [line.strip() for line in body_text.splitlines() if line.strip()]

    rows = []

    for i, line in enumerate(lines):
        price = parse_price(line)

        if price is None:
            continue

        nearby_text = " ".join(lines[i:i + 8])
        beds, baths, sqft = parse_beds_baths_sqft(nearby_text)

        if beds is None or baths is None or sqft is None:
            continue

        address = ""
        for possible_line in lines[i:i + 10]:
            if zip_code in possible_line and "," in possible_line:
                address = possible_line
                break

        rows.append({
            "Beds": beds,
            "Baths": baths,
            "SQFT": sqft,
            "Price": price,
            "Zip_Code": zip_code,
            "Address": address
        })

    # Remove duplicates
    unique = []
    seen = set()

    for row in rows:
        key = (row["Price"], row["Beds"], row["Baths"], row["SQFT"], row["Address"])
        if key not in seen:
            seen.add(key)
            unique.append(row)

    print(f"Extracted {len(unique)} usable listings")
    return unique


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )

        context = browser.new_context(
            viewport={"width": 1400, "height": 1000},
            user_agent=(
                "Mozilla/5.0 (X11; Linux aarch64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )

        page = context.new_page()

        for zip_code in PA_ZIP_CODES:
            rows = scrape_zip(page, zip_code)

            if rows:
                save_rows(rows)

            wait_time = random.randint(8, 15)
            print(f"Waiting {wait_time} seconds...")
            time.sleep(wait_time)

        browser.close()

    print("\nDone. Data saved to housing_data.csv")


if __name__ == "__main__":
    main()
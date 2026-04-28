import csv
import random
import re
import time
from pathlib import Path
from urllib.parse import urljoin

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
MAX_PROPERTIES_PER_ZIP = 20


def clean_number(text):
    if not text:
        return None
    text = text.replace(",", "").replace("$", "")
    match = re.search(r"\d+(\.\d+)?", text)
    return float(match.group()) if match else None


def safe_text(page, selector, timeout=3000):
    try:
        locator = page.locator(selector).first
        if locator.count() > 0:
            return locator.inner_text(timeout=timeout).strip()
    except Exception:
        pass
    return ""


def collect_property_links(page, zip_code):
    search_url = f"https://www.redfin.com/zipcode/{zip_code}"
    print(f"\nOpening zip page: {search_url}")

    page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(random.randint(4000, 7000))

    for _ in range(5):
        page.mouse.wheel(0, random.randint(900, 1400))
        page.wait_for_timeout(random.randint(1500, 3000))

    links = page.locator("a").evaluate_all("""
        anchors => anchors
            .map(a => a.href)
            .filter(href => href && href.includes('/home/'))
    """)

    cleaned_links = []
    seen = set()

    for link in links:
        if link not in seen:
            seen.add(link)
            cleaned_links.append(link)

    print(f"Found {len(cleaned_links)} property links for {zip_code}")

    return cleaned_links[:MAX_PROPERTIES_PER_ZIP]


def scrape_property_page(page, url, zip_code):
    print(f"  Scraping property: {url}")

    page.goto(url, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(random.randint(3000, 6000))

    body_text = page.locator("body").inner_text(timeout=15000)

    if "Access Denied" in body_text or "verify" in body_text.lower():
        print("  Blocked or verification page.")
        return None

    address = safe_text(page, "h1")
    price_text = safe_text(page, ".statsValue.price")

    if not price_text:
        price_text = safe_text(page, '[data-rf-test-id="abp-price"]')

    price = clean_number(price_text)

    beds = None
    baths = None
    sqft = None

    stats_text = body_text

    bed_match = re.search(r"(\d+\.?\d*)\s*Beds?", stats_text, re.IGNORECASE)
    bath_match = re.search(r"(\d+\.?\d*)\s*Baths?", stats_text, re.IGNORECASE)
    sqft_match = re.search(r"([\d,]+)\s*Sq\.?\s*Ft\.?", stats_text, re.IGNORECASE)

    if bed_match:
        beds = clean_number(bed_match.group(1))

    if bath_match:
        baths = clean_number(bath_match.group(1))

    if sqft_match:
        sqft = clean_number(sqft_match.group(1))

    property_type = "Unknown"
    property_type_match = re.search(r"Property Type\s+([A-Za-z \-/]+)", body_text)
    if property_type_match:
        property_type = property_type_match.group(1).strip()

    property_id = ""
    if "/home/" in url:
        property_id = url.split("/home/")[-1].split("?")[0]

    if not price or not beds or not baths or not sqft:
        print("  Missing required fields, skipping.")
        return None

    return {
        "Beds": beds,
        "Baths": baths,
        "SQFT": sqft,
        "Price": price,
        "Zip_Code": zip_code,
        "Address": address,
        "Property_ID": property_id,
        "Property_Type": property_type,
        "URL": url,
    }


def save_rows(rows):
    file_exists = Path(OUTPUT_FILE).exists()

    with open(OUTPUT_FILE, "a", newline="", encoding="utf-8") as csvfile:
        fieldnames = [
            "Beds",
            "Baths",
            "SQFT",
            "Price",
            "Zip_Code",
            "Address",
            "Property_ID",
            "Property_Type",
            "URL",
        ]

        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerows(rows)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--window-size=1400,1000",
            ],
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
            rows = []

            try:
                links = collect_property_links(page, zip_code)

                for link in links:
                    property_data = scrape_property_page(page, link, zip_code)

                    if property_data:
                        rows.append(property_data)

                    time.sleep(random.randint(4, 8))

                if rows:
                    save_rows(rows)

                print(f"Saved {len(rows)} properties for {zip_code}")

            except Exception as e:
                print(f"Error scraping {zip_code}: {e}")

            wait_time = random.randint(10, 20)
            print(f"Waiting {wait_time} seconds before next zip...")
            time.sleep(wait_time)

        browser.close()

    print("\nDone. Data saved to housing_data.csv")


if __name__ == "__main__":
    main()
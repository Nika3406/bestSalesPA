import os
import re
import time
import random
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


app = FastAPI(title="Best Sales PA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEAL_DATA_FILE = "housing_data_with_deal_scores.csv"
REGION_MARKET_FILE = "region_market_summary.csv"
ZIP_MARKET_FILE = "zip_market_summary.csv"


def zip_to_region(zip_code):
    zip_code = str(zip_code).zfill(5)

    if zip_code.startswith("15"):
        return "Pittsburgh Area"
    if zip_code.startswith("16"):
        return "State College Area"
    if zip_code.startswith("17"):
        return "Central PA"
    if zip_code.startswith("18"):
        return "Lehigh Valley / Scranton Area"
    if zip_code.startswith("19"):
        return "Philadelphia / Southeast PA Area"

    return "Other PA"


def clean_number(text):
    if not text:
        return None

    text = text.replace(",", "").replace("$", "")
    match = re.search(r"\d+(\.\d+)?", text)

    if match:
        return float(match.group())

    return None


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


def get_market_price_per_sqft(zip_code):
    zip_code = str(zip_code).zfill(5)
    region = zip_to_region(zip_code)

    if os.path.exists(ZIP_MARKET_FILE):
        zip_market = pd.read_csv(ZIP_MARKET_FILE, dtype={"Zip_Code": str})
        zip_market["Zip_Code"] = zip_market["Zip_Code"].str.zfill(5)

        match = zip_market[zip_market["Zip_Code"] == zip_code]

        if not match.empty:
            return float(match.iloc[0]["avg_price_per_sqft"]), "zip-specific market average"

    if os.path.exists(REGION_MARKET_FILE):
        region_market = pd.read_csv(REGION_MARKET_FILE)

        match = region_market[region_market["Region"] == region]

        if not match.empty:
            return float(match.iloc[0]["avg_price_per_sqft"]), "regional market average"

    if os.path.exists(DEAL_DATA_FILE):
        df = pd.read_csv(DEAL_DATA_FILE)
        return float(df["Price_Per_SQFT"].mean()), "global PA market average"

    return 250.0, "default fallback average"


def label_deal(savings_percent):
    if savings_percent >= 30:
        return "Excellent Steal"
    if savings_percent >= 15:
        return "Good Deal"
    if savings_percent >= 5:
        return "Fair Deal"
    if savings_percent >= -5:
        return "Fair Price"

    return "Possibly Overpriced"


def scrape_redfin_zip(zip_code):
    zip_code = str(zip_code).zfill(5)
    url = f"https://www.redfin.com/zipcode/{zip_code}"
    listings = []

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

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(random.randint(4000, 7000))

            for _ in range(5):
                page.mouse.wheel(0, random.randint(900, 1400))
                page.wait_for_timeout(random.randint(1000, 2500))

            body_text = page.locator("body").inner_text(timeout=15000)

            if "Access Denied" in body_text or "verify" in body_text.lower():
                browser.close()
                return []

            # This extracts visible Redfin card data directly from the ZIP page.
            raw_cards = page.locator("a[href*='/home/']").evaluate_all(
                """
                anchors => anchors.map(a => {
                    const href = a.href;

                    let card = a;
                    for (let i = 0; i < 6; i++) {
                        if (!card.parentElement) break;
                        card = card.parentElement;

                        const text = card.innerText || '';
                        if (
                            text.includes('$') &&
                            text.toLowerCase().includes('bed') &&
                            text.toLowerCase().includes('bath') &&
                            text.toLowerCase().includes('sq ft')
                        ) {
                            break;
                        }
                    }

                    return {
                        url: href,
                        text: card.innerText || ''
                    };
                })
                """
            )

            seen_urls = set()

            for card in raw_cards:
                property_url = card.get("url", "").split("?")[0]
                text = card.get("text", "")

                if not property_url or property_url in seen_urls:
                    continue

                seen_urls.add(property_url)

                price = parse_price(text)
                beds, baths, sqft = parse_beds_baths_sqft(text)

                if not price or not beds or not baths or not sqft:
                    continue

                # Guardrails against bad Redfin page text like $145 / $200
                if price < 50000 or price > 10000000:
                    continue

                if sqft <= 0:
                    continue

                price_per_sqft = price / sqft

                if price_per_sqft < 50 or price_per_sqft > 1500:
                    continue

                address = ""

                # Try to find an address-like line inside the card text
                lines = [line.strip() for line in text.splitlines() if line.strip()]

                for line in lines:
                    if zip_code in line:
                        address = line
                        break

                if not address:
                    for line in lines:
                        if "," in line and any(state in line for state in ["PA", "Pennsylvania"]):
                            address = line
                            break

                if not address and lines:
                    # fallback, usually the visible card title/address
                    address = lines[-1]

                listings.append({
                    "Address": address,
                    "Zip_Code": zip_code,
                    "Beds": beds,
                    "Baths": baths,
                    "SQFT": sqft,
                    "Price": price,
                    "URL": property_url,
                })

        except PlaywrightTimeoutError:
            pass
        except Exception as e:
            print(f"Scrape error for {zip_code}: {e}")

        browser.close()

    # Deduplicate by URL
    unique = []
    seen = set()

    for listing in listings:
        if listing["URL"] not in seen:
            seen.add(listing["URL"])
            unique.append(listing)

    return unique


class HouseSearchRequest(BaseModel):
    city: str | None = None
    zip_code: str
    max_price: float
    min_beds: float
    min_baths: float
    min_sqft: float


@app.get("/")
def home():
    return {"message": "Best Sales PA backend is running"}


@app.post("/top-houses-any-zip")
def top_houses_any_zip(request: HouseSearchRequest):
    zip_code = str(request.zip_code).zfill(5)
    region = zip_to_region(zip_code)

    listings = scrape_redfin_zip(zip_code)

    if not listings:
        return {
            "count": 0,
            "message": "No listings were found or the page blocked scraping. Try another zip code.",
            "houses": [],
        }

    market_ppsqft, market_source = get_market_price_per_sqft(zip_code)

    scored_houses = []

    for house in listings:
        price = float(house["Price"])
        sqft = float(house["SQFT"])
        beds = float(house["Beds"])
        baths = float(house["Baths"])

        if sqft <= 0:
            continue

        if price > request.max_price:
            continue

        if beds < request.min_beds:
            continue

        if baths < request.min_baths:
            continue

        if sqft < request.min_sqft:
            continue

        # Reject non-home prices accidentally scraped from Redfin page text
        if price < 50000:
            continue

        price_per_sqft = price / sqft
        if price_per_sqft < 50 or price_per_sqft > 1500:
            continue
        estimated_market_value = market_ppsqft * sqft
        estimated_savings = estimated_market_value - price

        savings_percent = 0
        if estimated_market_value > 0:
            savings_percent = (estimated_savings / estimated_market_value) * 100

        deal = label_deal(savings_percent)

        pitch = (
            f"This home is listed at ${price:,.0f}, or about ${price_per_sqft:,.0f}/sqft. "
            f"Using the {market_source}, the estimated market value is about "
            f"${estimated_market_value:,.0f}. "
        )

        if estimated_savings > 0:
            pitch += (
                f"That suggests it may be about ${estimated_savings:,.0f} under expected value, "
                f"so it is labeled as a {deal.lower()}."
            )
        else:
            pitch += (
                f"That suggests it may be about ${abs(estimated_savings):,.0f} above expected value, "
                f"so it is labeled as {deal.lower()}."
            )

        scored_houses.append({
            "address": house["Address"],
            "url": house["URL"],
            "zip_code": zip_code,
            "region": region,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "price": price,
            "price_per_sqft": round(price_per_sqft, 2),
            "market_price_per_sqft": round(market_ppsqft, 2),
            "market_source": market_source,
            "estimated_market_value": round(estimated_market_value, 2),
            "estimated_savings": round(estimated_savings, 2),
            "savings_percent": round(savings_percent, 2),
            "deal_label": deal,
            "sales_pitch": pitch,
        })

    scored_houses = sorted(
        scored_houses,
        key=lambda x: (x["savings_percent"], x["estimated_savings"]),
        reverse=True,
    )

    top_10 = scored_houses[:10]

    return {
        "count": len(top_10),
        "zip_code": zip_code,
        "region": region,
        "market_source": market_source,
        "message": f"Found top {len(top_10)} matching houses in {zip_code}.",
        "houses": top_10,
    }
import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Best Sales PA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

region_classifier = joblib.load("region_classifier.pkl")
price_model = joblib.load("price_model.pkl")
zip_market = joblib.load("zip_market_summary.pkl")
region_market = joblib.load("region_market_summary.pkl")


class HousePreference(BaseModel):
    city: str
    desired_zip: str
    price: float
    beds: float
    baths: float
    sqft: float


@app.get("/")
def home():
    return {"message": "Best Sales PA backend is running"}


@app.post("/recommend")
def recommend_house(preference: HousePreference):
    desired_zip = str(preference.desired_zip).zfill(5)

    if preference.sqft <= 0:
        return {"error": "SQFT must be greater than 0"}

    price_per_sqft = preference.price / preference.sqft

    model_input = pd.DataFrame([{
        "Beds": preference.beds,
        "Baths": preference.baths,
        "SQFT": preference.sqft,
        "Price": preference.price,
        "Price_Per_SQFT": price_per_sqft,
    }])

    predicted_region = region_classifier.predict(model_input)[0]

    price_input = pd.DataFrame([{
        "Beds": preference.beds,
        "Baths": preference.baths,
        "SQFT": preference.sqft,
        "Price_Per_SQFT": price_per_sqft,
    }])

    estimated_market_price = float(price_model.predict(price_input)[0])
    estimated_savings = estimated_market_price - preference.price

    savings_percent = 0
    if estimated_market_price > 0:
        savings_percent = (estimated_savings / estimated_market_price) * 100

    if savings_percent >= 30:
        deal_quality = "Excellent Steal"
    elif savings_percent >= 15:
        deal_quality = "Good Deal"
    elif savings_percent >= 5:
        deal_quality = "Fair Deal"
    elif savings_percent >= -5:
        deal_quality = "Fair Price"
    else:
        deal_quality = "Possibly Overpriced"

    pitch = (
        f"Based on your preferences, this home best matches the {predicted_region}. "
        f"The estimated market value is about ${estimated_market_price:,.0f}. "
    )

    if estimated_savings > 0:
        pitch += (
            f"Your target price is about ${estimated_savings:,.0f} below the model estimate, "
            f"which makes it a {deal_quality.lower()}."
        )
    else:
        pitch += (
            f"Your target price is about ${abs(estimated_savings):,.0f} above the model estimate, "
            f"so this may not be the strongest deal."
        )

    return {
        "city": preference.city,
        "desired_zip": desired_zip,
        "predicted_region": predicted_region,
        "estimated_market_price": round(estimated_market_price, 2),
        "user_price": preference.price,
        "price_per_sqft": round(price_per_sqft, 2),
        "estimated_savings": round(estimated_savings, 2),
        "savings_percent": round(savings_percent, 2),
        "deal_quality": deal_quality,
        "sales_pitch": pitch,
    }
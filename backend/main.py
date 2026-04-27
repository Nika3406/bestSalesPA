from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np


app = FastAPI(title="Best Sales PA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

zip_model = joblib.load("zip_model.pkl")
price_model = joblib.load("price_model.pkl")
zip_averages = joblib.load("zip_averages.pkl")


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
    model_input = np.array([[
        preference.beds,
        preference.baths,
        preference.sqft,
        preference.price
    ]])

    predicted_zip = zip_model.predict(model_input)[0]

    estimated_price = price_model.predict(np.array([[
        preference.beds,
        preference.baths,
        preference.sqft
    ]]))[0]

    deal_score = estimated_price - preference.price

    if deal_score >= 75000:
        deal_quality = "Excellent Steal"
        pitch = (
            f"This looks like a strong deal. Based on the house size and features, "
            f"similar homes are estimated around ${estimated_price:,.0f}, while your target price is "
            f"${preference.price:,.0f}."
        )
    elif deal_score >= 25000:
        deal_quality = "Good Deal"
        pitch = (
            f"This appears fairly attractive for the region. The home may be priced below what "
            f"similar homes usually cost."
        )
    elif deal_score >= -25000:
        deal_quality = "Fair Price"
        pitch = (
            f"This house looks close to market value. It may not be a huge steal, but it is not clearly overpriced either."
        )
    else:
        deal_quality = "Possibly Overpriced"
        pitch = (
            f"This may be overpriced compared to similar homes. You may want to negotiate or compare more listings."
        )

    desired_zip_match = str(predicted_zip) == str(preference.desired_zip)

    return {
        "city": preference.city,
        "desired_zip": preference.desired_zip,
        "predicted_zip": str(predicted_zip),
        "desired_zip_match": desired_zip_match,
        "estimated_market_price": round(float(estimated_price), 2),
        "user_price": preference.price,
        "deal_score": round(float(deal_score), 2),
        "deal_quality": deal_quality,
        "sales_pitch": pitch
    }
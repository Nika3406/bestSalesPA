# KeyStonePA — Best Sales PA Housing Deal Finder

## Project Description
KeyStonePA is a machine learning web application built for the CMPSC 445 “Best in PA” final project. The application helps users search Pennsylvania housing listings and identify which homes may be strong deals based on price, square footage, and local market patterns.

The user enters a ZIP code and preferences such as maximum price, minimum beds, minimum baths, and minimum square footage. The backend scrapes current Redfin listings for that ZIP code, scores each home using a trained price-per-square-foot market model, and returns the top 10 matching homes labeled as Excellent Steal, Good Deal, Fair Deal, Fair Price, or Possibly Overpriced.

## Tech Stack
- React.js
- FastAPI
- Python
- Playwright
- scikit-learn
- pandas
- CSV dataset

## Main Features
- Search homes by ZIP code and user preferences
- Scrape current Redfin listing data with Playwright
- Calculate price per square foot
- Estimate market value using trained market averages
- Rank homes by estimated savings
- Display top 10 matching listings
- Save and compare listings

## Machine Learning Logic
The main value score is based on:

Estimated Market Value = Local Market Price Per SQFT × House SQFT

Estimated Savings = Estimated Market Value − Listing Price

Savings Percent = Estimated Savings / Estimated Market Value × 100

## Models
The project includes:
- Region classification model using Logistic Regression
- Price prediction model using Random Forest Regression
- Baseline price model using Ridge Regression
- Deal scoring system based on price-per-square-foot comparison

## How to Run

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python train_model.py
uvicorn main:app --reload
```
### Frontend
```bash
cd frontend
npm install
npm start
```
### Backend Endpoint
```
POST /top-houses-any-zip
```

### Example request:
```json
{
  "city": "Southampton",
  "zip_code": "18966",
  "max_price": 750000,
  "min_beds": 3,
  "min_baths": 2,
  "min_sqft": 1500
}
```

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


DATA_FILE = "housing_data.csv"


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


def load_and_clean_data():
    df = pd.read_csv(DATA_FILE, dtype={"Zip_Code": str})

    df["Zip_Code"] = df["Zip_Code"].str.zfill(5)

    numeric_cols = ["Beds", "Baths", "SQFT", "Price"]

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=numeric_cols + ["Zip_Code"])

    df = df[
        (df["Beds"] >= 1) & (df["Beds"] <= 10) &
        (df["Baths"] >= 1) & (df["Baths"] <= 10) &
        (df["SQFT"] >= 300) & (df["SQFT"] <= 10000) &
        (df["Price"] >= 30000) & (df["Price"] <= 5000000)
    ]

    df["Price_Per_SQFT"] = df["Price"] / df["SQFT"]
    df["Region"] = df["Zip_Code"].apply(zip_to_region)

    return df


def train_region_classifier(df):
    X = df[["Beds", "Baths", "SQFT", "Price", "Price_Per_SQFT"]]
    y = df["Region"]

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=3000))
    ])

    class_counts = y.value_counts()
    can_stratify = class_counts.min() >= 2 and len(df) >= 30

    if can_stratify:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=y,
        )
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
        )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    print("\n=== REGION CLASSIFICATION MODEL ===")
    print("Accuracy:", round(accuracy_score(y_test, predictions), 4))
    print(classification_report(y_test, predictions, zero_division=0))

    joblib.dump(model, "region_classifier.pkl")
    return model


def train_price_model(df):
    X = df[["Beds", "Baths", "SQFT", "Price_Per_SQFT"]]
    y = df["Price"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=250,
        random_state=42,
        min_samples_leaf=3,
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    print("\n=== PRICE PREDICTION MODEL ===")
    print("Mean Absolute Error:", round(mean_absolute_error(y_test, predictions), 2))
    print("R² Score:", round(r2_score(y_test, predictions), 4))

    joblib.dump(model, "price_model.pkl")
    return model


def train_baseline_price_model(df):
    """
    Simpler linear model for report comparison.
    This helps show that you tested multiple approaches.
    """
    X = df[["Beds", "Baths", "SQFT"]]
    y = df["Price"]

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("regressor", Ridge(alpha=1.0))
    ])

    model.fit(X, y)
    joblib.dump(model, "baseline_price_model.pkl")

    return model


def build_market_tables(df):
    zip_market = (
        df.groupby("Zip_Code")
        .agg(
            avg_price=("Price", "mean"),
            median_price=("Price", "median"),
            avg_price_per_sqft=("Price_Per_SQFT", "mean"),
            median_price_per_sqft=("Price_Per_SQFT", "median"),
            listing_count=("Price", "count"),
        )
        .reset_index()
    )

    region_market = (
        df.groupby("Region")
        .agg(
            avg_price=("Price", "mean"),
            median_price=("Price", "median"),
            avg_price_per_sqft=("Price_Per_SQFT", "mean"),
            median_price_per_sqft=("Price_Per_SQFT", "median"),
            listing_count=("Price", "count"),
        )
        .reset_index()
    )

    zip_market.to_csv("zip_market_summary.csv", index=False)
    region_market.to_csv("region_market_summary.csv", index=False)

    joblib.dump(zip_market, "zip_market_summary.pkl")
    joblib.dump(region_market, "region_market_summary.pkl")

    print("\n=== MARKET TABLES SAVED ===")
    print("zip_market_summary.csv")
    print("region_market_summary.csv")


def create_deal_scores(df):
    # Compute average price per sqft per zip
    zip_avg_ppsqft = df.groupby("Zip_Code")["Price_Per_SQFT"].transform("mean")

    df["Zip_Avg_Price_Per_SQFT"] = zip_avg_ppsqft

    # Core deal calculations
    df["Deal_Score_Per_SQFT"] = df["Zip_Avg_Price_Per_SQFT"] - df["Price_Per_SQFT"]
    df["Estimated_Value_From_Zip_Avg"] = df["Zip_Avg_Price_Per_SQFT"] * df["SQFT"]
    df["Estimated_Savings"] = df["Estimated_Value_From_Zip_Avg"] - df["Price"]

    # NEW: percentage-based deal metric
    df["Savings_Percent"] = (
        df["Estimated_Savings"] / df["Estimated_Value_From_Zip_Avg"]
    ) * 100

    # Clean out unrealistic / misleading deals
    df = df[
        (df["Estimated_Savings"] > 0) &         # must actually be a deal
        (df["Savings_Percent"] < 60)            # remove absurd outliers
    ]

    # Label deals
    def label_deal(row):
        if row["Savings_Percent"] >= 30:
            return "Excellent Steal"
        elif row["Savings_Percent"] >= 15:
            return "Good Deal"
        elif row["Savings_Percent"] >= 5:
            return "Fair Deal"
        else:
            return "Slight Value"

    df["Deal_Label"] = df.apply(label_deal, axis=1)

    # Sort smarter (not just huge houses)
    df = df.sort_values(
        ["Savings_Percent", "Estimated_Savings"],
        ascending=False
    )

    # Save full dataset
    df.to_csv("housing_data_with_deal_scores.csv", index=False)

    print("\n=== DEAL SCORE DATASET SAVED ===")
    print("housing_data_with_deal_scores.csv")

    print("\nTop 10 realistic deals:")
    cols = [
        "Zip_Code",
        "Beds",
        "Baths",
        "SQFT",
        "Price",
        "Price_Per_SQFT",
        "Savings_Percent",
        "Estimated_Savings",
        "Deal_Label"
    ]

    print(df[cols].head(10).to_string(index=False))


def main():
    df = load_and_clean_data()

    print("\n=== DATA SUMMARY ===")
    print("Rows after cleaning:", len(df))
    print("Zip codes:", df["Zip_Code"].nunique())
    print("Regions:", df["Region"].nunique())
    print("\nListings per region:")
    print(df["Region"].value_counts())

    df.to_csv("housing_data_cleaned.csv", index=False)

    train_region_classifier(df)
    train_price_model(df)
    train_baseline_price_model(df)
    build_market_tables(df)
    create_deal_scores(df)

    print("\nTraining complete.")
    print("Saved models:")
    print("- region_classifier.pkl")
    print("- price_model.pkl")
    print("- baseline_price_model.pkl")


if __name__ == "__main__":
    main()
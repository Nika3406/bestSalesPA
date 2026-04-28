import pandas as pd
import joblib

from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


df = pd.read_csv("housing_data.csv")

df = df.dropna()

X = df[["Beds", "Baths", "SQFT", "Price"]]
y = df["Zip_Code"].astype(str)

zip_model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(max_iter=2000))
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42
)

zip_model.fit(X_train, y_train)

predictions = zip_model.predict(X_test)

print("Zip Code Classification Accuracy:", accuracy_score(y_test, predictions))
print(classification_report(y_test, predictions))

price_X = df[["Beds", "Baths", "SQFT"]]
price_y = df["Price"]

price_model = LinearRegression()
price_model.fit(price_X, price_y)

zip_averages = df.groupby("Zip_Code")["Price"].mean().to_dict()

joblib.dump(zip_model, "zip_model.pkl")
joblib.dump(price_model, "price_model.pkl")
joblib.dump(zip_averages, "zip_averages.pkl")


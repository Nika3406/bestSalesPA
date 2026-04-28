import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [desiredZip, setDesiredZip] = useState("");

  const [price, setPrice] = useState(500000);
  const [beds, setBeds] = useState(3);
  const [baths, setBaths] = useState(2);
  const [sqft, setSqft] = useState(1500);

  const [result, setResult] = useState(null);

  const priceOptions = [250000, 500000, 750000, 1000000, 1500000];
  const bedOptions = [1, 2, 3, 4, 5];
  const bathOptions = [1, 2, 3, 4];
  const sqftOptions = [800, 1200, 1600, 2200, 3000];

  const handleSubmit = async () => {
    const payload = {
      city: city,
      desired_zip: desiredZip,
      price: Number(price),
      beds: Number(beds),
      baths: Number(baths),
      sqft: Number(sqft),
    };

    const response = await fetch("http://127.0.0.1:8000/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setResult(data);
  };

  const BubbleGroup = ({ title, options, selected, setSelected, prefix = "", suffix = "" }) => (
    <div className="bubble-section">
      <h3>{title}</h3>
      <div className="bubble-row">
        {options.map((option) => (
          <button
            key={option}
            className={selected === option ? "bubble active" : "bubble"}
            onClick={() => setSelected(option)}
          >
            {prefix}{option.toLocaleString()}{suffix}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="card">
        <h1>Best Sales PA</h1>
        <p className="subtitle">
          Find out whether your target home is a steal, fair price, or overpriced.
        </p>

        <div className="input-row">
          <input
            placeholder="City you want to live in"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <input
            placeholder="Desired zip code"
            value={desiredZip}
            onChange={(e) => setDesiredZip(e.target.value)}
          />
        </div>

        <BubbleGroup
          title="Price Range"
          options={priceOptions}
          selected={price}
          setSelected={setPrice}
          prefix="$"
        />

        <BubbleGroup
          title="Beds"
          options={bedOptions}
          selected={beds}
          setSelected={setBeds}
          suffix=" bed"
        />

        <BubbleGroup
          title="Baths"
          options={bathOptions}
          selected={baths}
          setSelected={setBaths}
          suffix=" bath"
        />

        <BubbleGroup
          title="Square Feet"
          options={sqftOptions}
          selected={sqft}
          setSelected={setSqft}
          suffix=" sqft"
        />

        <button className="submit-btn" onClick={handleSubmit}>
          Analyze House Deal
        </button>

        {result && (
          <div className="result-card">
            <h2>{result.deal_quality}</h2>

            <p>
              <strong>Desired Zip:</strong> {result.desired_zip}
            </p>

            <p>
              <strong>Predicted Market Region:</strong> {result.predicted_region}
            </p>

            <p>
              <strong>Estimated Market Price:</strong> $
              {Number(result.estimated_market_price).toLocaleString()}
            </p>

            <p>
              <strong>Your Target Price:</strong> $
              {Number(result.user_price).toLocaleString()}
            </p>

            <p>
              <strong>Price per SQFT:</strong> $
              {Number(result.price_per_sqft).toLocaleString()} / sqft
            </p>

            <p>
              <strong>Estimated Savings:</strong> $
              {Number(result.estimated_savings).toLocaleString()}
            </p>

            <p>
              <strong>Savings Percent:</strong> {result.savings_percent}%
            </p>

            <p className="pitch">{result.sales_pitch}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
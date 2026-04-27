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

  const priceOptions = [250000, 500000, 750000, 1000000];
  const bedOptions = [1, 2, 3, 4];
  const bathOptions = [1, 2, 3];
  const sqftOptions = [800, 1200, 1600, 2200];

  const handleSubmit = async () => {
    const payload = {
      city,
      desired_zip: desiredZip,
      price,
      beds,
      baths,
      sqft
    };

    const response = await fetch("http://127.0.0.1:8000/recommend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setResult(data);
  };

  const BubbleGroup = ({ title, options, selected, setSelected }) => (
    <div style={{ marginBottom: "20px" }}>
      <h3>{title}</h3>
      <div>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            style={{
              margin: "5px",
              padding: "10px",
              borderRadius: "20px",
              border: selected === option ? "2px solid blue" : "1px solid gray",
              background: selected === option ? "#2563eb" : "white",
              color: selected === option ? "white" : "black",
              cursor: "pointer"
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "30px" }}>
      <h1>Best Sales PA</h1>

      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />

      <input
        placeholder="Zip Code"
        value={desiredZip}
        onChange={(e) => setDesiredZip(e.target.value)}
      />

      <BubbleGroup title="Price" options={priceOptions} selected={price} setSelected={setPrice} />
      <BubbleGroup title="Beds" options={bedOptions} selected={beds} setSelected={setBeds} />
      <BubbleGroup title="Baths" options={bathOptions} selected={baths} setSelected={setBaths} />
      <BubbleGroup title="SQFT" options={sqftOptions} selected={sqft} setSelected={setSqft} />

      <button onClick={handleSubmit} style={{ marginTop: "20px", padding: "10px 20px" }}>
        Analyze
      </button>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>{result.deal_quality}</h2>
          <p>Predicted Zip: {result.predicted_zip}</p>
          <p>Estimated Price: ${result.estimated_market_price}</p>
          <p>Deal Score: ${result.deal_score}</p>
          <p>{result.sales_pitch}</p>
        </div>
      )}
    </div>
  );
}

export default App;
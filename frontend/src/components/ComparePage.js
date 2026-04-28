import React, { useState } from 'react';

export default function ComparePage() {
  const [saved] = useState(
    JSON.parse(localStorage.getItem('savedHomes') || '[]')
  );

  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  const compare = (x, y) => {
    if (!x || !y) return null;

    const scoreA = x.estimated_market_price - x.user_price;
    const scoreB = y.estimated_market_price - y.user_price;

    return scoreA > scoreB ? 'A is better deal' : 'B is better deal';
  };

  return (
    <div>
      <div className="card">
        <h2 className="section-heading">Compare Listings</h2>
        <p className="section-sub">Pick two saved homes</p>
      </div>

      <div className="card">
        <h3>Select A</h3>
        {saved.map((item, i) => (
          <button key={i} onClick={() => setA(item)} className="btn btn-secondary">
            {item.city} - ${item.user_price}
          </button>
        ))}
      </div>

      <div className="card">
        <h3>Select B</h3>
        {saved.map((item, i) => (
          <button key={i} onClick={() => setB(item)} className="btn btn-secondary">
            {item.city} - ${item.user_price}
          </button>
        ))}
      </div>

      {a && b && (
        <div className="card">
          <h3>Result</h3>
          <p>{compare(a, b)}</p>

          <p>A: {a.city} → ${a.user_price}</p>
          <p>B: {b.city} → ${b.user_price}</p>
        </div>
      )}
    </div>
  );
}
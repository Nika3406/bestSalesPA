import React, { useEffect, useState } from 'react';

export default function SavedListings() {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('savedHomes') || '[]');
    setSaved(data);
  }, []);

  const removeItem = (index) => {
    const updated = [...saved];
    updated.splice(index, 1);
    setSaved(updated);
    localStorage.setItem('savedHomes', JSON.stringify(updated));
  };

  if (saved.length === 0) {
    return (
      <div className="card">
        <h2 className="section-heading">Saved Listings</h2>
        <p className="section-sub">No saved homes yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2 className="section-heading">Saved Listings</h2>
        <p className="section-sub">{saved.length} saved homes</p>
      </div>

      {saved.map((item, idx) => (
        <div key={idx} className="card" style={{ marginTop: '1rem' }}>
          <h3>{item.city} • {item.zip}</h3>

          <p>
            💰 Your Price: ${item.user_price.toLocaleString()}
          </p>

          <p>
            📊 Market: ${item.estimated_market_price.toLocaleString()}
          </p>

          <p>
            🏷️ {item.deal_quality}
          </p>

          <p style={{ color: '#555' }}>
            {item.sales_pitch}
          </p>

          <button
            className="btn btn-secondary"
            onClick={() => removeItem(idx)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
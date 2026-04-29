import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const money = (value) => {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const shortMoney = (value) => {
  const n = Number(value || 0);

  if (Math.abs(n) >= 1000000) {
    return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  }

  if (Math.abs(n) >= 1000) {
    return `$${Math.round(n / 1000)}K`;
  }

  return `$${n}`;
};

const number = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const getBadgeColor = (quality) => {
  switch (quality) {
    case 'Excellent Steal':
      return '#2D4A3E';
    case 'Good Deal':
      return '#1E88E5';
    case 'Fair Deal':
      return '#B85C38';
    case 'Fair Price':
      return '#F9A825';
    default:
      return '#C62828';
  }
};

export default function ResultsPage({ results, formData, onReset }) {
  const houses = results?.houses || [];

  const chartData = houses.slice(0, 10).map((house, index) => ({
    name: `#${index + 1}`,
    price: Number(house.price || 0),
    savings: Math.max(0, Number(house.estimated_savings || 0)),
    ppsqft: Number(house.price_per_sqft || 0),
  }));

  return (
    <div className="results-wrapper">
      <div className="card">
        <h2 className="section-heading">Top Matching Homes</h2>
        <p className="section-sub">
          ZIP {results.zip_code || formData?.zip_code} · Max {money(formData?.max_price)} ·
          Minimum {formData?.min_beds} bd / {formData?.min_baths} ba / {number(formData?.min_sqft)} sqft
        </p>

        <div className="results-summary">
          <span className="badge" style={{ background: '#2D4A3E', color: 'white' }}>
            {results.count || 0} Results
          </span>

          {results.market_source && (
            <span className="badge market-badge">
              Market source: {results.market_source}
            </span>
          )}
        </div>

        {results.message && <p className="section-sub" style={{ marginTop: '1rem' }}>{results.message}</p>}
        {results.error && <p className="field-error">{results.error}</p>}
      </div>

      {houses.length > 0 && (
        <div className="charts-grid">
          <div className="card chart-card">
            <h3>Top 10 Prices</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={shortMoney} width={55} />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="price" fill="#B85C38" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3>Estimated Savings</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="savings" fill="#2D4A3E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {houses.length === 0 ? (
        <div className="card empty-results">
          <h3>No matching houses found</h3>
          <p>
            Try increasing max price, lowering beds/baths/sqft, or searching another ZIP code.
          </p>
        </div>
      ) : (
        <div className="houses-list">
          {houses.map((house, index) => (
            <div className="card house-card" key={`${house.url || house.address}-${index}`}>
              <div className="house-card-header">
                <div>
                  <h3>#{index + 1} — {house.address || 'Address unavailable'}</h3>
                  <p className="section-sub">
                    ZIP {house.zip_code} · {house.region}
                  </p>
                </div>

                <span
                  className="badge"
                  style={{
                    background: getBadgeColor(house.deal_label),
                    color: 'white',
                  }}
                >
                  {house.deal_label}
                </span>
              </div>

              <div className="house-metrics">
                <div>
                  <span className="metric-label">Price</span>
                  <strong>{money(house.price)}</strong>
                </div>

                <div>
                  <span className="metric-label">Beds / Baths</span>
                  <strong>{house.beds} bd · {house.baths} ba</strong>
                </div>

                <div>
                  <span className="metric-label">Size</span>
                  <strong>{number(house.sqft)} sqft</strong>
                </div>

                <div>
                  <span className="metric-label">$/sqft</span>
                  <strong>{money(house.price_per_sqft)}</strong>
                </div>

                <div>
                  <span className="metric-label">Savings</span>
                  <strong>{money(house.estimated_savings)}</strong>
                </div>

                <div>
                  <span className="metric-label">Savings %</span>
                  <strong>{Number(house.savings_percent || 0).toFixed(2)}%</strong>
                </div>
              </div>

              <p className="ai-pitch">{house.sales_pitch}</p>

              <div className="result-actions-row">
                {house.url && (
                  <a
                    className="btn btn-primary"
                    href={house.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Listing
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="results-actions">
        <button className="btn btn-secondary" onClick={onReset}>
          New Search
        </button>
      </div>
    </div>
  );
}

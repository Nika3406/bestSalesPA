import React from 'react';
import MapView from './MapView';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const saveListing = (results) => {
  const saved = JSON.parse(localStorage.getItem('savedHomes') || '[]');

  const exists = saved.some(
    (item) =>
      item.city === results.city &&
      item.user_price === results.user_price &&
      item.predicted_zip === results.predicted_zip
  );

  if (!exists) {
    saved.push(results);
    localStorage.setItem('savedHomes', JSON.stringify(saved));
    alert('Listing saved ❤️');
  } else {
    alert('Already saved 👍');
  }
};

export default function ResultsPage({ results, onReset }) {

  const data = [
    { name: 'Your Price', value: results.user_price },
    { name: 'Market Estimate', value: results.estimated_market_price },
  ];

  const scoreData = [
    {
      name: 'Deal Score',
      value: Math.max(0, Math.min(100, results.deal_score / 1000)),
    },
  ];

  const trendData = [
    { year: '2021', price: results.estimated_market_price * 0.85 },
    { year: '2022', price: results.estimated_market_price * 0.92 },
    { year: '2023', price: results.estimated_market_price * 0.97 },
    { year: '2024', price: results.estimated_market_price },
  ];

  const getBadgeColor = (quality) => {
    switch (quality) {
      case 'Excellent Steal':
        return '#2D4A3E';
      case 'Good Deal':
        return '#1E88E5';
      case 'Fair Price':
        return '#F9A825';
      default:
        return '#C62828';
    }
  };

  return (
    <div className="results-wrapper">

      {/* HEADER */}
      <div className="card">
        <h2 className="section-heading">Your Home Analysis</h2>
        <p className="section-sub">
          {results.city} • ZIP {results.predicted_zip}
        </p>

        <div
          className="badge"
          style={{
            background: getBadgeColor(results.deal_quality),
            color: 'white',
            marginTop: '1rem',
          }}
        >
          {results.deal_quality}
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid">

        {/* PRICE COMPARISON */}
        <div className="card chart-card">
          <h3>Price Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#B85C38"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DEAL SCORE */}
        <div className="card chart-card">
          <h3>Deal Score Strength</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#2D4A3E"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TREND CHART */}
      <div className="card chart-card">
        <h3>Neighborhood Price Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="price"
              fill="#E07B39"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MAP */}
      <div className="card">
        <h3>Location Map</h3>
        <MapView city={results.city} />
      </div>

      {/* AI INSIGHT */}
      <div className="card">
        <h3>AI Insight</h3>
        <p>{results.sales_pitch}</p>
      </div>

      {/* ACTIONS */}
      <div className="results-actions">

        <button className="btn btn-secondary" onClick={onReset}>
          ← New Search
        </button>

        <button
          className="btn btn-primary"
          onClick={() => saveListing(results)}
        >
          ❤️ Save Listing
        </button>

      </div>

    </div>
  );
}
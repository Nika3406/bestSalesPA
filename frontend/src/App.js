import React, { useState } from 'react';
import './App.css';

import HouseForm from './components/HouseForm';
import ResultsPage from './components/ResultsPage';
import SavedListings from './components/SavedListings';
import ComparePage from './components/ComparePage';

function App() {
  const [page, setPage] = useState('home'); 
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    setFormData(data);

    try {
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Error:', error);
      setResults(getMockResult(data));
    }

    setLoading(false);
    setPage('results');
  };

  const handleReset = () => {
    setResults(null);
    setFormData(null);
    setPage('home');
  };

  return (
    <div className="app">

      {/* HEADER + NAV BAR */}
      <header className="site-header">
        <div className="header-inner">

          <div className="logo">
            <span className="logo-icon">⌂</span>
            <span className="logo-text">KeyStone<em>PA</em></span>
          </div>

          <p className="tagline">Pennsylvania's smartest home finder</p>

          <div className="nav-buttons">
            <button onClick={() => setPage('home')} className="btn btn-secondary">
              Home
            </button>

            <button onClick={() => setPage('saved')} className="btn btn-secondary">
              Saved
            </button>

            <button onClick={() => setPage('compare')} className="btn btn-secondary">
              Compare
            </button>
          </div>

        </div>
      </header>

      {/* MAIN ROUTING */}
      <main className="main-content">

        {loading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p className="loading-text">Analyzing Pennsylvania housing market…</p>
            <p className="loading-sub">Crunching thousands of listings for you</p>
          </div>
        )}

        {!loading && page === 'home' && (
          <HouseForm onSubmit={handleSubmit} />
        )}

        {!loading && page === 'results' && results && (
          <ResultsPage
            results={results}
            formData={formData}
            onReset={handleReset}
          />
        )}

        {!loading && page === 'saved' && (
          <SavedListings />
        )}

        {!loading && page === 'compare' && (
          <ComparePage />
        )}

      </main>

      <footer className="site-footer">
        <p>© 2025 KeyStonePA · Data sourced from PA housing market · Not financial advice</p>
      </footer>

    </div>
  );
}

function getMockResult(data) {
  const estimated = data.price * 1.12;
  const dealScore = estimated - data.price;

  return {
    city: data.city,
    desired_zip: data.desired_zip,
    predicted_zip: data.desired_zip,
    estimated_market_price: Math.round(estimated),
    user_price: data.price,
    deal_score: Math.round(dealScore),
    deal_quality:
      dealScore >= 75000
        ? 'Excellent Steal'
        : dealScore >= 25000
        ? 'Good Deal'
        : 'Fair Price',
    sales_pitch: `Based on ${data.beds} bed / ${data.baths} bath homes...`,
  };
}

export default App;
import React, { useState } from 'react';
import './App.css';

import HouseForm from './components/HouseForm';
import ResultsPage from './components/ResultsPage';

const API_BASE = 'http://127.0.0.1:8000';

function App() {
  const [page, setPage] = useState('home');
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    setFormData(form);
    setResults(null);

    const payload = {
      city: form.city || '',
      zip_code: form.zip_code,
      max_price: Number(form.max_price),
      min_beds: Number(form.min_beds),
      min_baths: Number(form.min_baths),
      min_sqft: Number(form.min_sqft),
    };

    try {
      const response = await fetch(`${API_BASE}/top-houses-any-zip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Backend request failed');
      }

      setResults(result);
    } catch (error) {
      console.error('Backend error:', error);
      setResults({
        count: 0,
        message: 'Could not get listings. Make sure FastAPI is running and the backend endpoint is /top-houses-any-zip.',
        houses: [],
        error: String(error.message || error),
      });
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
          </div>
        </div>
      </header>

      <main className="main-content">
        {loading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p className="loading-text">Searching Redfin and scoring deals…</p>
            <p className="loading-sub">This can take a moment because the backend is scraping live listings.</p>
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
      </main>

      <footer className="site-footer">
        <p>© 2026 KeyStonePA · Real estate deal scoring demo · Not financial advice</p>
      </footer>
    </div>
  );
}

export default App;

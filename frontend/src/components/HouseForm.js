import React, { useState } from 'react';
import './HouseForm.css';

const POPULAR_PA_ZIPS = [
  '19038', '18966', '19104', '19128', '19406',
  '15213', '15217', '15222', '16801', '17101',
  '17601', '18018', '18102', '18503', '19601',
];

const POPULAR_CITIES = [
  'Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Scranton',
  'Lancaster', 'Harrisburg', 'State College', 'Southampton', 'Glenside',
];

export default function HouseForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    city: '',
    zip_code: '',
    max_price: '750000',
    min_beds: '3',
    min_baths: '2',
    min_sqft: '1500',
  });

  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const e = {};
    const zip = String(form.zip_code || '').trim();

    if (!zip) e.zip_code = 'Enter a ZIP code';
    else if (!/^\d{5}$/.test(zip)) e.zip_code = 'ZIP code must be exactly 5 digits';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};

    if (!form.max_price || Number(form.max_price) < 50000) {
      e.max_price = 'Enter a realistic max price';
    }

    if (!form.min_beds || Number(form.min_beds) < 1) {
      e.min_beds = 'Choose minimum bedrooms';
    }

    if (!form.min_baths || Number(form.min_baths) < 1) {
      e.min_baths = 'Choose minimum bathrooms';
    }

    if (!form.min_sqft || Number(form.min_sqft) < 300) {
      e.min_sqft = 'Enter minimum square footage';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    onSubmit({
      city: form.city.trim(),
      zip_code: form.zip_code.trim(),
      max_price: Number(form.max_price),
      min_beds: Number(form.min_beds),
      min_baths: Number(form.min_baths),
      min_sqft: Number(form.min_sqft),
    });
  };

  return (
    <div className="form-wrapper">
      <div className="form-hero">
        <h1 className="hero-title">Find Your <em>Best Deal</em> in Pennsylvania</h1>
        <p className="hero-sub">
          Enter any Pennsylvania ZIP code and your preferences. The backend will search current
          listings, score them against the trained market model, and return the top 10 matches.
        </p>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">Any</span>
            <span className="stat-label">PA ZIP</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">Top 10</span>
            <span className="stat-label">Listings</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">$/ft²</span>
            <span className="stat-label">Deal Score</span>
          </div>
        </div>
      </div>

      <div className="form-panel card">
        <div className="progress-steps">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="step-dot">{step > 1 ? '✓' : '1'}</div>
            <span>Location</span>
          </div>

          <div className="progress-line" />

          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-dot">2</div>
            <span>Preferences</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <div className="form-step animate-in">
              <h2 className="step-title">Where do you want to search?</h2>
              <p className="step-hint">
                City is optional. ZIP code is required because the backend searches Redfin by ZIP.
              </p>

              <div className="field-group">
                <label className="field-label">City / Area <span className="optional">(optional)</span></label>
                <div className="city-grid">
                  {POPULAR_CITIES.map(city => (
                    <button
                      key={city}
                      type="button"
                      className={`city-chip ${form.city === city ? 'selected' : ''}`}
                      onClick={() => update('city', city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  className="field-input city-free-input"
                  placeholder="Or type a city, e.g. Southampton"
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">ZIP Code <span className="required">*</span></label>

                <div className="zip-grid">
                  {POPULAR_PA_ZIPS.map(zip => (
                    <button
                      key={zip}
                      type="button"
                      className={`zip-chip ${form.zip_code === zip ? 'selected' : ''}`}
                      onClick={() => update('zip_code', zip)}
                    >
                      {zip}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="5"
                  className={`field-input zip-free-input ${errors.zip_code ? 'error' : ''}`}
                  placeholder="Or enter any PA ZIP, e.g. 18966"
                  value={form.zip_code}
                  onChange={e => update('zip_code', e.target.value.replace(/\D/g, '').slice(0, 5))}
                />

                {errors.zip_code && <p className="field-error">{errors.zip_code}</p>}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-primary btn-lg" onClick={nextStep}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step animate-in">
              <button type="button" className="back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>

              <h2 className="step-title">What are your minimum requirements?</h2>
              <p className="step-hint">
                Searching ZIP <strong>{form.zip_code}</strong>{form.city ? ` near ${form.city}` : ''}.
              </p>

              <div className="inputs-grid">
                <div className="field-group">
                  <label className="field-label" htmlFor="max_price">
                    Max Price <span className="required">*</span>
                  </label>

                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      id="max_price"
                      type="number"
                      className={`field-input prefix-input ${errors.max_price ? 'error' : ''}`}
                      placeholder="750000"
                      value={form.max_price}
                      onChange={e => update('max_price', e.target.value)}
                      min="50000"
                    />
                  </div>

                  {errors.max_price && <p className="field-error">{errors.max_price}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="min_sqft">
                    Minimum Square Feet <span className="required">*</span>
                  </label>

                  <div className="input-wrapper">
                    <input
                      id="min_sqft"
                      type="number"
                      className={`field-input ${errors.min_sqft ? 'error' : ''}`}
                      placeholder="1500"
                      value={form.min_sqft}
                      onChange={e => update('min_sqft', e.target.value)}
                      min="300"
                    />
                    <span className="input-suffix">sq ft</span>
                  </div>

                  {errors.min_sqft && <p className="field-error">{errors.min_sqft}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label">Minimum Bedrooms <span className="required">*</span></label>
                  <div className="counter-group">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`counter-btn ${form.min_beds === String(n) ? 'selected' : ''}`}
                        onClick={() => update('min_beds', String(n))}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {errors.min_beds && <p className="field-error">{errors.min_beds}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label">Minimum Bathrooms <span className="required">*</span></label>
                  <div className="counter-group">
                    {[1, 1.5, 2, 2.5, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`counter-btn ${form.min_baths === String(n) ? 'selected' : ''}`}
                        onClick={() => update('min_baths', String(n))}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {errors.min_baths && <p className="field-error">{errors.min_baths}</p>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg submit-btn">
                  🔍 Find Top 10 Houses
                </button>
                <p className="submit-hint">Listings are ranked by savings percentage and estimated savings.</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

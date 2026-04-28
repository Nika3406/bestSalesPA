import React, { useState } from 'react';
import './HouseForm.css';

const PA_CITIES = [
  'Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading',
  'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'York',
  'Wilkes-Barre', 'Chester', 'Easton', 'State College', 'Monroeville',
];

const PA_ZIPS = {
  'Philadelphia': ['19038', '19104', '19111', '19124', '19128'],
  'Pittsburgh': ['15213', '15217', '15222', '15232'],
  'Allentown': ['18018', '18102'],
  'Erie': ['16801', '16803'],
  'Harrisburg': ['17101', '17102'],
  'Lancaster': ['17601'],
  'Scranton': ['18503'],
  'Reading': ['19601'],
  'Chester': ['19020'],
  'York': ['17406'],
  'Bethlehem': ['18018'],
  'Easton': ['18042'],
  'State College': ['16801'],
  'Wilkes-Barre': ['18701'],
  'Monroeville': ['15146'],
};

export default function HouseForm({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    city: '',
    desired_zip: '',
    price: '',
    beds: '',
    baths: '',
    sqft: '',
  });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'city') setForm(prev => ({ ...prev, city: value, desired_zip: '' }));
  };

  const zipOptions = form.city ? (PA_ZIPS[form.city] || []) : [];

  const validateStep1 = () => {
    const e = {};
    if (!form.city) e.city = 'Please select a city';
    if (!form.desired_zip) e.desired_zip = 'Please select a ZIP code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter a valid price';
    if (!form.beds || isNaN(form.beds) || Number(form.beds) < 1) e.beds = 'Enter number of bedrooms (min 1)';
    if (!form.baths || isNaN(form.baths) || Number(form.baths) < 1) e.baths = 'Enter number of bathrooms (min 1)';
    if (!form.sqft || isNaN(form.sqft) || Number(form.sqft) < 100) e.sqft = 'Enter square footage (min 100)';
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
      city: form.city,
      desired_zip: form.desired_zip,
      price: parseFloat(form.price),
      beds: parseFloat(form.beds),
      baths: parseFloat(form.baths),
      sqft: parseFloat(form.sqft),
    });
  };

  return (
    <div className="form-wrapper">
      <div className="form-hero">
        <h1 className="hero-title">Find Your <em>Perfect</em> Pennsylvania Home</h1>
        <p className="hero-sub">
          Tell us what you're looking for. Our AI analyzes thousands of PA listings to
          score the deal quality and find the best bang for your buck.
        </p>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">22+</span>
            <span className="stat-label">PA ZIP Codes</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">AI</span>
            <span className="stat-label">Deal Scoring</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">Top 10</span>
            <span className="stat-label">Best Picks</span>
          </div>
        </div>
      </div>

      <div className="form-panel card">
        {/* Progress steps */}
        <div className="progress-steps">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="step-dot">{step > 1 ? '✓' : '1'}</div>
            <span>Location</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-dot">2</div>
            <span>Details</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <div className="form-step animate-in">
              <h2 className="step-title">Where are you looking?</h2>
              <p className="step-hint">Select a Pennsylvania city and ZIP code to search in.</p>

              <div className="field-group">
                <label className="field-label">City <span className="required">*</span></label>
                <div className="city-grid">
                  {PA_CITIES.map(city => (
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
                {errors.city && <p className="field-error">{errors.city}</p>}
              </div>

              {form.city && (
                <div className="field-group animate-in">
                  <label className="field-label">ZIP Code <span className="required">*</span></label>
                  <div className="zip-grid">
                    {zipOptions.map(zip => (
                      <button
                        key={zip}
                        type="button"
                        className={`zip-chip ${form.desired_zip === zip ? 'selected' : ''}`}
                        onClick={() => update('desired_zip', zip)}
                      >
                        {zip}
                      </button>
                    ))}
                  </div>
                  {errors.desired_zip && <p className="field-error">{errors.desired_zip}</p>}
                </div>
              )}

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
              <h2 className="step-title">House details</h2>
              <p className="step-hint">
                Searching in <strong>{form.city}</strong>, ZIP <strong>{form.desired_zip}</strong>
              </p>

              <div className="inputs-grid">
                <div className="field-group">
                  <label className="field-label" htmlFor="price">
                    Budget / Target Price <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      id="price"
                      type="number"
                      className={`field-input prefix-input ${errors.price ? 'error' : ''}`}
                      placeholder="350,000"
                      value={form.price}
                      onChange={e => update('price', e.target.value)}
                      min="0"
                    />
                  </div>
                  {errors.price && <p className="field-error">{errors.price}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="sqft">
                    Square Footage <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      id="sqft"
                      type="number"
                      className={`field-input ${errors.sqft ? 'error' : ''}`}
                      placeholder="1,800"
                      value={form.sqft}
                      onChange={e => update('sqft', e.target.value)}
                      min="100"
                    />
                    <span className="input-suffix">sq ft</span>
                  </div>
                  {errors.sqft && <p className="field-error">{errors.sqft}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="beds">
                    Bedrooms <span className="required">*</span>
                  </label>
                  <div className="counter-group">
                    {[1,2,3,4,5,6].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`counter-btn ${form.beds === String(n) ? 'selected' : ''}`}
                        onClick={() => update('beds', String(n))}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {errors.beds && <p className="field-error">{errors.beds}</p>}
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="baths">
                    Bathrooms <span className="required">*</span>
                  </label>
                  <div className="counter-group">
                    {[1,1.5,2,2.5,3,4].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={`counter-btn ${form.baths === String(n) ? 'selected' : ''}`}
                        onClick={() => update('baths', String(n))}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {errors.baths && <p className="field-error">{errors.baths}</p>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg submit-btn">
                  🔍 Analyze This Home
                </button>
                <p className="submit-hint">Our AI will score the deal and find top alternatives</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

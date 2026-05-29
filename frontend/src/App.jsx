import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Metadata from backend
  const [metadata, setMetadata] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState(null);

  // Form Inputs
  const [condition, setCondition] = useState('Rent'); // Rent or Buy
  const [locality, setLocality] = useState('');
  const [bhk, setBhk] = useState(2);
  const [furnished, setFurnished] = useState('Furnished');
  const [propertyType, setPropertyType] = useState('None'); // None, New, PreOwned

  // Locality Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Prediction Output
  const [prediction, setPrediction] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  // Fetch Metadata on Mount
  useEffect(() => {
    fetch('https://estatepredictai-1.onrender.com')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load server metadata.');
        return res.json();
      })
      .then((data) => {
        setMetadata(data);
        setLoadingMeta(false);
        // Default locality
        if (data.localities && data.localities.length > 0) {
          setLocality(data.localities[0]);
          setSearchQuery(data.localities[0]);
        }
      })
      .catch((err) => {
        console.error(err);
        setMetaError(err.message);
        setLoadingMeta(false);
      });
  }, []);

  // Sync property type based on condition (Rent -> None, Buy -> New/PreOwned)
  useEffect(() => {
    if (condition === 'Rent') {
      setPropertyType('None');
    } else if (condition === 'Buy' && propertyType === 'None') {
      setPropertyType('New');
    }
  }, [condition]);

  // Trigger Prediction whenever form inputs change
  useEffect(() => {
    if (!locality || loadingMeta) return;

    setPredictLoading(true);
    setPredictError(null);

    const payload = {
      locality,
      bhk: parseInt(bhk, 10),
      furnished,
      condition,
      type: condition === 'Rent' ? 'None' : propertyType,
    };

    const timer = setTimeout(() => {
      fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Prediction API failed.');
          return res.json();
        })
        .then((data) => {
          if (data.error) {
            setPredictError(data.error);
            setPrediction(null);
          } else {
            setPrediction(data.predicted_price);
          }
          setPredictLoading(false);
        })
        .catch((err) => {
          setPredictError(err.message);
          setPrediction(null);
          setPredictLoading(false);
        });
    }, 200); // Small debounce

    return () => clearTimeout(timer);
  }, [locality, bhk, furnished, condition, propertyType, loadingMeta]);

  // Handle outside click for search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        // Reset query to current locality if they didn't select one
        if (metadata && !metadata.localities.includes(searchQuery)) {
          setSearchQuery(locality);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [locality, searchQuery, metadata]);

  if (loadingMeta) {
    return (
      <div className="center-screen">
        <div className="loader"></div>
        <p className="loading-text">Connecting to ML Server...</p>
      </div>
    );
  }

  if (metaError) {
    return (
      <div className="center-screen">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Connection Error</h2>
          <p>Unable to connect to the Flask server at <code>http://127.0.0.1:5000</code>.</p>
          <p className="error-details">Details: {metaError}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Filtered Localities based on input search
  const filteredLocalities = metadata
    ? metadata.localities.filter((loc) =>
        loc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Get statistics for the current locality
  const currentLocalityStats =
    metadata && metadata.stats && metadata.stats[locality]
      ? metadata.stats[locality]
      : { Rent: 0, Buy: 0 };

  const currentAverage = condition === 'Rent' ? currentLocalityStats.Rent : currentLocalityStats.Buy;

  // Comparison insights
  let percentageDifference = 0;
  let isHigher = false;
  if (prediction && currentAverage > 0) {
    const diff = prediction - currentAverage;
    percentageDifference = Math.round((Math.abs(diff) / currentAverage) * 100);
    isHigher = diff > 0;
  }

  // Generate comparison stats for top 4 localities + current locality
  const getComparisonLocalities = () => {
    if (!metadata || !metadata.stats) return [];
    
    // Sort all localities by average price for the active condition
    const sorted = Object.entries(metadata.stats)
      .map(([name, priceMap]) => ({ name, price: priceMap[condition] }))
      .filter((item) => item.price > 0)
      .sort((a, b) => b.price - a.price);

    // Pick top 3 most expensive + current selected locality + 1 cheapest
    const top3 = sorted.slice(0, 3);
    const cheapest = sorted.slice(-1);
    
    // Combine list and make unique
    const combined = [...top3];
    if (!combined.some((item) => item.name === locality) && currentAverage > 0) {
      combined.push({ name: locality, price: currentAverage });
    }
    if (!combined.some((item) => item.name === cheapest[0]?.name) && cheapest[0]) {
      combined.push(cheapest[0]);
    }
    
    // Re-sort combined
    return combined.sort((a, b) => b.price - a.price);
  };

  const comparisonData = getComparisonLocalities();
  const maxComparisonPrice = comparisonData.length > 0 ? Math.max(...comparisonData.map(d => d.price)) : 1;

  // Format price in Indian Rupee format (e.g. Lakhs, Crores or standard format)
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'Calculating...';
    
    // Format according to Indian Numbering System
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
    return formatter.format(val);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-area">
          <span className="logo-icon">✨</span>
          <h1>EstatePredict AI</h1>
        </div>
        <p className="app-subtitle">
          Real-time House Pricing Model powered by RandomForest Regression
        </p>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Form Controls Card */}
        <section className="card control-panel">
          <h2 className="section-title">Configure Property</h2>

          {/* Deal Type Switcher */}
          <div className="form-group">
            <label className="form-label">I want to:</label>
            <div className="deal-tabs">
              <button
                type="button"
                className={`deal-tab ${condition === 'Rent' ? 'active' : ''}`}
                onClick={() => setCondition('Rent')}
              >
                Rent a Flat
              </button>
              <button
                type="button"
                className={`deal-tab ${condition === 'Buy' ? 'active' : ''}`}
                onClick={() => setCondition('Buy')}
              >
                Buy a Flat
              </button>
            </div>
          </div>

          {/* Searchable Locality Field */}
          <div className="form-group search-container" ref={dropdownRef}>
            <label className="form-label" htmlFor="locality-search">Locality:</label>
            <div className="input-wrapper">
              <span className="input-icon">📍</span>
              <input
                id="locality-search"
                type="text"
                className="form-input"
                placeholder="Search Locality (e.g. Koregaon Park, Baner...)"
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
              />
            </div>
            
            {showDropdown && (
              <div className="locality-dropdown">
                {filteredLocalities.length > 0 ? (
                  filteredLocalities.map((loc) => (
                    <div
                      key={loc}
                      className={`dropdown-item ${loc === locality ? 'selected' : ''}`}
                      onClick={() => {
                        setLocality(loc);
                        setSearchQuery(loc);
                        setShowDropdown(false);
                      }}
                    >
                      {loc}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-item empty">No matching localities</div>
                )}
              </div>
            )}
          </div>

          {/* BHK Selection */}
          <div className="form-group">
            <label className="form-label">BHK size:</label>
            <div className="pill-selector">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`pill ${bhk === num ? 'active' : ''}`}
                  onClick={() => setBhk(num)}
                >
                  {num} BHK
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing Status */}
          <div className="form-group">
            <label className="form-label">Furnishing:</label>
            <div className="pill-selector">
              {['Furnished', 'Non-Furnished'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`pill ${furnished === opt ? 'active' : ''}`}
                  onClick={() => setFurnished(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type (Only visible for Buy) */}
          {condition === 'Buy' && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Flat Type:</label>
              <div className="pill-selector">
                {['New', 'PreOwned'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`pill ${propertyType === opt ? 'active' : ''}`}
                    onClick={() => setPropertyType(opt)}
                  >
                    {opt} Flat
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Prediction Display & Charts */}
        <section className="results-panel">
          {/* Prediction Hero Card */}
          <div className="card result-card">
            <h2 className="card-label">Estimated Market Value</h2>
            
            {predictLoading ? (
              <div className="skeleton-prediction">
                <div className="skeleton-bar"></div>
                <div className="skeleton-sub"></div>
              </div>
            ) : predictError ? (
              <div className="prediction-error">
                <span className="err-icon">⚠️</span>
                <p>{predictError}</p>
              </div>
            ) : (
              <div className="prediction-content">
                <div className="prediction-price">
                  {formatCurrency(prediction)}
                  <span className="price-suffix">
                    {condition === 'Rent' ? ' / month' : ''}
                  </span>
                </div>
                <p className="prediction-meta">
                  For a {furnished.toLowerCase()} {bhk} BHK {condition === 'Buy' ? `${propertyType.toLowerCase()} ` : ''}flat in {locality}
                </p>
              </div>
            )}
            
            <div className="model-badge">
              <span className="badge-dot"></span>
              RandomForest Acc: 99.86%
            </div>
          </div>

          {/* Statistics & Comparison Insights */}
          <div className="card stats-card">
            <h2 className="section-title">Valuation Insights</h2>
            
            {/* Value Gauge */}
            {prediction && currentAverage > 0 ? (
              <div className="insight-row">
                <div className="insight-gauge">
                  <div className={`gauge-percentage ${isHigher ? 'higher' : 'lower'}`}>
                    {percentageDifference}%
                  </div>
                  <div className="gauge-label">{isHigher ? 'Above' : 'Below'} Average</div>
                </div>
                <div className="insight-text">
                  <p>
                    The estimated price is <strong>{percentageDifference}% {isHigher ? 'higher' : 'lower'}</strong> than the overall average {condition.toLowerCase()} price in <strong>{locality}</strong>.
                  </p>
                  <p className="average-compare">
                    Locality Average: {formatCurrency(currentAverage)}
                    {condition === 'Rent' ? '/mo' : ''}
                  </p>
                </div>
              </div>
            ) : (
              <p className="no-stats">No average pricing data available for this locality configuration.</p>
            )}

            {/* Price comparison list chart */}
            {comparisonData.length > 0 && (
              <div className="comparison-chart-container">
                <h3 className="chart-title">Locality Price Comparison ({condition})</h3>
                <div className="bar-chart">
                  {comparisonData.map((item) => {
                    const isCurrent = item.name === locality;
                    const widthPercent = (item.price / maxComparisonPrice) * 100;
                    return (
                      <div key={item.name} className={`chart-bar-row ${isCurrent ? 'highlight' : ''}`}>
                        <div className="bar-label-area">
                          <span className="bar-name">
                            {item.name} {isCurrent && ' (Current)'}
                          </span>
                          <span className="bar-value">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer-bar">
        <p>© 2026 EstatePredict AI. Pair Programmed with Antigravity.</p>
      </footer>
    </div>
  );
}

export default App;

// src/pages/CheckExpiryPage.js
import React, { useState } from 'react';
import './CheckExpiryPage.css';
import { useNavigate } from 'react-router-dom';


const CheckExpiryPage = () => {
  const [batchId, setBatchId] = useState('');
  const [expired, setExpired] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  

  const handleCheck = async () => {
    try {
      setError('');
      const response = await fetch(`http://localhost:5000/api/drugs/${batchId}/isExpired`);
      const data = await response.json();
      if (response.ok) {
        setExpired(data.expired);
      } else {
        setError(data.error || 'Something went wrong');
        setExpired(null);
      }
    } catch (err) {
      setError('Failed to connect to the server');
      setExpired(null);
    }
  };

  return (
    <div className="check-expiry-container">
      <h2>Check Drug Expiry</h2>
      <input
        type="text"
        placeholder="Enter Batch ID"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
      />
      <button onClick={handleCheck}>Check Expiry</button>
      {expired !== null && (
        <p className={expired ? 'expired' : 'not-expired'}>
          {expired ? 'This drug has expired.' : 'This drug is not expired.'}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default CheckExpiryPage;

import React, { useState } from 'react';
import axios from 'axios';
import './DrugDetailsPage.css';
import { useNavigate } from 'react-router-dom';


const DrugDetailsPage = () => {
  const [drugId, setDrugId] = useState('');
  const [drug, setDrug] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  

  const fetchDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/drugs/${drugId}`);
      setDrug(res.data);
      setError('');
    } catch (err) {
      setDrug(null);
      setError('❌ Drug not found. Please check the ID.');
    }
  };

  return (
    <div className="drug-details-wrapper">
      <h1 className="drug-title">🔍 Drug Details Lookup</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter Drug ID (e.g., DRG100)"
          value={drugId}
          onChange={(e) => setDrugId(e.target.value)}
        />
        <button onClick={fetchDetails}>Search</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {drug && (
        <div className="drug-card">
          <div className="card-header">
            <h2>{drug.name}</h2>
            <span className={`status-badge ${drug.recalled ? 'recalled' : 'active'}`}>
              {drug.recalled ? 'Recalled' : 'Active'}
            </span>
          </div>

          <div className="card-body">
            <div><strong>Batch ID:</strong> {drug.batchId}</div>
            <div><strong>Manufacturer:</strong> {drug.manufacturer}</div>
            <div><strong>Status:</strong> {drug.status}</div>
            <div><strong>Location:</strong> {drug.location}</div>
            <div><strong>Owner:</strong> {drug.owner}</div>
            <div><strong>Expiry Date:</strong> {drug.expiryDate}</div>
            <div><strong>Last Updated:</strong> {new Date(drug.timestamp).toLocaleString()}</div>
          </div>
        </div>
      )}
       <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default DrugDetailsPage;

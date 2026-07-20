import React, { useState } from 'react';
import axios from 'axios';
import './DrugTimeline.css';
import { useNavigate } from 'react-router-dom';


const DrugTimeline = () => {
  const [batchId, setBatchId] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const navigate = useNavigate();
  

  const fetchTimeline = async () => {
    try {
      const detailRes = await axios.get(`http://localhost:5000/api/drugs/${batchId}`);
      const timelineRes = await axios.get(`http://localhost:5000/api/drugs/${batchId}/timeline`);

      setDetails(detailRes.data);
      setTimeline(timelineRes.data);
      setError('');
    } catch (err) {
      setError('Drug not found or error fetching data.');
      setTimeline([]);
      setDetails(null);
    }
  };

  return (
    <div className="timeline-container">
      <h2>Drug Timeline</h2>
      <div className="form">
        <input
          type="text"
          placeholder="Enter Batch ID (e.g., DRG100)"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        />
        <button onClick={fetchTimeline}>View Timeline</button>
      </div>

      {error && <p className="error">{error}</p>}

      {details && (
        <div className="drug-details">
          <h3>Details for {details.batchId}</h3>
          <p><strong>Name:</strong> {details.name}</p>
          <p><strong>Manufacturer:</strong> {details.manufacturer}</p>
          <p><strong>Status:</strong> {details.status}</p>
          <p><strong>Location:</strong> {details.location}</p>
          <p><strong>Owner:</strong> {details.owner}</p>
          <p><strong>Expiry Date:</strong> {details.expiryDate}</p>
          <p><strong>Recalled:</strong> {details.recalled ? 'Yes' : 'No'}</p>
        </div>
      )}

      {timeline.length > 0 && (
        <div className="timeline">
          <h3>History</h3>
          <ul>
            {timeline.map((step, idx) => (
              <li key={idx}>
                <div className="timeline-step">
                  <span className="step">Step {step.step}</span>
                  <span><strong>Status:</strong> {step.status}</span>
                  <span><strong>Location:</strong> {step.location}</span>
                  <span><strong>Owner:</strong> {step.owner}</span>
                  <span><strong>Recalled:</strong> {step.recalled ? 'Yes' : 'No'}</span>
                  <span><strong>Time:</strong> {new Date(step.time).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default DrugTimeline;

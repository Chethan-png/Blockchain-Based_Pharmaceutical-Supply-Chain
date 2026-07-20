// src/pages/DrugHistoryPage.js
import React, { useState } from 'react';
import './DrugHistoryPage.css';
import { useNavigate } from 'react-router-dom';

const DrugHistoryPage = () => {
  const [batchId, setBatchId] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleFetch = async () => {
    try {
      setError('');
      const res = await fetch(`http://localhost:5000/api/drugs/${batchId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
  
      if (res.ok) {
        setHistory(data);
      } else {
        setError(data.error || 'Failed to fetch history.');
        setHistory([]);
      }
    } catch (err) {
      setError('Server unreachable.');
      setHistory([]);
    }
  };
  

  return (
    <div className="history-container">
      <h2>Drug History</h2>
      <input
        type="text"
        placeholder="Enter Batch ID"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
      />
      <button onClick={handleFetch}>View History</button>

      {error && <p className="error">{error}</p>}

      {history.length > 0 && (
        <div className="history-list">
          {history.map((item, idx) => (
            <div className="history-card" key={idx}>
              <p><strong>Step:</strong> {idx + 1}</p>
              <p><strong>Status:</strong> {item.status}</p>
              <p><strong>Location:</strong> {item.location}</p>
              <p><strong>Owner:</strong> {item.owner}</p>
              <p><strong>Timestamp:</strong> {item.timestamp}</p>
              <p><strong>Recalled:</strong> {item.recalled ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      )}
      <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default DrugHistoryPage;

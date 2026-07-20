// src/pages/ViewNotesPage.js
import React, { useState } from 'react';
import axios from 'axios';
import './ViewNotesPage.css';
import { useNavigate } from 'react-router-dom';


const ViewNotesPage = () => {
  const [drugId, setDrugId] = useState('');
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleFetch = async () => {
    setError('');
    setNotes([]);

    try {
      const res = await axios.get(`http://localhost:5000/api/drugs/${drugId}/notes`);
      setNotes(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error fetching notes');
    }
  };

  return (
    <div className="view-notes-container">
      <h2>View Notes for Drug</h2>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter Drug ID"
          value={drugId}
          onChange={e => setDrugId(e.target.value)}
        />
        <button onClick={handleFetch}>Fetch Notes</button>
      </div>
      {error && <p className="error">{error}</p>}
      {notes.length > 0 && (
        <div className="notes-list">
          <h3>Notes:</h3>
          <ul>
            {notes.map((note, index) => (
              <li key={index}>📝 {note}</li>
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

export default ViewNotesPage;

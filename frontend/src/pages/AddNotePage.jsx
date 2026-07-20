// src/pages/AddNotePage.js
import React, { useState } from 'react';
import axios from 'axios';
import './AddNotePage.css';
import { useNavigate } from 'react-router-dom';


const AddNotePage = () => {
  const [drugId, setDrugId] = useState('');
  const [note, setNote] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setResponse('');
    setError('');

    try {
      const res = await axios.post(`http://localhost:5000/api/drugs/${drugId}/notes`, { note });
      setResponse(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding note');
    }
  };

  return (
    <div className="add-note-container">
      <h2>Add Note to Drug</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Drug ID"
          value={drugId}
          onChange={e => setDrugId(e.target.value)}
          required
        />
        <textarea
          placeholder="Enter note"
          value={note}
          onChange={e => setNote(e.target.value)}
          required
        ></textarea>
        <button type="submit">Add Note</button>
      </form>
      {response && <p className="success">{response}</p>}
      {error && <p className="error">{error}</p>}

      <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default AddNotePage;

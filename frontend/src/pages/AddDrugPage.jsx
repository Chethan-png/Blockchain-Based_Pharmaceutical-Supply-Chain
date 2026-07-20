import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddDrugPage.css';

const AddDrugPage = () => {
  const [form, setForm] = useState({
    drugId: '',
    name: '',
    manufacturer: '',
    expiryDate: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/drugs/add', form);
      setSuccess(res.data.message);
      setForm({ drugId: '', name: '', manufacturer: '', expiryDate: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register drug');
    }
  };

  return (
    <div className="add-drug-container">
      <h2>Add New Drug</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="drugId"
          placeholder="Drug ID"
          value={form.drugId}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Drug Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="manufacturer"
          placeholder="Manufacturer"
          value={form.manufacturer}
          onChange={handleChange}
          required
        />
        <label htmlFor="expiryDate">Expiry Date (format: YYYY-MM-DD)</label>
        <input
          type="date"
          name="expiryDate"
          id="expiryDate"
          value={form.expiryDate}
          onChange={handleChange}
          required
        />
        <button type="submit">Register Drug</button>
      </form>

      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}

      <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default AddDrugPage;

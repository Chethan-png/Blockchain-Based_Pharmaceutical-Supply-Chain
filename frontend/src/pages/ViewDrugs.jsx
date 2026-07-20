import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ViewDrugs.css';
import { useNavigate } from 'react-router-dom';


const ViewDrugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/drugs');
        setDrugs(res.data);
      } catch (err) {
        setError('Failed to fetch drug data.');
      }
    };

    fetchDrugs();
  }, []);

  return (
    <div className="view-drugs-container">
      <h2>All Registered Drugs</h2>
      {error && <p className="error">{error}</p>}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Name</th>
              <th>Manufacturer</th>
              <th>Status</th>
              <th>Location</th>
              <th>Owner</th>
              <th>Expiry</th>
              <th>Recalled</th>
            </tr>
          </thead>
          <tbody>
            {drugs.map((drug) => (
              <tr key={drug.batchId}>
                <td>{drug.batchId}</td>
                <td>{drug.name}</td>
                <td>{drug.manufacturer}</td>
                <td>{drug.status}</td>
                <td>{drug.location}</td>
                <td>{drug.owner}</td>
                <td>{drug.expiryDate}</td>
                <td>{drug.recalled ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="back-button" onClick={() => navigate('/')}>
        Go back to homepage
      </button>
    </div>
  );
};

export default ViewDrugs;

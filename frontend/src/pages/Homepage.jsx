import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const sampleId = 'DRG100'; // Replace with dynamic input later

  const routes = [
    { label: 'Add New Drug', path: '/add' },
    { label: 'View All Drugs', path: '/drugs' },
    { label: 'View Drug Details', path: `/drugs/${sampleId}` },
    { label: 'Update Location', path: `/drugs/${sampleId}/location` },
    { label: 'Update Status', path: `/drugs/${sampleId}/status` },
    { label: 'Transfer Ownership', path: `/drugs/${sampleId}/transfer` },
    { label: 'Recall Drug', path: `/drugs/${sampleId}/recall` },
    { label: 'Add Note', path: `/drugs/${sampleId}/notes/add` },
    { label: 'View Notes', path: `/drugs/${sampleId}/notes` },
    { label: 'Check Expiry', path: `/drugs/${sampleId}/isExpired` },
    { label: 'View Timeline', path: `/drugs/${sampleId}/timeline` },
    { label: 'View Full History', path: `/drugs/${sampleId}/history` },
  ];

  return (
    <div className="homepage-wrapper">
      <header className="homepage-header">
        <h1 className="title">Pharma Supply Chain Dashboard</h1>
        <p className="subtitle">
          Manage, track, and verify pharmaceutical products using blockchain technology.
        </p>
      </header>

      <section className="card action-panel">
        <h2 className="section-title">Available Actions</h2>
        <div className="button-grid">
          {routes.map((route, idx) => (
            <button key={idx} onClick={() => navigate(route.path)}>{route.label}</button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Homepage;

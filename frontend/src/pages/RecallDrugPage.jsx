// src/pages/RecallDrugPage.js
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RecallDrugPage = () => {
    const [batchID, setBatchID] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // Get user context for potential role checks if needed frontend side

    const handleSubmit = async (e, retryCount = 0) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!batchID) {
            setError('Please enter the Batch ID.');
            setIsSubmitting(false);
            return;
        }

        // Frontend role check (optional, backend enforces this anyway)
        if (user?.role !== 'manufacturer') {
             setError('Only manufacturers can recall drugs.');
             setIsSubmitting(false);
             return;
        }

        try {
            const response = await api.post('/drugs/recall', { batchID });
            setMessage(response.data.message || 'Drug recalled successfully!');
            setBatchID(''); // Clear form on success
        } catch (err) {
            console.error("Recall error:", err.response || err);

            // Retry logic for MVCC conflict
            if (err.response?.status === 409 && retryCount < 3) {
                setMessage('Transaction conflict detected. Retrying...');
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                return handleSubmit(e, retryCount + 1);
            }

            setError(err.response?.data?.error || 'Failed to recall drug. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
            <h1>Recall Drug</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="batchID" style={{ display: 'block', marginBottom: '5px' }}>Batch ID:</label>
                    <input
                        type="text"
                        id="batchID"
                        value={batchID}
                        onChange={(e) => setBatchID(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSubmitting || user?.role !== 'manufacturer'} // Disable if not manufacturer
                    style={{
                        padding: '10px 15px', 
                        cursor: (isSubmitting || user?.role !== 'manufacturer') ? 'not-allowed' : 'pointer',
                        opacity: (isSubmitting || user?.role !== 'manufacturer') ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Recalling...' : 'Recall Drug'}
                </button>
                 {user?.role !== 'manufacturer' && <p style={{ color: 'orange', marginTop: '10px' }}>Only manufacturers can recall drugs.</p>}
            </form>
            {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        </div>
    );
};

export default RecallDrugPage;

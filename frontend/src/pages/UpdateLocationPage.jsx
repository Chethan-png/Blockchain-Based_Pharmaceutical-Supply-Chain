// src/pages/UpdateLocationPage.js
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // To check if user is logged in, etc.

const UpdateLocationPage = () => {
    const [batchID, setBatchID] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // Get user context

    const handleSubmit = async (e, retryCount = 0) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!batchID || !newLocation) {
            setError('Please enter both Batch ID and New Location.');
            setIsSubmitting(false);
            return;
        }

        // Optional: Check if user is logged in (backend handles ownership)
        if (!user) {
             setError('You must be logged in to perform this action.');
             setIsSubmitting(false);
             return;
        }

        try {
            const response = await api.post('/drugs/location', { 
                batchID, 
                newLocation 
            });
            setMessage(response.data.message || 'Location updated successfully!');
            setBatchID(''); // Clear form on success
            setNewLocation('');
        } catch (err) {
            console.error("Update Location error:", err.response || err);

            // Retry logic for MVCC conflict
            if (err.response?.status === 409 && retryCount < 3) {
                setMessage('Transaction conflict detected. Retrying...');
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                return handleSubmit(e, retryCount + 1);
            }
            
            // Handle specific permission error from backend
            if (err.response?.status === 403) {
                 setError(err.response.data.details || 'Permission Denied: Only the current owner can update location.');
            } else {
                 setError(err.response?.data?.error || 'Failed to update location. Please try again.');
            }
           
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
            <h1>Update Drug Location</h1>
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
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="newLocation" style={{ display: 'block', marginBottom: '5px' }}>New Location:</label>
                    <input
                        type="text"
                        id="newLocation"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSubmitting || !user} // Disable if submitting or not logged in
                    style={{
                        padding: '10px 15px', 
                        cursor: (isSubmitting || !user) ? 'not-allowed' : 'pointer',
                        opacity: (isSubmitting || !user) ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Updating...' : 'Update Location'}
                </button>
            </form>
            {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        </div>
    );
};

export default UpdateLocationPage;

// src/pages/UpdateStatusPage.js
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UpdateStatusPage.css';

const UpdateStatusPage = () => {
    const [batchID, setBatchID] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e, retryCount = 0) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!batchID || !newStatus) {
            setError('Please enter both Batch ID and New Status.');
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
            const response = await api.post('/drugs/status', {
                batchID,
                newStatus
            });
            setMessage(response.data.message || 'Status updated successfully!');
            setBatchID(''); // Clear form on success
            setNewStatus('');
        } catch (err) {
            console.error("Update Status error:", err.response || err);

            // Retry logic for MVCC conflict
            if (err.response?.status === 409 && retryCount < 3) {
                setMessage('Transaction conflict detected. Retrying...');
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                return handleSubmit(e, retryCount + 1);
            }

            // Handle specific permission error from backend
            if (err.response?.status === 403) {
                setError(err.response.data.details || 'Permission Denied: Only the current owner can update status.');
            } else {
                setError(err.response?.data?.error || 'Failed to update status. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusOptions = [
        'manufactured',
        'in-transit',
        'delivered',
        'stored',
        'dispensed'
    ];

    return (
        <div className="update-status-container">
            <h2>Update Drug Status</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="batchID">Batch ID:</label>
                    <input
                        type="text"
                        id="batchID"
                        value={batchID}
                        onChange={(e) => setBatchID(e.target.value)}
                        placeholder="Enter Batch ID"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="newStatus">New Status:</label>
                    <select
                        id="newStatus"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        required
                    >
                        <option value="">Select Status</option>
                        {statusOptions.map(status => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting || !user}
                >
                    {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
            </form>
            {message && <p className="success">{message}</p>}
            {error && <p className="error">{error}</p>}
            <button className="back-button" onClick={() => navigate('/')}>
                Go back to homepage
            </button>
        </div>
    );
};

export default UpdateStatusPage;

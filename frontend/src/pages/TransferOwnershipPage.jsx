// src/pages/TransferOwnershipPage.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TransferOwnershipPage.css';

const TransferOwnershipPage = () => {
    const [batchID, setBatchID] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const [newRole, setNewRole] = useState('');
    const [currentDrug, setCurrentDrug] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Define the valid sequence of roles in the supply chain
    const roleSequence = {
        'manufacturer': ['wholesaler'],
        'wholesaler': ['distributor'],
        'distributor': ['pharmacy'],
        'pharmacy': [] // End of chain
    };

    // Fetch drug details when batchID changes
    useEffect(() => {
        const fetchDrugDetails = async () => {
            if (!batchID) {
                setCurrentDrug(null);
                return;
            }
            setIsLoading(true);
            try {
                const response = await api.get(`/drugs/${batchID}`);
                setCurrentDrug(response.data);
                setError('');
                
                // Auto-select the next valid role based on current owner's role
                const currentRole = response.data.ownerRole;
                if (currentRole && roleSequence[currentRole]?.length > 0) {
                    setNewRole(roleSequence[currentRole][0]);
                } else {
                    setNewRole('');
                }
            } catch (err) {
                console.error("Error fetching drug details:", err);
                setError('Failed to fetch drug details. Please check the Batch ID.');
                setCurrentDrug(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (batchID) {
            fetchDrugDetails();
        }
    }, [batchID]);

    // Get available roles for transfer based on current owner's role
    const getAvailableRoles = () => {
        if (!currentDrug || !currentDrug.ownerRole) return [];
        return roleSequence[currentDrug.ownerRole] || [];
    };

    const handleSubmit = async (e, retryCount = 0) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!batchID || !newOwner || !newRole) {
            setError('Please fill in all fields: Batch ID, New Owner, and New Role.');
            setIsSubmitting(false);
            return;
        }

        if (!user) {
            setError('You must be logged in to transfer ownership.');
            setIsSubmitting(false);
            return;
        }

        // Validate the transfer sequence
        if (!currentDrug) {
            setError('Please enter a valid Batch ID first.');
            setIsSubmitting(false);
            return;
        }

        const availableRoles = getAvailableRoles();
        if (!availableRoles.includes(newRole)) {
            setError(`Invalid transfer sequence. ${currentDrug.ownerRole} can only transfer to: ${availableRoles.join(', ')}`);
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await api.post('/drugs/transfer', {
                batchID,
                newOwner,
                newRole
            });
            setMessage(response.data.message || 'Ownership transferred successfully!');
            setBatchID('');
            setNewOwner('');
            setNewRole('');
            setCurrentDrug(null);
        } catch (err) {
            console.error("Transfer Ownership error:", err.response || err);

            if (err.response?.status === 409 && retryCount < 3) {
                setMessage('Transaction conflict detected. Retrying...');
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                return handleSubmit(e, retryCount + 1);
            }

            if (err.response?.status === 403) {
                setError(err.response.data.error || 'Permission Denied: You might not be the current owner or allowed to transfer.');
            } else {
                setError(err.response?.data?.error || 'Failed to transfer ownership. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="transfer-ownership-container">
            <h2>Transfer Drug Ownership</h2>
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

                {isLoading && <p className="info">Loading drug details...</p>}
                
                {currentDrug && (
                    <div className="drug-info">
                        <p><strong>Current Owner:</strong> {currentDrug.owner}</p>
                        <p><strong>Current Role:</strong> {currentDrug.ownerRole}</p>
                        <p><strong>Drug Name:</strong> {currentDrug.name}</p>
                        <p><strong>Status:</strong> {currentDrug.status}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="newOwner">New Owner:</label>
                    <input
                        type="text"
                        id="newOwner"
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                        placeholder="Enter New Owner Identifier"
                        required
                        disabled={!currentDrug}
                    />
                </div>

                <div>
                    <label htmlFor="newRole">New Owner's Role:</label>
                    <select
                        id="newRole"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        required
                        disabled={!currentDrug || getAvailableRoles().length === 0}
                    >
                        <option value="">Select New Owner's Role</option>
                        {getAvailableRoles().map(role => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>
                    {currentDrug && getAvailableRoles().length === 0 && (
                        <p className="info">This drug has reached the end of the supply chain.</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !user || !currentDrug || getAvailableRoles().length === 0}
                >
                    {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
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

export default TransferOwnershipPage;

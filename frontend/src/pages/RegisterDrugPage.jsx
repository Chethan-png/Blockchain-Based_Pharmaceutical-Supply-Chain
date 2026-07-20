import React, { useState } from 'react';
import api from '../services/api'; // Assuming you have an api service configured
import { useAuth } from '../context/AuthContext'; // To get user info if needed

const RegisterDrugPage = () => {
    const [batchID, setBatchID] = useState('');
    const [name, setName] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // Get user context

    const handleSubmit = async (e, retryCount = 0) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        // Basic validation
        if (!batchID || !name || !manufacturer || !expiryDate) {
            setError('Please fill in all fields.');
            setIsSubmitting(false);
            return;
        }

        // Optional: Check if user role is manufacturer if required by frontend logic
        // (Backend already checks this)
        // if (user?.role !== 'manufacturer') {
        //     setError('Only manufacturers can register drugs.');
        //     return;
        // }

        try {
            const response = await api.post('/drugs/register', {
                batchID,
                name,
                manufacturer,
                expiryDate
            });
            
            setMessage(response.data.message || 'Drug registered successfully!');
            // Clear form
            setBatchID('');
            setName('');
            setManufacturer('');
            setExpiryDate('');
        } catch (err) {
            console.error("Registration error:", err.response || err);
            
            // Check if it's a conflict error and we haven't exceeded retry attempts
            if (err.response?.status === 409 && retryCount < 3) {
                setMessage('Transaction conflict detected. Retrying...');
                // Wait for a short random time before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                // Retry the submission
                return handleSubmit(e, retryCount + 1);
            }
            
            setError(err.response?.data?.error || 'Failed to register drug. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
            <h1>Register New Drug</h1>
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
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Drug Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="manufacturer" style={{ display: 'block', marginBottom: '5px' }}>Manufacturer:</label>
                    <input
                        type="text"
                        id="manufacturer"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="expiryDate" style={{ display: 'block', marginBottom: '5px' }}>Expiry Date:</label>
                    <input
                        type="date" // Using type="date" for better UX
                        id="expiryDate"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                        padding: '10px 15px', 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Registering...' : 'Register Drug'}
                </button>
            </form>
            {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
        </div>
    );
};

export default RegisterDrugPage; 
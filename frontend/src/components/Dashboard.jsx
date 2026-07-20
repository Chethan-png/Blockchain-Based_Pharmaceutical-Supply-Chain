import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, hasPermission } = useAuth();

    if (!user) {
        return <div>Please log in to view the dashboard</div>;
    }

    return (
        <div className="dashboard">
            <h1>Welcome, {user.username} ({user.role})</h1>
            
            <div className="dashboard-grid">
                {/* Manufacturer Options */}
                {hasPermission('manufacturer') && (
                    <>
                        <Link to="/register-drug" className="dashboard-card">
                            <h3>Register New Drug</h3>
                            <p>Add a new drug batch to the system</p>
                        </Link>
                        <Link to="/recall-drug" className="dashboard-card">
                            <h3>Recall Drug</h3>
                            <p>Mark a drug batch as recalled</p>
                        </Link>
                    </>
                )}

                {/* Owner Options (Manufacturer, Wholesaler, Distributor, Pharmacy) */}
                {(hasPermission('manufacturer') || 
                  hasPermission('wholesaler') || 
                  hasPermission('distributor') || 
                  hasPermission('pharmacy')) && (
                    <>
                        <Link to="/update-location" className="dashboard-card">
                            <h3>Update Location</h3>
                            <p>Update the current location of a drug batch</p>
                        </Link>
                        <Link to="/update-status" className="dashboard-card">
                            <h3>Update Status</h3>
                            <p>Update the status of a drug batch</p>
                        </Link>
                        <Link to="/transfer-ownership" className="dashboard-card">
                            <h3>Transfer Ownership</h3>
                            <p>Transfer ownership of a drug batch</p>
                        </Link>
                    </>
                )}

                {/* Common Options (All Roles) */}
                <Link to="/view-drugs" className="dashboard-card">
                    <h3>View All Drugs</h3>
                    <p>View all drug batches in the system</p>
                </Link>
                <Link to="/drug-history" className="dashboard-card">
                    <h3>View Drug History</h3>
                    <p>View the history of a drug batch</p>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard; 
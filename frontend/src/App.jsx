import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

import Homepage from './pages/Homepage';
import AddDrugPage from './pages/AddDrugPage';
import ViewDrugs from './pages/ViewDrugs';
import DrugDetailsPage from './pages/DrugDetailsPage';
import UpdateLocationPage from './pages/UpdateLocationPage';
import UpdateStatusPage from './pages/UpdateStatusPage';
import TransferOwnershipPage from './pages/TransferOwnershipPage';
import RecallDrugPage from './pages/RecallDrugPage';
import AddNotePage from './pages/AddNotePage';
import ViewNotesPage from './pages/ViewNotesPage';
import CheckExpiryPage from './pages/CheckExpiryPage';
import DrugTimeline from './pages/DrugTimeline';
import DrugHistoryPage from './pages/DrugHistoryPage';
import RegisterDrugPage from './pages/RegisterDrugPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/register-drug" element={<ProtectedRoute><RegisterDrugPage /></ProtectedRoute>} />
                        <Route path="/recall-drug" element={<ProtectedRoute><RecallDrugPage /></ProtectedRoute>} />
                        <Route path="/update-location" element={<ProtectedRoute><UpdateLocationPage /></ProtectedRoute>} />
                        <Route path="/update-status" element={<ProtectedRoute><UpdateStatusPage /></ProtectedRoute>} />
                        <Route path="/transfer-ownership" element={<ProtectedRoute><TransferOwnershipPage /></ProtectedRoute>} />
                        <Route path="/view-drugs" element={<ProtectedRoute><ViewDrugs /></ProtectedRoute>} />
                        <Route path="/drug-history" element={<ProtectedRoute><DrugHistoryPage /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/login" />} />
                        <Route path="/add" element={<AddDrugPage />} />
                        <Route path="/drugs" element={<ViewDrugs />} />
                        <Route path="/drugs/:id" element={<DrugDetailsPage />} />
                        <Route path="/drugs/:id/location" element={<UpdateLocationPage />} />
                        <Route path="/drugs/:id/status" element={<UpdateStatusPage />} />
                        <Route path="/drugs/:id/transfer" element={<TransferOwnershipPage />} />
                        <Route path="/drugs/:id/recall" element={<RecallDrugPage />} />
                        <Route path="/drugs/:id/notes/add" element={<AddNotePage />} />
                        <Route path="/drugs/:id/notes" element={<ViewNotesPage />} />
                        <Route path="/drugs/:id/isExpired" element={<CheckExpiryPage />} />
                        <Route path="/drugs/:id/timeline" element={<DrugTimeline />} />
                        <Route path="/drugs/:id/history" element={<DrugHistoryPage />} />
                        <Route path="*" element={<ProtectedRoute><div>404 - Page Not Found</div></ProtectedRoute>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;

const { getDrugContract } = require('../services/fabricService');

const registerDrug = async (req, res) => {
    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ error: 'Only manufacturers can register drugs' });
        }

        const { batchID, name, manufacturer, expiryDate } = req.body;
        const { contract } = await getDrugContract(req.user.username);

        // Create a new transaction
        const transaction = contract.createTransaction('RegisterDrug');

        // Submit the transaction (implicitly waits for commit)
        await transaction.submit(batchID, name, manufacturer, expiryDate);

        res.json({ message: 'Drug registered successfully', transactionId: transaction.getTransactionId() });
    } catch (error) {
        console.error('Register Drug Error:', error);

        // Check for MVCC_READ_CONFLICT
        if (error.message && error.message.includes('MVCC_READ_CONFLICT')) {
            return res.status(409).json({
                error: 'Transaction conflict occurred. Please try again.',
                details: 'Another transaction may have modified the same data. This is a temporary condition.'
            });
        }

        res.status(400).json({ error: error.message || 'Failed to register drug' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { batchID, newLocation } = req.body;
        const { contract } = await getDrugContract(req.user.username);

        // Create transaction
        const transaction = contract.createTransaction('UpdateLocation');
        // Submit and implicitly wait for commit
        await transaction.submit(batchID, newLocation);

        res.json({ message: 'Location updated successfully', transactionId: transaction.getTransactionId() });
    } catch (error) {
        console.error('Update Location Error:', error);
        // Handle MVCC conflict
        if (error.message && error.message.includes('MVCC_READ_CONFLICT')) {
            return res.status(409).json({
                error: 'Transaction conflict occurred. Please try again.',
                details: 'Another transaction may have modified the same data. This is a temporary condition.'
            });
        }
        // Handle specific chaincode errors like ownership check
        if (error.message && error.message.includes('only the current owner can update location')) {
            return res.status(403).json({
                error: 'Permission Denied',
                details: 'Only the current owner of the drug can update its location.'
            });
        }

        res.status(400).json({ error: error.message || 'Failed to update location' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { batchID, newStatus } = req.body;
        const { contract } = await getDrugContract(req.user.username);

        // Create transaction
        const transaction = contract.createTransaction('UpdateStatus');
        // Submit and implicitly wait for commit
        await transaction.submit(batchID, newStatus);

        res.json({ message: 'Status updated successfully', transactionId: transaction.getTransactionId() });
    } catch (error) {
        console.error('Update Status Error:', error);

        // Handle MVCC conflict
        if (error.message && error.message.includes('MVCC_READ_CONFLICT')) {
            return res.status(409).json({
                error: 'Transaction conflict occurred. Please try again.',
                details: 'Another transaction may have modified the same data. This is a temporary condition.'
            });
        }

        // Handle specific chaincode errors like ownership check
        if (error.message && error.message.includes('only the current owner can update status')) {
            return res.status(403).json({
                error: 'Permission Denied',
                details: 'Only the current owner of the drug can update its status.'
            });
        }

        res.status(400).json({ error: error.message || 'Failed to update status' });
    }
};

const transferOwnership = async (req, res) => {
    try {
        const { batchID, newOwner, newRole } = req.body;
        const { username } = req.user;
        const { contract } = await getDrugContract(username);

        await contract.submitTransaction('TransferOwnership', batchID, newOwner, newRole);

        res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
        console.error('Transfer Ownership Error:', error);
        res.status(400).json({ error: error.message || 'Failed to transfer ownership' });
    }
};

const recallDrug = async (req, res) => {
    try {
        if (req.user.role !== 'manufacturer') {
            return res.status(403).json({ error: 'Only manufacturers can recall drugs' });
        }

        const { batchID } = req.body;
        const { contract } = await getDrugContract(req.user.username);

        // Create transaction
        const transaction = contract.createTransaction('RecallDrug');

        // Submit the transaction (implicitly waits for commit)
        await transaction.submit(batchID);

        res.json({ message: 'Drug recalled successfully', transactionId: transaction.getTransactionId() });
    } catch (error) {
        console.error('Recall Drug Error:', error);

        // Handle MVCC conflict
        if (error.message && error.message.includes('MVCC_READ_CONFLICT')) {
            return res.status(409).json({
                error: 'Transaction conflict occurred. Please try again.',
                details: 'Another transaction may have modified the same data. This is a temporary condition.'
            });
        }

        res.status(400).json({ error: error.message || 'Failed to recall drug' });
    }
};

const getDrug = async (req, res) => {
    try {
        const { batchID } = req.params;
        const { contract } = await getDrugContract(req.user.username);
        const drug = await contract.evaluateTransaction('VerifyDrug', batchID);

        res.json(JSON.parse(drug.toString()));
    } catch (error) {
        console.error('Get Drug Error:', error);
        res.status(400).json({ error: error.message || 'Failed to get drug details' });
    }
};

const getAllDrugs = async (req, res) => {
    try {
        const { contract } = await getDrugContract(req.user.username);
        const drugs = await contract.evaluateTransaction('GetAllDrugs');

        res.json(JSON.parse(drugs.toString()));
    } catch (error) {
        console.error('Get All Drugs Error:', error);
        res.status(400).json({ error: error.message || 'Failed to get all drugs' });
    }
};

const getDrugHistory = async (req, res) => {
    try {
        const { batchID } = req.params;
        const { contract } = await getDrugContract(req.user.username);
        const history = await contract.evaluateTransaction('GetDrugHistory', batchID);

        res.json(JSON.parse(history.toString()));
    } catch (error) {
        console.error('Get Drug History Error:', error);
        res.status(400).json({ error: error.message || 'Failed to get drug history' });
    }
};

module.exports = {
    registerDrug,
    updateLocation,
    updateStatus,
    transferOwnership,
    recallDrug,
    getDrug,
    getAllDrugs,
    getDrugHistory
};
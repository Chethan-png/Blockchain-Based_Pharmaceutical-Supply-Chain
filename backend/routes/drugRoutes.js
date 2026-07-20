const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    registerDrug,
    updateLocation,
    updateStatus,
    transferOwnership,
    recallDrug,
    getDrug,
    getAllDrugs,
    getDrugHistory
} = require('../controllers/drugController');

// Manufacturer routes
router.post('/register', auth(['manufacturer']), registerDrug);
router.post('/recall', auth(['manufacturer']), recallDrug);

// Owner routes (manufacturer, wholesaler, distributor, pharmacy)
router.post('/location', auth(['manufacturer', 'wholesaler', 'distributor', 'pharmacy']), updateLocation);
router.post('/status', auth(['manufacturer', 'wholesaler', 'distributor', 'pharmacy']), updateStatus);
router.post('/transfer', auth(['manufacturer', 'wholesaler', 'distributor', 'pharmacy']), transferOwnership);

// Read routes (all roles)
router.get('/:batchID', auth(), getDrug);
router.get('/', auth(), getAllDrugs);
router.get('/:batchID/history', auth(), getDrugHistory);

module.exports = router;

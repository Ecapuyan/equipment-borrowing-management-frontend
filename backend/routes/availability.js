const express = require('express');
const router = express.Router();
const { getSlotAvailability, getEquipmentAvailability } = require('../controllers/availabilityController');

router.get('/slots', getSlotAvailability);
router.get('/equipment', getEquipmentAvailability);

module.exports = router;
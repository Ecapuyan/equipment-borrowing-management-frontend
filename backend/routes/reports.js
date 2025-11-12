const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect, authMiddleware.restrictTo('staff', 'superadmin'));

router.get('/summary', reportsController.getSummary);
router.get('/completed', reportsController.getCompletedReservations);
router.get('/rejected', reportsController.getRejectedReservations);

module.exports = router;

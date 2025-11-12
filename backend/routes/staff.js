const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect, authMiddleware.restrictTo('superadmin'));

router
    .route('/')
    .get(staffController.getAllStaff)
    .post(staffController.createStaff);

router
    .route('/:id')
    .get(staffController.getStaff)
    .patch(staffController.updateStaff)
    .delete(staffController.deleteStaff);

module.exports = router;

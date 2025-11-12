const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware.protect);

router
    .route('/')
    .get(equipmentController.getAllEquipment)
    .post(authMiddleware.restrictTo('staff', 'superadmin'), equipmentController.createEquipment);

router
    .route('/:id')
    .get(equipmentController.getEquipment)
    .patch(authMiddleware.restrictTo('staff', 'superadmin'), equipmentController.updateEquipment)
    .delete(authMiddleware.restrictTo('staff', 'superadmin'), equipmentController.deleteEquipment);

module.exports = router;

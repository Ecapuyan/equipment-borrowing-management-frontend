const express = require('express');
const router = express.Router();
const {
    createReservation,
    getAllReservations,
    getReservation,
    updateReservation,
    deleteReservation,
    getReservationItems
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');
const { uploadFields, handleMulterError } = require('../middleware/multerMiddleware');

// Routes for reservations
router.post('/', [protect, uploadFields, handleMulterError, createReservation]);
router.get('/', protect, getAllReservations);
router.get('/:id', protect, getReservation);
router.get('/:id/items', protect, getReservationItems);
router.patch('/:id', protect, updateReservation);
router.delete('/:id', protect, deleteReservation);

module.exports = router;
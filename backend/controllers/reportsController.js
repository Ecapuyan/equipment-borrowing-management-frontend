const db = require('../config/db');

exports.getSummary = async (req, res) => {
    try {
        const [pending] = await db.query("SELECT COUNT(*) AS total_pending FROM reservations WHERE status = 'pending'");
        const [approved] = await db.query("SELECT COUNT(*) AS total_approved FROM reservations WHERE status = 'approved'");
        const [borrowed] = await db.query("SELECT COUNT(*) AS total_borrowed FROM reservations WHERE status = 'picked_up'");
        const [completed] = await db.query("SELECT COUNT(*) AS total_completed FROM reservations WHERE status = 'returned'");

        const summary = {
            total_pending: pending[0].total_pending,
            total_approved: approved[0].total_approved,
            total_borrowed: borrowed[0].total_borrowed,
            total_completed: completed[0].total_completed
        };

        return res.status(200).send({
            message: "Summary retrieved successfully",
            data: summary
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.getCompletedReservations = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM reservations WHERE status = 'returned'");
        return res.status(200).send({
            message: "Completed reservations retrieved successfully",
            data: results
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.getRejectedReservations = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM reservations WHERE status = 'rejected'");
        return res.status(200).send({
            message: "Rejected reservations retrieved successfully",
            data: results
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

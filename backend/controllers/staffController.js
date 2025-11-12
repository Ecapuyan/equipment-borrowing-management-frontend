const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAllStaff = async (req, res) => {
    try {
        const [results] = await db.query("SELECT id, username, email, first_name, last_name FROM users WHERE role = 'staff'");
        return res.status(200).send({
            message: "Staff retrieved successfully",
            data: results
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.createStaff = async (req, res) => {
    const { username, password, email, first_name, last_name } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            "INSERT INTO users (username, password, role, email, first_name, last_name) VALUES (?, ?, 'staff', ?, ?, ?)",
            [username, hash, email, first_name, last_name]
        );
        return res.status(201).send({
            message: "Staff created successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.getStaff = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query("SELECT id, username, email, first_name, last_name FROM users WHERE id = ? AND role = 'staff'", [id]);
        if (results.length === 0) {
            return res.status(404).send({
                message: "Staff not found"
            });
        }
        return res.status(200).send({
            message: "Staff retrieved successfully",
            data: results[0]
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.updateStaff = async (req, res) => {
    const { id } = req.params;
    const { username, email, first_name, last_name } = req.body;
    try {
        const [results] = await db.query(
            "UPDATE users SET username = ?, email = ?, first_name = ?, last_name = ? WHERE id = ? AND role = 'staff'",
            [username, email, first_name, last_name, id]
        );
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Staff not found"
            });
        }
        return res.status(200).send({
            message: "Staff updated successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.deleteStaff = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query("DELETE FROM users WHERE id = ? AND role = 'staff'", [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Staff not found"
            });
        }
        return res.status(200).send({
            message: "Staff deleted successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

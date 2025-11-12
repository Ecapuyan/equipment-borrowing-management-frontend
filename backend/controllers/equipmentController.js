const db = require('../config/db');

exports.getAllEquipment = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM equipment");
        return res.status(200).send({
            message: "Equipment retrieved successfully",
            data: results
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.createEquipment = async (req, res) => {
    const { name, description, quantity, available_quantity } = req.body;
    try {
        await db.query(
            "INSERT INTO equipment (name, description, quantity, available_quantity) VALUES (?, ?, ?, ?)",
            [name, description, quantity, available_quantity]
        );
        return res.status(201).send({
            message: "Equipment created successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.getEquipment = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query("SELECT * FROM equipment WHERE id = ?", [id]);
        if (results.length === 0) {
            return res.status(404).send({
                message: "Equipment not found"
            });
        }
        return res.status(200).send({
            message: "Equipment retrieved successfully",
            data: results[0]
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.updateEquipment = async (req, res) => {
    const { id } = req.params;
    const { name, description, quantity, available_quantity } = req.body;
    try {
        const [results] = await db.query(
            "UPDATE equipment SET name = ?, description = ?, quantity = ?, available_quantity = ? WHERE id = ?",
            [name, description, quantity, available_quantity, id]
        );
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Equipment not found"
            });
        }
        return res.status(200).send({
            message: "Equipment updated successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.deleteEquipment = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.query("DELETE FROM equipment WHERE id = ?", [id]);
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Equipment not found"
            });
        }
        return res.status(200).send({
            message: "Equipment deleted successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

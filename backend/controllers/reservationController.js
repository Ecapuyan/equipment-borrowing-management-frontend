const db = require('../config/db');

exports.getAllReservations = async (req, res) => {
    console.log('User making request:', req.user);

    let query = `
        SELECT 
            r.*,
            u.username,
            u.first_name,
            u.last_name,
            u.email,
            GROUP_CONCAT(CONCAT(e.name, ' (', ri.quantity, ')') SEPARATOR ', ') AS items_display
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
        LEFT JOIN equipment e ON ri.equipment_id = e.id
    `;

    let queryParams = [];

    if (req.user.role === 'borrower') {
        query += ` WHERE r.user_id = ?`;
        queryParams.push(req.user.userId);
    }

    query += ` GROUP BY r.id ORDER BY r.reservation_date DESC`;

    console.log('Executing query:', query);
    console.log('Query params:', queryParams);

    try {
        const [results] = await db.query(query, queryParams);
        console.log('Query results:', results);
        return res.status(200).send({
            message: "Reservations retrieved successfully",
            data: results
        });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).send({
            message: 'Database error: ' + error.message
        });
    }
};

exports.createReservation = async (req, res) => {
    console.log('=== CREATING RESERVATION ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User:', req.user);

    const { occasion, notes, phone_number, full_address, reservation_date, time_slot, items } = req.body;
    const user_id = req.user.userId;

    if (!occasion || !reservation_date || !time_slot || !items || !phone_number || !full_address) {
        console.log('Missing required fields');
        return res.status(400).send({
            message: "Missing required fields: occasion, phone_number, full_address, reservation_date, time_slot, items"
        });
    }

    if (!req.files || !req.files.id_picture || !req.files.selfie_picture) {
        console.log('Missing required files');
        return res.status(400).send({
            message: "Both ID picture and selfie picture are required"
        });
    }

    const id_picture = req.files.id_picture[0].filename;
    const selfie_picture = req.files.selfie_picture[0].filename;

    let itemsArray;
    try {
        itemsArray = JSON.parse(items);
        if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
            throw new Error('Items must be a non-empty array');
        }
    } catch (parseError) {
        console.log('Items parse error:', parseError);
        return res.status(400).send({
            message: "Invalid items format: " + parseError.message
        });
    }

    console.log('Parsed items:', itemsArray);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const reservationQuery = `
            INSERT INTO reservations (user_id, occasion, notes, phone_number, full_address, reservation_date, time_slot, id_picture, selfie_picture, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;
        const [results] = await connection.query(
            reservationQuery,
            [user_id, occasion, notes, phone_number, full_address, reservation_date, time_slot, id_picture, selfie_picture]
        );

        const reservation_id = results.insertId;
        console.log('Reservation created with ID:', reservation_id);

        const reservationItems = itemsArray.map(item => [
            reservation_id,
            item.id,
            item.quantity
        ]);

        console.log('Reservation items to insert:', reservationItems);

        const itemsQuery = `
            INSERT INTO reservation_items (reservation_id, equipment_id, quantity) 
            VALUES ?
        `;
        await connection.query(itemsQuery, [reservationItems]);

        await connection.commit();
        console.log('Reservation completed successfully');

        res.status(201).send({
            message: "Reservation created successfully!",
            reservationId: reservation_id
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Reservation creation error:', error);
        res.status(500).send({
            message: "Failed to create reservation: " + error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

exports.getReservation = async (req, res) => {
    const { id } = req.params;

    let query = `
        SELECT 
            r.*,
            u.username,
            u.first_name,
            u.last_name,
            u.email
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
    `;

    let queryParams = [id];

    if (req.user.role === 'borrower') {
        query += ` AND r.user_id = ?`;
        queryParams.push(req.user.userId);
    }

    try {
        const [results] = await db.query(query, queryParams);

        if (results.length === 0) {
            return res.status(404).send({
                message: "Reservation not found"
            });
        }

        const itemsQuery = `
            SELECT 
                ri.*,
                e.name as equipment_name,
                e.description
            FROM reservation_items ri
            LEFT JOIN equipment e ON ri.equipment_id = e.id
            WHERE ri.reservation_id = ?
        `;
        const [itemsResults] = await db.query(itemsQuery, [id]);

        const reservation = {
            ...results[0],
            items: itemsResults
        };

        return res.status(200).send({
            message: "Reservation retrieved successfully",
            data: reservation
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.updateReservation = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).send({
            message: "Status is required"
        });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'picked_up', 'returned'];
    if (!validStatuses.includes(status)) {
        return res.status(400).send({
            message: "Invalid status. Must be one of: " + validStatuses.join(', ')
        });
    }

    let query = "UPDATE reservations SET status = ? WHERE id = ?";
    let queryParams = [status, id];

    if (req.user.role === 'borrower') {
        query += " AND user_id = ?";
        queryParams.push(req.user.userId);
    }

    try {
        const [results] = await db.query(query, queryParams);
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Reservation not found"
            });
        }
        return res.status(200).send({
            message: "Reservation updated successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.deleteReservation = async (req, res) => {
    const { id } = req.params;

    let query = "DELETE FROM reservations WHERE id = ?";
    let queryParams = [id];

    if (req.user.role === 'borrower') {
        query += " AND user_id = ?";
        queryParams.push(req.user.userId);
    }

    try {
        const [results] = await db.query(query, queryParams);
        if (results.affectedRows === 0) {
            return res.status(404).send({
                message: "Reservation not found"
            });
        }
        return res.status(200).send({
            message: "Reservation deleted successfully!"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.getReservationItems = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await db.query(
            `SELECT 
                ri.quantity,
                e.name,
                e.description
            FROM reservation_items ri
            JOIN equipment e ON ri.equipment_id = e.id
            WHERE ri.reservation_id = ?`,
            [id]
        );

        if (results.length === 0) {
            return res.status(404).send({
                message: "No items found for this reservation"
            });
        }

        return res.status(200).send({
            message: "Reservation items retrieved successfully",
            data: results
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message
        });
    }
};
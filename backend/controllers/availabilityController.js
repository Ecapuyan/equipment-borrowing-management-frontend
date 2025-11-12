const db = require('../config/db');

// Get Slot Availability
const getSlotAvailability = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    const query = `
        SELECT time_slot FROM reservations 
        WHERE reservation_date = ? AND status IN ('pending', 'approved', 'picked_up')
    `;

    try {
        const [results] = await db.query(query, [date]);

        let morning = true;
        let afternoon = true;
        let fullday = true;

        results.forEach(row => {
            if (row.time_slot === 'fullday') {
                morning = false;
                afternoon = false;
                fullday = false;
            }
            if (row.time_slot === 'morning') {
                morning = false;
                fullday = false;
            }
            if (row.time_slot === 'afternoon') {
                afternoon = false;
                fullday = false;
            }
        });

        res.json({ morning, afternoon, fullday });
    } catch (err) {
        console.error('Error fetching slot availability:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Equipment Availability - FIXED VERSION
const getEquipmentAvailability = async (req, res) => {
    const { date, slot } = req.query;
    if (!date || !slot) {
        return res.status(400).json({ message: 'Date and slot are required' });
    }

    let conflictingSlots = [];
    if (slot === 'morning') {
        conflictingSlots = ['morning', 'fullday'];
    } else if (slot === 'afternoon') {
        conflictingSlots = ['afternoon', 'fullday'];
    } else if (slot === 'fullday') {
        conflictingSlots = ['morning', 'afternoon', 'fullday'];
    } else {
        return res.status(400).json({ message: 'Invalid slot' });
    }

    const query = `
        SELECT 
            e.id AS equipment_id,
            e.name,
            e.description,
            e.quantity AS total_quantity,
            COALESCE(SUM(ri.quantity), 0) AS reserved_quantity,
            GREATEST(e.quantity - COALESCE(SUM(ri.quantity), 0), 0) AS available_quantity
        FROM 
            equipment e
        LEFT JOIN 
            reservation_items ri ON e.id = ri.equipment_id
        LEFT JOIN 
            reservations r ON ri.reservation_id = r.id
            AND r.reservation_date = ?
            AND r.time_slot IN (?)
            AND r.status IN ('pending', 'approved', 'picked_up')
        GROUP BY 
            e.id, e.name, e.description, e.quantity
        HAVING 
            available_quantity > 0 OR SUM(ri.quantity) IS NULL
        ORDER BY 
            e.name
    `;

    try {
        const [results] = await db.query(query, [date, conflictingSlots]);
        
        // Ensure all equipment is returned, even if not reserved
        const allEquipmentQuery = `SELECT id, name, description, quantity FROM equipment WHERE quantity > 0`;
        const [allEquipment] = await db.query(allEquipmentQuery);
        
        // Create a map of available equipment
        const availableMap = new Map();
        results.forEach(item => {
            availableMap.set(item.equipment_id, item);
        });
        
        // Combine results to ensure all equipment is included
        const finalResults = allEquipment.map(equip => {
            const availableItem = availableMap.get(equip.id);
            if (availableItem) {
                return availableItem;
            } else {
                return {
                    equipment_id: equip.id,
                    name: equip.name,
                    description: equip.description,
                    total_quantity: equip.quantity,
                    reserved_quantity: 0,
                    available_quantity: equip.quantity
                };
            }
        });

        res.json(finalResults);
    } catch (err) {
        console.error('Error fetching equipment availability:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getSlotAvailability,
    getEquipmentAvailability
};
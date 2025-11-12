ALTER TABLE reservations
ADD COLUMN `time_slot` ENUM('morning', 'afternoon', 'fullday') NOT NULL 
AFTER `reservation_date`;

ALTER TABLE reservation_items
ADD COLUMN `quantity` INT NOT NULL DEFAULT 1
AFTER `equipment_id`;

ALTER TABLE reservations
ADD COLUMN `phone_number` VARCHAR(20) NULL
AFTER `notes`;

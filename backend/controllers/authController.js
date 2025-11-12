const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    const { username, password, role, email, first_name, last_name } = req.body;

    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Data:', { username, email, first_name, last_name, role });

    try {
        const hash = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed successfully');

        await db.query(
            "INSERT INTO users (username, password, role, email, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)",
            [username, hash, role, email, first_name, last_name]
        );

        console.log('✅ User registered successfully');
        return res.status(201).send({
            message: "User registered successfully!"
        });
    } catch (error) {
        console.log('❌ Error:', error);
        return res.status(500).send({
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);

    try {
        const [results] = await db.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        console.log('Database results:', results);

        if (results.length === 0) {
            console.log('❌ User not found in database');
            return res.status(401).send({
                message: "Authentication failed - user not found"
            });
        }

        const user = results[0];
        console.log('✅ User found:', user.username);
        console.log('User role:', user.role);

        const result = await bcrypt.compare(password, user.password);
        console.log('Bcrypt compare result:', result);

        if (result) {
            console.log('✅ Password correct!');
            const token = jwt.sign({
                username: user.username,
                userId: user.id,
                role: user.role
            },
            process.env.JWT_KEY,
            {
                expiresIn: "1h"
            });

            console.log('✅ Token generated successfully');

            return res.status(200).send({
                message: "Authentication successful",
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name
                }
            });
        } else {
            console.log('❌ Password incorrect');
            res.status(401).send({
                message: "Authentication failed - invalid password"
            });
        }
    } catch (error) {
        console.log('❌ Error:', error);
        return res.status(500).send({
            message: "An error occurred during the login process."
        });
    }
};

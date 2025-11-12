const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).send({
            message: 'You are not logged in! Please log in to get access.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send({
            message: 'Invalid token.'
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).send({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
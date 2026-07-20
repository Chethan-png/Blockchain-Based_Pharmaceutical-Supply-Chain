const jwt = require('jsonwebtoken');
const config = require('../config/config');

const auth = (roles = []) => {
    return (req, res, next) => {
        try {
            const token = req.header('Authorization').replace('Bearer ', '');
            const decoded = jwt.verify(token, config.jwtSecret);
            
            // Check if user's role is allowed
            if (roles.length && !roles.includes(decoded.role)) {
                throw new Error('Unauthorized access');
            }
            
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Please authenticate' });
        }
    };
};

module.exports = auth; 
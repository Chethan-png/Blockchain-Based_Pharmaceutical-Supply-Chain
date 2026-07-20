const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { enrollUser } = require('../utils/enrollUser');

const login = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        const validRoles = ['manufacturer', 'wholesaler', 'distributor', 'pharmacy', 'customer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const usersPath = path.join(__dirname, '../users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

        const matchedUser = usersData.find(
            u => u.username === username && u.password === password && u.role === role
        );

        if (!matchedUser) {
            return res.status(401).json({ error: 'Invalid username, password, or role' });
        }

        const user = await enrollUser(username, role);

        const token = jwt.sign(
            {
                username: user.username,
                role: user.role,
                mspId: user.mspId
            },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    login,
    getProfile
};

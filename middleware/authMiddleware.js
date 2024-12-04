const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const user = await User.findOne({ 'jwtSecret': token }); // Check if user exists based on the secret

            if (user) {
                req.user = user; // Attach user info to the request object
                next(); // Proceed to the next middleware or route handler
            } else {
                res.status(401).json({ error: 'Not authorized, token failed' });
            }
        } catch (error) {
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };

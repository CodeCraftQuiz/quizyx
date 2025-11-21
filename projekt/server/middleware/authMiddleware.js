const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-passwordHash');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Nieautoryzowany, błędny token' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Nieautoryzowany, brak tokena' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: 'Brak uprawnień administratora' });
    }
};

module.exports = { protect, admin };

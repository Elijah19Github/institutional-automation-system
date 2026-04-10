const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded; // Contains id and role
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};



module.exports = { authenticate, authorize };

const jwt = require('jsonwebtoken')
const authMiddleWare = (req, res, next) => {
    console.log(req, 'req...');
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided. Please login to continue",
        });
    }
    try {
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET)
        console.log(decodeToken, 'decodeToken');
        req.userInfo = decodeToken
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token!"
        });
    }
}
module.exports = authMiddleWare
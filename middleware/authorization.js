const authorizationMiddleware = (role) => {
    return (req, res, next) => {
        if (!role.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Insufficient permissions."
            })
        }
        next();
    }
}
module.exports = authorizationMiddleware
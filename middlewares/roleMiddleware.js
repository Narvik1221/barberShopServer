// middlewares/roleMiddleware.js
// Middleware для проверки, имеет ли пользователь одну из разрешённых ролей
exports.checkRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }
  next();
};

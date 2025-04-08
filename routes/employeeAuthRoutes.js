// routes/employeeAuthRoutes.js
const express = require("express");
const {
  register,
  login,
  getEmployeeProfile,
} = require("../controllers/employeeAuthController");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();

// Регистрация сотрудника/админа (требуется передать registrationCode в теле запроса)
router.post("/register", register);

// Логин сотрудника/админа
router.post("/login", login);

// Получение профиля сотрудника/админа
router.get("/me", verifyToken, getEmployeeProfile);

module.exports = router;

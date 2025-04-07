const express = require("express");
const {
  register,
  login,
  getUserProfile,
  getUserBookings,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getUserProfile); // Профиль пользователя
router.get("/appointments", authenticate, getUserBookings); // Записи пользователя
module.exports = router;

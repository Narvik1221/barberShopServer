// routes/authRoutes.js
const express = require("express");
const {
  register,
  login,
  getUserProfile,
  getUserBookings,
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getUserProfile);
router.get("/appointments", verifyToken, getUserBookings);

module.exports = router;

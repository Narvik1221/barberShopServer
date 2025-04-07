const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  createBooking,
  getUserBookings,
  getBookedSlots,
  deleteBooking,
} = require("../controllers/bookingController");

const router = express.Router();

// Создание записи
router.post("/", authenticate, createBooking);
// Получение всех записей пользователя
router.get("/", authenticate, getUserBookings);
router.get("/booked-slots/:masterId", getBookedSlots);
router.delete("/:id", deleteBooking);
module.exports = router;

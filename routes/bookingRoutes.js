// routes/bookingRoutes.js
const express = require("express");
const { verifyToken } = require("../middlewares/authMiddleware");
const {
  createBooking,
  getUserBookings,
  getBookedSlots,
  deleteBooking,
} = require("../controllers/bookingController");
const router = express.Router();

// Клиент создаёт запись
router.post("/", verifyToken, createBooking);

// Клиент получает свои записи
router.get("/", verifyToken, getUserBookings);

// Получение забронированных слотов для сотрудника (без авторизации)
router.get("/booked-slots/:employeeId", getBookedSlots);

// Удаление записи (без ограничения ролей, можно добавить проверку внутри контроллера)
router.delete("/:id", verifyToken, deleteBooking);

module.exports = router;

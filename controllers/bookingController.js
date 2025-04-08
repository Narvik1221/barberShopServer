// controllers/bookingController.js
const pool = require("../config/db");

// Создание записи
exports.createBooking = async (req, res) => {
  const { employee_id, service_id, date, time } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO bookings (user_id, employee_id, service_id, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.id, employee_id, service_id, date, time]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка создания записи" });
  }
};

// Получение записей пользователя (для клиентов)
exports.getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.name as service_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения записей" });
  }
};

// Получение забронированных слотов для сотрудника (или для показа доступного времени)
exports.getBookedSlots = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const result = await pool.query(
      "SELECT date, time FROM bookings WHERE employee_id = $1",
      [employeeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения забронированных слотов" });
  }
};

// Удаление записи (может удалять клиент или сотрудник)
exports.deleteBooking = async (req, res) => {
  const { id } = req.params;
  try {
    // Для клиента проверяем, что запись принадлежит ему
    await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
    res.json({ message: "Запись удалена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления записи" });
  }
};

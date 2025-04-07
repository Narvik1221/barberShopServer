const pool = require("../config/db");

// Контроллер для создания записи
exports.createBooking = async (req, res) => {
  try {
    const { master_id, date, time } = req.body;
    const user_id = req.user.id;

    if (!master_id || !date || !time) {
      return res
        .status(400)
        .json({ error: "Все поля обязательны для заполнения" });
    }

    // Запись в базу данных без учета временной зоны
    await pool.query(
      `INSERT INTO bookings (user_id, master_id, date, time) 
       VALUES ($1, $2, $3, $4)`,
      [user_id, master_id, date, time]
    );

    res.status(201).json({ message: "Запись успешно создана" });
  } catch (err) {
    console.error("Ошибка при создании записи:", err.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};

// Контроллер для получения записей пользователя
exports.getUserBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const bookings = await pool.query(
      `SELECT 
          b.id, 
          CONCAT(m.name, ' ', m.surname) AS master_name, 
          bs.name AS barbershop_name, 
          b.date, 
          b.time 
       FROM bookings b
       JOIN masters m ON b.master_id = m.id
       JOIN barbershops bs ON m.barbershop_id = bs.id
       WHERE b.user_id = $1
       ORDER BY b.date, b.time`,
      [user_id]
    );

    res.status(200).json(bookings.rows);
  } catch (err) {
    console.error("Ошибка при получении записей:", err.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};
exports.getBookedSlots = async (req, res) => {
  try {
    const { masterId } = req.params;
    console.log("Получен master_id:", masterId);

    const bookedSlots = await pool.query(
      `SELECT date, time FROM bookings WHERE master_id = $1 ORDER BY date, time`,
      [masterId]
    );

    console.log("Результат запроса:", bookedSlots.rows);

    res.status(200).json(bookedSlots.rows);
  } catch (err) {
    console.error("Ошибка при получении забронированных слотов:", err.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM bookings WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Запись не найдена" });
    }

    res.status(200).json({ message: "Запись успешно удалена" });
  } catch (err) {
    console.error("Ошибка при удалении записи:", err.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};

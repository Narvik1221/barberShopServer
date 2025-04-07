const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, surname, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, surname, email, password) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, surname, email, hashedPassword]
    );
    res.status(201).json({ userId: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (!user.rows.length)
      return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password
    );
    if (!isPasswordValid)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ID пользователя из токена

    const user = await pool.query(
      "SELECT id, name, surname, email FROM users WHERE id = $1",
      [userId]
    );
    if (!user.rows.length) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; // ID пользователя из токена

    const bookings = await pool.query(
      `SELECT 
         b.id AS bookingId, 
         sh.name AS barbershopName, 
         sh.address AS barbershopAddress, 
         m.name AS masterName, 
         m.surname AS masterSurname, 
         m.status AS masterStatus, -- Добавлено поле статуса мастера
         b.date, 
         b.time
       FROM bookings b
       JOIN masters m ON b.master_id = m.id
       JOIN barbershops sh ON m.barbershop_id = sh.id
       WHERE b.user_id = $1
       ORDER BY b.date, b.time`,
      [userId]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error("Ошибка при получении записей:", err.message);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};

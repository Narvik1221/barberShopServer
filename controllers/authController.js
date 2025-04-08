// controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Регистрация клиента
exports.register = async (req, res) => {
  const { name, surname, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, surname, email, password, role) VALUES ($1, $2, $3, $4, 'client') RETURNING *",
      [name, surname, email, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
};

// Логин клиента
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role='client'",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Неверный пароль" });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка авторизации" });
  }
};

// Получение профиля клиента
exports.getUserProfile = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, surname, email, role FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения профиля" });
  }
};

// Получение записей клиента
// Получение записей клиента с данными мастера и салона
// Получение записей клиента с данными мастера и салона и отладкой ошибок
exports.getUserBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          b.*,
          serv.name AS service_name,
          u.name AS master_name,
          u.surname AS master_surname,
          u.email AS master_email,
          sal.name AS salon_name,
          sal.address AS salon_address,
          sal.description AS salon_description,
          sal."imagesrc" AS salon_imagesrc
       FROM bookings b
       JOIN services serv ON b.service_id = serv.id
       JOIN employees e ON b.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       JOIN salons sal ON e.salon_id = sal.id
       WHERE b.user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при выполнении запроса getUserBookings:", err);
    // Дополнительное логирование для отладки:
    if (err.stack) {
      console.error("Stack trace:", err.stack);
    }
    res
      .status(500)
      .json({ error: "Ошибка получения записей", details: err.message });
  }
};

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Регистрация сотрудника/админа с проверкой регистрационного кода
// Ожидается: name, surname, email, password, role ('employee' или 'admin'), registrationCode
exports.register = async (req, res) => {
  const { name, surname, email, password, role, registrationCode } = req.body;

  // Проверяем, что роль корректная
  if (!["employee", "admin"].includes(role)) {
    return res.status(400).json({ error: "Неверная роль" });
  }

  // Проверка регистрационного кода для разных ролей
  if (role === "admin") {
    if (registrationCode !== process.env.ADMIN_REGISTRATION_CODE) {
      return res
        .status(403)
        .json({ error: "Неверный регистрационный код для администратора" });
    }
  } else if (role === "employee") {
    if (registrationCode !== process.env.EMPLOYEE_REGISTRATION_CODE) {
      return res
        .status(403)
        .json({ error: "Неверный регистрационный код для сотрудника" });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Создаём пользователя с указанной ролью
    const result = await pool.query(
      "INSERT INTO users (name, surname, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, surname, email, hashedPassword, role]
    );
    const user = result.rows[0];

    // Если регистрируется сотрудник, создаём запись в таблице employees с salon_id = NULL
    if (role === "employee") {
      await pool.query(
        "INSERT INTO employees (user_id, salon_id) VALUES ($1, NULL)",
        [user.id]
      );
    }
    // Для администратора запись в employees не создаём (администратор не привязан к салону)

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
    res.status(500).json({ error: "Ошибка регистрации сотрудника" });
  }
};

// Логин сотрудника/админа остается без изменений
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('employee', 'admin')",
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

// Получение профиля сотрудника/админа
exports.getEmployeeProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         u.id, 
         u.name, 
         u.surname, 
         u.email, 
         u.role,
         e.salon_id
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения профиля" });
  }
};

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const {
    name,
    surname,
    patronymic,
    email,
    password,
    role, // 'employee' | 'salon_admin' | 'admin'
    registrationCode,
  } = req.body;

  // 1) Проверяем, что роль валидна для этого роута
  if (!["employee", "salon_admin", "admin"].includes(role)) {
    return res.status(400).json({ error: "Неверная роль" });
  }

  // 2) Валидация регистрационного кода
  if (
    role === "admin" &&
    registrationCode !== process.env.ADMIN_REGISTRATION_CODE
  ) {
    return res
      .status(403)
      .json({ error: "Неверный код для системного администратора" });
  }
  if (
    role === "salon_admin" &&
    registrationCode !== process.env.SALON_ADMIN_REGISTRATION_CODE
  ) {
    return res
      .status(403)
      .json({ error: "Неверный код для администратора салона" });
  }
  if (
    role === "employee" &&
    registrationCode !== process.env.EMPLOYEE_REGISTRATION_CODE
  ) {
    return res.status(403).json({ error: "Неверный код для сотрудника" });
  }

  try {
    // 3) Хэшируем пароль и создаём запись в users
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO users
         (name, surname, patronymic, email, password, role)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, role`,
      [name, surname, patronymic, email, hashedPassword, role]
    );
    const user = userResult.rows[0];

    // 4) Если роль — сотрудник или админ салона, создаём запись в employees без salon_id
    if (role === "employee" || role === "salon_admin") {
      const type = role === "employee" ? "staff" : "salon_admin";
      await pool.query(
        `INSERT INTO employees (user_id, salon_id, type)
         VALUES ($1, NULL, $2)`,
        [user.id, type]
      );
    }

    // 5) Генерируем JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token });
  } catch (err) {
    console.error("Ошибка при регистрации:", err);
    res.status(500).json({ error: "Не удалось зарегистрировать пользователя" });
  }
};

// Логин сотрудника/админа остается без изменений
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND role IN ('employee', 'admin','salon_admin')",
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
         u.patronymic, 
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

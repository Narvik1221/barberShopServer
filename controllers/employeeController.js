const pool = require("../config/db");

exports.getEmployeeAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Проверим, что пользователь — сотрудник
    const userResult = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );

    if (
      userResult.rows.length === 0 ||
      userResult.rows[0].role !== "employee"
    ) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    // Получим ID и дату регистрации сотрудника из таблицы employees
    const employeeResult = await pool.query(
      `SELECT id, registration_date
       FROM employees
       WHERE user_id = $1 AND type = 'staff'`,
      [userId]
    );

    if (employeeResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Сотрудник не найден в таблице employees" });
    }

    const { id: employeeId, registration_date } = employeeResult.rows[0];

    // Получаем параметр поиска (если он передан)
    const searchTerm = req.query.search || "";

    // Формируем базовый запрос
    let queryText = `
      SELECT 
        b.id,
        b.date,
        b.time,
        u.name      AS client_name,
        u.surname   AS client_surname,
        u.email     AS client_email,
        s.name      AS service_name,
        s.price     AS service_price,
        sa.name     AS salon_name,
        sa.address  AS salon_address
      FROM bookings b
      JOIN users u    ON b.user_id    = u.id
      JOIN services s ON b.service_id = s.id
      JOIN salons sa  ON s.salon_id   = sa.id
      WHERE b.employee_id = $1
    `;
    const queryParams = [employeeId];

    // Если передан поисковый запрос, добавляем фильтрацию
    if (searchTerm) {
      queryText += `
        AND (
          u.name ILIKE $2 OR 
          u.surname ILIKE $2 OR 
          s.name ILIKE $2
        )
      `;
      queryParams.push(`%${searchTerm}%`);
    }

    queryText += " ORDER BY b.date ASC, b.time ASC";

    const bookingsResult = await pool.query(queryText, queryParams);

    // Отдаём клиенту: записи + дата регистрации сотрудника
    res.json({
      registration_date, // дата регистрации этого сотрудника
      appointments: bookingsResult.rows,
    });
  } catch (err) {
    console.error("Ошибка при получении записей сотрудника:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

exports.getEmployeesBySalon = async (req, res) => {
  const { salon_id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT
        e.id                  AS employee_id,
        u.name,
        u.surname,
        u.patronymic,
        e.registration_date
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.salon_id = $1
        AND e.type = 'staff'
      ORDER BY e.registration_date DESC
      `,
      [salon_id]
    );

    // Каждая запись теперь содержит: employee_id, name, surname, patronymic, registration_date
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения сотрудников:", err);
    res.status(500).json({ error: "Ошибка получения сотрудников" });
  }
};

exports.getEmployeesBySalonAndService = async (req, res) => {
  const { salonId, serviceId } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT
        e.id                  AS employee_id,
        u.name,
        u.surname,
        u.patronymic,
        e.registration_date
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN employee_services es ON e.id = es.employee_id
      WHERE e.salon_id = $1
        AND es.service_id = $2
        AND e.type = 'staff'
      ORDER BY e.registration_date DESC
      `,
      [salonId, serviceId]
    );

    // Каждая запись: employee_id, name, surname, patronymic, registration_date
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении сотрудников по услуге и салону:", err);
    res.status(500).json({ error: "Ошибка получения сотрудников" });
  }
};

// GET /api/admins/candidates
exports.getSalonAdminCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id                    AS user_id,
        u.name,
        u.surname,
        u.patronymic,
        u.email,
        CASE WHEN e.salon_id IS NOT NULL THEN TRUE ELSE FALSE END AS assigned,
        e.registration_date
      FROM users u
      LEFT JOIN employees e
        ON u.id = e.user_id AND e.type = 'salon_admin'
      WHERE u.role = 'salon_admin'
      ORDER BY e.registration_date DESC NULLS LAST
      `
    );

    // У кандидатов, у которых запись в employees есть, будет их registration_date,
    // иначе — поле NULL
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения кандидатов админов:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

// POST /api/salons/:salonId/assign-salon-admin
exports.assignSalonAdmin = async (req, res) => {
  const { salonId } = req.params;
  const { userId } = req.body;

  try {
    // Проверим, что пользователь существует и имеет роль salon_admin
    const userRes = await pool.query(`SELECT role FROM users WHERE id = $1`, [
      userId,
    ]);
    if (userRes.rowCount === 0 || userRes.rows[0].role !== "salon_admin") {
      return res.status(400).json({ error: "Некорректный пользователь" });
    }

    // Вставим или обновим запись в employees
    // При вставке поле registration_date заполнится автоматически (NOW())
    // При конфликте (по user_id) обновим salon_id, type и сбросим дату регистрации на текущий момент
    await pool.query(
      `
      INSERT INTO employees (user_id, salon_id, type)
        VALUES ($1, $2, 'salon_admin')
      ON CONFLICT (user_id) DO UPDATE
        SET salon_id = EXCLUDED.salon_id,
            type = 'salon_admin',
            registration_date = NOW()
      `,
      [userId, salonId]
    );

    res.json({ message: "Администратор салона назначен" });
  } catch (err) {
    console.error("Ошибка назначения админа салона:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

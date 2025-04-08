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

    // Получим ID сотрудника из таблицы employees
    const employeeResult = await pool.query(
      "SELECT id FROM employees WHERE user_id = $1",
      [userId]
    );

    if (employeeResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Сотрудник не найден в таблице employees" });
    }

    const employeeId = employeeResult.rows[0].id;

    // Получаем параметр поиска (если он передан)
    const searchTerm = req.query.search || "";

    // Формируем базовый запрос
    let queryText = `
      SELECT 
        b.id,
        b.date,
        b.time,
        u.name AS client_name,
        u.surname AS client_surname,
        u.email AS client_email,
        s.name AS service_name,
        s.price AS service_price,
        sa.name AS salon_name,
        sa.address AS salon_address
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN services s ON b.service_id = s.id
      JOIN salons sa ON s.salon_id = sa.id
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

    res.json(bookingsResult.rows);
  } catch (err) {
    console.error("Ошибка при получении записей сотрудника:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

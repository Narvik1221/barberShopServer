// controllers/salonController.js
const pool = require("../config/db");

exports.createSalon = async (req, res) => {
  const { name, address, description } = req.body;
  const imageSrc = req.file ? `/uploads/${req.file.filename}` : null; // Получаем путь к файлу

  try {
    const result = await pool.query(
      "INSERT INTO salons (name, address, description, imageSrc) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, description, imageSrc]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при создании салона:", err);
    res.status(500).json({ error: "Ошибка создания салона" });
  }
};

// Получение всех салонов
exports.getSalons = async (req, res) => {
  try {
    let query = "SELECT * FROM salons";
    const values = [];

    // Если передан параметр поиска, добавляем условие поиска по нескольким полям
    if (req.query.search && req.query.search.trim() !== "") {
      query +=
        " WHERE name ILIKE $1 OR address ILIKE $1 OR description ILIKE $1";
      values.push(`%${req.query.search.trim()}%`);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении салонов:", err);
    res.status(500).json({ error: "Ошибка получения салонов" });
  }
};

// Получение салона по ID
exports.getSalonById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM salons WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Салон не найден" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения салона" });
  }
};

exports.updateSalon = async (req, res) => {
  const { id } = req.params;
  const { name, address, description } = req.body;
  const imageSrc = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const existing = await pool.query("SELECT * FROM salons WHERE id = $1", [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Салон не найден" });
    }

    const updatedImage = imageSrc || existing.rows[0].imagesrc;

    const result = await pool.query(
      "UPDATE salons SET name = $1, address = $2, description = $3, imageSrc = $4 WHERE id = $5 RETURNING *",
      [name, address, description, updatedImage, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка обновления салона" });
  }
};

// Удаление салона
exports.deleteSalon = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM salons WHERE id = $1", [id]);
    res.json({ message: "Салон удалён" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления салона" });
  }
};
exports.getAllEmployees = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.surname,
        u.patronymic,
        u.role,
        e.salon_id,
        e.registration_date
      FROM users u
      LEFT JOIN employees e 
        ON u.id = e.user_id
      WHERE u.role = 'employee' 
        AND e.salon_id IS NULL
      ORDER BY e.registration_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении сотрудников:", err);
    res.status(500).json({ error: "Ошибка получения сотрудников" });
  }
};

// Получение всех сотрудников, прикреплённых к конкретному салону
exports.getEmployeesBySalon = async (req, res) => {
  const salonId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT
        e.id               AS employee_id,
        u.name,
        u.surname,
        e.registration_date
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.salon_id = $1
      ORDER BY e.registration_date DESC
      `,
      [salonId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка при получении сотрудников салона:", err);
    res.status(500).json({ error: "Ошибка получения сотрудников салона" });
  }
};

exports.attachEmployeesToSalon = async (req, res) => {
  const { salonId } = req.params;
  const { employeeIds } = req.body;

  if (!employeeIds || !Array.isArray(employeeIds)) {
    return res
      .status(400)
      .json({ error: "employeeIds must be provided as an array" });
  }

  try {
    const attachedEmployees = [];
    for (const employeeId of employeeIds) {
      try {
        // Ищем, есть ли запись сотрудника
        const existingResult = await pool.query(
          `SELECT * FROM employees WHERE user_id = $1`,
          [employeeId]
        );

        if (existingResult.rows.length > 0) {
          // Запись существует
          const employeeRecord = existingResult.rows[0];
          if (employeeRecord.salon_id === null) {
            // Если сотруднику не прикреплен салон, обновляем запись
            const updateResult = await pool.query(
              `UPDATE employees SET salon_id = $1, status = 'active' WHERE user_id = $2 RETURNING *`,
              [salonId, employeeId]
            );
            attachedEmployees.push(updateResult.rows[0]);
          } else {
            // Сотрудник уже прикреплен к какому-то салону, возвращаем ошибку
            return res.status(400).json({
              error: `Ошибка при добавлении сотрудника с id ${employeeId}`,
              details: `Этот сотрудник уже прикреплен к салону с id ${employeeRecord.salon_id}.`,
            });
          }
        } else {
          // Записи не существует, выполняем INSERT
          const insertResult = await pool.query(
            `INSERT INTO employees (user_id, salon_id, status)
             VALUES ($1, $2, 'active')
             RETURNING *`,
            [employeeId, salonId]
          );
          attachedEmployees.push(insertResult.rows[0]);
        }
      } catch (innerErr) {
        console.error(
          `Ошибка при обработке сотрудника с id ${employeeId}:`,
          innerErr
        );
        return res.status(500).json({
          error: `Ошибка при добавлении сотрудника с id ${employeeId}`,
          details: innerErr.detail || innerErr.message,
        });
      }
    }
    res.json({
      message: "Employees attached successfully",
      employees: attachedEmployees,
    });
  } catch (err) {
    console.error("Error attaching employees:", err);
    res.status(500).json({
      error: "Ошибка при добавлении сотрудников",
      details: err.detail || err.message,
    });
  }
};

// Открепление сотрудника от салона
exports.detachEmployee = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE employees SET salon_id = NULL WHERE id = $1 RETURNING *`,
      [employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Сотрудник не найден" });
    }

    res.json({ message: "Сотрудник откреплён от салона" });
  } catch (err) {
    console.error("Ошибка при откреплении сотрудника:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};

// controllers/serviceController.js
const pool = require("../config/db");

// Создание услуги
exports.createService = async (req, res) => {
  const { salon_id, name, description, price, employee_ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Создание услуги
    const serviceResult = await client.query(
      "INSERT INTO services (salon_id, name, description, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [salon_id, name, description, price]
    );

    const service = serviceResult.rows[0];

    // Если есть сотрудники, привязываем их к услуге
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      const insertValues = employee_ids
        .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
        .join(", ");

      const queryParams = employee_ids.flatMap((id) => [id, service.id]);

      await client.query(
        `INSERT INTO employee_services (employee_id, service_id) VALUES ${insertValues}`,
        queryParams
      );
    }

    await client.query("COMMIT");
    res.json(service);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Ошибка при создании услуги:", err);
    res.status(500).json({ error: "Ошибка создания услуги" });
  } finally {
    client.release();
  }
};

// Получение услуг по салону

exports.getServicesBySalon = async (req, res) => {
  const { salon_id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT 
        s.id AS service_id,
        s.salon_id,
        s.name AS service_name,
        s.description,
        s.price,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', u.id,
              'name', u.name,
              'surname', u.surname,
              'patronymic', u.patronymic,
              'employee_id', e.id,
              'master_registration_date', to_char(e.registration_date, 'YYYY-MM-DD"T"HH24:MI:SSZ')
            )
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'::json
        ) AS employees
      FROM services s
      LEFT JOIN employee_services es ON s.id = es.service_id
      LEFT JOIN employees e ON es.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE s.salon_id = $1
      GROUP BY s.id
      `,
      [salon_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения услуг" });
  }
};

// Получение услуги по ID
exports.getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM services WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка получения услуги" });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, employee_ids } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *",
      [name, description, price, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Услуга не найдена" });
    }

    // Удаляем старые связи
    await client.query("DELETE FROM employee_services WHERE service_id = $1", [
      id,
    ]);

    // Добавляем новые связи (если есть)
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      // Формируем плейсхолдеры для bulk insert
      const valuesClause = employee_ids
        .map((_, index) => `($1, $${index + 2})`)
        .join(", ");

      const params = [id, ...employee_ids];

      await client.query(
        `INSERT INTO employee_services (service_id, employee_id) VALUES ${valuesClause}`,
        params
      );
    }

    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка обновления услуги" });
  } finally {
    client.release();
  }
};

// Удаление услуги
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Удалить все связанные записи в bookings
    await client.query("DELETE FROM bookings WHERE service_id = $1", [id]);

    // Удалить все связи с мастерами
    await client.query("DELETE FROM employee_services WHERE service_id = $1", [
      id,
    ]);

    // Удалить услугу
    await client.query("DELETE FROM services WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Услуга удалена" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления услуги" });
  } finally {
    client.release();
  }
};

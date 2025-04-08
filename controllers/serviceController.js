// controllers/serviceController.js
const pool = require("../config/db");

// Создание услуги
exports.createService = async (req, res) => {
  const { salon_id, name, description, price } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO services (salon_id, name, description, price) VALUES ($1, $2, $3, $4) RETURNING *",
      [salon_id, name, description, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка создания услуги" });
  }
};

// Получение услуг по салону
exports.getServicesBySalon = async (req, res) => {
  const { salon_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM services WHERE salon_id = $1",
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

// Обновление услуги
exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const result = await pool.query(
      "UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *",
      [name, description, price, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Услуга не найдена" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка обновления услуги" });
  }
};

// Удаление услуги
exports.deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM services WHERE id = $1", [id]);
    res.json({ message: "Услуга удалена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка удаления услуги" });
  }
};

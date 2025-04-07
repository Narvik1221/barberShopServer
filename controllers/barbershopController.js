const pool = require("../config/db");

// Получение всех парикмахерских
exports.getBarbershops = async (req, res) => {
  const { search } = req.query; // Получаем строку поиска

  try {
    // Формируем SQL-запрос с фильтрацией
    const query = `
      SELECT * 
      FROM barbershops 
      WHERE LOWER(name) LIKE $1 OR LOWER(address) LIKE $1
    `;
    const values = [`%${search?.toLowerCase() || ""}%`]; // Фильтруем по имени или адресу

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// Получение парикмахерской по ID
exports.getBarbershopById = async (req, res) => {
  const { id } = req.params;

  try {
    // Получаем информацию о парикмахерской
    const barbershopResult = await pool.query(
      "SELECT * FROM barbershops WHERE id = $1",
      [id]
    );
    if (barbershopResult.rows.length === 0) {
      return res.status(404).json({ error: "Barbershop not found" });
    }

    const barbershop = barbershopResult.rows[0];

    // Получаем всех мастеров, привязанных к парикмахерской, только со статусом "работает"
    const mastersResult = await pool.query(
      "SELECT * FROM masters WHERE barbershop_id = $1 AND status = 'работает'",
      [id]
    );

    // Включаем отфильтрованных мастеров в результат
    barbershop.masters = mastersResult.rows;

    res.json(barbershop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

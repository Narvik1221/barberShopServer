const pool = require("../config/db");

const createTables = async () => {
  try {
    await pool.query(`
      -- Таблица пользователей
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100),
        patronymic VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'client' -- client | employee | salon_admin | admin
      );

      -- Таблица салонов
      CREATE TABLE IF NOT EXISTS salons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        description TEXT,
        imageSrc VARCHAR(255)
      );

      -- Таблица сотрудников
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id),
        salon_id INTEGER REFERENCES salons(id),
        type VARCHAR(20) NOT NULL DEFAULT 'staff', -- staff | salon_admin
        status VARCHAR(50) DEFAULT 'active',
        registration_date TIMESTAMP NOT NULL DEFAULT NOW()
      );
      -- Таблица услуг
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        salon_id INTEGER REFERENCES salons(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2)
      );

      -- Связующая таблица employee_services
      CREATE TABLE IF NOT EXISTS employee_services (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES employees(id),
        service_id INTEGER REFERENCES services(id)
      );

      -- Таблица бронирований
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        employee_id INTEGER REFERENCES employees(id),
        service_id INTEGER REFERENCES services(id),
        date DATE NOT NULL,
        time TIME NOT NULL
      );
    `);
    console.log("DB connected and tables created (if not exist)");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
};

module.exports = { createTables };

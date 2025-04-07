const pool = require("../config/db");

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS barbershops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        imageSrc VARCHAR(255) DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS masters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100),
        barbershop_id INTEGER REFERENCES barbershops(id),
        status VARCHAR(50) DEFAULT 'работает',
        CONSTRAINT status_check CHECK (status IN ('работает', 'уволен', 'болен'))
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        master_id INTEGER REFERENCES masters(id),
        date DATE NOT NULL,
        time TIME NOT NULL
      );
    `);
    console.log("DB connected");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
};

module.exports = { createTables };

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const barbershopRoutes = require("./routes/barbershopRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const { createTables } = require("./models/initTables"); // Импорт функции создания таблиц
const cors = require("cors");
const app = express();

// Создание таблиц
createTables();
app.use(
  cors({
    origin: "http://localhost:5173", // Разрешить запросы только с этого адреса
    methods: ["GET", "POST", "PUT", "DELETE"], // Указать разрешенные HTTP методы
  })
);

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/barbershops", barbershopRoutes);
app.use("/api/bookings", bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

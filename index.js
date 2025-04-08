// index.js
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();
const cors = require("cors");

const { createTables } = require("./models/initTables");

// Маршруты
const clientAuthRoutes = require("./routes/authRoutes");
const employeeAuthRoutes = require("./routes/employeeAuthRoutes");
const salonRoutes = require("./routes/salonRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const employeeRouter = require("./routes/employeeRouter");
const app = express();

// Создание таблиц в БД (если не существуют)
createTables();

app.use(
  cors({
    origin: "http://localhost:5173", // Разрешённый адрес фронтенда
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Подключение маршрутов
app.use("/api/auth", clientAuthRoutes);
app.use("/api/employee/auth", employeeAuthRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/employee", employeeRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

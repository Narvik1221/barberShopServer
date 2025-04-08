// routes/salonRoutes.js
const express = require("express");
const {
  createSalon,
  getSalons,
  getSalonById,
  updateSalon,
  deleteSalon,
  getAllEmployees,
  attachEmployeesToSalon,
  detachEmployee,
  getEmployeesBySalon,
} = require("../controllers/salonController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
// Получить все салоны (открытый)
router.get("/", getSalons);

// Получить салон по ID (открытый)
router.get("/salon/:id", getSalonById);

// Создание, обновление, удаление салона – только для администраторов
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  upload.single("image"),
  createSalon
);
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  upload.single("image"),
  updateSalon
);
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteSalon);

// Получить всех сотрудников (админ)
router.get("/employees", verifyToken, checkRole(["admin"]), getAllEmployees);

router.get("/:id/employees", getEmployeesBySalon);

// Прикрепить сотрудников к салону
router.post(
  "/employees/:salonId",
  verifyToken,
  checkRole(["admin"]),

  attachEmployeesToSalon
);

// Открепить одного сотрудника от салона
router.delete(
  "/employees/detach/:employeeId",
  verifyToken,
  checkRole(["admin"]),
  detachEmployee
);
module.exports = router;

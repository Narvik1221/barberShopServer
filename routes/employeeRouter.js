const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { verifyToken } = require("../middlewares/authMiddleware");
// GET /api/employee/appointments — только для сотрудников
router.get(
  "/appointments",
  verifyToken,
  employeeController.getEmployeeAppointments
);

module.exports = router;

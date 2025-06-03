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
router.get("/salon/:salon_id", employeeController.getEmployeesBySalon);
router.get("/salon-service", employeeController.getEmployeesBySalonAndService);

router.get("/admins/candidates", employeeController.getSalonAdminCandidates);
router.post(
  "/salons/:salonId/assign-salon-admin",
  employeeController.assignSalonAdmin
);

module.exports = router;

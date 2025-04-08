// routes/serviceRoutes.js
const express = require("express");
const {
  createService,
  getServicesBySalon,
  getServiceById,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { checkRole } = require("../middlewares/roleMiddleware");
const router = express.Router();

// Получение услуг по салону (открытый)
router.get("/salon/:salon_id", getServicesBySalon);
router.get("/:id", getServiceById);

// Управление услугами – только для админов
router.post("/", verifyToken, checkRole(["admin"]), createService);
router.put("/:id", verifyToken, checkRole(["admin"]), updateService);
router.delete("/:id", verifyToken, checkRole(["admin"]), deleteService);

module.exports = router;

const express = require("express");
const {
  getBarbershops,
  getBarbershopById,
} = require("../controllers/barbershopController");
const router = express.Router();

// Маршрут для получения всех парикмахерских
router.get("/", getBarbershops);

// Маршрут для получения парикмахерской по ID
router.get("/:id", getBarbershopById);

module.exports = router;

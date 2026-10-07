const express = require("express");

const router = express.Router();

const cartController = require("../controllers/cartController");

// Show cart
router.get("/", cartController.index);

// Add product
router.post("/add", cartController.add);

// Update quantity
router.post("/update", cartController.update);

// Remove product
router.post("/remove", cartController.remove);

module.exports = router;
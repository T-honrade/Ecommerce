const express = require("express");

const router = express.Router();

const productController = require("../controllers/productController");

// Customer shop
router.get("/", productController.shop);

// Product details
router.get("/product/:id", productController.details);

module.exports = router;
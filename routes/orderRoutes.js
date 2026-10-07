const express = require("express");

const router = express.Router();

const orderController =
    require("../controllers/orderController");

const {
    requireLogin
} = require("../middleware/authMiddleware");


// ================================
// CHECKOUT
// ================================

router.get(
    "/checkout",
    requireLogin,
    orderController.showCheckout
);


// ================================
// PLACE ORDER
// ================================

router.post(
    "/checkout",
    requireLogin,
    orderController.placeOrder
);


// ================================
// ORDER SUCCESS
// ================================

router.get(
    "/order-success/:orderId",
    requireLogin,
    orderController.success
);


// ================================
// MY ORDERS
// ================================

router.get(
    "/orders",
    requireLogin,
    orderController.myOrders
);

// ORDER DETAILS
router.get(
    "/orders/:orderId",
    requireLogin,
    orderController.orderDetails
);


module.exports = router;
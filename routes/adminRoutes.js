const express = require("express");

const router = express.Router();

const adminController =
    require("../controllers/adminController");

const categoryController =
    require("../controllers/categoryController");

const productController =
    require("../controllers/productController");

const orderController =
    require("../controllers/orderController");

const {
    requireAdmin
} = require("../middleware/adminMiddleware");


// ==============================
// ADMIN DASHBOARD
// ==============================

router.get(
    "/dashboard",
    requireAdmin,
    adminController.dashboard
);


// ==============================
// CATEGORY MANAGEMENT
// ==============================

router.get(
    "/categories",
    requireAdmin,
    categoryController.index
);

router.get(
    "/categories/add",
    requireAdmin,
    categoryController.showAddForm
);

router.post(
    "/categories/add",
    requireAdmin,
    categoryController.create
);

router.get(
    "/categories/edit/:id",
    requireAdmin,
    categoryController.showEditForm
);

router.post(
    "/categories/edit/:id",
    requireAdmin,
    categoryController.update
);

router.post(
    "/categories/delete/:id",
    requireAdmin,
    categoryController.delete
);


// ==============================
// PRODUCT MANAGEMENT
// ==============================

router.get(
    "/products",
    requireAdmin,
    productController.index
);

router.get(
    "/products/add",
    requireAdmin,
    productController.showAddForm
);

router.post(
    "/products/add",
    requireAdmin,
    productController.create
);

router.get(
    "/products/edit/:id",
    requireAdmin,
    productController.showEditForm
);

router.post(
    "/products/edit/:id",
    requireAdmin,
    productController.update
);

router.post(
    "/products/delete/:id",
    requireAdmin,
    productController.delete
);


// ==============================
// ORDER MANAGEMENT
// ==============================

router.get(
    "/orders",
    requireAdmin,
    orderController.adminOrders
);

router.get(
    "/orders/:orderId",
    requireAdmin,
    orderController.adminOrderDetails
);

router.post(
    "/orders/:orderId/status",
    requireAdmin,
    orderController.updateOrderStatus
);


// ==============================
// CUSTOMER MANAGEMENT
// ==============================

router.get(
    "/customers",
    requireAdmin,
    adminController.customers
);

router.post(
    "/customers/delete/:id",
    requireAdmin,
    adminController.deleteCustomer
);


module.exports = router;
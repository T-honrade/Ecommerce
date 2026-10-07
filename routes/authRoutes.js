const express = require("express");

const router = express.Router();

const authController =
    require("../controllers/authController");

const {
    requireLogin
} = require("../middleware/authMiddleware");


// ==============================
// REGISTER
// ==============================

router.get(
    "/register",
    authController.showRegister
);

router.post(
    "/register",
    authController.register
);


// ==============================
// LOGIN
// ==============================

router.get(
    "/login",
    authController.showLogin
);

router.post(
    "/login",
    authController.login
);


// ==============================
// PROFILE
// ==============================

router.get(
    "/profile",
    requireLogin,
    authController.profile
);


// ==============================
// LOGOUT
// ==============================

router.get(
    "/logout",
    authController.logout
);


module.exports = router;
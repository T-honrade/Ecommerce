const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const PORT = process.env.PORT || 3000;


// ================================
// EJS CONFIGURATION
// ================================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// ================================
// STATIC FILES
// ================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ================================
// BODY PARSING
// ================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// ================================
// SESSION
// ================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "studycart-secret-key",

        resave: false,

        saveUninitialized: false
    })
);


// ================================
// MAKE USER AVAILABLE TO EJS
// ================================

app.use((req, res, next) => {

    res.locals.user =
        req.session.user || null;

    next();

});


// ================================
// ROUTES
// ================================

// Authentication

app.use(
    "/",
    authRoutes
);


// Admin

app.use(
    "/admin",
    adminRoutes
);


// Customer Shop

app.use(
    "/shop",
    productRoutes
);


// Customer Cart

app.use(
    "/cart",
    cartRoutes
);


// Customer Orders / Checkout

app.use(
    "/",
    orderRoutes
);


// ================================
// HOME PAGE
// ================================

app.get("/", (req, res) => {

    res.render("home");

});


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

    console.log(
        `StudyCart running at http://localhost:${PORT}`
    );

});
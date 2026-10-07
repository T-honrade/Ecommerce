const db = require("../config/db");
const bcrypt = require("bcrypt");


// ==============================
// REGISTER PAGE
// ==============================

exports.showRegister = (req, res) => {

    res.render("auth/register", {
        error: null
    });

};


// ==============================
// REGISTER
// ==============================

exports.register = (req, res) => {

    const {
        name,
        email,
        password,
        confirmPassword
    } = req.body;


    if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
    ) {

        return res.render(
            "auth/register",
            {
                error: "Please fill in all fields."
            }
        );

    }


    if (password !== confirmPassword) {

        return res.render(
            "auth/register",
            {
                error: "Passwords do not match."
            }
        );

    }


    if (password.length < 6) {

        return res.render(
            "auth/register",
            {
                error:
                    "Password must be at least 6 characters."
            }
        );

    }


    db.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
        `,
        [email],
        (err, results) => {

            if (err) {

                console.error(
                    "Registration lookup error:",
                    err
                );

                return res.status(500).send(
                    "Registration failed."
                );

            }


            if (results.length > 0) {

                return res.render(
                    "auth/register",
                    {
                        error:
                            "Email is already registered."
                    }
                );

            }


            bcrypt.hash(
                password,
                10,
                (err, hashedPassword) => {

                    if (err) {

                        console.error(
                            "Password hashing error:",
                            err
                        );

                        return res.status(500).send(
                            "Registration failed."
                        );

                    }


                    db.query(
                        `
                        INSERT INTO users
                        (
                            name,
                            email,
                            password
                        )
                        VALUES (?, ?, ?)
                        `,
                        [
                            name,
                            email,
                            hashedPassword
                        ],
                        (err) => {

                            if (err) {

                                console.error(
                                    "Registration insert error:",
                                    err
                                );

                                return res.status(500).send(
                                    "Registration failed."
                                );

                            }


                            res.redirect(
                                "/login"
                            );

                        }
                    );

                }
            );

        }
    );

};


// ==============================
// LOGIN PAGE
// ==============================

exports.showLogin = (req, res) => {

    res.render("auth/login", {
        error: null
    });

};


// ==============================
// LOGIN
// ==============================

exports.login = (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (!email || !password) {

        return res.render(
            "auth/login",
            {
                error:
                    "Please enter your email and password."
            }
        );

    }


    db.query(
        `
        SELECT *
        FROM users
        WHERE email = ?
        `,
        [email],
        (err, results) => {

            if (err) {

                console.error(
                    "Login lookup error:",
                    err
                );

                return res.status(500).send(
                    "Login failed."
                );

            }


            if (results.length === 0) {

                return res.render(
                    "auth/login",
                    {
                        error:
                            "Invalid email or password."
                    }
                );

            }


            const user = results[0];


            bcrypt.compare(
                password,
                user.password,
                (err, match) => {

                    if (err) {

                        console.error(
                            "Password comparison error:",
                            err
                        );

                        return res.status(500).send(
                            "Login failed."
                        );

                    }


                    if (!match) {

                        return res.render(
                            "auth/login",
                            {
                                error:
                                    "Invalid email or password."
                            }
                        );

                    }


                    req.session.user = {

                        id: user.id,

                        name: user.name,

                        email: user.email,

                        role: user.role

                    };


                    if (
                        user.role === "admin"
                    ) {

                        return res.redirect(
                            "/admin/dashboard"
                        );

                    }


                    res.redirect("/");

                }
            );

        }
    );

};


// ==============================
// PROFILE
// ==============================

exports.profile = (req, res) => {

    const userId = req.session.user.id;


    db.query(
        `
        SELECT
            id,
            name,
            email,
            role,
            created_at
        FROM users
        WHERE id = ?
        `,
        [userId],
        (err, results) => {

            if (err) {

                console.error(
                    "Profile fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load profile."
                );

            }


            if (results.length === 0) {

                return res.status(404).send(
                    "User not found."
                );

            }


            res.render(
                "profile",
                {
                    profile: results[0]
                }
            );

        }
    );

};


// ==============================
// LOGOUT
// ==============================

exports.logout = (req, res) => {

    req.session.destroy(
        (err) => {

            if (err) {

                console.error(
                    "Logout error:",
                    err
                );

            }

            res.redirect("/");

        }
    );

};
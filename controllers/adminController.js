const db = require("../config/db");


// ==============================
// ADMIN DASHBOARD
// ==============================

exports.dashboard = (req, res) => {

    const productQuery = `
        SELECT COUNT(*) AS totalProducts
        FROM products
    `;

    const categoryQuery = `
        SELECT COUNT(*) AS totalCategories
        FROM categories
    `;

    const orderQuery = `
        SELECT COUNT(*) AS totalOrders
        FROM orders
    `;

    const pendingQuery = `
        SELECT COUNT(*) AS pendingOrders
        FROM orders
        WHERE status = 'Pending'
    `;


    db.query(productQuery, (err, productResults) => {

        if (err) {
            console.error("Product count error:", err);
            return res.status(500).send(
                "Failed to load dashboard."
            );
        }


        db.query(categoryQuery, (err, categoryResults) => {

            if (err) {
                console.error("Category count error:", err);
                return res.status(500).send(
                    "Failed to load dashboard."
                );
            }


            db.query(orderQuery, (err, orderResults) => {

                if (err) {
                    console.error("Order count error:", err);
                    return res.status(500).send(
                        "Failed to load dashboard."
                    );
                }


                db.query(
                    pendingQuery,
                    (err, pendingResults) => {

                        if (err) {
                            console.error(
                                "Pending order count error:",
                                err
                            );

                            return res.status(500).send(
                                "Failed to load dashboard."
                            );
                        }


                        res.render(
                            "admin/dashboard",
                            {
                                totalProducts:
                                    productResults[0].totalProducts,

                                totalCategories:
                                    categoryResults[0].totalCategories,

                                totalOrders:
                                    orderResults[0].totalOrders,

                                pendingOrders:
                                    pendingResults[0].pendingOrders
                            }
                        );

                    }
                );

            });

        });

    });

};


// ==============================
// CUSTOMER MANAGEMENT
// ==============================

exports.customers = (req, res) => {

    const search = (req.query.search || "").trim();
    const role = (req.query.role || "").trim();

    let query = `
        SELECT
            users.id,
            users.name,
            users.email,
            users.role,
            users.created_at,
            COUNT(orders.id) AS order_count
        FROM users
        LEFT JOIN orders
            ON users.id = orders.user_id
    `;

    const conditions = [];
    const values = [];


    // SEARCH BY NAME OR EMAIL

    if (search) {

        conditions.push(`
            (
                users.name LIKE ?
                OR users.email LIKE ?
            )
        `);

        values.push(
            `%${search}%`,
            `%${search}%`
        );

    }


    // FILTER BY ROLE

    if (
        role === "customer" ||
        role === "admin"
    ) {

        conditions.push(
            "users.role = ?"
        );

        values.push(role);

    }


    if (conditions.length > 0) {

        query += `
            WHERE ${conditions.join(" AND ")}
        `;

    }


    query += `
        GROUP BY
            users.id,
            users.name,
            users.email,
            users.role,
            users.created_at
        ORDER BY users.created_at DESC
    `;


    db.query(
        query,
        values,
        (err, customers) => {

            if (err) {

                console.error(
                    "Customer fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load customers."
                );

            }


            res.render(
                "admin/customers/index",
                {
                    customers,
                    search,
                    role
                }
            );

        }
    );

};


// ==============================
// DELETE CUSTOMER
// ==============================

exports.deleteCustomer = (req, res) => {

    const customerId = Number(
        req.params.id
    );


    if (!customerId) {

        return res.redirect(
            "/admin/customers"
        );

    }


    // Prevent deleting an admin account

    db.query(
        `
        SELECT role
        FROM users
        WHERE id = ?
        `,
        [customerId],
        (err, results) => {

            if (err) {

                console.error(
                    "Customer lookup error:",
                    err
                );

                return res.status(500).send(
                    "Failed to delete customer."
                );

            }


            if (results.length === 0) {

                return res.redirect(
                    "/admin/customers"
                );

            }


            if (results[0].role === "admin") {

                return res.status(403).send(
                    "Admin accounts cannot be deleted."
                );

            }


            db.query(
                `
                DELETE FROM users
                WHERE id = ?
                `,
                [customerId],
                (err) => {

                    if (err) {

                        console.error(
                            "Customer delete error:",
                            err
                        );

                        return res.status(500).send(
                            "Failed to delete customer."
                        );

                    }


                    res.redirect(
                        "/admin/customers"
                    );

                }
            );

        }
    );

};
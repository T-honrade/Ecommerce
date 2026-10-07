const db = require("../config/db");

// ======================================================
// CUSTOMER - SHOW CHECKOUT
// ======================================================

exports.showCheckout = (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    const productIds = cart.map(item => item.productId);
    const placeholders = productIds.map(() => "?").join(",");

    const query = `
        SELECT *
        FROM products
        WHERE id IN (${placeholders})
    `;

    db.query(query, productIds, (err, products) => {
        if (err) {
            console.error("Checkout product fetch error:", err);

            return res.status(500).send(
                "Failed to load checkout."
            );
        }

        const checkoutItems = cart
            .map(item => {
                const product = products.find(
                    product => product.id === item.productId
                );

                if (!product) {
                    return null;
                }

                const subtotal =
                    Number(product.price) *
                    Number(item.quantity);

                return {
                    productId: product.id,
                    name: product.name,
                    price: Number(product.price),
                    stock: product.stock,
                    image: product.image,
                    quantity: item.quantity,
                    subtotal
                };
            })
            .filter(item => item !== null);

        const total = checkoutItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        res.render("checkout", {
            cart: checkoutItems,
            total,
            error: null
        });
    });
};


// ======================================================
// CUSTOMER - PLACE ORDER
// ======================================================

exports.placeOrder = (req, res) => {
    const userId = req.session.user.id;

    const {
        customer_name,
        contact_number,
        delivery_address,
        payment_method
    } = req.body;

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/cart");
    }

    // Validate customer information
    if (
        !customer_name ||
        !contact_number ||
        !delivery_address ||
        !payment_method
    ) {
        return res.status(400).send(
            "Please complete all checkout fields."
        );
    }

    // Only Cash on Delivery is currently supported
    if (payment_method !== "Cash on Delivery") {
        return res.status(400).send(
            "Invalid payment method."
        );
    }

    const productIds = cart.map(item => item.productId);
    const placeholders = productIds.map(() => "?").join(",");

    db.query(
        `
        SELECT *
        FROM products
        WHERE id IN (${placeholders})
        `,
        productIds,
        (err, products) => {
            if (err) {
                console.error(
                    "Place order product fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to process order."
                );
            }

            // Check that all products still exist
            for (const item of cart) {
                const product = products.find(
                    product => product.id === item.productId
                );

                if (!product) {
                    return res.status(400).send(
                        "One of the products in your cart is no longer available."
                    );
                }

                // Check stock
                if (item.quantity > product.stock) {
                    return res.status(400).send(
                        `Not enough stock for ${product.name}.`
                    );
                }
            }

            // Calculate total
            let total = 0;

            cart.forEach(item => {
                const product = products.find(
                    product => product.id === item.productId
                );

                total +=
                    Number(product.price) *
                    Number(item.quantity);
            });

            // Create order
            db.query(
                `
                INSERT INTO orders
                (
                    user_id,
                    customer_name,
                    contact_number,
                    delivery_address,
                    payment_method,
                    total_amount,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    customer_name,
                    contact_number,
                    delivery_address,
                    payment_method,
                    total,
                    "Pending"
                ],
                (err, orderResult) => {
                    if (err) {
                        console.error(
                            "Create order error:",
                            err
                        );

                        return res.status(500).send(
                            "Failed to create order."
                        );
                    }

                    const orderId = orderResult.insertId;

                    let completedItems = 0;

                    // No items to insert
                    if (cart.length === 0) {
                        req.session.cart = [];

                        return res.redirect(
                            `/order-success/${orderId}`
                        );
                    }

                    cart.forEach(item => {
                        const product = products.find(
                            product =>
                                product.id === item.productId
                        );

                        // Insert order item
                        db.query(
                            `
                            INSERT INTO order_items
                            (
                                order_id,
                                product_id,
                                quantity,
                                price
                            )
                            VALUES (?, ?, ?, ?)
                            `,
                            [
                                orderId,
                                product.id,
                                item.quantity,
                                product.price
                            ],
                            (err) => {
                                if (err) {
                                    console.error(
                                        "Order item insert error:",
                                        err
                                    );

                                    return res.status(500).send(
                                        "Failed to create order items."
                                    );
                                }

                                // Update stock
                                db.query(
                                    `
                                    UPDATE products
                                    SET stock = stock - ?
                                    WHERE id = ?
                                    `,
                                    [
                                        item.quantity,
                                        product.id
                                    ],
                                    (err) => {
                                        if (err) {
                                            console.error(
                                                "Stock update error:",
                                                err
                                            );

                                            return res.status(500).send(
                                                "Failed to update product stock."
                                            );
                                        }

                                        completedItems++;

                                        if (
                                            completedItems ===
                                            cart.length
                                        ) {
                                            // Clear cart
                                            req.session.cart = [];

                                            // Go to success page
                                            res.redirect(
                                                `/order-success/${orderId}`
                                            );
                                        }
                                    }
                                );
                            }
                        );
                    });
                }
            );
        }
    );
};


// ======================================================
// CUSTOMER - ORDER SUCCESS
// ======================================================

exports.success = (req, res) => {
    const orderId = Number(req.params.orderId);
    const userId = req.session.user.id;

    if (!orderId) {
        return res.redirect("/orders");
    }

    db.query(
        `
        SELECT *
        FROM orders
        WHERE id = ?
        AND user_id = ?
        `,
        [orderId, userId],
        (err, results) => {
            if (err) {
                console.error(
                    "Order success fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load order."
                );
            }

            if (results.length === 0) {
                return res.status(404).send(
                    "Order not found."
                );
            }

            const order = results[0];

            res.render("order-success", {
                order
            });
        }
    );
};


// ======================================================
// CUSTOMER - MY ORDERS
// ======================================================

exports.myOrders = (req, res) => {
    const userId = req.session.user.id;

    db.query(
        `
        SELECT *
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [userId],
        (err, orders) => {
            if (err) {
                console.error(
                    "My orders fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load your orders."
                );
            }

            res.render("orders", {
                orders
            });
        }
    );
};


// ======================================================
// CUSTOMER - ORDER DETAILS
// ======================================================

exports.orderDetails = (req, res) => {
    const orderId = Number(req.params.orderId);
    const userId = req.session.user.id;

    if (!orderId) {
        return res.redirect("/orders");
    }

    db.query(
        `
        SELECT *
        FROM orders
        WHERE id = ?
        AND user_id = ?
        `,
        [orderId, userId],
        (err, orderResults) => {
            if (err) {
                console.error(
                    "Order details error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load order details."
                );
            }

            if (orderResults.length === 0) {
                return res.status(404).send(
                    "Order not found."
                );
            }

            const order = orderResults[0];

            db.query(
                `
                SELECT
                    order_items.*,
                    products.name,
                    products.image
                FROM order_items
                INNER JOIN products
                    ON order_items.product_id = products.id
                WHERE order_items.order_id = ?
                `,
                [orderId],
                (err, items) => {
                    if (err) {
                        console.error(
                            "Order items error:",
                            err
                        );

                        return res.status(500).send(
                            "Failed to load order items."
                        );
                    }

                    res.render("order-details", {
                        order,
                        items
                    });
                }
            );
        }
    );
};


// ======================================================
// ADMIN - ORDERS LIST
// ======================================================

exports.adminOrders = (req, res) => {
    db.query(
        `
        SELECT
            orders.*,
            users.email
        FROM orders
        INNER JOIN users
            ON orders.user_id = users.id
        ORDER BY orders.created_at DESC
        `,
        (err, orders) => {
            if (err) {
                console.error(
                    "Admin orders fetch error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load orders."
                );
            }

            res.render("admin/orders/index", {
                orders
            });
        }
    );
};


// ======================================================
// ADMIN - ORDER DETAILS
// ======================================================

exports.adminOrderDetails = (req, res) => {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
        return res.redirect("/admin/orders");
    }

    db.query(
        `
        SELECT
            orders.*,
            users.email
        FROM orders
        INNER JOIN users
            ON orders.user_id = users.id
        WHERE orders.id = ?
        `,
        [orderId],
        (err, orderResults) => {
            if (err) {
                console.error(
                    "Admin order details error:",
                    err
                );

                return res.status(500).send(
                    "Failed to load order details."
                );
            }

            if (orderResults.length === 0) {
                return res.status(404).send(
                    "Order not found."
                );
            }

            const order = orderResults[0];

            db.query(
                `
                SELECT
                    order_items.*,
                    products.name,
                    products.image
                FROM order_items
                INNER JOIN products
                    ON order_items.product_id = products.id
                WHERE order_items.order_id = ?
                `,
                [orderId],
                (err, items) => {
                    if (err) {
                        console.error(
                            "Admin order items error:",
                            err
                        );

                        return res.status(500).send(
                            "Failed to load order items."
                        );
                    }

                    res.render(
                        "admin/orders/details",
                        {
                            order,
                            items
                        }
                    );
                }
            );
        }
    );
};


// ======================================================
// ADMIN - UPDATE ORDER STATUS
// ======================================================

exports.updateOrderStatus = (req, res) => {
    const orderId = Number(req.params.orderId);
    const status = req.body.status;

    const allowedStatuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Completed",
        "Cancelled"
    ];

    if (!orderId) {
        return res.redirect("/admin/orders");
    }

    if (!allowedStatuses.includes(status)) {
        return res.status(400).send(
            "Invalid order status."
        );
    }

    db.query(
        `
        UPDATE orders
        SET status = ?
        WHERE id = ?
        `,
        [status, orderId],
        (err) => {
            if (err) {
                console.error(
                    "Order status update error:",
                    err
                );

                return res.status(500).send(
                    "Failed to update order status."
                );
            }

            res.redirect(
                `/admin/orders/${orderId}`
            );
        }
    );
};
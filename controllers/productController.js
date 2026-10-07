const db = require("../config/db");

// Show all products
exports.index = (req, res) => {
    const query = `
        SELECT 
            products.*,
            categories.name AS category_name
        FROM products
        INNER JOIN categories
            ON products.category_id = categories.id
        ORDER BY products.id DESC
    `;

    db.query(query, (err, products) => {
        if (err) {
            console.error("Product fetch error:", err);
            return res.status(500).send("Failed to load products.");
        }

        res.render("admin/products/index", {
            products
        });
    });
};

// Show add product form
exports.showAddForm = (req, res) => {
    db.query(
        "SELECT * FROM categories ORDER BY name ASC",
        (err, categories) => {
            if (err) {
                console.error("Category fetch error:", err);
                return res.status(500).send("Failed to load categories.");
            }

            res.render("admin/products/form", {
                product: null,
                categories,
                error: null
            });
        }
    );
};

// Add product
exports.create = (req, res) => {
    const {
        category_id,
        name,
        description,
        price,
        stock,
        image
    } = req.body;

    if (!category_id || !name || !price || stock === undefined) {
        return db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {
                if (err) {
                    return res.status(500).send("Failed to load categories.");
                }

                return res.render("admin/products/form", {
                    product: req.body,
                    categories,
                    error: "Please fill in all required fields."
                });
            }
        );
    }

    if (Number(price) < 0 || Number(stock) < 0) {
        return db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {
                if (err) {
                    return res.status(500).send("Failed to load categories.");
                }

                return res.render("admin/products/form", {
                    product: req.body,
                    categories,
                    error: "Price and stock cannot be negative."
                });
            }
        );
    }

    db.query(
        `INSERT INTO products
        (category_id, name, description, price, stock, image)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            category_id,
            name.trim(),
            description || null,
            price,
            stock,
            image || null
        ],
        (err) => {
            if (err) {
                console.error("Product creation error:", err);

                return db.query(
                    "SELECT * FROM categories ORDER BY name ASC",
                    (categoryErr, categories) => {
                        if (categoryErr) {
                            return res.status(500).send(
                                "Failed to load categories."
                            );
                        }

                        res.render("admin/products/form", {
                            product: req.body,
                            categories,
                            error: "Failed to create product."
                        });
                    }
                );
            }

            res.redirect("/admin/products");
        }
    );
};

// Show edit product form
exports.showEditForm = (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
        (err, productResults) => {
            if (err) {
                console.error("Product fetch error:", err);
                return res.status(500).send("Failed to load product.");
            }

            if (productResults.length === 0) {
                return res.status(404).send("Product not found.");
            }

            db.query(
                "SELECT * FROM categories ORDER BY name ASC",
                (categoryErr, categories) => {
                    if (categoryErr) {
                        console.error(
                            "Category fetch error:",
                            categoryErr
                        );

                        return res.status(500).send(
                            "Failed to load categories."
                        );
                    }

                    res.render("admin/products/form", {
                        product: productResults[0],
                        categories,
                        error: null
                    });
                }
            );
        }
    );
};

// Update product
exports.update = (req, res) => {
    const { id } = req.params;

    const {
        category_id,
        name,
        description,
        price,
        stock,
        image
    } = req.body;

    if (!category_id || !name || !price || stock === undefined) {
        return db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {
                if (err) {
                    return res.status(500).send(
                        "Failed to load categories."
                    );
                }

                res.render("admin/products/form", {
                    product: {
                        id,
                        ...req.body
                    },
                    categories,
                    error: "Please fill in all required fields."
                });
            }
        );
    }

    if (Number(price) < 0 || Number(stock) < 0) {
        return db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (err, categories) => {
                if (err) {
                    return res.status(500).send(
                        "Failed to load categories."
                    );
                }

                res.render("admin/products/form", {
                    product: {
                        id,
                        ...req.body
                    },
                    categories,
                    error: "Price and stock cannot be negative."
                });
            }
        );
    }

    db.query(
        `UPDATE products
         SET category_id = ?,
             name = ?,
             description = ?,
             price = ?,
             stock = ?,
             image = ?
         WHERE id = ?`,
        [
            category_id,
            name.trim(),
            description || null,
            price,
            stock,
            image || null,
            id
        ],
        (err) => {
            if (err) {
                console.error("Product update error:", err);
                return res.status(500).send("Failed to update product.");
            }

            res.redirect("/admin/products");
        }
    );
};

// Delete product
exports.delete = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM products WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.error("Product delete error:", err);
                return res.status(500).send("Failed to delete product.");
            }

            res.redirect("/admin/products");
        }
    );
};

// ================================
// CUSTOMER SHOP
// ================================

// Show shop page
exports.shop = (req, res) => {
    const { search, category } = req.query;

    let query = `
        SELECT
            products.*,
            categories.name AS category_name
        FROM products
        INNER JOIN categories
            ON products.category_id = categories.id
        WHERE 1 = 1
    `;

    const params = [];

    // Search
    if (search) {
        query += `
            AND (
                products.name LIKE ?
                OR products.description LIKE ?
            )
        `;

        const searchValue = `%${search}%`;

        params.push(searchValue, searchValue);
    }

    // Category filter
    if (category) {
        query += ` AND products.category_id = ?`;
        params.push(category);
    }

    query += ` ORDER BY products.id DESC`;

    db.query(query, params, (err, products) => {
        if (err) {
            console.error("Shop product fetch error:", err);
            return res.status(500).send("Failed to load products.");
        }

        db.query(
            "SELECT * FROM categories ORDER BY name ASC",
            (categoryErr, categories) => {
                if (categoryErr) {
                    console.error(
                        "Shop category fetch error:",
                        categoryErr
                    );

                    return res.status(500).send(
                        "Failed to load categories."
                    );
                }

                res.render("shop", {
                    products,
                    categories,
                    search: search || "",
                    selectedCategory: category || ""
                });
            }
        );
    });
};

// ================================
// CUSTOMER PRODUCT DETAILS
// ================================

exports.details = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT
            products.*,
            categories.name AS category_name
        FROM products
        INNER JOIN categories
            ON products.category_id = categories.id
        WHERE products.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error("Product details error:", err);
            return res.status(500).send("Failed to load product.");
        }

        if (results.length === 0) {
            return res.status(404).send("Product not found.");
        }

        res.render("product-details", {
            product: results[0]
        });
    });
};
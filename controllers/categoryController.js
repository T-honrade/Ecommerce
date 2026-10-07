const db = require("../config/db");

// Show all categories
exports.index = (req, res) => {
    db.query(
        "SELECT * FROM categories ORDER BY id DESC",
        (err, categories) => {
            if (err) {
                console.error("Category fetch error:", err);
                return res.status(500).send("Failed to load categories.");
            }

            res.render("admin/categories/index", {
                categories
            });
        }
    );
};

// Show add category form
exports.showAddForm = (req, res) => {
    res.render("admin/categories/form", {
        category: null,
        error: null
    });
};

// Add category
exports.create = (req, res) => {
    const { name, description } = req.body;

    if (!name.trim()) {
        return res.render("admin/categories/form", {
            category: null,
            error: "Category name is required."
        });
    }

    db.query(
        "INSERT INTO categories (name, description) VALUES (?, ?)",
        [name.trim(), description || null],
        (err) => {
            if (err) {
                console.error("Category creation error:", err);

                return res.render("admin/categories/form", {
                    category: null,
                    error: "Failed to create category."
                });
            }

            res.redirect("/admin/categories");
        }
    );
};

// Show edit form
exports.showEditForm = (req, res) => {
    const { id } = req.params;

    db.query(
        "SELECT * FROM categories WHERE id = ?",
        [id],
        (err, results) => {
            if (err) {
                console.error("Category fetch error:", err);
                return res.status(500).send("Failed to load category.");
            }

            if (results.length === 0) {
                return res.status(404).send("Category not found.");
            }

            res.render("admin/categories/form", {
                category: results[0],
                error: null
            });
        }
    );
};

// Update category
exports.update = (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name.trim()) {
        return res.render("admin/categories/form", {
            category: {
                id,
                name,
                description
            },
            error: "Category name is required."
        });
    }

    db.query(
        `UPDATE categories
         SET name = ?, description = ?
         WHERE id = ?`,
        [name.trim(), description || null, id],
        (err) => {
            if (err) {
                console.error("Category update error:", err);
                return res.status(500).send("Failed to update category.");
            }

            res.redirect("/admin/categories");
        }
    );
};

// Delete category
exports.delete = (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM categories WHERE id = ?",
        [id],
        (err) => {
            if (err) {
                console.error("Category delete error:", err);
                return res.status(500).send("Failed to delete category.");
            }

            res.redirect("/admin/categories");
        }
    );
};
const db = require("../config/db");

// ================================
// SHOW CART
// ================================

exports.index = (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.render("cart", {
            cart: [],
            total: 0
        });
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
            console.error("Cart product fetch error:", err);
            return res.status(500).send("Failed to load cart.");
        }

        const cartItems = cart.map(item => {
            const product = products.find(
                product => product.id === item.productId
            );

            if (!product) {
                return null;
            }

            const subtotal =
                Number(product.price) * item.quantity;

            return {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                stock: product.stock,
                image: product.image,
                quantity: item.quantity,
                subtotal
            };
        }).filter(item => item !== null);

        const total = cartItems.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        res.render("cart", {
            cart: cartItems,
            total
        });
    });
};


// ================================
// ADD TO CART
// ================================

exports.add = (req, res) => {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity) || 1;

    if (!productId || quantity < 1) {
        return res.redirect("/shop");
    }

    db.query(
        "SELECT * FROM products WHERE id = ?",
        [productId],
        (err, results) => {
            if (err) {
                console.error("Add cart product error:", err);
                return res.status(500).send(
                    "Failed to add product to cart."
                );
            }

            if (results.length === 0) {
                return res.status(404).send("Product not found.");
            }

            const product = results[0];

            if (product.stock <= 0) {
                return res.redirect(
                    `/shop/product/${productId}`
                );
            }

            if (!req.session.cart) {
                req.session.cart = [];
            }

            const existingItem = req.session.cart.find(
                item => item.productId === productId
            );

            if (existingItem) {

                const newQuantity =
                    existingItem.quantity + quantity;

                existingItem.quantity =
                    Math.min(newQuantity, product.stock);

            } else {

                req.session.cart.push({
                    productId,
                    quantity: Math.min(quantity, product.stock)
                });

            }

            res.redirect("/cart");
        }
    );
};


// ================================
// UPDATE CART
// ================================

exports.update = (req, res) => {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);

    if (!req.session.cart) {
        return res.redirect("/cart");
    }

    const item = req.session.cart.find(
        item => item.productId === productId
    );

    if (!item) {
        return res.redirect("/cart");
    }

    if (quantity <= 0) {
        req.session.cart = req.session.cart.filter(
            item => item.productId !== productId
        );

        return res.redirect("/cart");
    }

    db.query(
        "SELECT stock FROM products WHERE id = ?",
        [productId],
        (err, results) => {
            if (err) {
                console.error("Cart update error:", err);
                return res.status(500).send(
                    "Failed to update cart."
                );
            }

            if (results.length === 0) {
                return res.redirect("/cart");
            }

            item.quantity = Math.min(
                quantity,
                results[0].stock
            );

            res.redirect("/cart");
        }
    );
};


// ================================
// REMOVE FROM CART
// ================================

exports.remove = (req, res) => {
    const productId = Number(req.body.productId);

    if (!req.session.cart) {
        return res.redirect("/cart");
    }

    req.session.cart = req.session.cart.filter(
        item => item.productId !== productId
    );

    res.redirect("/cart");
};
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed.");
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        return;
    }

    console.log("✅ Connected to StudyCart MySQL database.");
});

module.exports = db;
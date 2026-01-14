const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  // If a cloud URL exists, use it. Otherwise, use local details.
  connectionString: process.env.DATABASE_URL 
    ? process.env.DATABASE_URL 
    : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.connect()
  .then(() => console.log("🔗 Database Connected"))
  .catch(err => console.error("DB Error:", err));

module.exports = pool;
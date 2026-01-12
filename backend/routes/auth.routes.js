const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

   const result = await pool.query(
  `INSERT INTO users (name, roll, section, branch, email, password, role)
   VALUES ($1,$2,$3,$4,$5,$6,'student')
   RETURNING id,name,roll,section,branch,email,role`,
  [name, roll, section, branch, email, hashed]
);


    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rowCount === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },  // Added role
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

const authMiddleware = require("../middleware/auth");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,name,roll,section,branch,email,role FROM users WHERE id=$1",  // Added role
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to load user" });
  }
});

// GET ALL USERS (For Directory) - Public (or protected)
router.get("/directory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, roll, branch, role FROM users ORDER BY name ASC"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// --- NEW: PUBLIC COURSE LIST ---
router.get("/courses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// 1. REGISTER (Called AFTER frontend verifies OTP)
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email, password } = req.body;

    // Check for existing user
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1 OR roll = $2", [email, roll]);
    if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: "User already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Save User (Verified = TRUE because frontend checked OTP)
    const result = await pool.query(
      `INSERT INTO users (name, roll, section, branch, email, password, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, 'student', TRUE)
       RETURNING id, name, roll, email, role`,
      [name, roll, section, branch || 'B.Tech', email, hashed]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ success: true, token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// 2. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });
    
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET ME
const authMiddleware = require("../middleware/auth");
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch { res.status(500).json({ error: "Error" }); }
});

// PUBLIC DATA
router.get("/courses", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
        res.json({ success: true, courses: result.rows });
    } catch { res.status(500).json({ error: "Error" }); }
});

router.get("/directory", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, roll, branch, role FROM users ORDER BY name ASC");
        res.json({ success: true, users: result.rows });
    } catch { res.status(500).json({ error: "Error" }); }
});

// RESET PASSWORD ROUTE
router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPass } = req.body;
        const hashed = await bcrypt.hash(newPass, 10);
        
        const result = await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, email]);
        
        if (result.rowCount > 0) res.json({ success: true });
        else res.status(400).json({ error: "Email not found" });
        
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

// RESET PASSWORD ROUTE
router.post("/reset-password", async (req, res) => {
    try {
        const { email, newPass } = req.body;
        
        // 1. Check if user exists
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Email not found" });
        }

        // 2. Hash new password
        const hashed = await bcrypt.hash(newPass, 10);
        
        // 3. Update DB
        await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashed, email]);
        
        res.json({ success: true, message: "Password updated successfully" });
        
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Server Error" }); 
    }
});

module.exports = router;
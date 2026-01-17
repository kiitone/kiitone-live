const router = require("express").Router();
const pool = require("../models/db");

// 1. REGISTER / SYNC USER
// Called after Firebase creates the user on frontend.
// This saves the extra details (Roll, Section, Role) to Postgres.
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email } = req.body;

    // Check if user exists in Postgres
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userCheck.rows.length > 0) {
        // User already exists, just return success
        return res.json({ success: true, user: userCheck.rows[0] });
    }

    // Save new user to Postgres (No password needed here, Firebase handles it)
    // We set a dummy password 'firebase_user' just to satisfy the DB constraint if needed
    const result = await pool.query(
      `INSERT INTO users (name, roll, section, branch, email, password, role, is_verified)
       VALUES ($1, $2, $3, $4, $5, 'firebase_auth', 'student', TRUE)
       RETURNING id, name, roll, email, role, section, branch`,
      [name, roll, section, branch || 'B.Tech', email]
    );

    res.json({ success: true, user: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database Sync Error" });
  }
});

// 2. FETCH USER DETAILS (LOGIN)
// Called after Firebase logs in. We just need to get the Role/Roll from Postgres.
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: "User data not found in database." });
    }

    const user = result.rows[0];
    delete user.password; // Don't send internal fields
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. GET CURRENT USER (Session)
const authMiddleware = require("../middleware/auth");
router.get("/me", async (req, res) => {
    // For Firebase, we rely on the frontend state mostly, but this endpoint 
    // can be used if you pass the email in headers. 
    // For simplicity in this transition, we will skip complex token verification here
    // and let the frontend handle the session persistence via Firebase.
    res.status(200).json({ message: "Use Firebase Client SDK" });
});

// PUBLIC DATA ROUTES
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

module.exports = router;
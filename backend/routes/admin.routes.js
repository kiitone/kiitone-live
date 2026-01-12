const router = require("express").Router();
const pool = require("../models/db");
const authMiddleware = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// 1. List all users
router.get("/users", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, roll, section, branch, email, role FROM users ORDER BY created_at DESC");
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Delete user
router.delete("/user/:id/delete", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// 3. Approve/Promote user
router.put("/user/:id/approve", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [id]);
    res.json({ success: true, message: "User promoted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

// --- NEW: COURSE MANAGEMENT APIs ---

// 4. Create a Course (Updated with Price/Desc)
router.post("/courses", [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { title, category, description, price, discount_code } = req.body;
        const result = await pool.query(
            "INSERT INTO courses (title, category, description, price, discount_code) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, category, description, price, discount_code]
        );
        res.json({ success: true, course: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Failed to create course" });
    }
});

// 5. Get All Courses
router.get("/courses", [authMiddleware, isAdmin], async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
        res.json({ success: true, courses: result.rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

// 6. Delete Course
router.delete("/courses/:id", [authMiddleware, isAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM courses WHERE id = $1", [id]);
        res.json({ success: true, message: "Course deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete course" });
    }
});

module.exports = router;
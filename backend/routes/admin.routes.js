const router = require("express").Router();
const pool = require("../models/db");
const authMiddleware = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// List all users (GET /api/admin/users)
router.get("/users", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, roll, section, branch, email, role FROM users ORDER BY created_at DESC"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Delete user (DELETE /api/admin/user/:id/delete)
router.delete("/user/:id/delete", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Approve/Change role (PUT /api/admin/user/:id/approve) - Example: Sets role to 'admin' (you can make it toggle or param-based)
router.put("/user/:id/approve", [authMiddleware, isAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const newRole = 'admin';  // Or req.body.role for flexibility
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [newRole, id]);
    res.json({ success: true, message: "User role updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

module.exports = router;
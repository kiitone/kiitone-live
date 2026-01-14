const router = require("express").Router();
const pool = require("../models/db");
const authMiddleware = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// Create Post (POST /api/posts/create) - Auth required
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { content, is_anonymous = false, tags = [] } = req.body;
    const userId = req.user.id;

    const result = await pool.query(
      `INSERT INTO posts (user_id, content, is_anonymous, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, content, is_anonymous, tags, created_at`,
      [userId, content, is_anonymous, tags]
    );

    res.json({ success: true, post: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Fetch Recent Posts (GET /api/posts) - Optional auth, public for now
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.content, p.is_anonymous, p.tags, p.created_at,
              CASE WHEN p.is_anonymous THEN 'Anonymous' ELSE u.name END AS user_name
       FROM posts p LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 50`
    );
    res.json({ success: true, posts: result.rows });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Delete Post (DELETE /api/posts/:id) - Author or admin only
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [id]);
    if (post.rowCount === 0) return res.status(404).json({ error: "Post not found" });

    if (post.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
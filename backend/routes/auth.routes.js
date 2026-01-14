const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --- EMAIL CONFIGURATION (FIXED) ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: "kiitone.official@gmail.com", // REPLACE THIS
        pass: "ukku ymvo fduz yfmb" // REPLACE THIS
    }
});

// 1. REGISTER (Send OTP)
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email, password } = req.body;

    // Check if user exists (Email OR Roll)
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1 OR roll = $2", [email, roll]);
    if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: "User or Roll Number already exists. Please login." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 10);

    // Save user as UNVERIFIED
    await pool.query(
      `INSERT INTO users (name, roll, section, branch, email, password, role, otp, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, 'student', $7, FALSE)`,
      [name, roll, section, branch, email, hashed, otp]
    );

    // Send Email
    await transporter.sendMail({
        from: '"KIIT ONE Admin" <no-reply@kiitone.in>',
        to: email,
        subject: "Verify your KIIT ONE Account",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`
    });

    res.json({ success: true, message: "OTP sent to email. Please verify." });

  } catch (err) {
    console.error("Register Error:", err);
    // If it's a duplicate key error from DB
    if (err.code === '23505') {
        return res.status(400).json({ error: "Email or Roll Number already taken." });
    }
    res.status(500).json({ error: "Email failed to send. Check server logs." });
  }
});

// 2. VERIFY OTP
router.post("/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

        if (user.rows[0].otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // OTP Matches -> Verify User
        await pool.query("UPDATE users SET is_verified = TRUE, otp = NULL WHERE email = $1", [email]);

        // Generate Token
        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        delete user.rows[0].password;
        res.json({ success: true, token, user: user.rows[0] });

    } catch (err) {
        res.status(500).json({ error: "Verification failed" });
    }
});

// 3. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rowCount === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    // Check Verification
    if (!user.is_verified) {
        return res.status(400).json({ error: "Account not verified. Register again to get OTP." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const authMiddleware = require("../middleware/auth");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id,name,roll,section,branch,email,role FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ error: "Failed to load user" });
  }
});

router.get("/directory", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, roll, branch, role FROM users ORDER BY name ASC");
    res.json({ success: true, users: result.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

router.get("/courses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
    res.json({ success: true, courses: result.rows });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

module.exports = router;
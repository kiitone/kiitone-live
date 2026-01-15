const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --- EMAIL CONFIGURATION ---
// This reads the specific variables you added to your .env file
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// 1. REGISTER (Send OTP)
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email, password } = req.body;
    
    // Check for existing user (Email OR Roll)
    const userCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR roll = $2", 
        [email, roll.toString()]
    );

    if (userCheck.rows.length > 0) {
        // If user exists but NOT verified, delete them so they can try again
        if (!userCheck.rows[0].is_verified) {
             await pool.query("DELETE FROM users WHERE email = $1", [email]);
        } else {
             return res.status(400).json({ error: "User or Roll Number already registered. Please login." });
        }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 10);

    // Save user as UNVERIFIED
    await pool.query(
      `INSERT INTO users (name, roll, section, branch, email, password, role, otp, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, 'student', $7, FALSE)`,
      [name, roll, section, branch || 'B.Tech', email, hashed, otp]
    );

    // Send Email
    try {
        await transporter.sendMail({
            from: '"KIIT ONE" <no-reply@kiitone.in>',
            to: email,
            subject: "Your OTP for KIIT ONE",
            text: `Your OTP is: ${otp}`
        });
        res.json({ success: true, message: "OTP sent successfully" });
    } catch (emailErr) {
        console.error("Email Failed:", emailErr);
        // Fallback: Return OTP in response if email fails (Only for debugging/emergency)
        res.json({ success: true, message: "Email failed (Server Issue). Use OTP: " + otp, debug_otp: otp });
    }

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Registration failed. Try again." });
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

        await pool.query("UPDATE users SET is_verified = TRUE, otp = NULL WHERE email = $1", [email]);

        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
            JWT_SECRET, { expiresIn: "7d" }
        );

        res.json({ success: true, token, user: user.rows[0] });

    } catch (err) {
        res.status(500).json({ error: "Verification error" });
    }
});

// 3. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (user.rows.length === 0) return res.status(400).json({ error: "User does not exist" });

    // Allow Admin bypass if verified manually in DB
    if (!user.rows[0].is_verified && user.rows[0].role !== 'admin') {
        return res.status(400).json({ error: "Account not verified. Register again to get OTP." });
    }

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET, { expiresIn: "7d" }
    );

    res.json({ success: true, token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Login error" });
  }
});

// GET Current User
const authMiddleware = require("../middleware/auth");
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch { res.status(500).json({ error: "Error" }); }
});

// Public Routes (Courses & Directory)
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
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// --- PROFESSIONAL EMAIL CONFIGURATION (Port 587) ---
// This port is not blocked by Render/AWS/Google Cloud
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, 
    secure: false, // Must be false for Port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Fixes certificate issues on free servers
    }
});

// 1. REGISTER (Smart Logic)
router.post("/register", async (req, res) => {
  try {
    const { name, roll, section, branch, email, password } = req.body;

    // Check if user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userCheck.rows.length > 0) {
        const user = userCheck.rows[0];
        
        // Scenario A: User is already verified -> Stop them.
        if (user.is_verified) {
            return res.status(400).json({ error: "Account exists. Please Login." });
        }
        
        // Scenario B: User tried before but failed OTP -> DELETE OLD DATA so they can try again.
        await pool.query("DELETE FROM users WHERE email = $1", [email]);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 10);

    // Save New User
    await pool.query(
      `INSERT INTO users (name, roll, section, branch, email, password, role, otp, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, 'student', $7, FALSE)`,
      [name, roll, section, branch || 'B.Tech', email, hashed, otp]
    );

    // Send Email (With Timeout Protection)
    try {
        await transporter.sendMail({
            from: '"KIIT ONE Team" <no-reply@kiitone.in>',
            to: email,
            subject: "Your OTP - KIIT ONE",
            text: `Welcome to KIIT ONE.\n\nYour Verification OTP is: ${otp}\n\nThis code expires in 10 minutes.`
        });
        res.json({ success: true, message: "OTP Sent" });
    } catch (emailErr) {
        console.error("SMTP Error:", emailErr);
        // If email fails, delete the user so they aren't stuck
        await pool.query("DELETE FROM users WHERE email = $1", [email]);
        res.status(500).json({ error: "Email System Error. Please try again later." });
    }

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// 2. VERIFY OTP (Finalizes Account)
router.post("/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

        if (user.rows[0].otp !== otp) {
            return res.status(400).json({ error: "Wrong OTP" });
        }

        // Verify User
        await pool.query("UPDATE users SET is_verified = TRUE, otp = NULL WHERE email = $1", [email]);

        // Auto-Login
        const token = jwt.sign(
            { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
            JWT_SECRET, { expiresIn: "30d" } // 30 Days Session
        );

        // Remove password from response
        delete user.rows[0].password;
        res.json({ success: true, token, user: user.rows[0] });

    } catch (err) {
        res.status(500).json({ error: "Verification Failed" });
    }
});

// 3. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (user.rows.length === 0) return res.status(400).json({ error: "User not found. Please Register." });

    if (!user.rows[0].is_verified && user.rows[0].role !== 'admin') {
        // If not verified, tell them to register again to get a new OTP
        return res.status(400).json({ error: "Account not verified. Please Register again." });
    }

    const valid = await bcrypt.compare(password, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: "Wrong Password" });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      JWT_SECRET, { expiresIn: "30d" }
    );

    delete user.rows[0].password;
    res.json({ success: true, token, user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Login Error" });
  }
});

// 4. GET ME (Session Check)
const authMiddleware = require("../middleware/auth");
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query("SELECT id, name, roll, section, branch, email, role FROM users WHERE id=$1", [req.user.id]);
        if(result.rows.length === 0) return res.status(401).json({error: "User not found"});
        res.json({ success: true, user: result.rows[0] });
    } catch { res.status(500).json({ error: "Session Error" }); }
});

// 5. PUBLIC COURSES
router.get("/courses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY created_at DESC");
    res.json({ success: true, courses: result.rows });
  } catch { res.status(500).json({ error: "Error fetching courses" }); }
});

// 6. PUBLIC DIRECTORY
router.get("/directory", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, roll, branch, role FROM users ORDER BY name ASC");
    res.json({ success: true, users: result.rows });
  } catch { res.status(500).json({ error: "Error fetching directory" }); }
});

module.exports = router; 
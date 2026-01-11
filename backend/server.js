require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());


app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/posts", require("./routes/posts.routes"));


// -------------------- ENV --------------------
const PORT = process.env.PORT || 5000;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_KEY) {
  console.error("❌ OPENROUTER_API_KEY missing in .env");
  process.exit(1);
}

// -------------------- TEST ROUTE --------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "Backend Running" });
});

// -------------------- AI ROUTE --------------------
app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "KIIT ONE",
        },
        body: JSON.stringify(req.body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    response.body.pipe(res);
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -------------------- FRONTEND SERVE (DEV SAFE) --------------------
app.use(express.static(path.join(__dirname, "../frontend")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});


// -------------------- START SERVER --------------------
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);

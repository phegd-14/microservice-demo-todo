import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db.js";

const app = express();
app.use(express.json());

// allow frontend (Vite default = 5173)
app.use(cors({ origin: "http://localhost:30081" }));

const JWT_SECRET = "supersecret"; // ⚠️ move to ENV later

app.get("/", (req, res) => {
  res.json({ status: "User service is up 🚀" });
});

// signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashed],
    function (err) {
      if (err) {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.json({ message: "User created", id: this.lastID });
    }
  );
});

// login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

app.listen(4000, () => {
  console.log("✅ User service running on http://localhost:4000");
});

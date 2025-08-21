import express from "express";
import jwt from "jsonwebtoken";
import db from "./db.js";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

const JWT_SECRET = "supersecret"; // ⚠️ must match user-service

// Middleware to verify token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // { userId, username }
    next();
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Task service is up 🚀" });
});

// Get tasks
app.get("/tasks", authenticateToken, (req, res) => {
  db.all("SELECT * FROM tasks WHERE userId = ?", [req.user.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create task
app.post("/tasks", authenticateToken, (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "Missing description" });

  db.run(
    "INSERT INTO tasks (userId, description) VALUES (?, ?)",
    [req.user.userId, description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, description, done: 0 });
    }
  );
});

// Update task
app.put("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { description, done } = req.body;

  db.run(
    "UPDATE tasks SET description = ?, done = ? WHERE id = ? AND userId = ?",
    [description, done ? 1 : 0, id, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Task updated" });
    }
  );
});

// Delete task
app.delete("/tasks/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM tasks WHERE id = ? AND userId = ?",
    [id, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Task not found" });
      res.json({ message: "Task deleted" });
    }
  );
});

app.listen(5000, () => {
  console.log("✅ Task service running on http://localhost:5000");
});

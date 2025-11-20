import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import db from "./db.js"; // sqlite db.js

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:30081" }));

const JWT_SECRET = "supersecret"; // must match user-service

// ------------------- AUTH MIDDLEWARE -------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("❌ Token verification failed:", err.message);
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user; // { userId, username }
    next();
  });
}

// ------------------- ROUTES -------------------

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Deadline service is up 🚀" });
});

// Get all deadlines for logged-in user
app.get("/deadlines", authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM deadlines WHERE userId = ?",
    [req.user.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get deadline for a specific task
app.get("/deadlines/:taskId", authenticateToken, (req, res) => {
  db.get(
    "SELECT * FROM deadlines WHERE taskId = ? AND userId = ?",
    [req.params.taskId, req.user.userId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Deadline not found" });
      res.json(row);
    }
  );
});

// Add a deadline
app.post("/deadlines", authenticateToken, (req, res) => {
  const { taskId, deadline } = req.body;
  if (!taskId || !deadline)
    return res.status(400).json({ error: "taskId and deadline are required" });

  db.run(
    "INSERT INTO deadlines (taskId, deadline, userId) VALUES (?, ?, ?)",
    [taskId, deadline, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res
        .status(201)
        .json({ id: this.lastID, taskId, deadline, userId: req.user.userId });
    }
  );
});

// Update deadline
app.put("/deadlines/:taskId", authenticateToken, (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: "deadline is required" });

  db.run(
    "UPDATE deadlines SET deadline = ? WHERE taskId = ? AND userId = ?",
    [deadline, req.params.taskId, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Deadline not found" });
      res.json({
        message: "Deadline updated",
        taskId: req.params.taskId,
        deadline
      });
    }
  );
});

// Delete deadline
app.delete("/deadlines/:taskId", authenticateToken, (req, res) => {
  db.run(
    "DELETE FROM deadlines WHERE taskId = ? AND userId = ?",
    [req.params.taskId, req.user.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0)
        return res.status(404).json({ error: "Deadline not found" });
      res.json({ message: "Deadline deleted" });
    }
  );
});

// ------------------- SERVER -------------------
app.listen(6001, () => {
  console.log("✅ Deadline service running on http://localhost:6001");
});

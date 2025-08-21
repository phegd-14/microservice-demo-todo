// src/routes.js
import express from "express";
import db from "./db.js";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Validate task ownership via task-service
async function validateTaskOwnership(taskId, userId, token) {
  try {
    const res = await fetch(`http://localhost:5000/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return false;

    const task = await res.json();
    return task.userId === userId;
  } catch (e) {
    console.error("❌ Task service validation failed:", e.message);
    return false;
  }
}

// ---------------- ROUTES ----------------

// Get all deadlines for logged-in user
router.get("/", (req, res) => {
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
router.get("/:taskId", (req, res) => {
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
router.post("/", async (req, res) => {
  const { taskId, deadline } = req.body;
  if (!taskId || !deadline)
    return res.status(400).json({ error: "taskId and deadline are required" });

  const token = req.headers["authorization"].split(" ")[1];
  const isOwner = await validateTaskOwnership(taskId, req.user.userId, token);
  if (!isOwner)
    return res.status(403).json({ error: "Not authorized for this task" });

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
router.put("/:taskId", async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: "deadline is required" });

  const token = req.headers["authorization"].split(" ")[1];
  const isOwner = await validateTaskOwnership(
    req.params.taskId,
    req.user.userId,
    token
  );
  if (!isOwner)
    return res.status(403).json({ error: "Not authorized for this task" });

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
router.delete("/:taskId", async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  const isOwner = await validateTaskOwnership(
    req.params.taskId,
    req.user.userId,
    token
  );
  if (!isOwner)
    return res.status(403).json({ error: "Not authorized for this task" });

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

export { router as deadlineRoutes };
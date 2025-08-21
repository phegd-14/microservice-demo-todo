import express from "express";
import db from "../db.js";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Middleware already added in index.js, so req.user is available

// Helper: validate task belongs to user via task-service
async function validateTaskOwnership(taskId, userId) {
  try {
    const res = await fetch(`http://localhost:5000/tasks`, {
      headers: { Authorization: `Bearer ${taskId}` }
    });
    const tasks = await res.json();
    return tasks.some((t) => t.id === parseInt(taskId) && t.userId === userId);
  } catch (e) {
    console.error("❌ Task service validation failed:", e.message);
    return false;
  }
}

// Get all deadlines for logged-in user
router.get("/", (req, res) => {
  db.all("SELECT * FROM deadlines WHERE userId = ?", [req.user.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get deadline for a specific task
router.get("/:taskId", (req, res) => {
  db.get("SELECT * FROM deadlines WHERE taskId = ? AND userId = ?", [req.params.taskId, req.user.userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Deadline not found" });
    res.json(row);
  });
});

// Add a deadline
router.post("/", (req, res) => {
  const { taskId, deadline } = req.body;
  if (!taskId || !deadline) return res.status(400).json({ error: "taskId and deadline are required" });

  db.run("INSERT INTO deadlines (taskId, deadline, userId) VALUES (?, ?, ?)", [taskId, deadline, req.user.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, taskId, deadline });
  });
});

// Update deadline
router.put("/:taskId", (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: "deadline is required" });

  db.run("UPDATE deadlines SET deadline = ? WHERE taskId = ? AND userId = ?", [deadline, req.params.taskId, req.user.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Deadline not found" });
    res.json({ message: "Deadline updated", taskId: req.params.taskId, deadline });
  });
});

// Delete deadline
router.delete("/:taskId", (req, res) => {
  db.run("DELETE FROM deadlines WHERE taskId = ? AND userId = ?", [req.params.taskId, req.user.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Deadline not found" });
    res.json({ message: "Deadline deleted" });
  });
});

export { router as deadlineRoutes };

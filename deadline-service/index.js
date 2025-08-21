import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { deadlineRoutes } from "./src/routes.js";

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const JWT_SECRET = "supersecret"; // must match user-service

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
  res.json({ status: "Deadline service is up 🚀" });
});

// Apply auth middleware
app.use("/deadlines", authenticateToken, deadlineRoutes);

app.listen(6001, () => {
  console.log("✅ Deadline service running on http://localhost:6001");
});

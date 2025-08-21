import sqlite3 from "sqlite3";

const db = new sqlite3.Database("deadlines.db", (err) => {
  if (err) {
    console.error("❌ Error opening DB:", err.message);
  } else {
    console.log("✅ Connected to deadlines.db");
    db.run(`
      CREATE TABLE IF NOT EXISTS deadlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId INTEGER,
        deadline TEXT,
        userId INTEGER
      )
    `);
  }
});

export default db;
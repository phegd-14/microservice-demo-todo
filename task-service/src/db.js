import sqlite3 from "sqlite3";

const db = new sqlite3.Database("tasks.db", (err) => {
  if (err) {
    console.error("❌ Error opening DB:", err.message);
  } else {
    console.log("✅ Connected to tasks.db");
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        description TEXT,
        done INTEGER DEFAULT 0
      )
    `);
  }
});

export default db;


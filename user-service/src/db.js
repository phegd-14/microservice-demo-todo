import sqlite3 from "sqlite3";

// open database (creates file if not exists)
const db = new sqlite3.Database("users.db", (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");

    // create table if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )
    `);
  }
});

export default db;

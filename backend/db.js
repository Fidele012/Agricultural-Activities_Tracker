const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "tasks.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Pending', 'Completed')),
    priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    createdAt   TEXT NOT NULL
  );
`);

// Migrate existing table if it used the old CHECK constraint that did not include 'Not Started'.
// This safely recreates the table while preserving existing rows.
const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get();
// If the existing table doesn't include 'Not Started' or doesn't include 'Completed', migrate.
if (row && row.sql && (!row.sql.includes("'Not Started'") || !row.sql.includes("'Completed'"))) {
  db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks_new (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT NOT NULL,
        description TEXT DEFAULT '',
        status      TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Pending', 'Completed')),
        priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
        createdAt   TEXT NOT NULL
      );
    `);

    // Copy rows, normalizing any unknown statuses to 'Not Started'.
    db.exec(`
      INSERT INTO tasks_new (id, title, description, status, priority, createdAt)
      SELECT id, title, description,
        CASE WHEN status IN ('Not Started','Pending','Completed') THEN status ELSE 'Not Started' END,
        priority, createdAt
      FROM tasks;
    `);

    db.exec('DROP TABLE tasks;');
    db.exec('ALTER TABLE tasks_new RENAME TO tasks;');
  })();
}

module.exports = db;

const { Pool } = require("pg");

// Use DATABASE_URL env var (Railway provides this) or fallback to a local Postgres URL
const connectionString = process.env.DATABASE_URL || process.env.PG_URI || "";

if (!connectionString) {
  console.warn(
    "No DATABASE_URL found. Please set DATABASE_URL in your environment to a Postgres connection string."
  );
}

const pool = new Pool({ connectionString });

// Ensure the tasks table exists
async function migrate() {
  const create = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Pending', 'Completed')),
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
      createdAt TIMESTAMP WITH TIME ZONE NOT NULL
    );
  `;
  await pool.query(create);
}

migrate().catch((err) => {
  console.error("DB migration error:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

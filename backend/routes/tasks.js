const express = require("express");
const db = require("../db");

const router = express.Router();

const VALID_STATUSES = ["Not Started", "Pending", "Completed"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

function serializeTask(row) {
  return row;
}

function validateTaskInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push("title is required and must be a non-empty string");
    } else {
      data.title = body.title.trim();
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push("description must be a string");
    } else {
      data.description = body.description;
    }
  } else if (!partial) {
    data.description = "";
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
    } else {
      data.status = body.status;
    }
  } else if (!partial) {
    data.status = "Not Started";
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      errors.push(`priority must be one of: ${VALID_PRIORITIES.join(", ")}`);
    } else {
      data.priority = body.priority;
    }
  } else if (!partial) {
    data.priority = "Medium";
  }

  return { data, errors };
}

// GET /tasks?status=Pending&priority=High&search=term
router.get("/", (req, res) => {
  const { status, priority, search } = req.query;

  let query = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    }
    query += " AND status = ?";
    params.push(status);
  }

  if (priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }
    query += " AND priority = ?";
    params.push(priority);
  }

  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY createdAt DESC";

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(serializeTask));
});

// GET /tasks/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ error: "task not found" });

  res.json(serializeTask(row));
});

// POST /tasks
router.post("/", (req, res) => {
  const { data, errors } = validateTaskInput(req.body || {});
  if (errors.length) return res.status(400).json({ errors });

  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, createdAt)
    VALUES (@title, @description, @status, @priority, @createdAt)
  `);
  const info = stmt.run({ ...data, createdAt });

  const created = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(serializeTask(created));
});

// PUT /tasks/:id  (full or partial update)
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "task not found" });

  const { data, errors } = validateTaskInput(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ errors });

  const merged = { ...existing, ...data };

  // Enforce allowed forward-only transitions
  const allowed = {
    "Not Started": ["Pending"],
    Pending: ["Not Started", "Completed"],
    Completed: [],
  };

  if (merged.status !== existing.status) {
    if (!(allowed[existing.status] || []).includes(merged.status)) {
      return res.status(400).json({ error: `invalid status transition: ${existing.status} -> ${merged.status}` });
    }
  }

  db.prepare(`
    UPDATE tasks
    SET title = @title, description = @description, status = @status, priority = @priority
    WHERE id = @id
  `).run({ ...merged, id });

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(serializeTask(updated));
});

// PATCH /tasks/:id/status  — convenience endpoint to toggle/set status
router.patch("/:id/status", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "task not found" });

  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  const allowed = {
    "Not Started": ["Pending"],
    Pending: ["Not Started", "Completed"],
    Completed: [],
  };

  if (status !== existing.status && !(allowed[existing.status] || []).includes(status)) {
    return res.status(400).json({ error: `invalid status transition: ${existing.status} -> ${status}` });
  }

  db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(serializeTask(updated));
});

// DELETE /tasks/:id
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "task not found" });

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.status(204).send();
});

module.exports = router;

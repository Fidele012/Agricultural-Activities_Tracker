const express = require("express");
const db = require("../db");

const router = express.Router();

const VALID_STATUSES = ["Not Started", "Pending", "Completed"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

function serializeTask(row) {
  if (!row) return row;
  // Ensure createdAt is ISO string
  if (row.createdat && row.createdat.toISOString) {
    row.createdAt = row.createdat.toISOString();
    delete row.createdat;
  }
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
router.get("/", async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let query = "SELECT * FROM tasks WHERE 1=1";
    const params = [];

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
      }
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
      }
      query += ` AND priority = $${params.length + 1}`;
      params.push(priority);
    }

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY createdAt DESC";

    const result = await db.query(query, params);
    res.json(result.rows.map(serializeTask));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

// GET /tasks/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

    const result = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "task not found" });

    res.json(serializeTask(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

// POST /tasks
router.post("/", async (req, res) => {
  try {
    const { data, errors } = validateTaskInput(req.body || {});
    if (errors.length) return res.status(400).json({ errors });

    const createdAt = new Date().toISOString();
    const insert = `
      INSERT INTO tasks (title, description, status, priority, createdAt)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(insert, [data.title, data.description, data.status, data.priority, createdAt]);
    res.status(201).json(serializeTask(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

// PUT /tasks/:id  (full or partial update)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

    const existingRes = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    const existing = existingRes.rows[0];
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

    const update = `
      UPDATE tasks
      SET title = $1, description = $2, status = $3, priority = $4
      WHERE id = $5
      RETURNING *
    `;
    const updatedRes = await db.query(update, [merged.title, merged.description, merged.status, merged.priority, id]);
    res.json(serializeTask(updatedRes.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

// PATCH /tasks/:id/status  — convenience endpoint to toggle/set status
router.patch("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

    const existingRes = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    const existing = existingRes.rows[0];
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

    const r = await db.query("UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
    res.json(serializeTask(r.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

// DELETE /tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be an integer" });

    const existingRes = await db.query("SELECT * FROM tasks WHERE id = $1", [id]);
    const existing = existingRes.rows[0];
    if (!existing) return res.status(404).json({ error: "task not found" });

    await db.query("DELETE FROM tasks WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
  }
});

module.exports = router;

const path = require("path");
const express = require("express");
const cors = require("cors");
const tasksRouter = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 4000;

// If the frontend is deployed separately (e.g. on Vercel) set FRONTEND_ORIGIN
// to its URL so only that origin can call the API. Left unset, all origins
// are allowed, which is fine for local dev and for the single-service
// deployment where the frontend is served from this same app.
const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/tasks", tasksRouter);

// Serve the built React app (frontend/dist, produced by `npm run build`)
// so the whole app can run from one server/process/deployment.
const FRONTEND_DIST = path.join(__dirname, "..", "frontend", "dist");
const fs = require("fs");
const hasFrontendBuild = fs.existsSync(path.join(FRONTEND_DIST, "index.html"));

if (hasFrontendBuild) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/tasks") || req.path.startsWith("/health")) return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.type("text").send(
      "Task Manager API is running. No frontend build found at frontend/dist — " +
        "run `npm run build` in frontend/ (or `npm run dev` there for local development)."
    );
  });
}

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`Task Manager API running on http://localhost:${PORT}`);
});

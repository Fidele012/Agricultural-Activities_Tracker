const path = require("path");
const express = require("express");
const cors = require("cors");
const tasksRouter = require("./routes/tasks");

const app = express();
const PORT = process.env.PORT || 4000;

// If the frontend is deployed separately (e.g. on Vercel) set FRONTEND_ORIGIN
// to one or more comma-separated origins (no trailing slash), e.g.
//  https://my-site.vercel.app,https://my-site-branch.vercel.app
// If unset, all origins are allowed (useful for quick testing).
const rawFrontendOrigin = process.env.FRONTEND_ORIGIN;
let corsOptions = undefined;
if (rawFrontendOrigin) {
  const allowedOrigins = rawFrontendOrigin
    .split(/\s*,\s*/)
    .map((o) => o.replace(/\/$/, "")); // remove trailing slash if present

  corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (no origin) and allowed origins
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
}

app.use(cors(corsOptions));
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
  // Include error message and stack to aid debugging (temporary)
  res.status(500).json({ error: "internal server error", message: err.message, stack: err.stack });
});

app.listen(PORT, () => {
  console.log(`Task Manager API running on http://localhost:${PORT}`);
});

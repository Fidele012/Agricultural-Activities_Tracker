# Agricultural Activities Tracker

A simple, farmer-focused activity tracker to plan and monitor agricultural
tasks and operations — sowing, weeding, irrigation, harvesting, and other
field activities. Create activities, track status (Not Started / In Progress /
Completed), set priority, search and filter, and deploy easily to common
Node hosting platforms.

Quick start (dev)

1. Start the backend (API):

```bash
cd backend
npm install
npm start
```

2. Start the frontend (dev server):

```bash
cd frontend
npm install
npm run dev
```

Build & single-service run

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```

Deployment & CI notes

This repository includes example GitHub Actions workflows that automate
deploys on push (see `.github/workflows/`). To use them add these GitHub
Secrets (Settings → Secrets → Actions):

- `VERCEL_TOKEN` — Vercel personal access token
- `VERCEL_ORG_ID` — Vercel organization id
- `VERCEL_PROJECT_ID` — Vercel project id for the frontend
- `RENDER_API_KEY` — Render API key to trigger backend deploys
- `RENDER_SERVICE_ID` — Render service id for the backend

If you'd rather use Netlify or Railway, tell me and I will add an alternate
workflow for that provider.

For local development the frontend expects the backend at `http://localhost:4000`.
Set `VITE_API_URL` at build time to point the production build at a different
API origin.

License: MIT (or choose your preferred license)

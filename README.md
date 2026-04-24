# GWM Station

This project is split into:

- `client/` for the Vite + React frontend
- `server/` for the Express backend

## Run locally

Open two Terminal windows.

Frontend:

```bash
cd /Users/kita/gwm-station/client
npm install
npm run dev
```

Backend:

```bash
cd /Users/kita/gwm-station/server
npm install
npm run dev
```

Ports:

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:4243`

## Deploy on Render

This project is ready to deploy as a single web service:

- Build command: `npm run build:production`
- Start command: `npm start`

The included [render.yaml](/Users/kita/gwm-station/render.yaml) configures that automatically.

## Deploy on Railway

This project is also set up for Railway as a single service using [railway.json](/Users/kita/gwm-station/railway.json).

Railway will:

- build with `npm run build:production`
- start with `npm start`
- health check `GET /api/health`

Quick Railway steps:

1. Push this project to GitHub.
2. In Railway, create a new project and choose `Deploy from GitHub repo`.
3. Select this repository.
4. Railway should detect the included `railway.json` automatically.
5. After the first deploy, open the generated Railway domain.

Notes:

- The Express server serves the built React app and the `/api/*` routes together.
- Railway provides the runtime `PORT`, and the server already uses it automatically.

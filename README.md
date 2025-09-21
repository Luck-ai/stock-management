## Stock Management App

This repository contains a simple stock management application with a FastAPI backend and a React frontend.

The backend is configured via environment variables. See `./.env.example` for the required keys.

Required environment variables
- `DATABASE_URL` (required): asyncpg URL for Postgres. Example: `postgresql+asyncpg://user:pass@host:5432/dbname`
- `JWT_SECRET` (required): secret used to sign JWT tokens
- `ACCESS_TOKEN_EXPIRE_MINUTES` (optional): token expiry in minutes (default: `60`)
- `SENDGRID_API_KEY` (optional): SendGrid key to enable outgoing email

To set up the environment variables, create a `.env` file in the `backend` folder based on the `.env.example` template and add the required keys.

Security
- Never commit real secrets. Use `backend/.env.example` as a template and keep `backend/.env` local and out of source control.

Running with Docker Compose (recommended for development)

1. From the repository root run:

   docker-compose up --build

   This starts three services: `db` (Postgres), `backend`, and `frontend`. The `backend` service is configured to use the compose `DATABASE_URL`.

2. Backend is available at:

   http://localhost:8000

3. Frontend is available at:

   http://localhost:3000


Running using the Windows PowerShell launcher (`launch.ps1`)

`launch.ps1` is a convenience script that:
- starts the Postgres DB container (docker compose up -d db)
- opens new PowerShell windows for the backend (uvicorn) and frontend (npm run dev)

From the repository root, run in PowerShell:

```powershell
.\launch.ps1
```

Notes about `launch.ps1`:
- The script sets `DATABASE_URL` for the backend to point at the local Postgres container it starts.
- If a `.venv` exists in the backend folder or repo root, `launch.ps1` will try to activate it before running the server.

A virtual environment is required for the launch script to work. If you don't have one, create it in the repo root:


1. Create and activate a virtualenv:

Use python version 3.9 or 3.10 for best compatibility.

2. Install dependencies:

```powershell
python -m pip install -r backend/requirements.txt
```




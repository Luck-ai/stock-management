This project uses a multi-stage Dockerfile for the Next.js frontend that produces a standalone build in /.next/standalone.

Problem
-------
During development the `docker-compose.yml` mounted the host `./frontend` directory onto `/app` in the running container. That bind-mount overwrote the files copied into the image (including the standalone server.js created by `next build`), causing the runtime error:

  Error: Cannot find module '/app/server.js'

Fix applied
-----------
Removed the bind-mount from `docker-compose.yml` for the `frontend` service so the built image's `/app` directory (with `server.js`) is preserved at runtime.

How to rebuild and run (production-like)
---------------------------------------
Use these commands to rebuild only the frontend image and bring the container up:

```powershell
# Rebuild and start the frontend only
docker compose up --build --force-recreate --remove-orphans frontend

# Or run detached
docker compose up --build --force-recreate --remove-orphans -d frontend
```

Development workflow
--------------------
If you want live code editing in development, don't use the production `docker-compose.yml` file with the removed bind-mount. Instead create a separate `docker-compose.dev.yml` that mounts `./frontend:/app` and maps node_modules, or run `npm run dev` locally.

Follow-ups
---------
- Consider adding a `docker-compose.override.yml` or `docker-compose.dev.yml` to make dev vs prod behavior explicit.
- Use smaller base images (node:18-alpine) pinned to a version and cache dependencies in the Dockerfile for faster rebuilds.

#!/usr/bin/env sh
# Require DATABASE_URL to be set externally (avoid embedding credentials in script)
if [ -z "${DATABASE_URL}" ]; then
	echo "ERROR: DATABASE_URL environment variable is not set. Please set it in your environment or .env file." >&2
	exit 1
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000

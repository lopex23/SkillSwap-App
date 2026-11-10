# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

SkillSwap is a university peer-tutoring platform (upper-semester students tutor newer students). The database is **Supabase (PostgreSQL)** and the backend is **Node.js + Express** using `pg` directly (no ORM, no Supabase JS client). There is no frontend, linter, or test suite yet.

- `backend/` — Express API (CommonJS)
- `database/skillswap_schema_supabase.sql` — the current schema, run manually in the Supabase SQL Editor
- `database/skillswap_schema.sql` — legacy MySQL version of the same model; not used anymore
- `diagrams/skillswap_ERD.png.png` — ER diagram, source of truth for the model (note the doubled extension; `README.md` links to this exact filename)
- `docs/database_description.md` — outdated English description that does **not** match the schema

Project documentation, API messages and schema identifiers are in **Spanish**; keep new code consistent with that.

## Backend commands (run inside `backend/`)

```
npm install
npm run dev       # node --watch src/server.js
npm start
npm run db:test   # connects with DATABASE_URL, prints DB info and the tables in public, then exits
```

Configuration lives in `backend/.env` (gitignored; template in `backend/.env.example`): `DATABASE_URL`, `DATABASE_SSL` (`false` only for a local Postgres), `PORT`. Use Supabase's **Session pooler** connection string (IPv4-compatible); the direct `db.<ref>.supabase.co` host is IPv6-only.

## Backend architecture

- `src/server.js` loads dotenv and starts the app; `src/app.js` builds the Express app (routes, 404, central error handler) without listening, so it can be imported by tests.
- `src/config/db.js` creates the single shared `pg` Pool and throws at require time if `DATABASE_URL` is missing. Import `{ query }` or `{ pool }` from it; always use parameterized queries (`$1`, `$2`).
- Routes go in `src/routes/*.routes.js` and are mounted under `/api` in `app.js`. Existing: `GET /api/health` and `GET /api/health/db` (returns 503 if the DB is unreachable).

## Database schema

The schema script is idempotent (`IF NOT EXISTS`) and wrapped in a transaction. Schema changes must be applied by hand in the Supabase SQL Editor — there is no migration tool.

- **RLS is enabled on every table with no policies.** This blocks Supabase's public REST API (anon key) from reading tables like `usuarios.password_hash`. The backend connects as `postgres` (table owner) so it bypasses RLS. Any new table must also get `ENABLE ROW LEVEL SECURITY`.
- PostgreSQL does not auto-index foreign keys; the script creates an index for each FK column not already covered by a PK. Do the same for new FKs.
- `usuarios` is the base identity table. Roles are many-to-many via `roles` + `usuario_rol`, so one user can be both student and tutor.
- `estudiantes` and `tutores` are subtype tables whose primary key **is** the `usuarios.id_usuario` FK (shared-PK inheritance).
- Tutoring flow: `solicitudes_tutoria` (student request for a `materia`) → `matching_tutor` (candidate tutors with `puntaje_match`) → `sesiones_tutoria` → `calificaciones` / `historial_tutorias` / `archivos_compartidos`. Sessions reach the student and subject only through the request.
- `usuarios.carrera` is free-text `VARCHAR`, not an FK to `carreras`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

SkillSwap is a university peer-tutoring platform (upper-semester students tutor newer students). The database is **Supabase (PostgreSQL)** and the backend is **Node.js + Express** using `pg` directly (no ORM, no Supabase JS client). The frontend is React + Vite in `frontend/`. There is no linter or automated test suite yet.

- `backend/` — Express API (CommonJS)
- `frontend/` — React SPA (ES modules) that consumes the API
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
npm run admin:create -- correo@ejemplo.com   # grants "administrador" to an already registered user
```

The only way to get an `administrador` is `admin:create`; the user must log in again afterwards because roles are read from the JWT, not the DB.

Configuration lives in `backend/.env` (gitignored; template in `backend/.env.example`): `DATABASE_URL`, `DATABASE_SSL` (`false` only for a local Postgres), `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`. Special characters in the DB password must be URL-encoded in `DATABASE_URL` (e.g. `#` → `%23`). Use Supabase's **Session pooler** connection string (IPv4-compatible); the direct `db.<ref>.supabase.co` host is IPv6-only.

## Frontend (`frontend/`, React 19 + Vite + React Router 7, plain JS + CSS)

```
npm install
npm run dev       # http://localhost:5173 — needs the backend running on :3000
npm run build     # outputs dist/ (gitignored)
```

- No CORS setup: `vite.config.js` proxies `/api` to `http://localhost:3000`, and `src/api/client.js` always calls relative `/api/...`. A production deploy needs either the same proxy or CORS on Express.
- `src/api/client.js#api` adds the JWT (stored in `localStorage` as `skillswap_token`), throws `ApiError { status, message, errores }`, and on a 401 with a token dispatches `skillswap:logout`, which `AuthContext` listens to.
- `AuthContext` restores the user via `/auth/me` on load; `RutaProtegida roles={[...]}` guards pages. Routes are declared in `App.jsx`; nav links per role in `components/Layout.jsx`.
- `hooks/useCarga(fn, deps)` is the data-loading pattern (`data/error/cargando/recargar`). Shared UI bits live in `components/ui.jsx`; all styles are in `src/index.css` (color tokens on `:root`, dark mode via `prefers-color-scheme`).
- Field errors from the API (`errores`) are shown next to inputs through `<Campo error=…>`.
- Branding: logo assets live in `frontend/public/` (`logo-icono.png` for the navbar/hero, `favicon.png`, full `logo.png`). The navbar renders the icon as an image plus the "SkillSwap" wordmark as styled text (`.marca-skill` / `.marca-swap` gradient) so it adapts to dark mode; in dark mode the icon sits on a light tile because its navy parts disappear on dark backgrounds. The palette is derived from the logo (`--marca-*` tokens; `--primario` navy, `--acento` orange, green for success) and every text/background pair was checked for WCAG AA (≥ 4.5:1) — keep that when changing colors.
- React Router 7 applies `navigate()` inside a transition. When a state change that affects `RutaProtegida`/redirects (login, logout) happens together with a navigation, wrap it in `startTransition` or guard the redirect (see `Layout.salir`, and the `!enviando` guards in `Login`/`Registro`), otherwise the guard's redirect wins.
- Client-side search ignores accents via `utils/formato.js#normalizar`; the backend `?q=` search (ILIKE) does not.
- Session times are entered in the browser's local time and sent as UTC ISO strings (`toISOString()`), which satisfies the backend's "ISO with timezone" rule.

## Backend architecture

- `src/server.js` loads dotenv and starts the app; `src/app.js` builds the Express app (routes, 404, central error handler) without listening, so it can be imported by tests.
- `src/config/db.js` creates the single shared `pg` Pool and throws at require time if `DATABASE_URL` is missing. Import `{ query }` or `{ pool }` from it; always use parameterized queries (`$1`, `$2`).
- Layering: `routes/*.routes.js` (mounted under `/api` in `app.js`) → `controllers/` (validation + HTTP) → `models/` (SQL). Express 5 forwards rejected promises from async handlers to the error handler, so handlers don't need try/catch.
- Expected errors: `throw new HttpError(status, message, details)` (`src/utils/httpError.js`); the handler in `app.js` returns `{ status: 'error', message, errores }`. Any other error (no status, or ≥500) is logged and returned as a generic 500 without details.
- Multi-table writes use a transaction on a client from `db.pool.connect()` (see `usuario.model.js#crear`). Models map Postgres errors to HTTP: `23505` (unique violation) and `23503` (FK in use on delete) → 409.
- Shared input helpers in `src/utils/validators.js`: `texto`, `parseId` (400 on non-positive-integer ids), `assertSinErrores` (400 with per-field `errores`).
- In routers, register literal paths (e.g. `/me/...`) before `/:id` so they aren't captured as ids.

## Auth

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. Passwords hashed with `bcryptjs`; sessions are stateless JWT (HS256) signed with `JWT_SECRET` (required, ≥32 chars, checked at startup in `src/utils/jwt.js`). Token `sub` is `id_usuario`, payload carries `roles`.
- Protect routes with `requireAuth` (sets `req.user = { id, roles }`) and `requireRole(...)` from `src/middlewares/auth.middleware.js`.
- Registering creates rows in `usuarios`, `usuario_rol` and the matching subtype table (`estudiantes`/`tutores`) atomically. Only `estudiante` and `tutor` are self-assignable; `administrador` is not.
- Emails are stored lowercase and unique case-insensitively (`uq_usuarios_email_lower`). Never return `password_hash` — use `Usuario.sinPassword`.

## API resources

- `GET /` lists the endpoints — keep it in sync in `app.js` when adding routes. `GET /api/health`, `GET /api/health/db` (503 if the DB is unreachable).
- `/api/materias`: reads are public (`?q=` searches name or code); create/update/delete require `administrador`. Codes are stored uppercase and unique.
- `/api/tutores`: listing (`?materia=ID`) and profiles require any logged-in user and never expose email. `/api/tutores/me/materias` and `/api/tutores/me/disponibilidad` require role `tutor` and act on `req.user.id`.
- A tutor's subjects live in `usuario_materia` (keyed by `id_usuario`, which equals `id_tutor`); `nivel` is `básico|intermedio|avanzado`. Posting an existing subject updates its level (upsert).
- `/api/solicitudes`: a student (`estudiante` role) creates a request for a subject; tutors with role `tutor` who teach that subject see it in `/disponibles` and one of them accepts it with `fecha_inicio`/`fecha_fin` (ISO 8601 **with timezone offset**, 30–240 min, future) and `modalidad` (`virtual|presencial`), which creates a `sesiones_tutoria` row (`programada`) and sets the request to `asignada`. States: `pendiente → asignada | cancelada`; only `pendiente` can be cancelled (by its owner).
- Matching runs once when the request is created (`solicitud.model.js#crear`) and stores up to 10 suggestions in `matching_tutor` with `puntaje_match` = 0.5·reputation/5 (no ratings counts as 3) + 0.3·level (avanzado 1, intermedio 0.66, básico 0.33) + 0.2·has availability. Tutors who add the subject later still see the request in `/disponibles`, but are not in its suggestions.
- Accepting locks the request row with `SELECT … FOR UPDATE` so concurrent accepts yield one 201 and one 409; it also rejects overlapping `programada` sessions of the same tutor. Unauthorized reads of a request return 404 (not 403) so existence isn't leaked.
- `/api/sesiones`: session states `programada → completada | cancelada`. Participants are the tutor (`se.id_tutor`) and the student, who is only reachable through the request (`solicitudes_tutoria.id_estudiante`). Non-participants get 404.
  - `completar` (assigned tutor, only once `fecha_inicio` has passed) atomically: increments `tutores.total_tutorias`, inserts into `historial_tutorias`, and upserts `progreso_estudiante.sesiones_completadas`.
  - `cancelar` (tutor or student): if the **student** cancels, the request becomes `cancelada`; if the **tutor** cancels, the request goes back to `pendiente` (unless the student already has another pending request for that subject) so another tutor can take it.
  - `calificar` (the student, only `completada`, once per session, 1–5) locks the tutor row and recomputes `reputacion_promedio` as `ROUND(AVG(puntuacion), 1)` over all their ratings. `GET /api/tutores/:id/calificaciones` returns ratings anonymously.
  - Transitions lock the session with `SELECT … FOR UPDATE OF se` (helpers `bloquear`/`enTransaccion` in `sesion.model.js`).
- Availability: `dia_semana` is stored as lowercase Spanish with accents (`Tutor.DIAS`; input accepted with or without accents), times as `HH:MM`. Overlapping slots on the same day are rejected with 409; adjacent ones are allowed.

## Database schema

The schema script is idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) and wrapped in a transaction; it also seeds the base roles (`estudiante`, `tutor`, `administrador`) and 23 sample subjects from several degree programs. There is no migration tool: add changes to this same file in an idempotent way and re-run the whole script (Supabase SQL Editor, or via `pg` with `DATABASE_URL`).

- **RLS is enabled on every table with no policies.** This blocks Supabase's public REST API (anon key) from reading tables like `usuarios.password_hash`. The backend connects as `postgres` (table owner) so it bypasses RLS. Any new table must also get `ENABLE ROW LEVEL SECURITY`.
- PostgreSQL does not auto-index foreign keys; the script creates an index for each FK column not already covered by a PK. Do the same for new FKs.
- `usuarios` is the base identity table. Roles are many-to-many via `roles` + `usuario_rol`, so one user can be both student and tutor.
- `estudiantes` and `tutores` are subtype tables whose primary key **is** the `usuarios.id_usuario` FK (shared-PK inheritance).
- Tutoring flow: `solicitudes_tutoria` (student request for a `materia`) → `matching_tutor` (candidate tutors with `puntaje_match`) → `sesiones_tutoria` → `calificaciones` / `historial_tutorias` / `archivos_compartidos`. Sessions reach the student and subject only through the request.
- `usuarios.carrera` is free-text `VARCHAR`, not an FK to `carreras`.

# WT Bind Editor

React 19 + TypeScript + Vite demo editor, with a Node.js 24 read-only API and PostgreSQL storage for the supplied `files/jetfighter.blk` export.

The editable UI still uses illustrative demo controls. A separate **Server file keybindings (read-only)** section calls the backend and displays the actual file's raw action IDs and typed properties. No game keycode translation, file upload, `.blk` editing, or `.blk` export is enabled. Existing browser demo edits remain in `wt-bind-editor-demo-v1`.

## Run with Docker

Requires Docker with Compose and a running Docker daemon.

Compose builds the API from `docker/backend.Dockerfile` and the React frontend from `docker/frontend.Dockerfile`. Both use the repository root as build context; PostgreSQL uses the official image.

```powershell
Copy-Item .env.example .env
# Set POSTGRES_PASSWORD and the matching password in DATABASE_URL in .env.
docker compose up --build -d
```

Open http://localhost:8080 and expand **Server file keybindings (read-only)**. The browser calls `/api/keybinds` through Nginx to the Node.js backend. PostgreSQL uses a named volume; the API seeds the supplied file on startup and reads it from the database for each keybindings request.

- Frontend: http://localhost:8080
- API health: http://localhost:3001/api/health
- API keybindings: http://localhost:3001/api/keybinds
- PostgreSQL: localhost:5432, database `wt_bind_editor`, user `wt`

Published ports bind to localhost. Compose passes PostgreSQL credentials through `PG*` environment variables, so passwords do not need URL encoding there. `DATABASE_URL` is used when running Node directly; URL-encode special characters in that URL. `.env` is ignored by Git and excluded from Docker builds. This is a local development setup without authentication, TLS, or user accounts.

```powershell
docker compose logs backend
docker compose down
```

`down` retains database contents. Changing the database password in `.env` does not change the credentials of an already initialized PostgreSQL volume; keep its original credentials or change them in PostgreSQL explicitly.

## Run the frontend and API locally

Requires Node.js **24.11+**, npm, and PostgreSQL (for example, the Compose database).

```powershell
npm ci
Copy-Item .env.example .env
# Set matching credentials in .env first.
docker compose up -d db
npm run dev:api
```

In a second terminal:

```powershell
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:3001`. The frontend demo remains usable if the backend is unavailable; the server section reports errors and offers reload. `npm run preview` previews the static build only and does not proxy the API; use Compose to check complete production routing.

`npm run start:api` starts without watching. The API accepts `DATABASE_URL` (or standard `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`), optional `PORT` (default 3001), and optional `BLK_FILE` (default supplied export). `BLK_FILE` is a trusted server configuration path, never a request parameter. In Docker, mount a different export read-only and set `BLK_FILE` to its container path to inspect another file. Unsupported input fails startup without replacing earlier database sources.

## API contract

`GET /api/health` runs `SELECT 1` and returns HTTP 200:

```json
{ "status": "ok", "database": "ok" }
```

If PostgreSQL is unavailable it returns HTTP 503 with `status` and `database` set to `unavailable`. This is a database readiness check.

`GET /api/keybinds` returns the configured export, read from PostgreSQL:

```json
{
  "source": "jetfighter.blk",
  "sha256": "<64-character SHA-256 of the original bytes>",
  "keybinds": [
    {
      "actionId": "ID_FLARES",
      "occurrence": 0,
      "properties": [
        { "name": "keyboardKey", "valueType": "i", "rawValue": "56" },
        { "name": "keyboardKey", "valueType": "i", "rawValue": "18" }
      ]
    }
  ]
}
```

The actual response contains all **27** hotkey blocks, in source order. Each block is one record, including empty blocks. Repeated action blocks and repeated properties remain separate and retain their order. `occurrence` counts each action's blocks from zero. `rawValue` retains the source representation; numeric game IDs are **not** browser `KeyboardEvent.code` values. The endpoint exposes explicit `controls/hotkeys` only: inherited defaults in `basePresetPaths` are not resolved, and axes/device settings are not interpreted.

Keybindings failures return HTTP 503 with a generic error; internal details are logged server-side. Unknown routes return 404; unsupported methods return 405. No endpoint accepts filesystem paths or changes bindings.

## Preservation and storage

The ordered syntax model keeps blocks, properties, value types, duplicates, and source offsets. Original UTF-8 text retains comments, whitespace, ordering and opaque unknown values. The `blk_sources` table retains the **original bytes** as `bytea`, keyed by SHA-256, with filename and import time. Startup is idempotent; a different source hash creates a new record and leaves previous originals intact. There is no automatic deletion or edit API.

The parser supports the textual subset in the supplied real export, with bounded nesting, comments and quoted strings. Unknown property types remain opaque. Invalid UTF-8, malformed supported scalar values, ambiguous hotkeys structures, quoted identifiers, and multiline strings are rejected. This is not a complete BLK implementation. Tests verify exact original-text retention and parse/original-text/parse equivalence; they do not establish safe modification or serialization of edited files. More representative exports and verified mappings are needed before adding import/edit/export.

## Checks

```powershell
npm test
npm run build
docker compose --env-file .env.example config --quiet
```

`npm test` uses Node's built-in test runner for fixture preservation, duplicate/empty hotkeys, unknown settings, comments/escaping/encoding, malformed input, HTTP responses and frontend API validation. A PostgreSQL integration test is skipped unless `TEST_DATABASE_URL` points to a disposable test database. It uses a temporary table and rolls back its transaction:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://wt:change-me-local-only@127.0.0.1:5432/wt_bind_editor'
npm test
Remove-Item Env:TEST_DATABASE_URL
```

`npm run build` type-checks frontend and backend and builds the frontend. There is no lint script. Full browser interaction and binding capture tests remain future work.

## Demo editor

- Categories, search, visual keyboard selection, and add/change/remove demo bindings.
- Exact-chord conflicts within the same category.
- Local persistence, reset, and **demo JSON** download. JSON is not `.blk` output.
- Browser/OS-reserved shortcuts may be inaccessible to capture. Broader accessibility and persistence validation work remains.

Implementation references: [node-postgres parameterized queries](https://node-postgres.com/features/queries) and [Docker Compose dependency health checks](https://docs.docker.com/compose/how-tos/startup-order/).

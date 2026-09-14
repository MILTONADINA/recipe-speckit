# API Reference

**Status:** reflects the integrated product on `dev` after Feature 1.

API mount path: `/recipeapi` (see `backend/server.js`).

## Endpoints

### Auth (no session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `POST` | `/recipeapi/users` | `200` | Create an account; also starts a session | Feature 1 |
| `POST` | `/recipeapi/login` | `200` | Authenticate via `Authorization: Basic base64(email:password)`; returns a session payload | Feature 1 |

### Auth (session required)

| Method | Path | Success | Purpose | Introduced |
|--------|------|---------|---------|------------|
| `POST` | `/recipeapi/logout` | `200` | Invalidate the current session token | Feature 1 |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated write routes: `Authorization: Bearer <token>` (encrypted session id; see [behavior.md](./behavior.md)).
- Login specifically uses `Authorization: Basic base64(email:password)`, not a JSON body.

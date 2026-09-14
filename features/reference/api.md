# API Reference

**Status:** reflects the integrated product on `dev` after Features 1–2.

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

### Recipes

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/recipeapi/recipes` | `Bearer` | Create a recipe | Feature 2 |
| `GET` | `/recipeapi/recipes` | No | List published recipes | Feature 2 |
| `GET` | `/recipeapi/recipes/user/:userId` | `Bearer` | List a user's own recipes | Feature 2 |
| `GET` | `/recipeapi/recipes/:id` | No | Get one recipe (returns a single-element array) with steps + ingredients | Feature 2 |
| `PUT` | `/recipeapi/recipes/:id` | `Bearer`, owner only | Update a recipe | Feature 2 |

### Recipe ingredients

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients` | `Bearer`, owner only | Add an ingredient to a recipe | Feature 2 |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | List a recipe's ingredients | Feature 2 |

### Recipe steps

| Method | Path | Auth | Purpose | Introduced |
|--------|------|------|---------|------------|
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps` | `Bearer` | Add a step to a recipe | Feature 2 |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | List a recipe's steps with their ingredients | Feature 2 |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }` — except a handful of documented exceptions in [behavior.md](./behavior.md) that return an HTML stack-trace body instead.
- Authenticated write routes: `Authorization: Bearer <token>` (encrypted session id; see [behavior.md](./behavior.md)).
- Login specifically uses `Authorization: Basic base64(email:password)`, not a JSON body.

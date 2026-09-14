# Behavior & Rules Reference

**Living snapshot** of product rules on integrated `dev` after Feature 1.

These files answer: *"What rules does the app enforce right now?"*
They do **not** authorize new scope; implement only from `features/feature-*.md`.

| File | Role |
|------|------|
| [api.md](./api.md) | Routes and payloads |
| [data-model.md](./data-model.md) | Tables, columns, and associations |
| **This file** | Ownership, sorting, validation, and UI rules |

---

## Authentication & Sessions

| Rule | Enforcement | Provenance |
|------|-------------|------------|
| Login uses **email + password** via `Authorization: Basic base64(email:password)` | `POST /recipeapi/login`; `UserServices.loginUser` | Feature 1 FR-005 |
| Passwords are hashed with scrypt + random salt, never returned by the API | `backend/app/authentication/crypto.js` | Feature 1 FR-002 |
| Duplicate email on registration is rejected | `POST /recipeapi/users` → `400 "This email is already in use."` | Feature 1 FR-003 |
| Sessions are encrypted (AES-256-GCM) session ids sent as `Authorization: Bearer <token>` | `backend/app/authentication/authentication.js` | Feature 1 FR-009 |
| Session lifetime is 1 day from creation | `Session.expirationDate` | Feature 1 FR-010 |
| Login always creates a new session (no reuse of an existing one) | `auth.controller.js#login` | Feature 1 FR-008 |
| Logout deletes the session row server-side | `POST /recipeapi/logout` | Feature 1 FR-011 |
| Protected writes require a valid, unexpired session; missing/expired token → `401` | `authenticateRoute` middleware | Feature 1 FR-012 |
| Reads (recipe/ingredient list, detail, steps, recipe ingredients) are public — no auth required, except `GET /recipeapi/recipes/user/:userId` | route definitions | Feature 1 FR-013 |
| Visiting the Login page always clears any stored session | `Login.vue` `onMounted` | Feature 1 FR-014 |
| A stored session persists across reloads on every other route | `MenuBar.vue` reads `localStorage` on mount; `apiClient` attaches the Bearer token on every request | Feature 1 FR-015 |

## Known defects (documented, not fixed — team decision)

| Defect | Where | Provenance |
|--------|-------|------------|
| Missing required field on `users` or `recipeIngredients` create crashes the Node process instead of returning `400` (both controllers declare `create` as `async`) | `user.controller.js`, `recipeIngredient.controller.js` — synchronous `throw` inside an `async` handler, no `try/catch`, no global Express error handler | Feature 1 Edge Cases |
| Missing required field on `recipes`, `recipeSteps`, or `ingredients` create returns a real `400` but as an HTML stack-trace body, not the app's usual `{ message }` JSON (these `create` handlers are non-`async`, so Express's default error handler catches the throw safely) | `recipe.controller.js`, `recipeStep.controller.js`, `ingredient.controller.js` | Feature 2 Edge Cases |
| A malformed `Bearer` token (not valid AES-256-GCM ciphertext) crashes the process in `decrypt()`/`authenticateRoute` instead of returning `401` | `backend/app/authentication/crypto.js`, `authentication.js` | Feature 1 Edge Cases |
| `users.email` has no database-level unique constraint | `user.model.js` | Feature 1 Edge Cases |

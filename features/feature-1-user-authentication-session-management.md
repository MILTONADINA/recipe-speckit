# Feature: User Authentication & Session Management

**Feature ID:** 1
**Branch pattern:** `feature/1-user-authentication-session-management`
**Status:** Ready
**Created:** 2026-09-14
**Input:** Users must be able to create an account, sign in, stay signed in, and sign out, so that recipe creation and management (Features 2+) can be scoped to an owner. This feature specs and tests the authentication/session code that already ships in `backend/app/authentication/`, `backend/app/controllers/auth.controller.js`, `backend/app/controllers/user.controller.js`, and `frontend/src/views/Login.vue` / `frontend/src/components/MenuBar.vue` — it does not introduce new behavior.

---

## User Stories

### US-1.1: Create an account
**As a** new user
**I want to** create an account with my first name, last name, email, and password
**So that** I can sign in and create my own recipes

**Priority:** P1
**Independent test:** Submit the Create Account dialog with valid data and confirm a `user` entry lands in `localStorage`
**Acceptance scenarios:** see ### US-1.1 under Acceptance Criteria

### US-1.2: Sign in
**As a** registered user
**I want to** sign in with my email and password
**So that** I can access recipe creation and management

**Priority:** P1
**Independent test:** Sign in with known credentials and receive a session token
**Acceptance scenarios:** see ### US-1.2 under Acceptance Criteria

### US-1.3: Stay signed in across page loads
**As a** signed-in user
**I want** my session to persist while I navigate the app
**So that** I do not have to sign in again for every screen or request

**Priority:** P1
**Independent test:** With a `user` entry already in `localStorage`, mount `MenuBar` on a non-login route and confirm it renders the signed-in state
**Acceptance scenarios:** see ### US-1.3 under Acceptance Criteria

### US-1.4: Sign out
**As a** signed-in user
**I want to** sign out from the account menu
**So that** no one else can use my session on a shared device

**Priority:** P2
**Independent test:** Trigger logout and confirm the server session is deleted and `localStorage` is cleared
**Acceptance scenarios:** see ### US-1.4 under Acceptance Criteria

### US-1.5: Block unauthenticated access to protected actions
**As the** application
**I want to** require a valid session for write operations (create/update/delete)
**So that** recipes, steps, ingredients, and recipe ingredients can only be modified by a signed-in user

**Priority:** P1
**Independent test:** Send a write request with no `Authorization` header and confirm the API returns `401`, while a matching read request without auth still succeeds
**Acceptance scenarios:** see ### US-1.5 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Registration (`POST /recipeapi/users`) MUST require `firstName`, `lastName`, `email`, and `password` in the JSON body.
- **FR-002**: Passwords MUST be hashed with `crypto.scrypt` (`N=16384, r=8, p=1`, 64-byte key) against a random 16-byte salt before persistence (`backend/app/authentication/crypto.js`); the raw password MUST never be returned by the API.
- **FR-003**: Registration MUST reject an email that already exists, returning `400` with `{ "message": "This email is already in use." }`.
- **FR-004**: A successful registration MUST create a session for the new user and respond with `{ email, firstName, lastName, id, token }`; the frontend MUST store this payload in `localStorage` under the key `user`.
- **FR-005**: Login (`POST /recipeapi/login`) MUST authenticate via an HTTP `Authorization: Basic base64(email:password)` header — not a JSON body.
- **FR-006**: Login MUST return `401` with `{ "message": "User not found!" }` for an email with no account, and `401` with `{ "message": "Invalid password!" }` for a known email with the wrong password (distinct messages for the two cases).
- **FR-007**: Login MUST return `401` with `{ "message": "Authentication required" }` when no `Authorization` header is present.
- **FR-008**: A successful login MUST create a new session row (no reuse of an existing session) and respond with `{ email, firstName, lastName, id, token }`.
- **FR-009**: Sessions MUST use an AES-256-GCM–encrypted session-id token: the session id is persisted server-side in the `sessions` table; the client sends the encrypted id as `Authorization: Bearer <token>`.
- **FR-010**: Session lifetime MUST be 1 day from creation (`expirationDate` set to creation time `+1` day).
- **FR-011**: Logout (`POST /recipeapi/logout`) MUST require a `Bearer` token, delete the matching session row, and respond `200` with `{ "message": "Logged out successfully." }`; a missing/non-`Bearer` `Authorization` header MUST respond `401` with `{ "message": "Authentication required" }`.
- **FR-012**: Protected write routes (create/update/delete on recipes, recipe steps, recipe ingredients, ingredients) MUST require `authenticateRoute`: no `Authorization` header → `401 { message: "Unauthorized! No Auth Header" }`; a well-formed token whose session no longer exists or has expired → `401 { message: "Unauthorized! Expired Token, Logout and Login again" }`; a valid, unexpired session → sets `req.user = { id: session.userId }` and proceeds.
- **FR-013**: `GET` reads of recipes, ingredients, recipe steps, and recipe ingredients MUST remain accessible without authentication (no `authenticateRoute` on read routes, except `GET /recipeapi/recipes/user/:userId`).
- **FR-014**: The Login page (route `/`) MUST unconditionally clear any existing `user` entry from `localStorage` when it mounts, ending any prior client-side session state on that navigation.
- **FR-015**: Outside the Login page, a stored `user` entry in `localStorage` MUST continue to be treated as signed-in across reloads/navigations — `MenuBar` reads it on every mount, and `apiClient` attaches its `token` as a `Bearer` header on every outgoing request — until logout, session expiry, or a revisit to the Login page clears it.
- **FR-016**: `MenuBar` MUST show a **Login** button when no user is stored, and an **Ingredients** button plus an avatar menu (initials, name, email, **Logout**) when a user is stored.
- **FR-017**: **Logout** MUST call `POST /recipeapi/logout` with the stored token (its outcome is not required to block the flow), then unconditionally remove the `localStorage` `user` entry, clear local auth state, and navigate to the Login page.
- **FR-018**: The Login page MUST also expose a **View Published Recipes** button that navigates directly to the Recipes list without requiring sign-in.

---

## Assumptions

- This feature specs and tests authentication/session code that ships already implemented in this starter kit; it does not authorize new implementation work.
- Features 2–5 (recipes, ingredients, publishing, PDF export) depend on the `req.user.id` identity and `Authorization` header mechanism established here.
- Identity is by **email** only — there is no username, role, or email-verification concept in this schema.
- One `localStorage` session per browser; no multi-tab invalidation beyond shared storage.

## Edge Cases

- **Known defect — not fixed, not automated (team decision):** submitting registration with `firstName`, `lastName`, `email`, or `password` missing (`=== undefined`) crashes the Node process instead of returning `400` — a synchronous `throw` inside an `async` controller with no `try/catch` and no global Express error handler (`backend/app/controllers/user.controller.js`). Reproduced empirically on 2026-09-14. The same pattern exists in every other `create` controller (`recipe`, `recipeStep`, `recipeIngredient`, `ingredient`) and is out of scope for this feature per team decision — no code changes.
- **Known defect — not fixed, not automated (team decision):** a `Bearer` token that is not valid AES-256-GCM ciphertext (e.g. a garbage string) crashes the process in `decrypt()`/`authenticateRoute`, rather than returning `401`. Reproduced empirically on 2026-09-14.
- An empty-string (not `undefined`) `firstName`/`lastName`/`email`/`password` on registration passes the `=== undefined` check and is accepted as-is — no additional non-empty validation exists.
- `users.email` has no database-level unique constraint (`user.model.js` has no `unique: true`); uniqueness is enforced only by the pre-insert lookup in the controller, which is not safe under concurrent requests.
- Reusing a `Bearer` token after logout: the token still decrypts successfully (it is well-formed), but its session row no longer exists, so protected routes return `401 { message: "Unauthorized! Expired Token, Logout and Login again" }`.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A user can create an account, sign in, reach `/recipes` and `/ingredients` while signed in, and sign out in one manual pass.
- **SC-003**: `npm test` passes for backend auth/session coverage and frontend Login/MenuBar coverage.

---

## Data Ownership & Isolation (foundation)

- Registration and login never return another user's password, salt, or session data.
- A session is looked up strictly by its (encrypted) id; `req.user.id` — derived server-side from the session's `userId` — is the identity every later feature uses for ownership checks.
- Recipe **reads** (list/browse) are intentionally public and unauthenticated by design (see Feature 4); only recipe/step/ingredient **writes** are scoped to `req.user.id`.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/recipeapi/users` | No | Create a new user account (also starts a session) |
| `POST` | `/recipeapi/login` | `Basic base64(email:password)` | Authenticate and return a session payload |
| `POST` | `/recipeapi/logout` | `Bearer <token>` | Invalidate the current session token |

**Register / login success response** (flat JSON, no envelope):
```json
{
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "id": 1,
  "token": "<encrypted-session-id>"
}
```

**Error response:** `{ "message": "Human-readable explanation." }` with the HTTP status noted in FR-003, FR-006, FR-007, FR-011, FR-012.

---

## Screen Requirements

### [View: Login Page] — route name `login`, path `/`
- One screen combining login and account creation (no separate `/register` route).
- **Login card:** `Email` and `Password` text fields (no client-side validation rules — the backend is the only validator), **Create Account** button (opens the dialog below) and **Login** button (submits `POST /recipeapi/login` via `UserServices.loginUser`).
- **Create Account dialog** (`v-dialog`, persistent): `First Name`, `Last Name`, `Email`, `Password` fields, **Close** and **Create Account** actions (submits `POST /recipeapi/users` via `UserServices.addUser`).
- **View Published Recipes** button (separate card below the login card) navigates to route `recipes` without requiring sign-in.
- Success/failure feedback via a `v-snackbar` (green on success: "Account created successfully!" / "Login successful!"; error color showing the server's `message` on failure).
- On mount, the page unconditionally clears any existing `localStorage` `user` entry (FR-014).

### [Component: MenuBar] — rendered on every route via `App.vue`
- Shows the OC logo (links to `recipes`), title "Recipes", and an always-visible **Recipes** button.
- No user stored → **Login** button (to route `login`).
- User stored → **Ingredients** button (to route `ingredients`) and an avatar menu showing initials, full name, email, and **Logout**.
- **Logout** calls `POST /recipeapi/logout`, then unconditionally clears `localStorage` `user` and local state, and navigates to `login` (FR-017).

---

## Key Entities

- **User**: registered account (first name, last name, email, password); will own recipes created in Feature 2.
- **Session**: server-side record tying an encrypted token to a user; expires 1 day after creation.

---

## Data Model Requirements

### `users` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `firstName` | STRING | Required |
| `lastName` | STRING | Required |
| `email` | STRING | Required; **not** database-unique — see Edge Cases |
| `password` | BLOB | Required; scrypt hash bytes only |
| `salt` | BLOB | Required |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `sessions` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `email` | STRING | Required; copy of the user's email at session creation |
| `expirationDate` | DATE | Required; creation time + 1 day |
| `userId` | INTEGER FK | Required, references `users.id`, `ON DELETE CASCADE` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

---

## Acceptance Criteria (Gherkin)

### US-1.1 — Create an account

#### Scenario: User creates an account with valid information
* **Given** no account exists with email `jane.doe@example.com`
* **When** I submit the Create Account dialog with first name `Jane`, last name `Doe`, email `jane.doe@example.com`, and password `secret123`
* **Then** the API returns `200` with a payload containing `email`, `firstName`, `lastName`, `id`, and `token`
* **And** the user is stored in the database with a scrypt password hash and salt (not the raw password)
* **And** my session is stored in `localStorage` under the key `user`
* **And** I am navigated to the Recipes page

#### Scenario: User attempts to register with an email that is already in use
* **Given** a user with email `jane.doe@example.com` already exists
* **When** I submit the Create Account dialog with email `jane.doe@example.com`
* **Then** the API returns `400` with `{ "message": "This email is already in use." }`
* **And** the error is shown in the snackbar

---

### US-1.2 — Sign in

#### Scenario: User signs in with valid credentials
* **Given** a registered user exists with email `jane.doe@example.com` and password `secret123`
* **When** I submit the Login form with that email and password
* **Then** the API returns `200` with a payload containing `email`, `firstName`, `lastName`, `id`, and `token`
* **And** a new session row is created in the database
* **And** my session is stored in `localStorage` under the key `user`
* **And** I am navigated to the Recipes page

#### Scenario: User signs in with an incorrect password
* **Given** a registered user exists with email `jane.doe@example.com`
* **When** I submit the Login form with that email and the wrong password
* **Then** the API returns `401` with `{ "message": "Invalid password!" }`
* **And** the error is shown in the snackbar
* **And** I remain on the Login page

#### Scenario: User signs in with an email that has no account
* **Given** no user exists with email `nobody@example.com`
* **When** I submit the Login form with that email
* **Then** the API returns `401` with `{ "message": "User not found!" }`

#### Scenario: User attempts to sign in with no Authorization header
* **Given** a `POST /recipeapi/login` request is sent with no `Authorization` header
* **Then** the API returns `401` with `{ "message": "Authentication required" }`

---

### US-1.3 — Stay signed in across page loads

#### Scenario: MenuBar shows the signed-in state for a stored session
* **Given** a valid `user` entry is present in `localStorage`
* **When** `MenuBar` mounts on any route other than Login
* **Then** it shows the **Ingredients** button and the avatar menu instead of the **Login** button

#### Scenario: Visiting the Login page clears an existing stored session
* **Given** a valid `user` entry is present in `localStorage`
* **When** I navigate to the Login page
* **Then** the `user` entry is removed from `localStorage`

#### Scenario: An authenticated request is sent with the stored session token
* **Given** I am signed in with a valid session token
* **When** the frontend makes an API request through `apiClient`
* **Then** the request includes header `Authorization: Bearer <token>`
* **And** a protected write request (e.g. `POST /recipeapi/recipes`) made with that token succeeds

---

### US-1.4 — Sign out

#### Scenario: User signs out from the account menu
* **Given** I am signed in and the avatar menu is open
* **When** I click **Logout**
* **Then** `POST /recipeapi/logout` is called with my session token
* **And** the `user` entry is removed from `localStorage`
* **And** I am navigated to the Login page

#### Scenario: A logged-out session token no longer authorizes protected requests
* **Given** I signed in and then logged out
* **When** I retry a protected write request (e.g. `POST /recipeapi/recipes`) using the same token
* **Then** the API returns `401` with `{ "message": "Unauthorized! Expired Token, Logout and Login again" }`

---

### US-1.5 — Block unauthenticated access to protected actions

#### Scenario: An unauthenticated write request is rejected
* **Given** no `Authorization` header is sent
* **When** I send `POST /recipeapi/recipes`
* **Then** the API returns `401` with `{ "message": "Unauthorized! No Auth Header" }`

#### Scenario: An expired session is rejected on a protected request
* **Given** a session row exists whose `expirationDate` is in the past
* **When** I send a protected write request with a token encrypting that session's id
* **Then** the API returns `401` with `{ "message": "Unauthorized! Expired Token, Logout and Login again" }`

#### Scenario: Unauthenticated read requests are not blocked
* **Given** no `Authorization` header is sent
* **When** I send `GET /recipeapi/recipes` or `GET /recipeapi/ingredients`
* **Then** the API returns `200` with the published/available records

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-1.1 | User creates an account with valid information | `backend/tests/auth.test.js` | `User creates an account with valid information` |
| US-1.1 | User attempts to register with an email that is already in use | `backend/tests/auth.test.js` | `User attempts to register with an email that is already in use` |
| US-1.2 | User signs in with valid credentials | `backend/tests/auth.test.js` | `User signs in with valid credentials` |
| US-1.2 | User signs in with an incorrect password | `backend/tests/auth.test.js` | `User signs in with an incorrect password` |
| US-1.2 | User signs in with an email that has no account | `backend/tests/auth.test.js` | `User signs in with an email that has no account` |
| US-1.2 | User attempts to sign in with no Authorization header | `backend/tests/auth.test.js` | `User attempts to sign in with no Authorization header` |
| US-1.3 | MenuBar shows the signed-in state for a stored session | `frontend/tests/MenuBar.test.js` | `MenuBar shows the signed-in state for a stored session` |
| US-1.3 | Visiting the Login page clears an existing stored session | `frontend/tests/Login.test.js` | `Visiting the Login page clears an existing stored session` |
| US-1.3 | An authenticated request is sent with the stored session token | `backend/tests/authenticate.test.js` | `An authenticated request is sent with the stored session token` |
| US-1.4 | User signs out from the account menu | `frontend/tests/MenuBar.test.js` | `User signs out from the account menu` |
| US-1.4 | A logged-out session token no longer authorizes protected requests | `backend/tests/auth.test.js` | `A logged-out session token no longer authorizes protected requests` |
| US-1.5 | An unauthenticated write request is rejected | `backend/tests/authenticate.test.js` | `An unauthenticated write request is rejected` |
| US-1.5 | An expired session is rejected on a protected request | `backend/tests/authenticate.test.js` | `An expired session is rejected on a protected request` |
| US-1.5 | Unauthenticated read requests are not blocked | `backend/tests/authenticate.test.js` | `Unauthenticated read requests are not blocked` |

---

## Agent implementation request

Copy when asking an AI assistant to implement this feature (`@` this file):

```text
Add automated tests for @features/feature-1-user-authentication-session-management.md only.
Follow its Test Coverage Map and @.cursor/rules/testing-standards.mdc.
Create or update only the test files listed for this feature (backend/tests and/or frontend/tests).
Do not add tests for other features. Map every Gherkin scenario in this file to an it() with the exact scenario title.
Do not change application code — this feature specs and tests already-shipped behavior (team decision).
Use backend/.env.test for API tests.
Update @features/reference/api.md, @features/reference/data-model.md, and @features/reference/behavior.md to match this spec.
```

**Reference updates for this feature:** `features/reference/data-model.md`, `features/reference/api.md`, `features/reference/behavior.md`

---

## Definition of Done

*   [x] Backend and frontend behavior matches this spec (**FR-001**–**FR-018** verified against the running app)
*   [x] **Success Criteria (SC-001–SC-003)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated
*   [x] `features/reference/api.md` updated
*   [x] `features/reference/behavior.md` updated

---

## Out of Scope

*   Password reset
*   Email verification
*   OAuth / social login
*   Role-based access control (no roles exist in this app)
*   Generic user profile viewing/editing/deleting (`GET/PUT/DELETE /recipeapi/users/:id` exist on the backend but are not wired to any screen or user story)
*   Frontend route guards / redirect-to-login on protected pages (not implemented — protection is API-only; see Edge Cases)
*   Fixing the crash-on-invalid-input defects described in Edge Cases — explicit team decision, no code changes
*   Recipe, ingredient, publishing, and PDF export screens (Features 2–5)

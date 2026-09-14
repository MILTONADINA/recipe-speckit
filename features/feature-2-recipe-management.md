# Feature: Recipe Management

**Feature ID:** 2
**Branch pattern:** `feature/2-recipe-management`
**Status:** Ready
**Created:** 2026-09-14
**Input:** Signed-in users must be able to create recipes and maintain their steps and ingredients, so the recipe catalog (and, later, publishing and PDF export) has content to work with. This feature specs and tests the already-shipped recipe/recipe-step/recipe-ingredient code in `backend/app/controllers/{recipe,recipeStep,recipeIngredient}.controller.js` and `frontend/src/views/{RecipeList,EditRecipe}.vue` / `frontend/src/components/RecipeCardComponent.vue` — it does not introduce new behavior.
**Depends on:** [Feature 1 — User Authentication & Session Management](feature-1-user-authentication-session-management.md)

---

## User Stories

### US-2.1: Create a recipe
**As a** signed-in user
**I want to** create a recipe with a name, description, servings, time, and publish flag
**So that** I can start building out its steps and ingredients

**Priority:** P1
**Independent test:** Submit the Add Recipe dialog while signed in and confirm the recipe appears in my recipe list
**Acceptance scenarios:** see ### US-2.1 under Acceptance Criteria

### US-2.2: View my recipes
**As a** signed-in user
**I want to** see only the recipes I created
**So that** I can find and manage my own content

**Priority:** P1
**Independent test:** Sign in as two different users, each with recipes, and confirm each user's list shows only their own
**Acceptance scenarios:** see ### US-2.2 under Acceptance Criteria

### US-2.3: Update recipe details
**As the** owner of a recipe
**I want to** edit its name, servings, time, description, and publish flag
**So that** I can keep it accurate and control whether it is public

**Priority:** P1
**Independent test:** Update a recipe I own and confirm the change persists; attempt to update a recipe I do not own and confirm it is rejected
**Acceptance scenarios:** see ### US-2.3 under Acceptance Criteria

### US-2.4: Manage recipe ingredients
**As the** owner of a recipe
**I want to** add, edit, and remove the ingredients it uses
**So that** the recipe records what it needs and in what quantity

**Priority:** P1
**Independent test:** Add an ingredient to a recipe I own and confirm it appears in the recipe's ingredient list
**Acceptance scenarios:** see ### US-2.4 under Acceptance Criteria

### US-2.5: Manage recipe steps
**As the** owner of a recipe
**I want to** add, edit, and remove its steps, and assign ingredients to a step
**So that** the recipe records how to make it

**Priority:** P1
**Independent test:** Add a step to a recipe I own and confirm it appears, in order, in the recipe's step list
**Acceptance scenarios:** see ### US-2.5 under Acceptance Criteria

### US-2.6: View recipe details with linked ingredients
**As a** user viewing a recipe
**I want** each step to show which ingredients it uses
**So that** I can follow the recipe without cross-referencing a separate list

**Priority:** P2
**Independent test:** Read a recipe's steps with ingredients and confirm each step lists its assigned ingredients
**Acceptance scenarios:** see ### US-2.6 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: Creating a recipe (`POST /recipeapi/recipes`) MUST require a valid `Authorization: Bearer` session token (Feature 1 FR-012); missing/invalid token → `401`.
- **FR-002**: Recipe creation MUST require `name`, `description`, `servings`, `time`, `isPublished`, and `userId` in the request body.
- **FR-003**: A successful recipe creation MUST return `200` with the created recipe (`id`, `name`, `description`, `servings`, `time`, `isPublished`, `userId`, timestamps).
- **FR-004**: The frontend MUST set `userId` on the create payload from the signed-in user's `localStorage` id before submitting; the **Add** button on the Recipes screen MUST only render when a user is signed in.
- **FR-005**: `GET /recipeapi/recipes/user/:userId` ("my recipes") MUST require authentication and return only recipes whose `userId` matches the requested id.
- **FR-006**: `GET /recipeapi/recipes` (used when signed out) MUST return only recipes where `isPublished` is `true`, with no authentication required (see Feature 4 for the signed-out browsing experience this powers).
- **FR-007**: `GET /recipeapi/recipes/:id` MUST return the matching recipe as a single-element **array** (`Recipe.findAll` is used, not `findByPk`), including its steps and each step's linked ingredients.
- **FR-008**: Updating a recipe (`PUT /recipeapi/recipes/:id`) MUST require authentication and MUST reject a request from anyone other than the recipe's owner with `404 { "message": "Cannot find Recipe with id=<id>." }`.
- **FR-009**: A recipe update by its owner MUST persist the submitted fields and return `200 { "message": "Recipe was updated successfully." }`.
- **FR-010**: Adding an ingredient to a recipe (`POST /recipeapi/recipes/:recipeId/recipeIngredients`) MUST require authentication and MUST reject a request from anyone other than the recipe's owner with `404 { "message": "Cannot find Recipe with id=<recipeId>." }`.
- **FR-011**: Recipe-ingredient creation MUST require `quantity`, `recipeId`, and `ingredientId`; `recipeStepId` is optional and defaults to `null` (an ingredient can belong to the recipe before being assigned to a specific step).
- **FR-012**: `GET /recipeapi/recipes/:recipeId/recipeIngredients` MUST return that recipe's ingredients, each including its linked `ingredient` record, without requiring authentication.
- **FR-013**: Adding a step to a recipe (`POST /recipeapi/recipes/:recipeId/recipeSteps`) MUST require authentication and MUST require `stepNumber`, `instruction`, and `recipeId` in the body (see Edge Cases — this endpoint does not check that the caller owns the recipe).
- **FR-014**: `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients` MUST return that recipe's steps ordered by `stepNumber`, each including its linked `recipeIngredient` rows (and their `ingredient`), without requiring authentication.
- **FR-015**: Assigning an existing recipe-ingredient to a step MUST be done by selecting it in the step dialog's ingredient picker and saving the step; saving MUST update each selected recipe-ingredient's `recipeStepId` to that step's id.
- **FR-016**: The Recipes screen (`RecipeList.vue`) MUST fetch and display only the signed-in user's own recipes when signed in (FR-005), and only published recipes when signed out (FR-006).
- **FR-017**: `EditRecipe.vue` MUST let a recipe's `name`, `servings`, `time`, `description`, and `isPublished` fields be edited and saved via **Update Recipe**.
- **FR-018**: `EditRecipe.vue` MUST let ingredients be added/edited/removed on its **Ingredients** card, and steps be added/edited/removed on its **Steps** card, each through its own dialog.
- **FR-019**: `RecipeCardComponent.vue` MUST let a signed-in user expand a recipe card to view its ingredients and steps, and navigate to `EditRecipe.vue` via a pencil icon (a PDF export icon is also shown when signed in — see Feature 5).

---

## Assumptions

- Feature 1 (auth/session) is on `dev`; `req.user.id` is available to every protected route used here.
- At least one `ingredient` row exists (created via Feature 3's Ingredient Catalog screen, or directly) before an ingredient can be linked to a recipe — this feature only **reads** the ingredient catalog, it does not create ingredients.
- This feature specs and tests already-shipped behavior; it does not authorize new implementation work (same posture as Feature 1).

## Edge Cases

- **Known defect — not fixed (team decision):** `POST /recipeapi/recipes` trusts `req.body.userId` directly instead of deriving it from `req.user.id`; a direct API call could submit a different `userId` and record the recipe as owned by someone else. Not reachable through the shipped UI (the frontend always sets it from the signed-in user).
- **Known defect — not fixed (team decision):** `DELETE /recipeapi/recipes/:id` has no ownership check — any authenticated user can delete any recipe. Reproduced empirically 2026-09-14 (a second user successfully deleted the first user's recipe). Not wired to any screen (`RecipeCardComponent.vue` has no delete control), so not reachable through the shipped UI.
- **Known defect — not fixed (team decision):** `recipeStep` create, update, and delete have **no** ownership check on the parent recipe at all — any authenticated user can add, edit, or delete steps on any recipe, including one they do not own. Reproduced empirically 2026-09-14.
- **Known defect — not fixed (team decision):** `recipeIngredient` update and delete have no ownership check (only `create` checks the parent recipe's owner, per FR-010). Reproduced empirically 2026-09-14.
- **Known defect — not fixed, not automated (team decision):** missing required fields on `POST /recipeapi/recipeIngredients` crash the Node process (`create` is declared `async`, the same bug class as Feature 1's registration crash — see Feature 1 Edge Cases). `POST /recipeapi/recipes` and `POST /recipeapi/recipes/:recipeId/recipeSteps` are declared as plain (non-`async`) functions, so a missing field there returns a real `400`, but as an HTML stack-trace body rather than the app's `{ message }` JSON convention — safe to trigger, but not promoted to a Gherkin scenario since the response shape does not match the documented API convention.
- `StepComponent.vue` and `RecipeServices.deleteRecipe()` exist in the codebase but are not imported/called anywhere in the app — dead code, out of scope.

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can create a recipe, add an ingredient and a step to it, and see it in their own recipe list, in one manual pass.
- **SC-003**: `npm test` passes for backend recipe/recipeStep/recipeIngredient coverage and frontend RecipeList coverage.

---

## Data Ownership & Isolation

Ownership enforcement is **inconsistent** across these endpoints — documented here exactly as shipped (team decision: no code changes):

| Action | Ownership enforced? | Effect for a non-owner |
|--------|:---:|---|
| Update recipe | ✅ Yes (FR-008) | `404` |
| Delete recipe | ❌ **No — known gap** | Succeeds |
| Create recipe step | ❌ **No — known gap** | Succeeds |
| Update recipe step | ❌ **No — known gap** | Succeeds |
| Delete recipe step | ❌ **No — known gap** | Succeeds |
| Create recipe ingredient | ✅ Yes (FR-010) | `404` |
| Update recipe ingredient | ❌ **No — known gap** | Succeeds |
| Delete recipe ingredient | ❌ **No — known gap** | Succeeds |

All "known gap" rows were reproduced empirically on 2026-09-14 against the running app (a second registered user successfully performed each action on the first user's recipe). Read endpoints (list published, list mine, get one, list steps/ingredients) are intentionally public or user-scoped per FR-005/FR-006/FR-012/FR-014.

---

## Key Entities

- **Recipe**: name, description, servings, time, publish flag; owned by one User (Feature 1); has many Recipe Steps and Recipe Ingredients.
- **Recipe Step**: an ordered instruction (`stepNumber`, `instruction`) within a Recipe; may have Recipe Ingredients assigned to it.
- **Recipe Ingredient**: a quantity of one Ingredient (Feature 3's catalog) used by a Recipe, optionally assigned to one of its Steps.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/recipeapi/recipes` | `Bearer` | Create a recipe (FR-001–FR-004) |
| `GET` | `/recipeapi/recipes` | No | List published recipes (FR-006) |
| `GET` | `/recipeapi/recipes/user/:userId` | `Bearer` | List a user's own recipes (FR-005) |
| `GET` | `/recipeapi/recipes/:id` | No | Get one recipe with steps + ingredients (FR-007) |
| `PUT` | `/recipeapi/recipes/:id` | `Bearer`, owner only | Update a recipe (FR-008–FR-009) |
| `POST` | `/recipeapi/recipes/:recipeId/recipeIngredients` | `Bearer`, owner only | Add an ingredient to a recipe (FR-010–FR-011) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | List a recipe's ingredients (FR-012) |
| `POST` | `/recipeapi/recipes/:recipeId/recipeSteps` | `Bearer` | Add a step to a recipe (FR-013) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | List a recipe's steps with their ingredients (FR-014) |

**Error response:** `{ "message": "Human-readable explanation." }` with the HTTP status noted per FR (except the two HTML-body cases noted in Edge Cases).

---

## Screen Requirements

### [View: Recipes] — route name `recipes`, `RecipeList.vue`
- Signed in: fetches and shows only the user's own recipes (FR-005); an **Add** button opens the Add Recipe dialog (Name, Servings, Time, Description, Publish switch → **Add Recipe** / **Close**).
- Signed out: fetches and shows only published recipes (FR-006); no **Add** button.
- Each recipe renders via `RecipeCardComponent`.

### [Component: RecipeCardComponent]
- Shows name, servings chip, time chip, and description; clicking the card expands/collapses a details panel listing its ingredients and steps (with each step's assigned ingredients as chips).
- Signed in only: a pencil icon navigates to `EditRecipe.vue` for that recipe (route `editRecipe`, param `id`); a PDF icon triggers `RecipeReports.generateRecipePDF` (Feature 5).

### [View: Edit Recipe] — route name `editRecipe`, path `/recipe/:id`, `EditRecipe.vue`
- **Recipe details card:** Name, Servings, Time, Description, Publish switch, **Update Recipe** button (FR-017).
- **Ingredients card:** lists the recipe's ingredients (quantity, unit, name, price); **Add** opens an Add/Edit Ingredient dialog (Quantity, Ingredient picker); each row has pencil (edit) and trash (delete) icons.
- **Steps card:** lists the recipe's steps as a table (number, instruction, assigned-ingredient chips); **Add** opens an Add/Edit Step dialog (Number, Instruction, multi-select of the recipe's existing ingredients to assign to this step); each row has pencil (edit) and trash (delete) icons.

---

## Data Model Requirements

### `recipes` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `description` | STRING | Required |
| `servings` | INTEGER | Required |
| `time` | INTEGER | Required |
| `isPublished` | BOOLEAN | Required |
| `userId` | INTEGER FK | References `users.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `recipeSteps` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `stepNumber` | INTEGER | Required |
| `instruction` | STRING(5000) | Required |
| `recipeId` | INTEGER FK | References `recipes.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `recipeIngredients` table
| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `quantity` | FLOAT | Required |
| `recipeId` | INTEGER FK | References `recipes.id`, nullable, `ON DELETE SET NULL` |
| `recipeStepId` | INTEGER FK | References `recipeSteps.id`, nullable, `ON DELETE SET NULL` — `null` until assigned to a step |
| `ingredientId` | INTEGER FK | References `ingredients.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### Associations
- `recipes` **hasMany** `recipeSteps` (as `recipeStep`); `recipeSteps` **belongsTo** `recipes` (as `recipe`).
- `recipes` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `recipes` (as `recipe`).
- `recipeSteps` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `recipeSteps` (as `recipeStep`).
- `ingredients` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `ingredients` (as `ingredient`).

---

## Acceptance Criteria (Gherkin)

### US-2.1 — Create a recipe

#### Scenario: Signed-in user creates a recipe with valid information
* **Given** I am signed in
* **When** I submit the Add Recipe dialog with name `Omelette`, description `Simple`, servings `2`, time `10`, and publish set to `true`
* **Then** the API returns `200` with the created recipe including `id`, `name`, `userId`
* **And** the recipe is stored in the database owned by my user id
* **And** it appears in my recipe list

#### Scenario: Recipe creation is rejected without authentication
* **Given** no `Authorization` header is sent
* **When** `POST /recipeapi/recipes` is submitted
* **Then** the API returns `401` with `{ "message": "Unauthorized! No Auth Header" }`

#### Scenario: The Add Recipe button is hidden when signed out
* **Given** no user is stored in `localStorage`
* **When** the Recipes screen renders
* **Then** no **Add** button is shown

---

### US-2.2 — View my recipes

#### Scenario: Signed-in user's recipe list includes only their own recipes
* **Given** user A has created a recipe and user B has created a different recipe
* **When** user A requests `GET /recipeapi/recipes/user/:userId` for their own id
* **Then** the response includes user A's recipe
* **And** the response does not include user B's recipe

---

### US-2.3 — Update recipe details

#### Scenario: Recipe owner updates their recipe
* **Given** I own a recipe
* **When** I submit **Update Recipe** with a new name
* **Then** the API returns `200` with `{ "message": "Recipe was updated successfully." }`
* **And** the recipe's stored name reflects the change

#### Scenario: A non-owner cannot update another user's recipe
* **Given** a recipe exists that I do not own
* **When** I send `PUT /recipeapi/recipes/:id` for that recipe
* **Then** the API returns `404` with `{ "message": "Cannot find Recipe with id=<id>." }`
* **And** the recipe's stored fields are unchanged

#### Scenario: Recipe update is rejected without authentication
* **Given** no `Authorization` header is sent
* **When** `PUT /recipeapi/recipes/:id` is submitted
* **Then** the API returns `401` with `{ "message": "Unauthorized! No Auth Header" }`

---

### US-2.4 — Manage recipe ingredients

#### Scenario: Recipe owner adds an ingredient to their recipe
* **Given** I own a recipe and an ingredient exists in the catalog
* **When** I submit the Add Ingredient dialog with a quantity and that ingredient
* **Then** the API returns `200` with the created recipe-ingredient
* **And** it appears in the recipe's ingredient list with `recipeStepId` of `null`

#### Scenario: A non-owner cannot add an ingredient to another user's recipe
* **Given** a recipe exists that I do not own
* **When** I send `POST /recipeapi/recipes/:recipeId/recipeIngredients` for that recipe with valid fields
* **Then** the API returns `404` with `{ "message": "Cannot find Recipe with id=<recipeId>." }`

#### Scenario: A recipe's ingredients are publicly readable
* **Given** no `Authorization` header is sent
* **When** I send `GET /recipeapi/recipes/:recipeId/recipeIngredients`
* **Then** the API returns `200` with that recipe's ingredients

---

### US-2.5 — Manage recipe steps

#### Scenario: Recipe owner adds a step to their recipe
* **Given** I own a recipe
* **When** I submit the Add Step dialog with a step number and instruction
* **Then** the API returns `200` with the created step
* **And** it appears in the recipe's step list, ordered by `stepNumber`

#### Scenario: A recipe's steps are publicly readable
* **Given** no `Authorization` header is sent
* **When** I send `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients`
* **Then** the API returns `200` with that recipe's steps

---

### US-2.6 — View recipe details with linked ingredients

#### Scenario: A recipe step's linked ingredients are included when reading recipe steps with ingredients
* **Given** a recipe has a step with one recipe-ingredient assigned to it (`recipeStepId` set to that step)
* **When** I send `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients`
* **Then** the returned step includes that recipe-ingredient, with its linked `ingredient` record

---

## Test Coverage Map

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-2.1 | Signed-in user creates a recipe with valid information | `backend/tests/recipe.test.js`, `frontend/tests/RecipeList.test.js` | `Signed-in user creates a recipe with valid information` |
| US-2.1 | Recipe creation is rejected without authentication | `backend/tests/recipe.test.js` | `Recipe creation is rejected without authentication` |
| US-2.1 | The Add Recipe button is hidden when signed out | `frontend/tests/RecipeList.test.js` | `The Add Recipe button is hidden when signed out` |
| US-2.2 | Signed-in user's recipe list includes only their own recipes | `backend/tests/recipe.test.js` | `Signed-in user's recipe list includes only their own recipes` |
| US-2.3 | Recipe owner updates their recipe | `backend/tests/recipe.test.js` | `Recipe owner updates their recipe` |
| US-2.3 | A non-owner cannot update another user's recipe | `backend/tests/recipe.test.js` | `A non-owner cannot update another user's recipe` |
| US-2.3 | Recipe update is rejected without authentication | `backend/tests/recipe.test.js` | `Recipe update is rejected without authentication` |
| US-2.4 | Recipe owner adds an ingredient to their recipe | `backend/tests/recipeIngredient.test.js` | `Recipe owner adds an ingredient to their recipe` |
| US-2.4 | A non-owner cannot add an ingredient to another user's recipe | `backend/tests/recipeIngredient.test.js` | `A non-owner cannot add an ingredient to another user's recipe` |
| US-2.4 | A recipe's ingredients are publicly readable | `backend/tests/recipeIngredient.test.js` | `A recipe's ingredients are publicly readable` |
| US-2.5 | Recipe owner adds a step to their recipe | `backend/tests/recipeStep.test.js` | `Recipe owner adds a step to their recipe` |
| US-2.5 | A recipe's steps are publicly readable | `backend/tests/recipeStep.test.js` | `A recipe's steps are publicly readable` |
| US-2.6 | A recipe step's linked ingredients are included when reading recipe steps with ingredients | `backend/tests/recipeStep.test.js` | `A recipe step's linked ingredients are included when reading recipe steps with ingredients` |

---

## Agent implementation request

Copy when asking an AI assistant to implement this feature (`@` this file):

```text
Add automated tests for @features/feature-2-recipe-management.md only.
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

*   [x] Backend and frontend behavior matches this spec (**FR-001**–**FR-019** verified against the running app)
*   [x] **Success Criteria (SC-001–SC-003)** met
*   [x] All mapped tests pass (`npm test`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated
*   [x] `features/reference/api.md` updated
*   [x] `features/reference/behavior.md` updated

---

## Out of Scope

*   Ingredient catalog management — creating/editing/deleting `ingredient` rows (Feature 3)
*   Public/signed-out recipe browsing UX (Feature 4) — this feature covers the signed-in "my recipes" management surface only
*   Recipe PDF export (Feature 5)
*   Fixing the ownership/crash defects described in Edge Cases and Data Ownership & Isolation — explicit team decision, no code changes
*   `StepComponent.vue` and `RecipeServices.deleteRecipe()` — dead code, not wired to any screen

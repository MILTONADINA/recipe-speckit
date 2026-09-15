# Feature: Ingredient Catalog

**Feature ID:** 3
**Branch pattern:** `feature/3-ingredient-catalog`
**Status:** Draft
**Created:** 2026-09-14
**Input:** Existing Recipe application and source code
**Depends on:** [Feature 1 — User Authentication & Session Management](feature-1-user-authentication-session-management.md)

---

## User Stories

### US-3.1: View the Ingredient Catalog
**As a** user
**I want to** view the shared ingredient catalog
**So that** I can see the ingredients available in the Recipe application

**Priority:** P1
**Independent test:** Open the Ingredients page and confirm the catalog displays name, unit, and price per unit
**Acceptance scenarios:** see ### US-3.1 under Acceptance Criteria

### US-3.2: Add an Ingredient
**As an** authenticated user
**I want to** add an ingredient to the shared catalog
**So that** it can be used by the Recipe application

**Priority:** P1
**Independent test:** Submit the Add Ingredient form while authenticated and confirm the ingredient appears in the catalog
**Acceptance scenarios:** see ### US-3.2 under Acceptance Criteria

### US-3.3: Edit an Ingredient
**As an** authenticated user
**I want to** edit an existing ingredient
**So that** its catalog information can be corrected or updated

**Priority:** P1
**Independent test:** Open an existing ingredient for editing, save a change, and confirm it appears in the catalog
**Acceptance scenarios:** see ### US-3.3 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide a shared ingredient catalog.
- **FR-002**: The catalog MUST display each ingredient's name, unit, and price per unit.
- **FR-003**: The ingredient list MUST be returned in ascending order by ingredient name.
- **FR-004**: Reading the ingredient catalog MUST not require authentication.
- **FR-005**: The ingredient catalog MUST not be isolated by user. Ingredients are shared across the application.
- **FR-006**: An authenticated user MUST be able to add an ingredient.
- **FR-007**: The Add Ingredient form MUST provide fields for Name, Unit, and Price Per Unit.
- **FR-008**: The Unit field MUST use the application's predefined unit list in the user interface.
- **FR-009**: Creating an ingredient MUST require the request to include name, unit, and pricePerUnit.
- **FR-010**: Successfully created ingredients MUST be stored in the shared ingredient catalog.
- **FR-011**: A newly created ingredient MUST appear in the Ingredient Catalog after the catalog is refreshed.
- **FR-012**: An unauthenticated request to create an ingredient MUST be rejected.
- **FR-013**: Ingredient names are not required to be unique by the current data model.
- **FR-014**: An authenticated user MUST be able to edit an existing ingredient.
- **FR-015**: Selecting the edit action MUST open the Edit Ingredient form.
- **FR-016**: The Edit Ingredient form MUST be pre-populated with the ingredient's current Name, Unit, and Price Per Unit values.
- **FR-017**: The user MUST be able to update the ingredient's name.
- **FR-018**: The user MUST be able to update the ingredient's unit.
- **FR-019**: The user MUST be able to update the ingredient's price per unit.
- **FR-020**: Successfully saved changes MUST be reflected in the Ingredient Catalog.
- **FR-021**: An unauthenticated API request to update an ingredient MUST be rejected.
- **FR-022**: Because the catalog is shared, an authenticated user is not limited to editing ingredients that they created.

---

## Assumptions

- The Ingredient Catalog is shared across all users.
- Ingredients are not owned by individual users.
- Viewing ingredient data is public at the API level.
- Creating and updating ingredient data requires authentication.
- The user interface supplies a predefined list of units.
- The backend stores the unit as a string and does not enforce the frontend unit list.
- Duplicate ingredient names are allowed by the current data model.
- Recipe Management may reference Ingredient records through recipe-ingredient associations owned by Feature 2.

## Edge Cases

- The Add Ingredient form does not currently use Vuetify validation rules to block invalid submissions.
- Name and Unit appear required in the form, but the UI does not currently enforce those fields with `:rules`.
- Price Per Unit is not marked required by the UI even though the create controller expects `pricePerUnit` to be present.
- The backend create validation checks whether values are `undefined`.
- Empty strings and `null` may pass some of the current backend checks.
- Update requests currently do not have the same validation checks as create requests.
- A completely untouched Add Ingredient form can result in a failed create request because undefined values can be omitted from the JSON request.
- The current backend create error can return an HTTP 400 response with an HTML error body instead of a normal JSON error message.
- After a successful edit, the current UI can display the incorrect message `undefined updated successfully!` because of how the Vue ref is referenced.
- The current Add dialog contains an existing ingredient-id reset issue.
- The edit pencil can remain visible even when a user is signed out, although the backend rejects unauthenticated update requests.
- These are existing defects and edge cases. They are not requirements to reproduce or expand.

## Success Criteria

- **SC-001**: Users can retrieve and view the shared ingredient catalog.
- **SC-002**: Catalog entries display Name, Unit, and Price Per Unit.
- **SC-003**: An authenticated user can successfully create a valid ingredient.
- **SC-004**: A newly created ingredient becomes visible in the catalog.
- **SC-005**: An authenticated user can open an ingredient and see its existing values.
- **SC-006**: An authenticated user can modify and save ingredient information.
- **SC-007**: Saved ingredient changes appear in the catalog.
- **SC-008**: Unauthenticated create and update API requests are rejected.
- **SC-009**: Ingredient data remains shared and is not isolated by user.

---

## Data Ownership & Isolation

Ingredients are a **shared global catalog**. There is no `userId` on `ingredients`, so Feature 1's per-user ownership rules do not apply here.

| Rule | Requirement |
|------|-------------|
| **Read scope** | `GET /recipeapi/ingredients` and `GET /recipeapi/ingredients/:id` return catalog rows with no user filter and no authentication (FR-004, FR-005) |
| **Write scope** | Any authenticated user may update any ingredient (`PUT /recipeapi/ingredients/:id`); there is no owner check (FR-022) |
| **Create scope** | New rows are global catalog records, not owned by `req.user.id` |
| **Cross-user access** | Not applicable — ingredients have no owner, so there is no "another user's ingredient" `404` |
| **UI scope** | The Ingredients page displays the full shared catalog returned by `GET /recipeapi/ingredients` |
| **Implementation** | Writes use Feature 1 `authenticateRoute` only; no ingredient authorization helper |

---

## Key Entities

- **Ingredient**: one reusable ingredient in the application's shared ingredient catalog (name, unit, price per unit); global rather than user-owned.
- **RecipeIngredient**: the association between recipes and ingredients. This association already participates in Recipe Management and is not created or managed as a separate Ingredient Catalog user story in this feature.

---

## API Requirements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/ingredients` | No | List all catalog ingredients ordered by `name` ASC (FR-001, FR-003, FR-004) |
| `GET` | `/recipeapi/ingredients/:id` | No | Get one catalog ingredient by id (FR-004) |
| `POST` | `/recipeapi/ingredients` | `Bearer` | Create a catalog ingredient (FR-006, FR-009–FR-012) |
| `PUT` | `/recipeapi/ingredients/:id` | `Bearer` | Update a catalog ingredient (FR-014, FR-017–FR-022) |

`DELETE /recipeapi/ingredients/:id` and `DELETE /recipeapi/ingredients/` exist on the backend but are **not** Feature 3 user stories and are not wired to the Ingredient Catalog screen (see Out of Scope).

**Create request body:**
```json
{
  "name": "Flour",
  "unit": "cup",
  "pricePerUnit": 0.25
}
```

**Create success response** (`200`, flat JSON, no envelope): the created ingredient, including `id`, `name`, `unit`, `pricePerUnit`, and timestamps.

**Update success response** (`200`):
```json
{ "message": "Ingredient was updated successfully." }
```

**Unauthenticated write:** `401 { "message": "Unauthorized! No Auth Header" }` (Feature 1 FR-012).

**Create with a missing `name`, `unit`, or `pricePerUnit` (`=== undefined`):** the backend rejects the request and does not store a row (FR-009). The current error body is HTML, not `{ "message": "..." }` — see Edge Cases; do not treat that HTML shape as required product behavior.

---

## Screen Requirements

### [View: Ingredients] — route name `ingredients`, path `/ingredients`, `IngredientList.vue`

- Heading **Ingredients**.
- Table columns: **Name**, **Unit**, **Price Per Unit**, **Actions**. Price Per Unit is displayed with a `$` prefix.
- On mount, the page loads the shared catalog via `GET /recipeapi/ingredients`.
- Signed in (`localStorage` `user` is not null): an **Add** button opens the Add Ingredient dialog.
- Signed out: the **Add** button is not shown.
- Each row has a pencil icon (`mdi-pencil`) that opens the Edit Ingredient dialog with that row's current Name, Unit, and Price Per Unit. There is no delete control on this screen.
- The page has no Vue router guard (Feature 1: API-only protection). Signed-in users reach it from MenuBar **Ingredients** (Feature 1 FR-016).

**Add / Edit dialog** (shared `v-dialog`, persistent):
- Title **Add Ingredient** or **Edit Ingredient**.
- Fields: **Name** (text), **Unit** (`v-select` from the predefined list below), **Price Per Unit** (number).
- Actions: **Close**, and **Add Ingredient** or **Update Ingredient**.
- The UI does not use Vuetify `:rules` to block submit (see Edge Cases).

**Predefined Unit list** (frontend only; stored as a STRING, not enforced by the API):

`cup`, `gallon`, `gram`, `kilogram`, `liter`, `milliliter`, `ounce`, `pint`, `piece`, `pound`, `quart`, `tablespoon`, `teaspoon`, `unit`

**Feedback:** `v-snackbar` for success/error. Existing snackbar/id-reset defects are documented in Edge Cases and are not required behavior.

---

## Data Model Requirements

### `ingredients` table

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required; `allowNull: false` |
| `unit` | STRING | Required; `allowNull: false` |
| `pricePerUnit` | DECIMAL(10,2) | Database column currently permits null |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### Data Rules

- There is no `userId` column on Ingredient.
- Ingredient records belong to the global/shared catalog.
- Ingredient names do not have a uniqueness constraint.
- Unit is stored as a string instead of an ENUM.
- The database does not enforce the predefined frontend unit list.
- The Ingredient model has a `hasMany` association with `recipeIngredients`.

### Associations

- `ingredients` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `ingredients` (as `ingredient`). Recipe-ingredient rows and their screens belong to [Feature 2](./feature-2-recipe-management.md).

---

## Acceptance Criteria (Gherkin)

### US-3.1 — View the Ingredient Catalog

#### Scenario: View the ingredient catalog
* **Given** ingredients exist in the shared ingredient catalog
* **When** a user opens the Ingredients page
* **Then** the system displays the available ingredients
* **And** each ingredient shows its name
* **And** each ingredient shows its unit
* **And** each ingredient shows its price per unit

#### Scenario: View ingredients without authentication
* **Given** a user is not authenticated
* **When** the ingredient catalog is requested
* **Then** the system allows the ingredient data to be read

### US-3.2 — Add an Ingredient

#### Scenario: Add an ingredient successfully
* **Given** an authenticated user is viewing the Ingredient Catalog
* **When** the user enters a name
* **And** selects a unit
* **And** enters a price per unit
* **And** submits the Add Ingredient form
* **Then** the ingredient is created in the shared ingredient catalog
* **And** the ingredient appears in the ingredient list
* **And** the displayed ingredient contains the saved name, unit, and price per unit

#### Scenario: Reject an unauthenticated ingredient creation request
* **Given** a user is not authenticated
* **When** the user sends a request to create an ingredient
* **Then** the system rejects the request as unauthorized
* **And** the ingredient is not created

#### Scenario: Reject creation when a required value is omitted
* **Given** an authenticated user is creating an ingredient
* **When** the create request omits the name, unit, or price per unit value
* **Then** the backend rejects the create request
* **And** no new ingredient is stored

### US-3.3 — Edit an Ingredient

#### Scenario: Open an ingredient for editing
* **Given** an ingredient exists in the shared ingredient catalog
* **When** an authenticated user selects the ingredient's edit action
* **Then** the Edit Ingredient form opens
* **And** the current name is displayed
* **And** the current unit is displayed
* **And** the current price per unit is displayed

#### Scenario: Update an ingredient successfully
* **Given** an authenticated user has opened an existing ingredient for editing
* **When** the user changes one or more editable ingredient values
* **And** the user saves the changes
* **Then** the ingredient is updated
* **And** the saved values appear in the Ingredient Catalog

#### Scenario: Reject an unauthenticated ingredient update request
* **Given** a user is not authenticated
* **When** the user sends a request to update an ingredient
* **Then** the system rejects the request as unauthorized

---

## Test Coverage Map

Each scenario above must map to at least one automated test.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-3.1 | View the ingredient catalog | `frontend/tests/IngredientList.test.js` | `View the ingredient catalog` |
| US-3.1 | View ingredients without authentication | `backend/tests/ingredient.test.js` | `View ingredients without authentication` |
| US-3.2 | Add an ingredient successfully | `backend/tests/ingredient.test.js`, `frontend/tests/IngredientList.test.js` | `Add an ingredient successfully` |
| US-3.2 | Reject an unauthenticated ingredient creation request | `backend/tests/ingredient.test.js` | `Reject an unauthenticated ingredient creation request` |
| US-3.2 | Reject creation when a required value is omitted | `backend/tests/ingredient.test.js` | `Reject creation when a required value is omitted` |
| US-3.3 | Open an ingredient for editing | `frontend/tests/IngredientList.test.js` | `Open an ingredient for editing` |
| US-3.3 | Update an ingredient successfully | `backend/tests/ingredient.test.js`, `frontend/tests/IngredientList.test.js` | `Update an ingredient successfully` |
| US-3.3 | Reject an unauthenticated ingredient update request | `backend/tests/ingredient.test.js` | `Reject an unauthenticated ingredient update request` |

---

## Agent implementation request

Copy when asking an AI assistant to implement this feature (`@` this file):

```text
Add automated tests for @features/feature-3-ingredient-catalog.md only.
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

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-022** satisfied)
*   [ ] **Success Criteria (SC-001–SC-009)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Adding an ingredient delete button to the Ingredient Catalog screen.
*   Ingredient catalog **delete** API (`DELETE /recipeapi/ingredients/:id`, `DELETE /recipeapi/ingredients/`) — those routes exist on the backend but are not a Feature 3 user story and are not covered by this feature's tests.
*   Changing Recipe Management behavior owned by [Feature 2](./feature-2-recipe-management.md).
*   Recipe PDF export (Feature 5).
*   User authentication implementation itself, which is owned by [Feature 1](./feature-1-user-authentication-session-management.md).
*   Adding ingredient ownership per user.
*   Adding ingredient-name uniqueness.
*   Changing the unit database field into an ENUM.
*   Fixing unrelated existing UI defects unless a later explicit requirement requires those fixes.
*   Fixing the Edge Cases defects (HTML 400 create body, snackbar `undefined updated successfully!`, add-dialog id reset, unsigned-in pencil) — explicit team decision, no code changes.

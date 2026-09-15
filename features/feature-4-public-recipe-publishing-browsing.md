# Feature: Public Recipe Publishing & Browsing

**Feature ID:** 4
**Branch pattern:** `feature/4-public-recipe-publishing-browsing`
**Status:** Ready
**Created:** 2026-09-14
**Input:** Existing Recipe application and source code
**Depends on:** [Feature 2 — Recipe Management](feature-2-recipe-management.md)

---

## User Stories

### US-4.1: Browse published recipes while signed out
**As a** signed-out visitor
**I want to** browse recipes that have been published
**So that** I can discover recipes without creating an account or signing in

**Priority:** P1
**Independent test:** Open the Recipes page while signed out and confirm published recipes show name, servings, time to make, and description
**Acceptance scenarios:** see ### US-4.1 under Acceptance Criteria

### US-4.2: Do not show unpublished recipes in the public catalog
**As a** signed-out visitor
**I want to** see only published recipes
**So that** recipes that have not been published are not shown in the public catalog

**Priority:** P1
**Independent test:** Open the Recipes page while signed out with one published recipe and one unpublished recipe and confirm only the published recipe is displayed
**Acceptance scenarios:** see ### US-4.2 under Acceptance Criteria

### US-4.3: Open a published recipe's details while signed out
**As a** signed-out visitor
**I want to** open a published recipe
**So that** I can view the recipe's available details, ingredients, and steps

**Priority:** P1
**Independent test:** Open a published recipe from the public catalog while signed out and confirm Ingredients and Recipe Steps sections are displayed
**Acceptance scenarios:** see ### US-4.3 under Acceptance Criteria

### US-4.4: Browse public recipes without owner controls
**As a** signed-out visitor
**I want to** browse published recipes without owner-only controls
**So that** I can view recipes without being able to modify them

**Priority:** P1
**Independent test:** Open the Recipes page while signed out and confirm Add, edit pencil, and PDF controls are not shown
**Acceptance scenarios:** see ### US-4.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST allow a signed-out visitor to access the public Recipes view.
- **FR-002**: The public Recipes view MUST retrieve recipes from the existing public recipe API.
- **FR-003**: The public Recipes view MUST display only recipes whose publication state is published.
- **FR-004**: Each published recipe card MUST display its name.
- **FR-005**: Each published recipe card MUST display its number of servings.
- **FR-006**: Each published recipe card MUST display its time to make.
- **FR-007**: Each published recipe card MUST display its description.
- **FR-008**: The public recipe catalog MUST filter recipes by the existing publication field.
- **FR-009**: Recipes whose publication state is false MUST not appear in the signed-out recipe catalog.
- **FR-010**: Recipes whose publication state is true MUST be eligible to appear in the signed-out recipe catalog.
- **FR-011**: Feature 4 MUST use the publication state created and maintained by Feature 2 rather than redefining recipe publishing behavior.
- **FR-012**: A signed-out visitor MUST be able to open or expand a published recipe from the public catalog.
- **FR-013**: The published recipe detail view MUST display the recipe's basic information.
- **FR-014**: The published recipe detail view MUST include an Ingredients section.
- **FR-015**: The published recipe detail view MUST include a Recipe Steps section.
- **FR-016**: Recipe steps MUST support displaying the step number, instruction, and associated ingredients when those values exist.
- **FR-017**: Public recipe details MUST use the existing recipe, ingredient, and recipe-step data supplied by the Recipe application.
- **FR-018**: The signed-out public recipe view MUST not display the Add Recipe control.
- **FR-019**: The signed-out public recipe view MUST not display the recipe edit pencil.
- **FR-020**: The signed-out public recipe view MUST not display the PDF control.
- **FR-021**: The public navigation MUST provide a Login option for a signed-out visitor.
- **FR-022**: Feature 4 MUST not provide recipe creation, editing, publishing, unpublishing, or PDF-export ownership behavior.

---

## Assumptions

- Feature 2 owns recipe creation, editing, and the recipe publication field.
- Feature 4 consumes the publication state already managed by Feature 2.
- The signed-out Recipes page is the public recipe catalog.
- A recipe is included in the public catalog when its existing publication field is set to published.
- Published recipes may contain ingredients and recipe steps supplied by existing Recipe Management behavior.
- Feature 4 does not introduce a new publication workflow or a new recipe data model.
- Signed-in owner behavior is not redefined by this feature.

## Edge Cases

- If there are no published recipes, the public Recipes page may display an empty list.
- Published recipes may have no ingredients.
- Published recipes may have no recipe steps.
- Recipe steps may therefore display only the table headings with no rows.
- The signed-out catalog filters the recipe list using the existing `isPublished` state.
- The current shipped backend has an existing information-leak behavior where directly requesting an individual recipe by ID may return an unpublished recipe.
- That direct-ID behavior is documented as an existing defect and is not a Feature 4 product requirement.
- Feature 4 does not add a requirement to redesign or repair that existing endpoint unless a later implementation requirement explicitly calls for it.
- Publishing and unpublishing through the recipe editor belong to Feature 2 and are not re-owned by Feature 4.

## Success Criteria

- **SC-001**: A signed-out visitor can open the public Recipes page.
- **SC-002**: Published recipes appear in the signed-out recipe catalog.
- **SC-003**: Unpublished recipes do not appear in the signed-out recipe catalog.
- **SC-004**: Public recipe cards show name, servings, time to make, and description.
- **SC-005**: A signed-out visitor can open a published recipe's displayed details.
- **SC-006**: Public recipe details provide Ingredients and Recipe Steps sections.
- **SC-007**: Signed-out visitors are not shown Add Recipe controls.
- **SC-008**: Signed-out visitors are not shown recipe edit controls.
- **SC-009**: Signed-out visitors are not shown the PDF control.
- **SC-010**: The public recipe experience remains read-only from the user's point of view.

---

## Data Ownership & Isolation

Feature 4 is a **public catalog**. It does not introduce per-user ownership of recipe rows (Feature 2 owns create/update and the `isPublished` flag).

| Rule | Requirement |
|------|-------------|
| **Read scope (public list)** | `GET /recipeapi/recipes` returns only rows where `isPublished` is `true`; no authentication (FR-003, FR-008–FR-010) |
| **Read scope (public details)** | The signed-out UI expands a published card and loads that recipe's ingredients and steps via the existing unauthenticated GETs used by `RecipeCardComponent` (FR-012–FR-017) |
| **Write scope** | None in this feature — create, update, publish, and unpublish remain Feature 2 |
| **Cross-user access** | Not applicable to the public list; unpublished recipes are excluded from `GET /recipeapi/recipes` |
| **UI scope** | Signed-out `/recipes` shows only the published list; no Add, pencil, or PDF controls (FR-018–FR-020) |
| **Known defect (not required)** | `GET /recipeapi/recipes/:id` does not filter on `isPublished` and may return an unpublished recipe — Edge Cases; do not test as required Feature 4 behavior |

---

## Key Entities

- **Recipe**: the existing Recipe entity used by this feature; Feature 4 uses its publication state to decide whether it appears in the public catalog. Public-facing information includes name, number of servings, time to make, description, and publication state. Recipe creation and ownership remain defined by Feature 2.
- **Recipe Step**: an existing step associated with a recipe. Public recipe details may display step number/order, instruction, and associated ingredients.
- **Ingredient**: an ingredient associated with recipe content. Feature 4 reads ingredient information as part of published recipe details but does not manage the Ingredient Catalog.

---

## API Requirements

Feature 4 **reads** existing public endpoints. It does not add a publish/unpublish API.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes` | No | List published recipes (`where isPublished: true`) for the signed-out catalog (FR-002, FR-003, FR-008–FR-010) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | Load a published recipe card's Ingredients section (FR-014, FR-017) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | Load a published recipe card's Recipe Steps section, ordered by `stepNumber` (FR-015–FR-017) |

`GET /recipeapi/recipes/:id` exists and is unauthenticated, but it is **not** the signed-out viewing surface (the public UI expands the card on `/recipes`). That get-by-id route may return an unpublished recipe — see Edge Cases; do not treat that as required Feature 4 behavior.

Create/update (`POST` / `PUT /recipeapi/recipes`) remain [Feature 2](./feature-2-recipe-management.md).

---

## Screen Requirements

### [View: Recipes] — route name `recipes`, path `/recipes`, `RecipeList.vue` (signed-out)

- Heading **Recipes**.
- With no `user` in `localStorage`, the page calls `RecipeServices.getRecipes()` → `GET /recipeapi/recipes` and renders one `RecipeCardComponent` per returned recipe.
- **Add** is not shown (`v-if="user !== null"`).
- There is no dedicated empty-state copy; an empty published list simply shows no cards.
- Signed-in owner list, Add Recipe dialog, and **Publish?** switch are [Feature 2](./feature-2-recipe-management.md).

Signed-out visitors can reach this view from Login **View Published Recipes** (Feature 1 FR-018) or the MenuBar **Recipes** button.

### [Component: RecipeCardComponent] — public details

- Collapsed card shows **name**, servings chip (`N Servings`), time chip (`N minutes`), and **description**.
- Clicking the card expands/collapses details (`showDetails`): **Ingredients** list and **Recipe Steps** table with columns **Step**, **Instruction**, and **Ingredients**.
- Ingredients and steps are loaded on mount via the public GETs in API Requirements.
- Pencil (`mdi-pencil`) and PDF (`mdi-file-pdf-box`) icons render only when `user !== null` (FR-019, FR-020). PDF generation is Feature 5 and is out of scope here.

### [Component: MenuBar] — signed-out chrome (Feature 1)

- No stored user → **Login** button (FR-021). Feature 4 does not change MenuBar signed-in behavior.

---

## Data Model Requirements

Feature 4 does not introduce a new database table. It relies on the existing Recipe data model owned by [Feature 2](./feature-2-recipe-management.md).

### `recipes` table (publication field used by this feature)

| Field | Type | Rules |
|-------|------|-------|
| `isPublished` | BOOLEAN | Required; Feature 2 owns create/update; Feature 4 reads `true` for the public catalog |

### Data Rules

- The existing Recipe publication field is `isPublished`.
- Public recipe browsing uses recipes where `isPublished` is true.
- Unpublished recipes have `isPublished` false and are excluded from the public recipe list.
- Feature 4 does not add a new publication column.
- Feature 4 does not change Recipe ownership.
- Recipe associations with ingredients and recipe steps remain the existing associations defined by the Recipe application.

### Associations

Feature 4 reads existing Recipe relationships necessary to display published recipe details, including:

- Recipe → Recipe Steps
- Recipe → Recipe Ingredients / Ingredients

The creation and maintenance of those associations remain owned by Feature 2.

---

## Acceptance Criteria (Gherkin)

### US-4.1 — Browse published recipes while signed out

#### Scenario: Browse published recipes while signed out
* **Given** a visitor is not signed in
* **And** published recipes exist
* **When** the visitor opens the Recipes page
* **Then** the published recipes are displayed
* **And** each displayed recipe shows its name
* **And** each displayed recipe shows its number of servings
* **And** each displayed recipe shows its time to make
* **And** each displayed recipe shows its description

### US-4.2 — Do not show unpublished recipes in the public catalog

#### Scenario: Hide unpublished recipes from the public catalog
* **Given** a published recipe exists
* **And** an unpublished recipe exists
* **And** a visitor is not signed in
* **When** the visitor opens the Recipes page
* **Then** the published recipe is displayed
* **And** the unpublished recipe is not displayed

### US-4.3 — Open a published recipe's details while signed out

#### Scenario: Open a published recipe's details while signed out
* **Given** a visitor is not signed in
* **And** a published recipe appears in the public recipe catalog
* **When** the visitor opens the published recipe
* **Then** the recipe details are displayed
* **And** the Ingredients section is displayed
* **And** the Recipe Steps section is displayed
* **And** recipe step information can include Step, Instruction, and Ingredients

### US-4.4 — Browse public recipes without owner controls

#### Scenario: Browse without owner controls while signed out
* **Given** a visitor is not signed in
* **And** published recipes exist
* **When** the visitor browses the public Recipes page
* **Then** the Add Recipe control is not displayed
* **And** recipe edit controls are not displayed
* **And** the PDF control is not displayed
* **And** a Login option is available

---

## Test Coverage Map

Each scenario above must map to at least one automated test. Do not add tests to Feature 1, 2, 3, or 5 files.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-4.1 | Browse published recipes while signed out | `backend/tests/publishedRecipe.test.js`, `frontend/tests/PublicRecipeBrowsing.test.js` | `Browse published recipes while signed out` |
| US-4.2 | Hide unpublished recipes from the public catalog | `backend/tests/publishedRecipe.test.js`, `frontend/tests/PublicRecipeBrowsing.test.js` | `Hide unpublished recipes from the public catalog` |
| US-4.3 | Open a published recipe's details while signed out | `frontend/tests/PublicRecipeBrowsing.test.js` | `Open a published recipe's details while signed out` |
| US-4.4 | Browse without owner controls while signed out | `frontend/tests/PublicRecipeBrowsing.test.js` | `Browse without owner controls while signed out` |

---

## Agent implementation request

Copy when asking an AI assistant to implement this feature (`@` this file):

```text
Add automated tests for @features/feature-4-public-recipe-publishing-browsing.md only.
Follow its Test Coverage Map and @.cursor/rules/testing-standards.mdc.
Create or update only the test files listed for this feature (backend/tests and/or frontend/tests).
Do not add tests for other features. Map every Gherkin scenario in this file to an it() with the exact scenario title.
Do not change application code — this feature specs and tests already-shipped behavior (team decision).
Do not add a publish/unpublish story or tests. Do not test or "fix" the GET-by-id unpublished-recipe leak.
Use backend/.env.test for API tests.
Update @features/reference/api.md, @features/reference/data-model.md, and @features/reference/behavior.md to match this spec.
```

**Reference updates for this feature:** `features/reference/api.md`, `features/reference/behavior.md` (public catalog rules). Schema is unchanged (`data-model.md` only if needed to note Feature 4 reads `isPublished`).

---

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-022** satisfied)
*   [ ] **Success Criteria (SC-001–SC-010)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Creating recipes ([Feature 2](./feature-2-recipe-management.md)).
*   Editing general recipe information ([Feature 2](./feature-2-recipe-management.md)).
*   Implementing the Publish toggle ([Feature 2](./feature-2-recipe-management.md)).
*   Changing a recipe from unpublished to published ([Feature 2](./feature-2-recipe-management.md)).
*   Changing a recipe from published to unpublished ([Feature 2](./feature-2-recipe-management.md)).
*   Recipe ownership rules ([Feature 2](./feature-2-recipe-management.md)).
*   Adding or editing recipe ingredients ([Feature 2](./feature-2-recipe-management.md)).
*   Adding or editing recipe steps ([Feature 2](./feature-2-recipe-management.md)).
*   Deleting recipes ([Feature 2](./feature-2-recipe-management.md)).
*   Ingredient Catalog management ([Feature 3](./feature-3-ingredient-catalog.md)).
*   Recipe PDF Export (Feature 5).
*   Adding PDF controls to the public recipe view.
*   Fixing the existing direct recipe-ID unpublished-recipe information leak unless explicitly required by a later feature or implementation task.
*   A publish/unpublish user story or dedicated publish API.
*   Changing production application code in this feature (tests of already-shipped behavior only).

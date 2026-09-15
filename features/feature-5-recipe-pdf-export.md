# Feature: Recipe PDF Export

**Feature ID:** 5
**Branch pattern:** `feature/5-recipe-pdf-export`
**Status:** Ready
**Created:** 2026-09-15
**Input:** Signed-in cooks must be able to download a PDF of a recipe (name, description, ingredients, and steps) from the recipe card. This feature specs and tests the already-shipped PDF control in `frontend/src/components/RecipeCardComponent.vue` and `frontend/src/reports/RecipeReports.js` — it does not introduce new behavior.
**Depends on:** [Feature 2 — Recipe Management](feature-2-recipe-management.md)
**Related:** [Feature 4 — Public Recipe Publishing & Browsing](feature-4-public-recipe-publishing-browsing.md) (signed-out users must not see the PDF control)

---

## User Stories

### US-5.1: See the PDF control when signed in
**As a** signed-in cook
**I want to** see a PDF icon on a recipe card
**So that** I know I can download that recipe

**Priority:** P1
**Independent test:** Mount a recipe card with a `user` in `localStorage` and confirm the `mdi-file-pdf-box` icon is shown
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Hide the PDF control when signed out
**As a** signed-out visitor
**I want** recipe cards not to offer PDF download
**So that** export stays a signed-in action (same rule as Feature 4 FR-020)

**Priority:** P1
**Independent test:** Mount a recipe card with no stored user and confirm the PDF icon is absent
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Export a recipe as a PDF
**As a** signed-in cook
**I want to** click the PDF icon and get a downloaded PDF of that recipe
**So that** I can keep or print the recipe offline

**Priority:** P1
**Independent test:** Click the PDF icon and confirm `RecipeReports.generateRecipePDF` is called with that recipe; confirm the generator loads ingredients and steps, writes name/description/ingredients/steps, and saves `recipeReport.pdf`
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: PDF click does not open recipe edit
**As a** signed-in cook
**I want** clicking the PDF icon not to open the edit screen
**So that** export is a separate action from the pencil/edit control

**Priority:** P2
**Independent test:** Click the PDF icon and confirm the router does not navigate to `editRecipe`
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: `RecipeCardComponent.vue` MUST show the PDF icon (`mdi-file-pdf-box`) only when `localStorage` contains a `user` entry (signed in).
- **FR-002**: `RecipeCardComponent.vue` MUST NOT show the PDF icon when no `user` is stored (signed out). Feature 4 already requires this on the public catalog; this feature states the same rule on the card itself.
- **FR-003**: Clicking the PDF icon MUST call `RecipeReports.generateRecipePDF(recipe)` with the card's `recipe` prop and MUST use `@click.stop` so the card click/expand handler does not own the action.
- **FR-004**: `generateRecipePDF` MUST load that recipe's ingredients via `GET /recipeapi/recipes/:recipeId/recipeIngredients` (`RecipeIngredientServices.getRecipeIngredientsForRecipe`) and its steps-with-ingredients via `GET /recipeapi/recipes/:recipeId/recipeStepsWithIngredients` (`RecipeStepServices.getRecipeStepsForRecipeWithIngredients`).
- **FR-005**: Those two reads MUST remain unauthenticated public GETs as specified in Feature 2; PDF export does not add a new backend endpoint.
- **FR-006**: The generated PDF MUST include the recipe **name** and **description**.
- **FR-007**: The generated PDF MUST include an **Ingredients** section. Each ingredient line MUST use quantity, unit (plural `s` suffix when `quantity > 1`), ingredient name, and price per unit in the form already shipped: `{quantity} {unit}[s] of {name} (${price}/{unit})`.
- **FR-008**: The generated PDF MUST include a **Steps** table with columns Step, Instruction, and Ingredients. Step ingredient cells MUST be the comma-separated catalog names from each step's `recipeIngredient` list.
- **FR-009**: The generated PDF MUST be saved with the filename `recipeReport.pdf` (`doc.save("recipeReport.pdf")`).
- **FR-010**: Clicking the PDF icon MUST NOT navigate to `editRecipe` (the pencil icon remains the edit control).
- **FR-011**: PDF generation is client-side (jsPDF). Feature 5 MUST NOT add a server-side PDF route.
- **FR-012**: If ingredient or step fetches fail, the shipped generator logs the error and still builds a PDF with whatever lists it has (possibly empty). This feature documents that behavior; it does not require a user-visible error snackbar.

---

## Assumptions

- Features 1–4 are on `dev`. Recipe cards, recipe-ingredient reads, and recipe-step-with-ingredient reads already exist.
- This feature specs and tests already-shipped behavior; it does not authorize new implementation work (same posture as Features 1–4).
- A recipe may have zero ingredients or zero steps; the PDF still downloads.

## Edge Cases

- Signed-out visitor: no PDF icon (FR-002 / Feature 4 FR-020).
- Ingredient or step API failure: errors are `console.log`'d; save still runs (FR-012).
- **Shipped detail — not changed:** every export uses the same filename `recipeReport.pdf` (not the recipe name).
- **Shipped detail — not changed:** the PDF attempts to draw `/oc-logo-white.png` and a footer `{recipe.name} published as of {today's locale date}` even when the recipe is unpublished (the word "published" is hardcoded copy, not `isPublished`).

## Success Criteria

- **SC-001**: Every Gherkin scenario in this feature has at least one automated test before merge.
- **SC-002**: A signed-in user can click the PDF icon on a recipe card and receive a `recipeReport.pdf` download in one manual pass.
- **SC-003**: Mapped frontend tests for this feature pass (`npx vitest run tests/RecipeCardPdf.test.js tests/RecipeReports.test.js`).

---

## Data Ownership & Isolation

PDF export does not create or update recipe rows. It **reads** the same public ingredient and step-with-ingredient APIs as the expanded recipe card (Feature 2).

| Rule | Requirement |
|------|-------------|
| **Who can start export** | Only a signed-in UI (PDF icon gated on `localStorage.user`) |
| **What data is read** | Ingredients and steps for the `recipe.id` on the card, via existing public GETs |
| **Who can call those GETs** | Anyone (no auth) — same as Feature 2 FR-012 / FR-014 |
| **Writes** | None |

A signed-in user who can see a recipe card (their list, or a published card) can trigger export from that card. This feature does not add an extra ownership check inside `generateRecipePDF`.

---

## Key Entities

- **Recipe**: the card's recipe (name, description, id); content comes from Feature 2.
- **Recipe Ingredient**: quantity plus catalog Ingredient (name, unit, pricePerUnit) listed in the PDF Ingredients section.
- **Recipe Step**: stepNumber, instruction, and linked recipe-ingredient names listed in the PDF Steps table.

No new entity is introduced.

---

## API Requirements

Feature 5 introduces **no** new endpoints. The client reuses Feature 2 reads:

| Method | Endpoint | Auth | Purpose in this feature |
|--------|----------|------|-------------------------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | Load lines for the PDF Ingredients section (FR-004, FR-007) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | Load rows for the PDF Steps table (FR-004, FR-008) |

There is no `POST /recipeapi/recipes/:id/pdf` (FR-011).

---

## Screen Requirements

### [Component: Recipe card] — `RecipeCardComponent.vue` on Recipes (`/recipes`)

*   When signed in: small `mdi-file-pdf-box` icon in the card title row (alongside the edit pencil).
*   When signed out: neither PDF nor pencil (Feature 2 / Feature 4).
*   PDF click: `RecipeReports.generateRecipePDF(recipe)` with `@click.stop`.
*   Pencil click: navigate to `editRecipe` (out of scope to change; Feature 5 only requires PDF not to use that path).

### [Client report: Recipe PDF] — `frontend/src/reports/RecipeReports.js`

*   Letter portrait PDF via jsPDF.
*   Title: recipe name; body: description; heading **Ingredients** then lines; heading **Steps** then autoTable.
*   Download name: `recipeReport.pdf`.

---

## Data Model Requirements

No new tables or columns. Feature 5 **reads**:

| Table | Fields used in the PDF |
|-------|------------------------|
| `recipes` | `id`, `name`, `description` (from the card prop) |
| `recipeIngredients` | `quantity`, `ingredientId` / included `ingredient` |
| `ingredients` | `name`, `unit`, `pricePerUnit` |
| `recipeSteps` | `stepNumber`, `instruction` |
| `recipeIngredients` on a step | nested `ingredient.name` for the Steps table |

Associations are Feature 2's. Schema is unchanged.

---

## Acceptance Criteria (Gherkin)

### US-5.1 — See the PDF control when signed in

#### Scenario: Signed-in user sees the PDF control on a recipe card
* **Given** a user is stored in `localStorage`
* **And** a recipe card is shown
* **When** the card renders
* **Then** the PDF icon is displayed

### US-5.2 — Hide the PDF control when signed out

#### Scenario: Signed-out visitor does not see the PDF control on a recipe card
* **Given** no user is stored in `localStorage`
* **And** a recipe card is shown
* **When** the card renders
* **Then** the PDF icon is not displayed

### US-5.3 — Export a recipe as a PDF

#### Scenario: Signed-in user starts a PDF export from the recipe card
* **Given** a user is stored in `localStorage`
* **And** a recipe card is shown
* **When** the user clicks the PDF icon
* **Then** `generateRecipePDF` is called with that recipe

#### Scenario: PDF export writes the recipe name, description, ingredients, and steps
* **Given** a recipe has ingredients and steps with linked ingredient names
* **When** `generateRecipePDF` runs for that recipe
* **Then** it requests that recipe's ingredients
* **And** it requests that recipe's steps with ingredients
* **And** the PDF includes the recipe name and description
* **And** the PDF includes an Ingredients section built from those ingredients
* **And** the PDF includes a Steps table built from those steps

#### Scenario: PDF export saves the file as recipeReport.pdf
* **Given** `generateRecipePDF` runs for a recipe
* **When** the PDF is finished
* **Then** the file is saved as `recipeReport.pdf`

### US-5.4 — PDF click does not open recipe edit

#### Scenario: PDF export does not navigate to recipe edit
* **Given** a user is stored in `localStorage`
* **And** a recipe card is shown
* **When** the user clicks the PDF icon
* **Then** the app does not navigate to `editRecipe`

---

## Test Coverage Map

Each scenario above must map to at least one automated test. Do not add tests to Feature 1, 2, 3, or 4 files.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | Signed-in user sees the PDF control on a recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-in user sees the PDF control on a recipe card` |
| US-5.2 | Signed-out visitor does not see the PDF control on a recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-out visitor does not see the PDF control on a recipe card` |
| US-5.3 | Signed-in user starts a PDF export from the recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-in user starts a PDF export from the recipe card` |
| US-5.3 | PDF export writes the recipe name, description, ingredients, and steps | `frontend/tests/RecipeReports.test.js` | `PDF export writes the recipe name, description, ingredients, and steps` |
| US-5.3 | PDF export saves the file as recipeReport.pdf | `frontend/tests/RecipeReports.test.js` | `PDF export saves the file as recipeReport.pdf` |
| US-5.4 | PDF export does not navigate to recipe edit | `frontend/tests/RecipeCardPdf.test.js` | `PDF export does not navigate to recipe edit` |

---

## Agent implementation request

Copy when asking an AI assistant to implement this feature (`@` this file):

```text
Add automated tests for @features/feature-5-recipe-pdf-export.md only.
Follow its Test Coverage Map and @.cursor/rules/testing-standards.mdc.
Create or update only the test files listed for this feature (backend/tests and/or frontend/tests).
Do not add tests for other features. Map every Gherkin scenario in this file to an it() with the exact scenario title.
Do not change application code — this feature specs and tests already-shipped behavior (team decision).
Do not add a server-side PDF endpoint.
Use backend/.env.test only if API tests are listed (none for this feature).
Update @features/reference/behavior.md (and api.md / data-model.md only if needed) to match this spec.
```

**Reference updates for this feature:** `features/reference/behavior.md` (PDF export rules). No new API or schema.

---

## Definition of Done

*   [x] Backend and frontend behavior matches this spec (**FR-001**–**FR-012** verified against the running app / shipped client)
*   [x] **Success Criteria (SC-001–SC-003)** met
*   [x] All mapped tests pass (`npx vitest run tests/RecipeCardPdf.test.js tests/RecipeReports.test.js`)
*   [x] Test Coverage Map complete
*   [x] `features/reference/data-model.md` updated (if schema changed) — no schema change
*   [x] `features/reference/api.md` updated (if API changed) — no new endpoints
*   [x] `features/reference/behavior.md` updated (if product rules changed)

This assignment ships the **spec + tests** against the starter PDF client. Implementation checkboxes for new code stay unused unless a mapped test requires a bugfix that this spec already requires.

---

## Out of Scope

*   Creating or editing recipes, steps, or recipe-ingredients — [Feature 2](./feature-2-recipe-management.md)
*   Ingredient catalog CRUD — [Feature 3](./feature-3-ingredient-catalog.md)
*   Public catalog browsing — [Feature 4](./feature-4-public-recipe-publishing-browsing.md)
*   Adding a PDF icon for signed-out visitors
*   A server-side PDF API or emailing the PDF
*   Changing the hardcoded filename `recipeReport.pdf` or the footer wording "published as of"
*   User-visible error UI when ingredient/step fetches fail (shipped `console.log` only)
*   Changing application code (team decision: spec and test existing behavior)

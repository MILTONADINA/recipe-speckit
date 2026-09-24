# Feature: Recipe PDF Export

**Feature ID:** 5
**Branch pattern:** `feature/5-recipe-pdf-export`
**Status:** Ready
**Created:** 2026-09-15
**Input:** Allow signed-in users to download a recipe as a PDF from the recipe card.
**Depends on:** [Feature 2 — Recipe Management](./feature-2-recipe-management.md)

---

## User Stories

### US-5.1: See the PDF control when signed in

**As a** signed-in user
**I want to** see a PDF icon on a recipe card
**So that** I know I can download the recipe

**Priority:** P1
**Independent test:** Sign in and check that the PDF icon appears on a recipe card.
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Hide the PDF control when signed out

**As a** signed-out visitor
**I want to** not see the PDF icon on recipe cards
**So that** only signed-in users can download recipe PDFs

**Priority:** P1
**Independent test:** View a recipe card while signed out and check that the PDF icon does not appear.
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Export a recipe as a PDF

**As a** signed-in user
**I want to** click the PDF icon and download the recipe
**So that** I can save it and view it later

**Priority:** P1
**Independent test:** Click the PDF icon on a recipe card and verify that the recipe is downloaded as a PDF.
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: Keep PDF download separate from editing

**As a** signed-in user
**I want to** click the PDF icon without opening the edit page
**So that** downloading and editing stay as separate actions

**Priority:** P2
**Independent test:** Click the PDF icon and verify that the PDF download starts without opening the recipe edit page.
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

* **FR-001**: The system MUST show a PDF icon on recipe cards when the user is signed in.
* **FR-002**: The system MUST hide the PDF icon when the user is signed out.
* **FR-003**: A signed-in user MUST be able to start a PDF download from the recipe card.
* **FR-004**: The PDF export MUST use the existing ingredient and recipe step APIs.
* **FR-005**: Feature 5 MUST NOT add a new API endpoint.
* **FR-006**: The PDF MUST include the recipe name and description.
* **FR-007**: The PDF MUST include an Ingredients section.
* **FR-008**: The PDF MUST include a Steps section.
* **FR-009**: The PDF MUST still be created if the recipe has no ingredients.
* **FR-010**: The PDF MUST still be created if the recipe has no steps.
* **FR-011**: The downloaded file MUST be named `recipeReport.pdf`.
* **FR-012**: Clicking the PDF icon MUST NOT open the recipe edit page.

---

## Assumptions

* Feature 2 already handles recipes, ingredients, and recipe steps.
* Feature 4 handles public recipe browsing for signed-out visitors.
* The ingredient and step APIs already exist and can be used for the PDF.
* A recipe may have no ingredients or no steps.
* The PDF feature already exists in the application, so this feature mainly documents it and adds the missing tests.
* No application code should need to change unless the current behavior does not match this specification.

---

## Edge Cases

* A recipe with no ingredients can still be downloaded as a PDF.
* A recipe with no steps can still be downloaded as a PDF.
* Signed-out visitors do not see the PDF icon.
* Clicking the PDF icon does not accidentally open the recipe edit page.
* The PDF should contain information from the recipe card that was clicked.

---

## Success Criteria

* **SC-001**: Signed-in users can see the PDF icon on recipe cards.
* **SC-002**: Signed-out visitors cannot see the PDF icon.
* **SC-003**: A signed-in user can download a recipe as a PDF.
* **SC-004**: The PDF includes the recipe name, description, ingredients, and steps.
* **SC-005**: A recipe with no ingredients can still be exported.
* **SC-006**: A recipe with no steps can still be exported.
* **SC-007**: The downloaded file is named `recipeReport.pdf`.
* **SC-008**: Clicking the PDF icon does not open the recipe edit page.
* **SC-009**: Every acceptance scenario has an automated test.

---

## Data Ownership & Isolation

Feature 5 only reads recipe information. It does not create, edit, or delete any recipe data.

| Rule | Requirement |
|------|-------------|
| **Who can export** | Signed-in users |
| **What is read** | Recipe name, description, ingredients, and steps |
| **Recipe used** | The recipe from the card that the user clicked |
| **Write scope** | None |
| **Ownership changes** | None |

---

## Key Entities

* **Recipe**: The recipe being downloaded as a PDF.
* **Recipe Ingredient**: The ingredients that belong to the recipe and are shown in the PDF.
* **Recipe Step**: The instructions that belong to the recipe and are shown in the PDF.

---

## API Requirements

Feature 5 does not add any new API endpoints. It uses the existing Feature 2 endpoints.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | Get the ingredients for the selected recipe |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | Get the steps for the selected recipe |

The `recipeId` must be the ID of the recipe card where the user clicked the PDF icon.

The existing APIs do not require authentication, but the PDF button itself is only shown to signed-in users.

---

## Screen Requirements

### RecipeCardComponent — Recipes Page (`/recipes`)

* Signed-in users see a PDF icon on the recipe card.
* Signed-out visitors do not see the PDF icon.
* Clicking the PDF icon starts the PDF download for that recipe.
* Clicking the PDF icon does not open the recipe edit page.

### Recipe PDF

The PDF includes:

* Recipe name
* Recipe description
* Ingredients
* Steps

The PDF is saved as:

`recipeReport.pdf`

If the recipe does not have ingredients or steps, the PDF can still be created.

---

## Data Model Requirements

Feature 5 does not add any tables, columns, or relationships.

It uses the existing Recipe, Recipe Ingredient, and Recipe Step data from [Feature 2 — Recipe Management](./feature-2-recipe-management.md).

### Data Rules

* Feature 5 only reads existing recipe information.
* It does not create, edit, or delete recipe data.
* It does not change recipe ownership.
* Generated PDF files are not stored in the database.

---

## Acceptance Criteria (Gherkin)

### US-5.1 — See the PDF control when signed in

#### Scenario: Signed-in user sees the PDF control on a recipe card

* **Given** a user is signed in
* **And** a recipe card is shown
* **When** the card is displayed
* **Then** the PDF icon is displayed

### US-5.2 — Hide the PDF control when signed out

#### Scenario: Signed-out visitor does not see the PDF control on a recipe card

* **Given** a visitor is not signed in
* **And** a recipe card is shown
* **When** the card is displayed
* **Then** the PDF icon is not displayed

### US-5.3 — Export a recipe as a PDF

#### Scenario: Signed-in user starts a PDF export from the recipe card

* **Given** a user is signed in
* **And** a recipe card is shown
* **When** the user clicks the PDF icon
* **Then** a PDF export starts for that recipe

#### Scenario: PDF export includes the recipe information

* **Given** a recipe has a name, description, ingredients, and steps
* **When** the PDF export runs
* **Then** the recipe ingredients are requested
* **And** the recipe steps are requested
* **And** the PDF includes the recipe name and description
* **And** the PDF includes an Ingredients section
* **And** the PDF includes a Steps section

#### Scenario: PDF export works with no ingredients

* **Given** a recipe has no ingredients
* **When** the PDF export runs
* **Then** the PDF is still created successfully

#### Scenario: PDF export works with no steps

* **Given** a recipe has no steps
* **When** the PDF export runs
* **Then** the PDF is still created successfully

#### Scenario: PDF export saves the file as recipeReport.pdf

* **Given** a PDF export runs for a recipe
* **When** the PDF is finished
* **Then** the file is saved as `recipeReport.pdf`

### US-5.4 — Keep PDF download separate from editing

#### Scenario: PDF export does not navigate to recipe edit

* **Given** a user is signed in
* **And** a recipe card is shown
* **When** the user clicks the PDF icon
* **Then** the PDF export starts
* **And** the recipe edit page does not open

---

## Test Coverage Map

Each scenario must have at least one automated test. Feature 5 tests should not be added to Feature 1, 2, 3, or 4 test files.

| Story | Scenario | Test file | Test name |
|-------|----------|-----------|-----------|
| US-5.1 | Signed-in user sees the PDF control on a recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-in user sees the PDF control on a recipe card` |
| US-5.2 | Signed-out visitor does not see the PDF control on a recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-out visitor does not see the PDF control on a recipe card` |
| US-5.3 | Signed-in user starts a PDF export from the recipe card | `frontend/tests/RecipeCardPdf.test.js` | `Signed-in user starts a PDF export from the recipe card` |
| US-5.3 | PDF export includes the recipe information | `frontend/tests/RecipeReports.test.js` | `PDF export includes the recipe information` |
| US-5.3 | PDF export works with no ingredients | `frontend/tests/RecipeReports.test.js` | `PDF export works with no ingredients` |
| US-5.3 | PDF export works with no steps | `frontend/tests/RecipeReports.test.js` | `PDF export works with no steps` |
| US-5.3 | PDF export saves the file as recipeReport.pdf | `frontend/tests/RecipeReports.test.js` | `PDF export saves the file as recipeReport.pdf` |
| US-5.4 | PDF export does not navigate to recipe edit | `frontend/tests/RecipeCardPdf.test.js` | `PDF export does not navigate to recipe edit` |

---

## Agent implementation request

Copy when asking an AI assistant to work on Feature 5:

```text
Add the automated tests for @features/feature-5-recipe-pdf-export.md.

Follow the Test Coverage Map and @.cursor/rules/testing-standards.mdc.

Use these test files:
- frontend/tests/RecipeCardPdf.test.js
- frontend/tests/RecipeReports.test.js

Create one test for every Gherkin scenario and use the exact scenario title for the it() name.

Do not add Feature 5 tests to Feature 1, 2, 3, or 4 test files.

The PDF feature already exists in the application, so do not change application code unless the existing behavior does not match this specification.

Do not create a new PDF API endpoint or make database changes.

Run npm test when finished.

Update @features/reference/behavior.md if needed to match the PDF export behavior.
```

**Reference updates for this feature:** `features/reference/behavior.md`

---

## Definition of Done

* [ ] FR-001 through FR-012 are satisfied
* [ ] SC-001 through SC-009 are met
* [ ] Every Gherkin scenario has an automated test
* [ ] Test Coverage Map is complete
* [ ] All Feature 5 tests pass
* [ ] `npm test` passes
* [ ] No new PDF API endpoint was added
* [ ] No database changes were made
* [ ] `features/reference/behavior.md` is updated if needed

---

## Out of Scope

* Creating, editing, or deleting recipes.
* Recipe management from [Feature 2](./feature-2-recipe-management.md).
* Ingredient Catalog from [Feature 3](./feature-3-ingredient-catalog.md).
* Public recipe browsing from [Feature 4](./feature-4-public-recipe-publishing-browsing.md).
* Showing the PDF icon to signed-out visitors.
* Creating a new PDF API endpoint.
* Adding new database tables or columns.
* Saving generated PDFs in the database.
* Changing the existing ingredient or recipe step APIs.

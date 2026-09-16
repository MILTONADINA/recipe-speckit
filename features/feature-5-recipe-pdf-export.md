# Feature: Recipe PDF Export

**Feature ID:** 5
**Branch pattern:** `feature/5-recipe-pdf-export`
**Status:** Ready
**Created:** 2026-09-15
**Input:** Existing Recipe application and source code
**Depends on:** [Feature 2 — Recipe Management](feature-2-recipe-management.md)

---

## User Stories

### US-5.1: See the PDF control when signed in
As a signed-in user
I want to see a PDF icon on a recipe card
So that I know I can download that recipe

**Priority:** P1
**Independent test:** Open a recipe card while signed in and confirm the PDF icon is shown
**Acceptance scenarios:** see ### US-5.1 under Acceptance Criteria

### US-5.2: Hide the PDF control when signed out
As a signed-out visitor
I want recipe cards not to show a PDF icon
So that PDF download is only for signed-in users

**Priority:** P1
**Independent test:** Open a recipe card while signed out and confirm the PDF icon is not shown
**Acceptance scenarios:** see ### US-5.2 under Acceptance Criteria

### US-5.3: Export a recipe as a PDF
As a signed-in user
I want to click the PDF icon and download a PDF of that recipe
So that I can keep the recipe

**Priority:** P1
**Independent test:** Click the PDF icon and confirm a PDF of that recipe is downloaded
**Acceptance scenarios:** see ### US-5.3 under Acceptance Criteria

### US-5.4: PDF click does not open recipe edit
As a signed-in user
I want clicking the PDF icon not to open the edit page
So that download and edit stay separate

**Priority:** P2
**Independent test:** Click the PDF icon and confirm the edit page does not open
**Acceptance scenarios:** see ### US-5.4 under Acceptance Criteria

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST show a PDF control on a recipe card when the user is signed in.
- **FR-002**: The system MUST not show the PDF control when the user is signed out.
- **FR-003**: A signed-in user MUST be able to start a PDF export from the recipe card.
- **FR-004**: PDF export MUST use the existing recipe ingredient and recipe step APIs.
- **FR-005**: Feature 5 MUST not add a new API endpoint.
- **FR-006**: The generated PDF MUST include the recipe name and description.
- **FR-007**: The generated PDF MUST include an Ingredients section.
- **FR-008**: The generated PDF MUST include a Steps section.
- **FR-009**: The PDF MUST be saved as recipeReport.pdf.
- **FR-010**: Clicking the PDF control MUST not open recipe edit.

---

## Assumptions

- Feature 2 owns recipes, recipe ingredients, and recipe steps.
- Feature 4 already hides the PDF control for signed-out visitors on the public catalog.
- Feature 5 specs and tests PDF export that already exists in the app.
- A recipe may have no ingredients or no steps.

## Edge Cases

- If there are no ingredients, the PDF can still download.
- If there are no steps, the PDF can still download.
- Signed-out visitors do not see the PDF control.

## Success Criteria

- **SC-001**: A signed-in user can see the PDF control on a recipe card.
- **SC-002**: A signed-out visitor cannot see the PDF control on a recipe card.
- **SC-003**: A signed-in user can download a PDF of a recipe from the recipe card.
- **SC-004**: The PDF includes name, description, ingredients, and steps.
- **SC-005**: The downloaded file is named recipeReport.pdf.
- **SC-006**: Clicking the PDF control does not open recipe edit.

---

## Data Ownership & Isolation

Feature 5 does not create or update recipes. It reads existing recipe content.

| Rule | Requirement |
|------|-------------|
| **Who can export** | Signed-in users only (FR-001, FR-002) |
| **What is read** | Ingredients and steps for the recipe on the card (FR-004) |
| **Write scope** | None |

---

## Key Entities

- **Recipe**: the recipe being exported. Feature 2 owns create and edit.
- **Recipe Ingredient**: ingredient lines shown in the PDF.
- **Recipe Step**: steps shown in the PDF.

---

## API Requirements

Feature 5 does not add endpoints. It uses existing Feature 2 reads:

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/recipeapi/recipes/:recipeId/recipeIngredients` | No | Load ingredients for the PDF (FR-004, FR-007) |
| `GET` | `/recipeapi/recipes/:recipeId/recipeStepsWithIngredients` | No | Load steps for the PDF (FR-004, FR-008) |

---

## Screen Requirements

### [Component: RecipeCardComponent] — recipe card on Recipes (`/recipes`)

- Signed in: PDF icon is shown on the card.
- Signed out: PDF icon is not shown.
- Clicking the PDF icon downloads a PDF of that recipe.
- Clicking the PDF icon does not open edit.

### [Recipe PDF]

- The PDF shows the recipe name, description, ingredients, and steps.
- The file name is recipeReport.pdf.

---

## Data Model Requirements

Feature 5 does not add a new table or column. It uses existing Recipe, Recipe Ingredient, and Recipe Step data from [Feature 2](./feature-2-recipe-management.md).

### Data Rules

- PDF export reads existing recipe content.
- Feature 5 does not change Recipe ownership.

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
* **Then** a PDF export is started for that recipe

#### Scenario: PDF export writes the recipe name, description, ingredients, and steps
* **Given** a recipe has ingredients and steps
* **When** a PDF export runs for that recipe
* **Then** the recipe ingredients are requested
* **And** the recipe steps are requested
* **And** the PDF includes the recipe name and description
* **And** the PDF includes an Ingredients section
* **And** the PDF includes a Steps section

#### Scenario: PDF export saves the file as recipeReport.pdf
* **Given** a PDF export runs for a recipe
* **When** the PDF is finished
* **Then** the file is saved as recipeReport.pdf

### US-5.4 — PDF click does not open recipe edit

#### Scenario: PDF export does not navigate to recipe edit
* **Given** a user is signed in
* **And** a recipe card is shown
* **When** the user clicks the PDF icon
* **Then** the recipe edit page does not open

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

**Reference updates for this feature:** `features/reference/behavior.md`

---

## Definition of Done

*   [ ] Backend and frontend implemented per this spec (**FR-001**–**FR-010** satisfied)
*   [ ] **Success Criteria (SC-001–SC-006)** met
*   [ ] All mapped tests pass (`npm test`)
*   [ ] Test Coverage Map complete
*   [ ] `features/reference/data-model.md` updated (if schema changed)
*   [ ] `features/reference/api.md` updated (if API changed)
*   [ ] `features/reference/behavior.md` updated (if product rules changed)

---

## Out of Scope

*   Creating or editing recipes ([Feature 2](./feature-2-recipe-management.md)).
*   Ingredient Catalog ([Feature 3](./feature-3-ingredient-catalog.md)).
*   Public recipe browsing ([Feature 4](./feature-4-public-recipe-publishing-browsing.md)).
*   Showing the PDF control to signed-out visitors.
*   Adding a new PDF API.
*   Changing application code in this feature (tests of already-shipped behavior only).

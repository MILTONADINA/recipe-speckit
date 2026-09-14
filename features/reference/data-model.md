# Data Model Reference

**Status:** reflects the integrated product on `dev` after Features 1–2.

## Tables

### `users`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `firstName` | STRING | Required |
| `lastName` | STRING | Required |
| `email` | STRING | Required; **not** database-unique (enforced only by a controller-level lookup) |
| `password` | BLOB | Required; scrypt hash bytes only, never returned by the API |
| `salt` | BLOB | Required |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `sessions`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `email` | STRING | Required; copy of the user's email at session creation |
| `expirationDate` | DATE | Required; creation time + 1 day |
| `userId` | INTEGER FK | Required, references `users.id` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `recipes`

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

### `recipeSteps`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `stepNumber` | INTEGER | Required |
| `instruction` | STRING(5000) | Required |
| `recipeId` | INTEGER FK | References `recipes.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `recipeIngredients`

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `quantity` | FLOAT | Required |
| `recipeId` | INTEGER FK | References `recipes.id`, nullable, `ON DELETE SET NULL` |
| `recipeStepId` | INTEGER FK | References `recipeSteps.id`, nullable, `ON DELETE SET NULL` — `null` until assigned to a step |
| `ingredientId` | INTEGER FK | References `ingredients.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

### `ingredients` (catalog — schema only; Feature 3 owns its management screen)

| Field | Type | Rules |
|-------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `name` | STRING | Required |
| `unit` | STRING | Required |
| `pricePerUnit` | DECIMAL(10,2) | Optional |
| `createdAt` / `updatedAt` | DATE | Sequelize timestamps |

## Associations

- `users` **hasMany** `sessions` (as `session`); `sessions` **belongsTo** `users` (as `user`) — `ON DELETE CASCADE`.
- `users` **hasMany** `recipes` (as `recipe`); `recipes` **belongsTo** `users` (as `user`).
- `recipes` **hasMany** `recipeSteps` (as `recipeStep`); `recipeSteps` **belongsTo** `recipes` (as `recipe`).
- `recipes` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `recipes` (as `recipe`).
- `recipeSteps` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `recipeSteps` (as `recipeStep`).
- `ingredients` **hasMany** `recipeIngredients` (as `recipeIngredient`); `recipeIngredients` **belongsTo** `ingredients` (as `ingredient`).

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` tables and association | Feature 1 — User Authentication & Session Management |
| `recipes`, `recipeSteps`, `recipeIngredients` tables and associations | Feature 2 — Recipe Management |

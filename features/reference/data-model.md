# Data Model Reference

**Status:** reflects the integrated product on `dev` after Feature 1.

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

## Associations

- `users` **hasMany** `sessions` (as `session`); `sessions` **belongsTo** `users` (as `user`) — `ON DELETE CASCADE`.

## Feature provenance

| Area | Introduced |
|------|------------|
| `users`, `sessions` tables and association | Feature 1 — User Authentication & Session Management |

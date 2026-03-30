# Auth Matrix — Items

> **Example domain.** This is the working reference implementation included with the Domain API Template.
> Replace this file with your own auth matrix by running `task domain:init`.

---

## Roles

| Role | Description |
|------|-------------|
| `contributor` | Can create items and update/delete their own items |
| `viewer` | Read-only access to items |

## Authentication

All protected routes require a `Bearer` JWT token in the `Authorization` header.
Unauthenticated requests to protected routes return `401 Unauthorized`.

Tokens are issued via `POST /v1/auth/login` and refreshed via `POST /v1/auth/refresh`.

## Auth Matrix

| Operation | Endpoint | Public | contributor | viewer |
|-----------|----------|--------|-------------|--------|
| Register | `POST /v1/auth/register` | 🌐 | �� | 🌐 |
| Login | `POST /v1/auth/login` | 🌐 | 🌐 | 🌐 |
| Refresh token | `POST /v1/auth/refresh` | 🌐 | 🌐 | 🌐 |
| Logout | `POST /v1/auth/logout` | ❌ | ✅ | ✅ |
| List items | `GET /v1/items` | ❌ | ✅ | ✅ |
| Create item | `POST /v1/items` | ❌ | ✅ | ❌ |
| Get item | `GET /v1/items/{itemId}` | ❌ | ✅ | ✅ |
| Update item | `PATCH /v1/items/{itemId}` | ❌ | ✅ own | ❌ |
| Delete item | `DELETE /v1/items/{itemId}` | ❌ | ✅ own | ❌ |

Legend:
- 🌐 Public (no auth required)
- ✅ Allowed
- ✅ own — Allowed only if `item.contributorId === req.user.sub`
- ❌ Forbidden

## Ownership Rule

A `contributor` may only update or delete items where `item.contributorId` matches their user ID (`req.user.sub`). Attempting to modify another contributor's item returns `403 Forbidden`.

## Error Responses

| Scenario | HTTP Status | Error Code |
|----------|-------------|------------|
| No token provided | `401` | `AUTHENTICATION_REQUIRED` |
| Token expired | `401` | `TOKEN_EXPIRED` |
| Valid token, wrong role | `403` | `FORBIDDEN` |
| Valid token, not item owner | `403` | `FORBIDDEN` |

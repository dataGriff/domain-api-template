# Authorisation Matrix

This document defines which roles are permitted to perform each operation.
It is independent of technical implementation — HTTP methods and API paths
are defined in `openapi.yaml`.

---

## Roles

| Role       | Description                                               |
|------------|-----------------------------------------------------------|
| **Owner**  | A registered dog owner who books walks for their dogs     |
| **Walker** | The dog walker; manages the business and all operational data |

---

## Notation

| Symbol     | Meaning                                                          |
|------------|------------------------------------------------------------------|
| ✓          | Permitted for all records of this type                           |
| `own`      | Permitted for the user's own record(s) only                      |
| `assigned` | Permitted only for records the walker is assigned to             |
| `pending`  | Permitted for records in `pending` status, plus their own        |
| ✗          | Not permitted                                                    |
| `public`   | No authentication required                                       |

---

## Interest Requests

| Operation                   | Public | Owner | Walker |
|-----------------------------|--------|-------|--------|
| Submit an interest request  | ✓      | ✗     | ✗      |
| List interest requests      | ✗      | ✗     | ✓      |
| View an interest request    | ✗      | ✗     | ✓      |
| Add internal notes          | ✗      | ✗     | ✓      |
| Accept an interest request  | ✗      | ✗     | ✓      |
| Decline an interest request | ✗      | ✗     | ✓      |

> **Note:** Interest request submission requires no account. The response
> returns minimal data only (id and submission timestamp) to avoid exposing
> internal state to anonymous callers. Internal notes and the linked owner
> record are never visible to unauthenticated callers.

---

## Authentication

| Operation       | Public | Owner | Walker |
|-----------------|--------|-------|--------|
| Register        | `public`| ✗    | ✗      |
| Log in          | `public`| `public`| `public`|
| Log out         | ✗      | ✓     | ✓      |
| Refresh session | `public`| `public`| `public`|

---

## Owners

| Operation    | Owner | Walker |
|--------------|-------|--------|
| List owners  | ✗     | ✓      |
| Create owner | ✗     | ✓      |
| View owner   | `own` | ✓      |
| Update owner | `own` | ✓      |
| Delete owner | ✗     | ✓      |

> **Note:** Owner accounts are created automatically when the walker accepts
> an interest request. The walker can update or remove owner records. Owners
> can view and update only their own profile.

---

## Walkers

| Operation     | Owner | Walker |
|---------------|-------|--------|
| List walkers  | ✓     | `own`  |
| Create walker | ✗     | ✓      |
| View walker   | ✓     | `own`  |
| Update walker | ✗     | `own`  |
| Delete walker | ✗     | `own`  |

> **Note:** Owners can view the walker profile (including rate card) to
> understand services and pricing. The walker manages her own profile only.

---

## Dogs

| Operation              | Owner | Walker     |
|------------------------|-------|------------|
| List dogs for an owner | `own` | `assigned` |
| Add a dog              | `own` | ✗          |
| View a dog             | `own` | `assigned` |
| Update a dog           | `own` | ✗          |
| Delete a dog           | `own` | ✗          |

> **Note:** Walkers can view dog details (including medical and behaviour
> notes) only for dogs on a walk they are assigned to.

---

## Walk Requests

| Operation              | Owner           | Walker            |
|------------------------|-----------------|-------------------|
| List walk requests     | `own`           | `pending` + `own` |
| Submit a walk request  | ✓               | ✗                 |
| View a walk request    | `own`           | `pending` + `own` |
| Update a walk request  | `own` (pending) | ✗                 |
| Cancel a walk request  | `own` (pending) | ✗                 |
| Accept a walk request  | ✗               | ✓                 |
| Decline a walk request | ✗               | ✓                 |

> **Note:** Walkers can see all pending requests (to choose which to accept)
> plus requests they have already acted on. Owners can only modify or cancel
> their own requests while they remain pending.

---

## Walks

| Operation       | Owner | Walker     |
|-----------------|-------|------------|
| List walks      | `own` | `assigned` |
| View a walk     | `own` | `assigned` |
| Update a walk   | ✗     | `assigned` |
| Start a walk    | ✗     | `assigned` |
| Complete a walk | ✗     | `assigned` |
| Cancel a walk   | `own` | `assigned` |

> **Note:** Only the assigned walker can start, complete, or update a walk.
> Both the owner and the assigned walker may cancel a scheduled walk.

---

## Walk Updates

| Operation            | Owner | Walker                     |
|----------------------|-------|----------------------------|
| List walk updates    | `own` | `assigned`                 |
| Post a walk update   | ✗     | `assigned` (`in_progress`) |
| View a walk update   | `own` | `assigned`                 |
| Delete a walk update | ✗     | `assigned` (own update)    |

> **Note:** Walkers may only post updates while the walk is in progress.
> Owners can read all updates for their own walks in real time.

---

## Invoices

| Operation         | Owner | Walker        |
|-------------------|-------|---------------|
| List invoices     | `own` | ✓             |
| Create an invoice | ✗     | ✓             |
| View an invoice   | `own` | ✓             |
| Update an invoice | ✗     | `own` (draft) |
| Send an invoice   | ✗     | `own` (draft) |
| Mark as paid      | `own` | ✗             |

> **Note:** Only the walker can raise invoices. Sending transitions the
> invoice from `draft` to `sent`; only a draft invoice can be sent. Only the
> owner to whom the invoice is addressed can mark it as paid. The walker can
> see all invoices across all clients. A walker can only edit or send an
> invoice while it is in draft.

---

## Recurring Walks

| Operation                      | Owner | Walker     |
|--------------------------------|-------|------------|
| List recurring walks           | `own` | ✓          |
| Create a recurring walk        | ✓     | ✗          |
| View a recurring walk          | `own` | ✓          |
| Update a recurring walk        | `own` | ✗          |
| Pause a recurring walk         | `own` | ✗          |
| Resume a recurring walk        | `own` | ✗          |
| Cancel a recurring walk        | `own` | ✗          |

> **Note:** Owners create and manage recurring walk schedules. The walker
> has read access to all recurring walk schedules to plan capacity. Pausing
> suspends future WalkRequest generation without losing the schedule;
> cancelling is permanent and prevents new WalkRequests from being generated.
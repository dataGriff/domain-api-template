# Stardogwalker – Domain Model

This document describes the core entities, their attributes, relationships,
and the business rules that govern the Stardogwalker domain.

---

## Entities

### User

Represents a registered user of the platform. A user has one of two roles:
**owner** or **walker**. Authentication is JWT-based.

| Attribute   | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| id          | UUID   | ✓        | System-assigned identifier     |
| email       | string | ✓        | Unique; used to log in         |
| password    | string | ✓        | Minimum 8 characters (hashed) |
| firstName   | string | ✓        |                                |
| lastName    | string | ✓        |                                |
| role        | enum   | ✓        | `owner` or `walker`            |

> **Note on profile data:** `User` holds authentication credentials only.
> `Owner` and `Walker` profiles are the canonical source for display data
> (name, phone, address). `User.email` and `Owner.email` / `Walker.email`
> should match and be kept in sync; the profile email is used for
> communication while the User email is used for login.

---

### Owner (Dog Owner)

A dog owner who uses the platform to book walks for their dogs. Linked 1-to-1
with a **User** account.

| Attribute | Type    | Required | Notes                              |
|-----------|---------|----------|------------------------------------|
| id        | UUID    | ✓        | System-assigned                    |
| firstName | string  | ✓        |                                    |
| lastName  | string  | ✓        |                                    |
| email     | string  | ✓        |                                    |
| phone     | string  | ✓        |                                    |
| address   | Address | ✗        | Embedded value object (see below)  |
| notes     | string  | ✗        | General notes (e.g. access codes)  |
| createdAt | datetime| ✓        | System-assigned                    |
| updatedAt | datetime| ✓        | System-assigned                    |

---

### Walker (Dog Walker)

A dog walker who accepts walk requests and carries out walks. Linked 1-to-1
with a **User** account.

| Attribute   | Type    | Required | Notes                              |
|-------------|---------|----------|------------------------------------|
| id          | UUID    | ✓        | System-assigned                    |
| firstName   | string  | ✓        |                                    |
| lastName    | string  | ✓        |                                    |
| email       | string  | ✓        |                                    |
| phone       | string  | ✓        |                                    |
| address     | Address | ✗        | Embedded value object              |
| bio         | string     | ✗        | Short biography for owners to read                |
| walkRates   | WalkRate[] | ✗        | Rate card; see **WalkRate** value object below    |
| createdAt   | datetime   | ✓        | System-assigned                                   |
| updatedAt   | datetime| ✓        | System-assigned                    |

---

### Dog

A dog belonging to an **Owner**. One owner may have many dogs.

| Attribute       | Type          | Required | Notes                                      |
|-----------------|---------------|----------|--------------------------------------------|
| id              | UUID          | ✓        | System-assigned                            |
| ownerId         | UUID          | ✓        | FK → Owner                                 |
| name            | string        | ✓        |                                            |
| breed           | string        | ✓        |                                            |
| dateOfBirth     | date          | ✓        |                                            |
| sex             | enum          | ✗        | `male` or `female`                         |
| colour          | string        | ✗        |                                            |
| microchipNumber | string        | ✗        | ISO 11784/11785 identifier                 |
| vaccinations    | Vaccination[] | ✗        | List of vaccination records                |
| vetContact      | VetContact    | ✗        | Embedded value object                      |
| medicalNotes    | string        | ✗        | Conditions, medications, allergies         |
| behaviourNotes  | string        | ✗        | Temperament notes useful for walkers       |
| createdAt       | datetime      | ✓        | System-assigned                            |
| updatedAt       | datetime      | ✓        | System-assigned                            |

---

### WalkRequest

A request submitted by an **Owner** asking for a walk for one or more of their
**Dogs**. This is the entry point to the walk booking workflow. A request may
optionally nominate a preferred **Walker**.

| Attribute         | Type     | Required | Notes                                        |
|-------------------|----------|----------|----------------------------------------------|
| id                | UUID     | ✓        | System-assigned                              |
| ownerId           | UUID     | ✓        | FK → Owner                                   |
| dogIds            | UUID[]   | ✓        | FK[] → Dog (≥1 dog per request)              |
| preferredWalkerId | UUID     | ✗        | FK → Walker; optional preference             |
| requestedDate     | date     | ✓        |                                              |
| requestedStartTime| time     | ✓        | RFC 3339 time (`HH:MM:SSZ`)                  |
| durationMinutes   | integer  | ✓        | 15–240 minutes                               |
| walkType          | enum     | ✓        | See **WalkType** enum below                  |
| notes             | string   | ✗        | Special instructions for the walker          |
| status            | enum     | ✓        | See **WalkRequest status lifecycle** below   |
| declineReason     | string   | ✗        | Populated when status = `declined`           |
| walkId            | UUID     | ✗        | FK → Walk; set when request is accepted      |
| recurringWalkId   | UUID     | ✗        | FK → RecurringWalk; set when generated from a recurring schedule |
| createdAt         | datetime | ✓        | System-assigned                              |
| updatedAt         | datetime | ✓        | System-assigned                              |

#### WalkRequest status lifecycle

```
pending ──► accepted ──► (Walk is created)
        │
        └──► declined
        │
        └──► cancelled
```

---

### Walk

A scheduled (or completed/cancelled) walk. Created automatically when a
**Walker** accepts a **WalkRequest**. A walk belongs to exactly one **Owner**,
one **Walker**, and one or more **Dogs**.

| Attribute          | Type     | Required | Notes                                   |
|--------------------|----------|----------|-----------------------------------------|
| id                 | UUID     | ✓        | System-assigned                         |
| requestId          | UUID     | ✓        | FK → WalkRequest                        |
| ownerId            | UUID     | ✓        | FK → Owner                              |
| walkerId           | UUID     | ✓        | FK → Walker                             |
| dogIds             | UUID[]   | ✓        | FK[] → Dog                              |
| scheduledDate      | date     | ✓        |                                         |
| scheduledStartTime | time     | ✓        | RFC 3339 time (`HH:MM:SSZ`)            |
| durationMinutes    | integer  | ✓        |                                         |
| walkType           | enum     | ✓        | Copied from the originating WalkRequest |
| agreedRate         | decimal  | ✓        | Hourly rate in GBP resolved from walker's WalkRate card; total walk cost is derived at invoicing time |
| status             | enum     | ✓        | See **Walk status lifecycle** below     |
| routeNotes         | string   | ✗        | Planned route description               |
| actualStartTime    | datetime | ✗        | Populated when walk is started              |
| actualEndTime      | datetime | ✗        | Populated on completion                 |
| distanceKm         | decimal  | ✗        | Populated on completion                 |
| summaryNotes       | string   | ✗        | Walker's post-walk summary              |
| cancelReason       | string   | ✗        | Populated when status = `cancelled`     |
| createdAt          | datetime | ✓        | System-assigned                         |
| updatedAt          | datetime | ✓        | System-assigned                         |

#### Walk status lifecycle

```
scheduled ──► in_progress ──► completed
          │
          └──────────────────► cancelled
```

---

### WalkUpdate

A real-time update posted by a **Walker** during a walk. Supports two types:
a text **note** or a photo **image**. An unlimited number of updates can be
posted per walk.

| Attribute    | Type     | Required | Notes                                          |
|--------------|----------|----------|------------------------------------------------|
| id           | UUID     | ✓        | System-assigned                                |
| walkId       | UUID     | ✓        | FK → Walk                                      |
| type         | enum     | ✓        | `note` or `image`                              |
| note         | string   | ✗        | Required when `type = note`                    |
| imageUrl     | string   | ✗        | URL of stored image; required when `type = image` |
| imageCaption | string   | ✗        | Optional caption for an image update           |
| createdAt    | datetime | ✓        | System-assigned                                |

---

### Invoice

An invoice raised by a **Walker** against an **Owner** for one or more
completed **Walks**. Each walk appears as a line item.

| Attribute       | Type             | Required | Notes                                       |
|-----------------|------------------|----------|---------------------------------------------|
| id              | UUID             | ✓        | System-assigned                             |
| invoiceNumber   | string           | ✗        | Human-readable reference (e.g. INV-2025-42) |
| ownerId         | UUID             | ✓        | FK → Owner                                  |
| walkerId        | UUID             | ✓        | FK → Walker                                 |
| lineItems       | InvoiceLineItem[]| ✓        | ≥1 line item; each linked to a Walk         |
| subtotal        | decimal          | ✓        | Sum of all line item totals                 |
| taxRate         | decimal          | ✗        | Percentage; defaults to 0                   |
| taxAmount       | decimal          | ✓        | Calculated from subtotal × taxRate          |
| total           | decimal          | ✓        | subtotal + taxAmount                        |
| dueDate         | date             | ✓        |                                             |
| status          | enum             | ✓        | See **Invoice status lifecycle** below      |
| notes           | string           | ✗        | Free-text notes on the invoice              |
| paidAt          | datetime         | ✗        | Populated when status = `paid`              |
| paymentMethod   | enum             | ✗        | `bank_transfer`, `card`, `cash`, `other`    |
| paymentReference| string           | ✗        | Transaction ID or reference                 |
| createdAt       | datetime         | ✓        | System-assigned                             |
| updatedAt       | datetime         | ✓        | System-assigned                             |

#### Invoice status lifecycle

```
draft ──► sent ──► paid
      │       │
      │       └──► overdue
      │
      └──► cancelled
```

---

### InvoiceLineItem (value object)

An individual line on an **Invoice**, representing one completed walk.

| Attribute   | Type    | Required | Notes                          |
|-------------|---------|----------|--------------------------------|
| walkId      | UUID    | ✓        | FK → Walk                      |
| description | string  | ✓        | Human-readable line description|
| quantity    | decimal | ✓        | E.g. hours walked              |
| unitPrice   | decimal | ✓        | Walker's rate per unit in GBP  |
| total       | decimal | ✓        | Calculated: quantity × unitPrice |

---

### InterestRequest

Value objects are embedded within entities and have no independent identity.

### WalkType

An enumeration of the available walk formats offered by the platform.

| Value            | Description                                             |
|------------------|---------------------------------------------------------|
| `solo_walk`      | One-on-one walk with a single dog                       |
| `group_walk`     | Walk shared with dogs from other owners                 |
| `adventure_walk` | Extended off-lead walk in parks or countryside          |
| `puppy_walk`     | Short, structured walk designed for young dogs          |

---

A public enquiry submitted by a prospective client before they have an
account. Managed by the walker as a backlog. Accepted requests automatically
create a **User** and **Owner** profile.

| Attribute      | Type     | Required | Notes                                                    |
|----------------|----------|----------|----------------------------------------------------------|
| id             | UUID     | ✓        | System-assigned                                          |
| firstName      | string   | ✓        |                                                          |
| lastName       | string   | ✓        |                                                          |
| email          | string   | ✓        | Must be unique across existing User records              |
| phone          | string   | ✓        |                                                          |
| postcode       | string   | ✓        | Must be within the Cardiff / South Wales service area    |
| dogDescription | string   | ✓        | Free-text description of the dog(s)                      |
| notes          | string   | ✗        | Internal walker notes; never visible to the prospect     |
| status         | enum     | ✓        | See **InterestRequest status lifecycle** below           |
| declineReason  | string   | ✗        | Populated when status = `declined`                       |
| ownerId        | UUID     | ✗        | FK → Owner; set when status transitions to `accepted`    |
| createdAt      | datetime | ✓        | System-assigned                                          |
| updatedAt      | datetime | ✓        | System-assigned                                          |

#### InterestRequest status lifecycle

```
pending ──► accepted (Owner account created)
        │
        └──► declined
```

---

### RecurringWalk

A recurring walk schedule set up by an **Owner**. The system generates a new
**WalkRequest** automatically on each scheduled occurrence. The walker accepts
or declines each generated request through the standard walk booking flow.

| Attribute          | Type              | Required | Notes                                                        |
|--------------------|-------------------|----------|--------------------------------------------------------------|
| id                 | UUID              | ✓        | System-assigned                                              |
| ownerId            | UUID              | ✓        | FK → Owner                                                   |
| dogIds             | UUID[]            | ✓        | FK[] → Dog; same dogs walked on every occurrence             |
| walkType           | enum              | ✓        | See **WalkType** enum                                        |
| durationMinutes    | integer           | ✓        | 15–240 minutes                                               |
| recurrence         | RecurrenceSchedule| ✓        | See **RecurrenceSchedule** value object below                |
| preferredWalkerId  | UUID              | ✗        | FK → Walker; optional preferred walker for every generated request |
| startDate          | date              | ✓        | Date of the first generated WalkRequest                      |
| endDate            | date              | ✗        | If omitted, schedule continues until paused or cancelled     |
| notes              | string            | ✗        | Standing instructions for every walk in this schedule        |
| status             | enum              | ✓        | See **RecurringWalk status lifecycle** below                 |
| createdAt          | datetime          | ✓        | System-assigned                                              |
| updatedAt          | datetime          | ✓        | System-assigned                                              |

#### RecurringWalk status lifecycle

```
active ──► paused ──► active
       │
       └──► cancelled
```

---

### WalkRate

A single pricing entry in a walker's rate card. The applicable rate for a
walk is determined by matching the walk's **walkType**, the **number of dogs**,
and the **durationMinutes** to an entry in the walker's `walkRates` list.

| Attribute       | Type    | Required | Notes                                              |
|-----------------|---------|----------|----------------------------------------------------|
| walkType        | enum    | ✓        | The walk format this rate applies to               |
| numberOfDogs    | integer | ✓        | Number of dogs this rate applies to (≥ 1)          |
| durationMinutes | integer | ✓        | Walk duration this rate applies to (15–240 min)    |
| ratePerHour     | decimal | ✓        | Hourly rate in GBP for this combination            |

---

### RecurrenceSchedule

Embedded in **RecurringWalk**. Defines the cadence of walk generation.

| Attribute   | Type    | Required | Notes                                                             |
|-------------|---------|----------|-------------------------------------------------------------------|
| frequency   | enum    | ✓        | `weekly` or `fortnightly`                                         |
| dayOfWeek   | enum    | ✓        | `monday` … `sunday`                                               |
| startTime   | time    | ✓        | RFC 3339 time (`HH:MM:SSZ`); applied to every generated request   |

---

### Address

Used by **Owner** and **Walker** (and **VetContact**).

| Attribute | Type   |
|-----------|--------|
| line1     | string |
| line2     | string |
| city      | string |
| postcode  | string |
| country   | string |

### Vaccination

Embedded in **Dog** as a list.

| Attribute        | Type   | Required |
|------------------|--------|----------|
| name             | string | ✓        |
| dateAdministered | date   | ✓        |
| nextDueDate      | date   | ✗        |

### VetContact

Embedded in **Dog**.

| Attribute | Type    | Required |
|-----------|---------|----------|
| name      | string  | ✗        |
| phone     | string  | ✗        |
| address   | Address | ✗        |

---

## Entity Relationship Diagram

```
┌──────────────────────┐
│  InterestRequest      │
│  (public / no auth)   │
└──────────┬───────────┘
           │ accepted (auto-creates)
           ▼
┌──────────┐          ┌──────────┐
│   User   │          │   User   │
│ (owner)  │          │ (walker) │
└────┬─────┘          └────┬─────┘
     │ 1                   │ 1
     │                     │
     ▼ 1                   ▼ 1
┌──────────┐          ┌──────────┐
│  Owner   │          │  Walker  │
└────┬─────┘          └────┬─────┘
     │ 1                   │ 1
     │                     │
     ├─── 1..* ──────────► │
     │    WalkRequest       │
     │    (preferred        │
     │     walker, opt.)    │
     │                     │
     │  (generates)         │
     │ 1                   │
  ┌──┴────────────┐         │
  │ RecurringWalk │         │
  └──────────────-┘         │
     │ 1                   │
     ▼ *                   │
┌──────────┐               │
│   Dog    │               │
└────┬─────┘               │
     │ *                   │ *
     │                     │
     └──────── * ──────────┘
                Walk
                │ 1
                │
                ▼ *
          ┌────────────┐
          │ WalkUpdate │
          │(note/image)│
          └────────────┘

Owner ──── 1 ──► * ──── Invoice ──── * ──► 1 ──── Walker
                             │
                             │ 1..* line items
                             ▼
                         Walk (completed)
```

---

## Aggregate Boundaries

| Aggregate Root  | Contains                                              |
|-----------------|-------------------------------------------------------|
| InterestRequest | Interest enquiry and internal notes                   |
| Owner           | Owner profile, Address                                |
| Walker          | Walker profile, Address, WalkRate[]                   |
| Dog             | Dog details, Vaccination[], VetContact                |
| WalkRequest     | Request details and status                            |
| RecurringWalk   | Recurring schedule, RecurrenceSchedule                |
| Walk            | Walk schedule, status, WalkUpdate[]                   |
| Invoice         | Invoice header, InvoiceLineItem[]                     |

---

## Key Business Rules

1. **One or more dogs per request** – A `WalkRequest` must include at least one dog, and all dogs must belong to the requesting owner.
2. **Walk created on acceptance** – A `Walk` is only created when a `WalkRequest` transitions to `accepted`. Each request produces at most one walk.
3. **Walk updates during active walks** – `WalkUpdate` records (notes and images) are intended to be posted while a walk's status is `in_progress`.
4. **Invoice per owner/walker pair** – An invoice is raised by a walker against a specific owner and references one or more of their completed walks.
5. **Line item totals** – Each `InvoiceLineItem.total` is derived from `quantity × unitPrice`. The invoice `subtotal` is the sum of all line item totals; `total = subtotal + taxAmount`.
6. **Preferred walker** – An owner may nominate a preferred walker on a `WalkRequest`, but any available walker may accept an open request.
7. **Walk duration limits** – Walk duration must be between 15 and 240 minutes.
8. **Password policy** – Passwords must be at least 8 characters.
9. **Rate resolution** – When a walker accepts a `WalkRequest`, the system resolves the `agreedRate` by finding the walker's `WalkRate` entry that exactly matches the request's `walkType`, the number of dogs in `dogIds`, and the `durationMinutes`. All three dimensions must match; if no entry is found the acceptance is rejected with a pricing error.
10. **Walk type required** – Every `WalkRequest` must specify a `walkType` at submission time. Rate resolution against that walk type (see rule 9) is performed only at acceptance time, not at submission time.
11. **Interest request is unauthenticated** – `InterestRequest` submission requires no account. The email provided must be unique across existing `User` records to prevent duplicate accounts.
12. **Account creation on acceptance** – When a walker accepts an `InterestRequest`, the system atomically creates a `User` record and an `Owner` profile populated from the interest request data (firstName, lastName, email, phone). A system-generated invitation credential is issued to the new user. The `InterestRequest.ownerId` is set to the new Owner's id.
13. **Interest postcode validation** – The postcode submitted in an `InterestRequest` should fall within the Cardiff / South Wales service area. Requests outside the service area may be declined by the walker.
14. **Recurring walk request generation** – When a `RecurringWalk` is `active`, the system generates a `WalkRequest` for each upcoming occurrence based on the `RecurrenceSchedule`. Generated requests enter the standard booking flow (pending → accepted/declined). If a generated request is declined, the `RecurringWalk` continues and the next occurrence is still generated.
15. **Recurring walk cancellation** – Cancelling a `RecurringWalk` stops future request generation. Any already-generated `WalkRequest` records in `pending` status are cancelled automatically. Accepted walks are not affected.
16. **Walk start required before updates** – `WalkUpdate` records may only be posted once a walk's status is `in_progress`. The walker must start the walk (transition to `in_progress`) before posting photos or notes.
17. **Scheduling conflict detection** – When a walker accepts a `WalkRequest`, the system checks for overlapping walks already assigned to that walker on the same date. Two walks overlap if their time windows (scheduledStartTime to scheduledStartTime + durationMinutes) intersect. If a conflict is detected, the acceptance is rejected with a scheduling error. This ensures the PRD goal of zero scheduling conflicts.
18. **Overdue invoice auto-flagging** – An invoice in `sent` status whose `dueDate` has passed is automatically transitioned to `overdue`. This may be implemented as a background scheduler or evaluated on read. Once an overdue invoice is paid, it transitions directly to `paid`.
19. **Preferred walker on recurring walks** – A `RecurringWalk` may specify a `preferredWalkerId`. When the system generates `WalkRequest` records from the schedule, the preferred walker is carried forward to each generated request.
20. **Recurring walk request linkage** – Generated `WalkRequest` records include a `recurringWalkId` linking them back to the originating `RecurringWalk`. This is required for pause and cancel operations to identify and cancel pending generated requests.

---

## Implementation Notes

The following areas are intentionally **out of scope** for V1 of the domain model but are acknowledged as future requirements from the PRD:

- **Online payment processing** – The `POST /invoices/{id}/pay` endpoint records that a payment has occurred (method, reference, timestamp) but does not initiate a payment flow with an external provider (e.g. Stripe). Online payment integration is deferred to a future iteration.
- **Notification / event model** – The PRD requires that owners are notified on key state transitions (request accepted/declined, walk started/completed, invoice sent). The mechanism (email, push, webhook) and the event catalogue are not defined here. A lightweight notification entity or event bus specification should be added before implementing notifications.
- **Marketing site content** – The PRD requires a public-facing marketing site. Content for this site is managed outside the API; the API provides only the interest request submission endpoint as the integration point.
- **Audit trail** – With multiple interaction channels (web, mobile, chat, agentic AI), an audit log recording which user and channel performed each state transition is recommended but not yet modelled.

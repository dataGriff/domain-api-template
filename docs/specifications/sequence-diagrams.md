# Sequence Diagrams

Key interaction flows for the Dog Walking Management API, using
[Mermaid](https://mermaid.js.org/) sequence diagrams.

---

## 1. Interest Registration

This flow covers a prospective client discovering the business, registering
their interest via the public marketing site, and the walker converting them
into a full client.

```mermaid
sequenceDiagram
    actor Prospect as Prospective Client
    actor Walker
    participant PublicSite as Marketing Site
    participant API
    participant DB

    Prospect->>PublicSite: Visits stardogwalker.co.uk (Google search)
    PublicSite-->>Prospect: Displays services, walk types, and interest form

    Prospect->>API: POST /interest-requests (no auth)<br/>{firstName, lastName, email, phone, postcode, dogDescription}
    API->>API: Validate postcode is within service area
    API->>DB: Check email not already registered as a User
    DB-->>API: Not found
    API->>DB: Create InterestRequest (status = pending)
    DB-->>API: InterestRequest created
    API-->>Prospect: 201 {id, createdAt}

    Walker->>API: GET /interest-requests?status=pending
    API->>DB: Fetch pending InterestRequests
    DB-->>API: InterestRequest[]
    API-->>Walker: 200 InterestRequestList

    Walker->>API: PUT /interest-requests/{id}<br/>{notes: "Spoke to Sarah, Buddy sounds great"}
    API->>DB: Update InterestRequest notes
    DB-->>API: Updated
    API-->>Walker: 200 InterestRequest

    alt Walker accepts
        Walker->>API: POST /interest-requests/{id}/accept
        API->>DB: Create User account (email from InterestRequest)
        API->>DB: Create Owner profile (firstName, lastName, email, phone)
        API->>DB: Update InterestRequest (status = accepted, ownerId = new Owner.id)
        DB-->>API: All records created
        API->>API: Generate invitation credential / magic link
        API-->>Walker: 200 InterestRequest {status: accepted, ownerId}
        note over API,Prospect: Invitation email sent to Prospect with login link
    else Walker declines
        Walker->>API: POST /interest-requests/{id}/decline<br/>{reason: "Outside service area"}
        API->>DB: Update InterestRequest (status = declined, declineReason)
        DB-->>API: Updated
        API-->>Walker: 200 InterestRequest {status: declined}
    end
```

---

## 2. Authentication

### Register

```mermaid
sequenceDiagram
    actor Client
    participant API
    participant DB

    Client->>API: POST /auth/register<br/>{email, password, firstName, lastName, role}
    API->>API: Validate payload (min 8-char password, unique email)
    API->>DB: Check email not already registered
    DB-->>API: Not found
    API->>DB: Create User record (hashed password)
    DB-->>API: User created
    alt role = owner
        API->>DB: Create Owner profile
    else role = walker
        API->>DB: Create Walker profile
    end
    DB-->>API: Profile created
    API->>API: Generate access token + refresh token (JWT)
    API-->>Client: 201 AuthResponse {accessToken, refreshToken, user}
```

### Login

```mermaid
sequenceDiagram
    actor Client
    participant API
    participant DB

    Client->>API: POST /auth/login {email, password}
    API->>DB: Lookup User by email
    DB-->>API: User record
    API->>API: Verify password hash
    alt credentials valid
        API->>API: Generate access token + refresh token
        API-->>Client: 200 AuthResponse {accessToken, refreshToken, user}
    else credentials invalid
        API-->>Client: 401 Unauthorised
    end
```

---

## 3. Walk Booking

This flow covers an owner submitting a walk request and a walker accepting it.
Rate resolution (step 7) is shown in detail in diagram 3.

```mermaid
sequenceDiagram
    actor Owner
    actor Walker
    participant API
    participant DB

    Owner->>API: POST /walk-requests<br/>{ownerId, dogIds, requestedDate, requestedStartTime,<br/>durationMinutes, walkType, preferredWalkerId?}
    API->>API: Validate all dogIds belong to ownerId
    API->>DB: Create WalkRequest (status = pending)
    DB-->>API: WalkRequest created
    API-->>Owner: 201 WalkRequest {id, status: pending}

    Walker->>API: GET /walk-requests?status=pending
    API->>DB: Fetch pending requests + walker's own assigned requests
    DB-->>API: WalkRequest list
    API-->>Walker: 200 WalkRequestList

    Walker->>API: POST /walk-requests/{id}/accept<br/>{walkerId, confirmedDate, confirmedStartTime}
    API->>DB: Fetch WalkRequest
    DB-->>API: WalkRequest (status = pending)
    API->>DB: Fetch Walker's walkRates
    DB-->>API: WalkRate[]

    API->>API: Resolve agreedRate<br/>(match walkType + numberOfDogs + durationMinutes)
    alt matching WalkRate found
        API->>DB: Update WalkRequest (status = accepted)
        API->>DB: Create Walk<br/>{walkerId, dogIds, scheduledDate, scheduledStartTime,<br/>durationMinutes, walkType, agreedRate, status = scheduled}
        DB-->>API: Walk created
        API-->>Walker: 200 Walk {id, status: scheduled, agreedRate}
    else no matching WalkRate
        API-->>Walker: 400 Bad Request<br/>{code: NO_MATCHING_RATE,<br/>message: No rate found for this walk type, dog count, and duration}
    end
```

---

## 4. Rate Resolution

Detailed view of how `agreedRate` is determined when a walker accepts a
walk request. Rate is matched on all three dimensions simultaneously.

```mermaid
sequenceDiagram
    participant API
    participant RateCard as Walker's WalkRates

    API->>RateCard: Fetch walkRates for walkerId
    RateCard-->>API: WalkRate[]

    API->>API: Derive numberOfDogs from len(dogIds)

    loop For each WalkRate entry
        API->>API: Does walkType match?
        API->>API: Does numberOfDogs match?
        API->>API: Does durationMinutes match?
    end

    alt All three dimensions matched
        API->>API: Set agreedRate = WalkRate.ratePerHour
        API-->>API: Proceed to create Walk
    else No entry matched
        API-->>API: Raise pricing error → return 400
    end
```

---

## 5. Walk Execution

Covers the active phase of a walk, from the walker starting it through to
completion, including real-time updates visible to the owner.

```mermaid
sequenceDiagram
    actor Walker
    actor Owner
    participant API
    participant DB

    Walker->>API: POST /walks/{id}/start<br/>{actualStartTime}
    API->>DB: Update Walk (status = in_progress, actualStartTime)
    DB-->>API: Walk updated
    API-->>Walker: 200 Walk {status: in_progress}

    loop During the walk
        Walker->>API: POST /walks/{id}/updates<br/>{type: note|image, note?, image?, imageCaption?}
        API->>API: Validate walk is in_progress
        API->>DB: Create WalkUpdate
        DB-->>API: WalkUpdate created
        API-->>Walker: 201 WalkUpdateItem

        Owner->>API: GET /walks/{id}/updates
        API->>DB: Fetch WalkUpdates for walkId
        DB-->>API: WalkUpdate[]
        API-->>Owner: 200 WalkUpdateList
    end

    Walker->>API: POST /walks/{id}/complete<br/>{actualStartTime, actualEndTime, distanceKm?, summaryNotes?}
    API->>DB: Update Walk (status = completed, actualEndTime, distanceKm, summaryNotes)
    DB-->>API: Walk updated
    API-->>Walker: 200 Walk {status: completed}
```

---

## 6. Invoice Flow

Covers a walker raising an invoice for one or more completed walks through
to the owner marking it as paid.

```mermaid
sequenceDiagram
    actor Walker
    actor Owner
    participant API
    participant DB

    Walker->>API: POST /invoices<br/>{ownerId, walkerId, lineItems[], dueDate, notes?}
    API->>API: Validate all referenced walks are completed<br/>and belong to this owner/walker pair
    API->>API: Calculate subtotal, taxAmount, total
    API->>DB: Create Invoice (status = draft)
    DB-->>API: Invoice created
    API-->>Walker: 201 Invoice {id, status: draft}

    Walker->>API: PUT /invoices/{id}<br/>(optional: adjust line items before sending)
    API->>DB: Update Invoice (must be status = draft)
    DB-->>API: Invoice updated
    API-->>Walker: 200 Invoice

    note over Walker,API: Walker reviews the draft and sends it when ready.
    Walker->>API: POST /invoices/{id}/send
    API->>DB: Update Invoice (status = sent)
    DB-->>API: Invoice updated
    API-->>Walker: 200 Invoice {status: sent}

    Owner->>API: GET /invoices/{id}
    API->>DB: Fetch Invoice
    DB-->>API: Invoice
    API-->>Owner: 200 Invoice {status: sent, lineItems[], total}

    Owner->>API: POST /invoices/{id}/pay<br/>{paymentMethod, paidAt, reference?}
    API->>API: Validate invoice is in sent or overdue status
    API->>DB: Update Invoice (status = paid, paidAt, paymentMethod, paymentReference)
    DB-->>API: Invoice updated
    API-->>Owner: 200 Invoice {status: paid, paidAt}
```

---

## 7. Recurring Walk Setup

Covers an owner creating a recurring walk schedule and the system generating
the first WalkRequests from it.

```mermaid
sequenceDiagram
    actor Owner
    actor Walker
    participant API
    participant DB

    Owner->>API: POST /recurring-walks<br/>{ownerId, dogIds, walkType, durationMinutes,<br/>recurrence: {frequency, dayOfWeek, startTime},<br/>startDate, endDate?, notes?}
    API->>API: Validate dogIds belong to ownerId
    API->>API: Validate startDate is in the future
    API->>DB: Create RecurringWalk (status = active)
    DB-->>API: RecurringWalk created
    API->>API: Generate WalkRequests from startDate<br/>up to a rolling 4-week window
    API->>DB: Create WalkRequest[] (status = pending, recurringWalkId set)
    DB-->>API: WalkRequests created
    API-->>Owner: 201 RecurringWalk {id, status: active}

    note over API,DB: Scheduler generates new WalkRequests weekly<br/>to maintain the 4-week rolling window.

    Walker->>API: GET /recurring-walks
    API->>DB: Fetch all RecurringWalks
    DB-->>API: RecurringWalk[]
    API-->>Walker: 200 RecurringWalkList

    alt Owner pauses the schedule
        Owner->>API: POST /recurring-walks/{id}/pause
        API->>DB: Update RecurringWalk (status = paused)
        API->>DB: Cancel future pending WalkRequests linked to this schedule
        DB-->>API: Updated
        API-->>Owner: 200 RecurringWalk {status: paused}
    else Owner resumes the schedule
        Owner->>API: POST /recurring-walks/{id}/resume
        API->>DB: Update RecurringWalk (status = active)
        API->>API: Re-generate WalkRequests for rolling 4-week window
        API->>DB: Create WalkRequest[] (status = pending)
        DB-->>API: WalkRequests created
        API-->>Owner: 200 RecurringWalk {status: active}
    else Owner cancels the schedule
        Owner->>API: POST /recurring-walks/{id}/cancel
        API->>DB: Update RecurringWalk (status = cancelled)
        API->>DB: Cancel all future pending WalkRequests linked to this schedule
        DB-->>API: Updated
        API-->>Owner: 200 RecurringWalk {status: cancelled}
    end
```

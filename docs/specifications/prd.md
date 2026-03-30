# Product Requirements Document – Stardogwalker

**Business:** Stardogwalker – Cardiff, South Wales  
**Last updated:** March 2026  
**Status:** Living document

This document describes the problems being solved, the people affected, and
the capabilities the product must have. It does not prescribe implementation
order or technical approach.

---

## 1. Problem Statement

Stardogwalker is a sole-trader dog walking business operating in Cardiff,
South Wales. Today the business is run entirely through informal channels —
WhatsApp messages, phone calls, and cash payments. This creates a number of
real daily frictions:

- Walk bookings get lost or forgotten in chat threads
- There is no single place to record which dogs are being walked, when, and for how long
- Dog medical and behavioural information is held in the walker's memory or scattered notes, creating a safety risk
- Invoicing is done manually and tracking outstanding payments is difficult
- Dog owners have no visibility of their dog during a walk

There is also no way for potential new clients to discover or contact the business online — all new clients come through word of mouth or personal referral.

The goal of this product is to replace informal coordination with a simple, professional platform purpose-built for Stardogwalker, and to make the business publicly discoverable so potential clients can find and register their interest online. The platform must support multiple interaction channels — web, mobile, chat, and agentic AI — from the same backend, without duplication of business logic.

---

## 2. Goals

| Goal | Measure of success |
|---|---|
| Make the business discoverable online | Public marketing site indexed by search engines at launch |
| Build a client backlog | Interest requests captured in the app rather than via WhatsApp |
| Eliminate missed or double-booked walks | Zero scheduling conflicts after launch |
| Give dog owners peace of mind during walks | Owners receive at least one photo or note per walk |
| Remove manual invoicing effort | All invoices created and tracked in the app |
| Maintain a safe central record of dog information | All active client dogs have a complete profile in the app |
| Professional client experience | Clients able to self-serve bookings without WhatsApp |
| Multi-channel reach | Same API serves web, mobile, chat, and agentic clients without backend changes |

---

## 3. User Personas

### Persona 1 – The Prospective Client

**Who:** Member of the public in Cardiff, South Wales searching for a dog walker.

**Needs:**
- Find a professional online presence when searching locally
- Learn about services, walk types, and the walker
- Register interest without making a phone call
- Receive a response and, if accepted, become a client automatically

---

### Persona 2 – The Dog Walker

**Who:** The sole trader running Stardogwalker, Cardiff, South Wales.

**Needs:**
- See a clear daily schedule without managing a chat thread
- Access dog medical, behaviour, and access notes instantly before a walk
- Record walk activity (photos, notes, distance) from a mobile device during a walk
- Create and send invoices quickly at the end of each period
- Track which invoices are outstanding

---

### Persona 3 – The Dog Owner

**Who:** Registered client in Cardiff, South Wales.

**Needs:**
- Submit and track walk bookings without WhatsApp
- See live updates and photos during their dog's walk
- View invoices and record payment in one place

---

## 4. Functional Requirements

The product must provide the following capabilities.

### Discoverability

- A public-facing marketing site, indexable by search engines, that describes Stardogwalker's services, walk types, and how to get in touch
- A public interest registration form requiring no account, capturing name, email, phone number, postcode, and a description of the dog(s)
- A walker-only backlog of submitted interest requests, with the ability to accept or decline each one with an optional reason
- When the walker accepts an interest request, the prospective client is automatically registered as a dog owner and receives an invitation to set up their account

### Authentication

- Users can register, log in, and log out
- Sessions can be extended without re-entering credentials
- Roles: dog owner, dog walker

### Owner and Dog Management

- Dog owners can create and manage their own profile
- Dog owners can create and manage profiles for each of their dogs, including breed, date of birth, medical notes, behaviour notes, and vet contact details
- The walker can view dog profiles for any dog on an assigned walk

### Walker and Rate Card Management

- The walker can create and manage her profile
- The walker can define a rate card specifying a price per walk type, number of dogs, and duration
- The system resolves the agreed rate automatically when a walk is accepted; if no matching rate exists, the acceptance is blocked with a clear message

### Walk Requests

- Dog owners can submit a walk request specifying date, time, duration, walk type, and which dogs to include
- Dog owners can cancel a pending request
- Dog owners can view the status of their requests
- The walker can view all pending requests and accept or decline each one
- When a request is accepted, a scheduled walk is created with the agreed rate applied
- Owners are notified when their request is accepted or declined

### Walk Execution

- The walker can mark a walk as started and as completed, recording end time, distance, and summary notes
- The walker can cancel a scheduled walk with a reason
- Dog owners can cancel a scheduled walk before it has started
- The walker can post photo and text updates during a walk
- Dog owners can view updates and the walk summary at any time

### Invoicing

- The walker can create invoices covering one or more completed walks
- The walker can send an invoice to the relevant dog owner
- Dog owners can view their invoices and record payment
- The walker can see which invoices are outstanding
- Invoices past their due date are automatically flagged as overdue
- Dog owners can pay invoices online without a manual bank transfer

### Recurring Walks

- Dog owners can set up a recurring walk schedule so they do not need to rebook manually each week

---

## 5. Channel Strategy

The platform serves multiple interaction channels from a single backend. All
business logic is centralised; no channel re-implements it.

| Channel | Notes |
|---|---|
| Web app (browser, mobile-responsive) | Primary launch channel |
| Native mobile app (iOS / Android) | Second channel; no backend changes required |
| Email notifications | Triggered by domain events |
| Chat interface (WhatsApp / SMS bot) | Natural language over the same backend |
| Agentic app (AI agent / LLM tool use) | Programmatic access over the same backend |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Availability** | 99.5% uptime during business hours (07:00–20:00 GMT) |
| **Response time** | All responses returned within 500ms under normal load |
| **Security** | All endpoints authenticated; HTTPS only; passwords stored with a strong one-way hash; OWASP Top 10 mitigations applied |
| **Data residency** | All data stored in UK data centres (GDPR compliance) |
| **Photo storage** | Walk update photos stored separately from the main database |
| **Mobile-friendly** | Web app fully usable on a mobile phone without a native app install |


# domain-api-template

A **GitHub Template repository** for building spec-driven, contract-first REST APIs with Node.js/Express.

> **This is a template.** Use it to bootstrap a new business domain API in minutes — write your specs, then implement.

## How to Use This Template

### 1. Create a new repository from this template

Click **Use this template** on GitHub to create a new repository for your domain.

### 2. Bootstrap the domain spec pack

```bash
task api:install        # install dependencies
task domain:init        # copy blank spec templates into docs/specifications/
```

### 3. Fill in your domain specifications

Edit the files created in `docs/specifications/`:

| File | What to fill in |
|------|----------------|
| `prd.md` | Problem statement, personas, user stories, goals |
| `domain-model.md` | Entities, attributes, relationships, business rules |
| `auth-matrix.md` | Roles and what each role can do |
| `sequence-diagrams.md` | Key interaction flows (Mermaid) |
| `contracts/openapi.yaml` | REST API contract (OpenAPI 3.0.3) |
| `contracts/asyncapi.yaml` | Domain event contract (AsyncAPI 2.6.0) |

### 4. Implement the API

With specs in place, implement routes, store, and tests to match:

```bash
task api:dev      # start dev server with hot reload
task api:test     # run tests
task lint         # lint OpenAPI + AsyncAPI contracts
```

### 5. Validate everything

```bash
task domain:check   # runs lint + tests together
```

---

## New Domain Checklist

Use this checklist each time you instantiate the template for a new project:

- [ ] Create repo from template ("Use this template" on GitHub)
- [ ] Update repo name/description in `api/package.json` and `mkdocs.yml`
- [ ] Run `task api:install`
- [ ] Run `task domain:init` to copy blank specs
- [ ] Fill in `docs/specifications/prd.md`
- [ ] Fill in `docs/specifications/domain-model.md`
- [ ] Fill in `docs/specifications/auth-matrix.md`
- [ ] Fill in `docs/specifications/sequence-diagrams.md`
- [ ] Fill in `docs/specifications/contracts/openapi.yaml`
- [ ] Fill in `docs/specifications/contracts/asyncapi.yaml`
- [ ] Update `api/src/store.js` with domain entities
- [ ] Replace example routes in `api/src/routes/` with domain routes
- [ ] Replace example tests in `api/tests/` with domain tests
- [ ] Run `task domain:check` — all green
- [ ] Update `README.md`, `AGENTS.md`, and `docs/index.md` for your domain
- [ ] Enable "Template repository" in Settings if reusing as a template

---

## What's Included

### Template Engine (domain-agnostic)

| Area | Location | Description |
|------|----------|-------------|
| API scaffolding | `api/src/app.js` | Express app with CORS, rate limiting, OpenAPI validation middleware |
| Auth | `api/src/auth.js`, `api/src/middleware/authenticate.js` | JWT-based auth with role checking |
| Error handling | `api/src/middleware/errorHandler.js` | Centralised error handler |
| Test helpers | `api/tests/helpers.js` | Token/store helpers for integration tests |
| Taskfiles | `Taskfile.yml`, `Taskfile.api.yml` | All automation tasks |
| Spec linting | `.spectral-openapi.yaml`, `.spectral-asyncapi.yaml` | Spectral rulesets |
| Docs | `mkdocs.yml` | MkDocs Material site |
| CI | `.github/workflows/` | GitHub Actions: API tests + docs deploy |
| AI guidelines | `.github/instructions/`, `AGENTS.md` | Copilot/agent rules (specs-first, task-first) |

### Example Domain (dog-walking)

The working example included in this template is a **dog-walking management platform**. It demonstrates all the patterns you need to follow:

- OpenAPI + AsyncAPI contracts → `docs/specifications/contracts/`
- Auth matrix → `docs/specifications/auth-matrix.md`
- Domain model → `docs/specifications/domain-model.md`
- Sequence diagrams → `docs/specifications/sequence-diagrams.md`
- Routes → `api/src/routes/`
- Store → `api/src/store.js`
- Tests → `api/tests/`

You can keep this example as reference, or replace it entirely with your new domain.

### Blank Spec Templates

Ready-to-fill templates for a new domain live in `docs/specifications/_template/`. Run `task domain:init` to copy them.

---

## Key Principles

1. **Specs drive code** — if code and spec disagree, fix the code
2. **Do not edit `docs/specifications/` incidentally** — spec changes are deliberate business decisions
3. **Task-first** — always run `task` to discover available commands; never run raw CLI commands
4. **OpenAPI is authoritative** — routes, request/response shapes, and status codes must match the spec
5. **Auth matrix is authoritative** — all access control logic must match the matrix exactly

---

## Running Locally

```bash
task api:install   # install npm dependencies
task api:dev       # start server on http://localhost:3000
task api:test      # run all tests
task lint          # lint contracts
task docs:serve    # serve docs on http://localhost:8000
```

## CI

GitHub Actions workflows run automatically on push/PR to `main`:

- `api-tests.yml` — installs dependencies and runs `task api:test`
- `docs.yml` — lints contracts and deploys MkDocs to GitHub Pages

---

## GitHub Template Repository

To mark this repo as a GitHub Template (so the "Use this template" button appears):

1. Go to **Settings** for this repository
2. Under **General**, check **Template repository**

This allows anyone to create a new repo with this codebase as a starting point.
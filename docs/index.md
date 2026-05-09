# Domain API Template

A design-and-contracts-only workspace for long-lived domain requirements, rules, and contracts.

---

## Specifications

All authoritative business requirements live in `docs/specifications/`.
**Code must conform to specs, not the other way around.**

| Document | Description |
|---|---|
| [Product Requirements](specifications/prd.md) | Problem statement, personas, user stories, goals |
| [Domain Model](specifications/domain-model.md) | Entities, attributes, relationships, business rules |
| [Auth Matrix](specifications/auth-matrix.md) | Roles and which operations each role may perform |
| [Sequence Diagrams](specifications/sequence-diagrams.md) | Key interaction flows (Mermaid) |
| [**Domain Overview →**](specifications/domain-overview.html) | Auto-generated: operations, events, entities, ER diagram and data contract in one page |
| [**Interactive API Reference →**](specifications/api-reference.html) | OpenAPI 3.0.3 contract — live try-it-out |
| [**AsyncAPI Event Reference →**](specifications/asyncapi-reference.html) | Domain event catalogue — CloudEvents schemas |
| [Data Contract](specifications/contracts/datacontract.yaml) | ODCS 3.1 data contract — historical event payload schema |

Raw contract files: [`specifications/contracts/openapi.yaml`](specifications/contracts/openapi.yaml) · [`specifications/contracts/asyncapi.yaml`](specifications/contracts/asyncapi.yaml) · [`specifications/contracts/datacontract.yaml`](specifications/contracts/datacontract.yaml)

---

## Tasks

All automation is in `Taskfile.yml`.
Always use `task`.

```bash
task                # list all available tasks
task lint           # lint OpenAPI + AsyncAPI + data contract
task lint:datacontract  # lint ODCS data contract only
task domain:check   # lint + regenerate domain overview
task domain:init    # seed blank spec templates into docs/specifications/
task docs:generate  # (re)generate the domain overview HTML page from specs
task docs:serve     # serve this documentation site locally
```

---

## Key Principles

1. **Specs drive code.** If code and spec disagree, fix the code — not the spec.
2. **Do not edit `docs/specifications/` incidentally.** Spec changes are deliberate business decisions.
3. **Domain model is authoritative for naming.** Entity and attribute names defined here must be used consistently across implementations.
4. **Auth matrix is authoritative for access control.** Implementation access logic must match it exactly.
5. **OpenAPI contract is authoritative for the REST API.** Paths, methods, request/response shapes, and status codes must match.
6. **AsyncAPI contract is authoritative for domain events.** Event channel names, message schemas, and CloudEvents attributes must match `docs/specifications/contracts/asyncapi.yaml`.
7. **Data contract is authoritative for historical event payload schema.** Field names, types, and constraints in `docs/specifications/contracts/datacontract.yaml` must match the published event payloads.
8. **Task-first.** Run `task` to discover commands. If no task exists for an operation, add one before running it.
9. **Business language over CRUD.** Use domain verbs in specs, user stories, descriptions, and comments. Prefer "add / edit / remove / archive" over "create / update / delete" in any human-readable context. HTTP methods and technical identifiers keep their technical names.
10. **Implementation guidance is reusable and technology-agnostic.** Use `.github/instructions/api-implementation.instructions.md` to implement these contracts consistently once this template is instantiated, without prescribing a framework/runtime.

---

## Bootstrap a New Domain

1. Create a new repo from this template (**Use this template** on GitHub)
2. `task domain:init` — copies blank spec templates into `docs/specifications/`
3. Fill in each spec file (start with `prd.md`, then `domain-model.md`, `auth-matrix.md`, `sequence-diagrams.md`, finally the contracts: `openapi.yaml`, `asyncapi.yaml`, `datacontract.yaml`)
4. `task domain:check` — ensure contracts lint and docs regenerate successfully
5. Update `README.md` and this file (`docs/index.md`) for your domain context

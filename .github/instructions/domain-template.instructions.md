---
description: "Use when bootstrapping a new business domain into this template repository. Covers the domain:init workflow, spec-first principles, and what to change vs what to keep."
applyTo: "docs/specifications/_template/**,Taskfile.yml"
---

# Domain Template — Bootstrap Guidelines

## Purpose

This repository is a **reusable template**. When instantiating it for a new business domain, follow this workflow precisely to ensure the specs-first approach is maintained.

## Bootstrap Workflow

### Step 1: Run `task domain:init`

```bash
task domain:init
```

This copies the blank spec templates from `docs/specifications/_template/` into `docs/specifications/` (without overwriting any existing files). Run with `FORCE=true` to overwrite:

```bash
task domain:init FORCE=true
```

### Step 2: Fill in the domain specifications (in order)

Edit the files in `docs/specifications/` in this recommended order:

1. **`prd.md`** — Define the problem, personas, and user stories first. This anchors everything else.
2. **`domain-model.md`** — Define entities, attributes, and relationships from the PRD.
3. **`auth-matrix.md`** — Define roles and access rules. Derive from PRD user stories.
4. **`sequence-diagrams.md`** — Define key interaction flows. Derive from PRD + domain model.
5. **`contracts/openapi.yaml`** — Define the REST API contract. Must match domain model + auth matrix.
6. **`contracts/asyncapi.yaml`** — Define domain events. Derive from state transitions in domain model.

### Step 3: Validate

```bash
task domain:check   # lint contracts + regenerate domain overview docs
```

## Key Rules During Bootstrap

1. **Fill specs completely before writing any code.** Code written before specs are complete will drift.
2. **Do not modify `docs/specifications/_template/`.** That directory is the reusable template pack — only edit the copies in `docs/specifications/`.
3. **Entity names in code must exactly match `domain-model.md`.** Do not invent synonyms.
4. **Every route must correspond to an operation in `openapi.yaml`.** No "extra" routes.
5. **Every access control check must correspond to a rule in `auth-matrix.md`.** No ad-hoc restrictions.

## What to Keep vs Replace

### Keep (design and contract source — do not change unless there is a clear reason):
- `Taskfile.yml` — project-wide tasks for linting and docs
- `.spectral-openapi.yaml`, `.spectral-asyncapi.yaml` — Linting rulesets
- `.github/` — CI workflows and Copilot instructions
- `.github/instructions/api-implementation.instructions.md` — reusable implementation conformance guide for downstream repos

### Replace (domain pack — this is what changes per project):
- `docs/specifications/` — All spec files (use `task domain:init` to start)
- `README.md` — Project description
- `AGENTS.md` — Project-specific AI guidelines
- `docs/index.md` — Docs homepage
- `mkdocs.yml` — Site name, URL, repo name

## When Working on Specs vs Code

- If asked to **change a spec file**: confirm this is a deliberate business decision. Spec changes ripple into code — do them intentionally.
- If asked to **change implementation details**: keep runtime/framework code out of this repository and update design/contracts plus reusable implementation guidance when needed.
- If **spec and downstream implementation disagree**: update implementation in its own repo, not here.

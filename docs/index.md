# Domain API Template Docs

A spec-driven, contract-first REST API template — ready to be instantiated for any business domain.

> The **Items** example domain is included as a working reference implementation.
> [See the README](https://github.com/dataGriff/domain-api-template#readme) for the full "How to use this template" guide.

## Documentation

| Document | Description |
|---|---|
| [Product Requirements](specifications/prd.md) | Problem statement, personas, user stories, and goals |
| [Domain Model](specifications/domain-model.md) | Domain entities, relationships, business rules, and aggregate boundaries |
| [Auth Matrix](specifications/auth-matrix.md) | Authorisation matrix — which roles can perform which operations |
| [Sequence Diagrams](specifications/sequence-diagrams.md) | Mermaid sequence diagrams for all key interaction flows |
| [**Interactive API Reference →**](specifications/api-reference.html) | Full REST API contract with live try-it-out and multi-language code samples |
| [**AsyncAPI Event Reference →**](specifications/asyncapi-reference.html) | Full domain event catalogue with CloudEvents 1.0 schemas and AMQP channel bindings |

## Example Domain: Items

The included example is a minimal **Items catalogue** — two roles (`contributor`, `viewer`) and one resource (`items`):

- **Authentication** — Register, log in, refresh tokens, log out (JWT-based)
- **Items** — Contributors can create, update, and delete their own items; viewers can list and read

This is intentionally generic so the template patterns are easy to spot and replace.

## Using This Template

To use this template for a new domain:

1. Create a new repo from this template (click **Use this template** on GitHub)
2. Run `task domain:init` to copy blank spec templates
3. Fill in your domain specifications
4. Implement routes and tests to match
5. Run `task domain:check` to validate

## API Contracts

The raw OpenAPI 3.0.3 spec is at [`specifications/contracts/openapi.yaml`](specifications/contracts/openapi.yaml).

The AsyncAPI 2.6.0 event contract is at [`specifications/contracts/asyncapi.yaml`](specifications/contracts/asyncapi.yaml).

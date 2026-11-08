# iconfigly-web

Modern, enterprise-grade developer control plane and configuration management interface built with Next.js 16 (App Router, Turbopack) and TypeScript.

---

## Overview

`iconfigly-web` provides a unified administrative console for distributed system configuration, environment drift governance, microservice dependency visualization, and immutable audit inspection. Designed following Domain-Driven Design (DDD) and Clean Architecture principles, it features a minimalist design system inspired by contemporary cloud dashboards with responsive layout controls and seamless dark/light theme adaptation.

---

## Key Features

- **Domain-Driven Architecture**: Clear separation of concern across domain definitions, infrastructure adapters, atomic UI components, and presentation layers.
- **Enterprise Design System**: Minimalist monochrome aesthetics with high-contrast surfaces, responsive collapsible side rails, and custom status badging.
- **Microservice Catalog & Dependency Graph**: Interactive topology inspection mapping service dependencies, bindings, and cloud resources.
- **Environment Management**: First-class support for multi-tier lifecycle stages (`DEV`, `QA`, `UAT`, `PROD`) with drift detection indicators.
- **Cryptographic Audit Viewer**: Tamper-evident ledger inspection interface displaying SHA-256 hash chains with real-time integrity verification indicators.
- **Role-Based Access Control (RBAC)**: User provisioning, team assignments, and granular permission governance directly in the UI.
- **Dual Theme Support**: Default clean light theme with seamless dark mode switching persisted via local storage.
- **BFF (Backend-For-Frontend) Route Proxy**: Integrated `/api/v1/[...path]` route handling secure session forwarding, cookie protection, and upstream Go API abstraction.

---

## Architecture

The frontend follows strict layered architecture:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/                     # Control plane sign-in
│   │   └── setup/                     # Initial cluster setup wizard
│   ├── (dashboard)/
│   │   ├── dashboard/                 # Overview & telemetry metrics
│   │   ├── projects/[projectId]/
│   │   │   ├── access/                # Role bindings & access control
│   │   │   ├── environments/          # Environment configuration
│   │   │   ├── graph/                 # Interactive dependency topology
│   │   │   ├── resources/             # Provisioned cloud resources
│   │   │   └── services/              # Microservice catalog & detail
│   │   ├── audit/                     # Cryptographic audit ledger
│   │   ├── settings/tokens/           # Personal Access Tokens (PAT)
│   │   ├── teams/                     # Team management & rosters
│   │   └── users/                     # User directory & permissions
│   └── api/v1/[...path]/              # Next.js BFF upstream API proxy
├── components/
│   ├── layout/                        # Header, Sidebar, ThemeProvider
│   └── ui/                            # Atomic UI primitives (Shadcn-based)
├── domain/                            # Enterprise domain models & contracts
└── infrastructure/                    # HTTP client, cookies, session adapters
```

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (or Docker `node:26-bookworm-slim`)
- **Package Manager**: `npm` v10+
- **Backend API**: Running `iconfigly-api` instance (default: `http://localhost:8080`)

---

## All Frontend Commands

### Development Server

Start the local development server with Turbopack fast refresh:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Production Build

Compile TypeScript and generate an optimized production build:

```bash
npm run build
```

### Production Server

Run the pre-built Next.js production server:

```bash
npm run start
```

### Code Quality & Static Analysis

Execute ESLint static analysis across all TypeScript and React files:

```bash
npm run lint
```

Run TypeScript type check without emitting compiler output:

```bash
npx tsc --noEmit
```

### End-to-End Testing (Playwright)

Execute the complete end-to-end test suite headlessly:

```bash
npx playwright test
```

Run Playwright tests in interactive UI mode:

```bash
npx playwright test --ui
```

Run tests with step-by-step visual debugging:

```bash
npx playwright test --debug
```

Run a specific Playwright test specification:

```bash
npx playwright test e2e/auth.spec.ts
```

View the generated HTML test report:

```bash
npx playwright show-report
```

### Dependency Audit & Security

Check dependencies for known security vulnerabilities:

```bash
npm audit
```

Automatically update and patch vulnerable dependencies:

```bash
npm audit fix
```

---

## Docker Commands

Run within the Docker Compose development environment:

```bash
# Start frontend container
docker compose up iconfigly-web

# Rebuild frontend container
docker compose up -d --build iconfigly-web

# Inspect frontend container logs
docker logs -f iconfigly-web

# Execute commands inside running container
docker exec -it iconfigly-web npm run lint
docker exec -it iconfigly-web npm run build
docker exec -it iconfigly-web npx playwright test
```

---

## Environment Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `API_URL` | String | `http://iconfigly-api:8080` (Docker) / `http://localhost:8080` | URL of the upstream `iconfigly-api` gateway |
| `PORT` | Number | `3000` | Port on which the Next.js server listens |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `production`, `test`) |

---

## Seeded Test Accounts

For local development and testing, use the following seeded accounts:

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `alice@acme.local` | `AdminPassword123!` | Full cluster access, organization administration, user management |
| **Developer** | `bob@acme.local` | `BobPassword123!` | Project viewer/editor, service catalog access, environment config |

---

## Route Catalog

| Path | Purpose | Access |
| :--- | :--- | :--- |
| `/login` | Control plane authentication entrypoint | Public |
| `/setup` | First-time cluster super-admin initialization wizard | Public (uninitialized only) |
| `/dashboard` | System health overview, statistics, and quick navigation | Authenticated |
| `/projects/[projectId]/services` | Microservice catalog and dependency mappings | Authenticated |
| `/projects/[projectId]/services/[serviceSlug]` | Microservice configuration details and bindings | Authenticated |
| `/projects/[projectId]/environments` | Environment tiers (`DEV`, `QA`, `UAT`, `PROD`) | Authenticated |
| `/projects/[projectId]/resources` | Provisioned infrastructure resources | Authenticated |
| `/projects/[projectId]/graph` | Dynamic dependency topology visualizer | Authenticated |
| `/projects/[projectId]/access` | Project-level RBAC role bindings | Authenticated (Admin) |
| `/teams` | Team directory and creation | Authenticated |
| `/teams/[teamId]` | Team membership and access policies | Authenticated |
| `/users` | Global user directory, role assignments, status management | Authenticated (Admin) |
| `/audit` | Immutable SHA-256 cryptographic audit event log | Authenticated |
| `/settings/tokens` | Personal Access Token (PAT) generation and revocation | Authenticated |
| `/api/v1/[...path]` | Backend-For-Frontend proxy to upstream Go API | Public / Session Proxied |

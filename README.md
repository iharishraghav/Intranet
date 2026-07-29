# Intranet

Internal web application for organization-wide communication: announcements, events, blogs, resources, quick links, upcoming employee birthdays, and a daily mood check-in.

## Documentation

- [project-scope.md](./project-scope.md) — problem, features, and user roles
- [tech-stack.md](./tech-stack.md) — stack and open decisions
- [implementation-plan.md](./implementation-plan.md) — phased delivery plan

## Requirements

- Node.js `^20.19.0 || >=22.12.0` (required by Vite)
- npm 10+ (uses workspaces)

## Setup

```bash
npm install
```

One install at the root covers both workspaces.

## Development

```bash
npm run dev
```

Runs both workspaces concurrently:

- Client (Vite): http://localhost:5173
- Server (Express): http://localhost:3001

The Vite dev server proxies `/api` to the Express server, so the client can call `/api/...` directly without any CORS configuration.

## Commands

Run these from the repo root.

| Command                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Start client and server together                         |
| `npm run build`        | Type-check and build both workspaces                     |
| `npm run lint`         | Lint both workspaces with oxlint (warnings fail the run) |
| `npm run format`       | Format the repo with Prettier                            |
| `npm run format:check` | Verify formatting without writing — use this in CI       |

Target a single workspace with `-w`, for example `npm run dev -w server`.

## Structure

```
client/   React + TypeScript, bundled with Vite
server/   Express + TypeScript
```

Linting is configured per workspace (`.oxlintrc.json`); formatting is configured once at the repo root (`.prettierrc.json`).

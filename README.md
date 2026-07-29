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

## Commit messages

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/). A Husky `commit-msg` hook runs commitlint and rejects anything that doesn't match, so a bad message fails before the commit is created.

```
<type>(<optional scope>): <subject>
```

| Type       | Use for                                     |
| ---------- | ------------------------------------------- |
| `feat`     | A new feature                               |
| `fix`      | A bug fix                                   |
| `docs`     | Documentation only                          |
| `style`    | Formatting only, no code change             |
| `refactor` | Neither fixes a bug nor adds a feature      |
| `perf`     | Performance improvement                     |
| `test`     | Adding or correcting tests                  |
| `build`    | Build system or dependencies                |
| `ci`       | CI configuration and scripts                |
| `chore`    | Maintenance, tooling, housekeeping          |
| `revert`   | Reverts a previous commit                   |

Rules: subject is required and must not be Capitalized or Title Case; the header is capped at 100 characters. Breaking changes take a `!` before the colon (`feat!: drop Zoho SSO v1`) or a `BREAKING CHANGE:` footer.

```bash
feat(announcements): add end-date auto-expiry
fix(auth): redirect to login when the session token expires
chore(deps): bump prisma to 6.2
docs: document the birthdays endpoint
```

The hook is installed by the `prepare` script, so it is active after `npm install` — no extra step. Rules live in [commitlint.config.mjs](./commitlint.config.mjs).

## Structure

```
client/   React + TypeScript, bundled with Vite
server/   Express + TypeScript
```

Linting is configured per workspace (`.oxlintrc.json`); formatting is configured once at the repo root (`.prettierrc.json`).

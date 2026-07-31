# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the **Context7 MCP** (`mcp__context7__resolve-library-id`, then `mcp__context7__query-docs`) to fetch
up-to-date documentation before writing code against any library, framework, SDK, API, CLI, or cloud
service in this repo — React, Vite, Express, TypeScript, Prisma, Azure SDKs, Zoho SSO, and so on.

This matters more than usual here: the stack is pinned to very recent majors (React 19, Express 5,
Vite 8, TypeScript 6, oxlint 1.x). Training data is likely to describe the previous major. Resolve the
library ID first, then query one concept per call; split multi-topic questions into separate queries.

Skip Context7 for refactoring, business-logic debugging, and general programming questions.

## Project

Internal organization intranet: announcements, events, blogs, resources, quick links, upcoming employee
birthdays, and an anonymous daily mood check-in. Two roles — `User` and `Admin`; admins get CRUD over
every entity. Auth is Zoho SSO, domain-restricted.

Read [docs/project-scope.md](./docs/project-scope.md) for the feature set,
[docs/tech-stack.md](./docs/tech-stack.md) for the chosen stack, and
[docs/implementation-plan.md](./docs/implementation-plan.md) for the phased build order. The plan is
the source of truth for what comes next — the repo is currently at the tail of Phase 0.

Target stack per `tech-stack.md`, most of it not yet wired up: Prisma for schema/migrations, Azure App
Service + Azure Database for PostgreSQL, Azure Blob Storage for resource files, and an Azure Function
(timer trigger) for auto-expiring announcements/events.

## Current state

Only a health-check vertical slice exists: `GET /api/health` on the server, and an `App.tsx` that
fetches it to show connection status. No database, no auth, no domain models, no tests.

**`README.md` describes an npm-workspaces monorepo, but that isn't set up yet.** The root
`package.json` exists but is **tooling-only** — it holds Husky and commitlint and has no `workspaces`
field. `client/` and `server/` each have their own `package.json` and `package-lock.json` and are still
installed independently. Root-level scripts the README lists (`npm run dev`, `build`, `typecheck`,
`lint`, and `-w` targeting) do not exist. Use the per-workspace commands below, or add the `workspaces`
field and root scripts and then make the README true.

The API port is also inconsistent: `server/.env.example` and the README say `4000`, while the server
default (`src/index.ts`), the Vite proxy target, and the client's error copy all say `3000`. Pick one
and fix all five places together.

## Commands

Run from the respective workspace directory. `npm install` is per-workspace.

**repo root/** — tooling only, no application code.

| Command       | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `npm install` | Installs Husky + commitlint and activates the git hooks (`prepare`) |

Run this once after cloning, otherwise the `commit-msg` hook won't be installed and bad commit
messages will go through unchecked.

**client/**

| Command        | Description                                              |
| -------------- | -------------------------------------------------------- |
| `npm run dev`  | Vite dev server on :5173, proxying `/api` to the API port |
| `npm run build`| `tsc -b` project build, then `vite build`                 |
| `npx tsc -b`   | Typecheck only (no `typecheck` script defined)            |
| `npx oxlint`   | Lint (oxlint is a devDependency; no `lint` script defined)|

**server/**

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | `tsx watch src/index.ts`, reloads on change        |
| `npx tsc`           | Compile to `dist/` (no `build` script defined)     |
| `npx tsc --noEmit`  | Typecheck only                                     |
| `node dist/index.js`| Run the compiled server (no `start` script defined) |

Both workspaces must be running for the client to reach the API. Copy `server/.env.example` to
`server/.env` before starting the server.

No test runner is configured. Testing lands in Phase 6 of the implementation plan; pick and wire up a
runner when you get there rather than assuming one exists.

## Architecture

**Single-origin in development.** The browser only ever talks to `:5173`. `client/vite.config.ts`
proxies `/api` to the Express server, so client code uses relative paths (`fetch('/api/health')`) with
no base URL or CORS handling. Preserve that — don't introduce absolute API URLs or a
`VITE_API_URL`-style env var without also reworking the proxy.

**Two independent TypeScript programs, deliberately different.**

- `server/` — ESM with `module: NodeNext`, emitting to `dist/`. Strictness is turned well past
  `strict`: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `useUnknownInCatchVariables`, `noUnusedLocals`/`noUnusedParameters`. Indexed access yields
  `T | undefined` and optional properties reject explicit `undefined` — write code that satisfies these
  rather than loosening the config.
- `client/` — solution-style `tsconfig.json` referencing `tsconfig.app.json` (app source, `noEmit`,
  bundler resolution) and `tsconfig.node.json` (Vite config). Add app source under `src` only;
  edit the referenced configs, not the root one.

Both set `verbatimModuleSyntax`, so type-only imports must be written `import type { ... }`.

**Error modeling on the client.** `App.tsx` models async state as a discriminated union
(`{ state: 'checking' | 'ok' | 'error' }`) and guards `setState` with an `active` flag in the effect
cleanup. Follow this shape for new data fetching instead of parallel `loading`/`error`/`data` booleans.

**Mood check-in is a privacy constraint, not just a feature.** One submission per employee per day must
be enforced *without* persisting any queryable link between an employee and their submission. No role,
including Admin, may retrieve an individual response — only aggregates. This shapes the schema, so get
it right when Phase 4 arrives; retrofitting it is not possible.

## Conventions

- Commit messages: **Conventional Commits**, enforced by commitlint via a Husky `commit-msg` hook
  (`commitlint.config.js` extends `@commitlint/config-conventional`). Format is
  `type(optional-scope): subject`, e.g. `feat(server): add health check endpoint`.
  - Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`,
    `style`, `test`. Type must be lower case and is required.
  - Subject must not start with a capital (no sentence/start/pascal/upper case), must not end with a
    period, and must not be empty. Header is capped at 100 characters.
  - Breaking changes use `type!: subject` or a `BREAKING CHANGE:` footer.

  Note: commits made before this hook was added use an older convention (imperative, sentence case,
  no type prefix) and do not match. Don't copy the style of existing history — follow the rules above.
- Branches: `dev` and `main` (per Phase 0 of the plan).
- PRs follow [.github/pull_request_template.md](./.github/pull_request_template.md).
- `.env` files are gitignored; only `.env.example` is committed. Document every new server variable
  there.

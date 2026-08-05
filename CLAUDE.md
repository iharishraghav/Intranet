# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the **Context7 MCP** (`mcp__context7__resolve-library-id`, then `mcp__context7__query-docs`) to
fetch up-to-date documentation before writing code against any library, framework, SDK, API, CLI, or
cloud service used here — React, Vite, Express, TypeScript, Prisma, Azure SDKs, Zoho SSO, and so on.

This matters more than usual in this repo: the stack is pinned to very recent majors (React 19,
Express 5, Vite 8, TypeScript 6, oxlint 1.x). Training data is likely to describe the previous major.
Resolve the library ID first, then query one concept per call; split multi-topic questions into
separate queries. Prefer this over web search for library docs.

Skip Context7 for refactoring, business-logic debugging, code review, and general programming
questions.

## Project

Internal organization intranet: announcements, events, blogs, resources, quick links, upcoming
employee birthdays, and an anonymous daily mood check-in. Two roles — `User` and `Admin`; admins get
CRUD over every entity. Auth is Zoho SSO, domain-restricted.

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

This is not an npm-workspaces monorepo. The root `package.json` is **tooling-only** — Husky and
commitlint, no `workspaces` field and no root dev/build scripts. `client/` and `server/` each have
their own `package.json` and `package-lock.json` and are installed independently.

Note that `server/package.json` still declares `"main": "dist/index.js"`, but `server/tsconfig.json`
sets `noEmit: true`, so nothing is ever emitted to `dist/`. Either wire up a real build or drop the
`main` field before relying on it.

## Commands

Run from the respective directory. `npm install` is per-directory.

**repo root/** — tooling only, no application code.

| Command       | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `npm install` | Installs Husky + commitlint and activates the git hooks (`prepare`)  |

Run this once after cloning, otherwise the `commit-msg` hook won't be installed and bad commit
messages will go through unchecked.

**client/**

| Command         | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `npm run dev`   | Vite dev server on :5173, proxying `/api` to :3000         |
| `npm run build` | `tsc -b` project build, then `vite build`                  |
| `npx tsc -b`    | Typecheck only (no `typecheck` script defined)             |
| `npx oxlint`    | Lint (oxlint is a devDependency; no `lint` script defined) |

**server/**

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | `tsx watch src/index.ts`, reloads on change     |
| `npx tsc --noEmit` | Typecheck (the config is `noEmit`, so `tsc` alone does the same) |

Both sides must be running for the client to reach the API. Copy `server/.env.example` to
`server/.env` before starting the server.

No test runner is configured. Testing lands in Phase 6 of the implementation plan; pick and wire up a
runner when you get there rather than assuming one exists.

## Architecture

**Single-origin in development.** The browser only ever talks to `:5173`. `client/vite.config.ts`
proxies `/api` to the Express server, so client code uses relative paths (`fetch('/api/health')`) with
no base URL. Preserve that — don't introduce absolute API URLs or a `VITE_API_URL`-style env var
without also reworking the proxy.

The API port is `3000` in `server/.env.example`, the `src/index.ts` default, the Vite proxy target,
and the client's error copy. Changing it means changing all four.

**Two independent TypeScript programs, deliberately different.**

- `server/` — ESM with `module: NodeNext`, `noEmit`, and strictness past `strict`:
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`. Indexed access yields `T | undefined` — write code that satisfies
  that rather than loosening the config. A `src/*` path alias is configured.
- `client/` — solution-style `tsconfig.json` referencing `tsconfig.app.json` (app source, `noEmit`,
  bundler resolution) and `tsconfig.node.json` (Vite config). Add app source under `src` only; edit
  the referenced configs, not the root one. `erasableSyntaxOnly` is on, so no enums or parameter
  properties in client code.

Both set `verbatimModuleSyntax`, so type-only imports must be written `import type { ... }`.

**Error modeling on the client.** `App.tsx` models async state as a discriminated union
(`{ state: 'checking' | 'ok' | 'error' }`) and guards `setState` with an `active` flag in the effect
cleanup. Follow this shape for new data fetching instead of parallel `loading`/`error`/`data`
booleans.

**Mood check-in is a privacy constraint, not just a feature.** One submission per employee per day
must be enforced *without* persisting any queryable link between an employee and their submission. No
role, including Admin, may retrieve an individual response — only aggregates. This shapes the schema,
so get it right when Phase 4 arrives; retrofitting it is not possible.

## Conventions

- Commit messages: **Conventional Commits**, enforced by commitlint via a Husky `commit-msg` hook
  (`commitlint.config.js` extends `@commitlint/config-conventional`). Format is
  `type(optional-scope): subject`, e.g. `feat(server): add health check endpoint`.
  - Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`,
    `style`, `test`. Type must be lower case and is required.
  - Subject must not start with a capital, must not end with a period, and must not be empty. Header
    is capped at 100 characters.
  - Breaking changes use `type!: subject` or a `BREAKING CHANGE:` footer.
- **Keep the message to a single short line — subject only, no body.** Aim for roughly 50–72
  characters; commitlint's 100-character cap is the hard limit, not the target. If a change needs a
  paragraph to explain, that is usually a sign it should be split into more commits instead.
- **Commit in context-based groups, never one bulk commit.** When a working tree holds several
  unrelated changes, split them into separate commits — one per coherent change — and commit them in
  dependency order (remove the consumer before the thing it consumed; add the dependency before the
  code using it). Each commit should stand on its own: a reader should be able to tell what it did
  from its subject alone, and the tree should still build at every commit.
  - Group by *what changed and why*, not by directory or file type. Source changes, dependency
    changes (`package.json` + lockfile), config changes, and docs are usually separate groups.
  - Prefer moving a whole file into one group over splitting a single file's diff across commits.
    If one file genuinely spans two groups, put it in the group whose commit would otherwise leave
    the tree broken.
  - Use the scope to name the affected area: `feat(server):`, `chore(client):`, `docs:`.
- **Branches: only `dev` and `main` exist — never create a feature branch.** Commit all work directly
  on `dev`; `main` is the release branch and is updated from `dev`, not from anything else. If a task
  seems to call for a branch, split it into smaller commits on `dev` instead.
- PRs follow [.github/pull_request_template.md](./.github/pull_request_template.md).
- `.env` files are gitignored; only `.env.example` is committed. Document every new server variable
  there.

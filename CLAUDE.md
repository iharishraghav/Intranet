# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation lookups

Use the **Context7 MCP** (`mcp__context7__resolve-library-id`, then `mcp__context7__query-docs`) to
fetch up-to-date documentation before writing code against any library, framework, SDK, API, CLI, or
cloud service used here — React, Vite, Express, TypeScript, Prisma, Azure SDKs, Zoho SSO, and so on.

This matters more than usual in this repo: the stack is pinned to very recent majors (React 19,
react-router 8, Express 5, Vite 8, TypeScript 6, TanStack Query 5, Zustand 5, oxlint 1.x). Training
data is likely to describe the previous major.
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
the source of truth for what comes next — Phases 0 and 1 are done (Zoho SSO, roles, login UI, client
route protection). Phase 2 — domain models and admin CRUD — is next.

Target stack per `tech-stack.md`. Prisma and PostgreSQL are wired up; still not started: Azure App
Service hosting, Azure Database for PostgreSQL, Azure Blob Storage for resource files, and an Azure
Function (timer trigger) for auto-expiring announcements/events.

## Current state

An authenticated shell around a health-check vertical slice: `GET /api/health` on the server, a
`HomePage.tsx` that queries it to show connection status, and Better Auth mounted at `/api/auth/*`
against a local PostgreSQL `intranet` database. No domain models and no tests.

The client data layer is already the one Phase 2 will build on, even though only the health check
uses it: axios (`src/lib/api.ts`) under TanStack Query (`src/lib/query-client.ts`) for anything from
the API, Zustand (`src/stores/`) for everything else, and `core/` for messages and the request/
response contract. See Architecture for all three.

`prisma/schema.prisma` holds the generator, datasource, the four Better Auth models
(`User`/`Session`/`Account`/`Verification`) and a `Role` enum. Domain models are still Phase 2. One
migration exists, `add_better_auth_models`.

**Auth is closed by default.** On the server, `src/lib/auth.ts` configures the `genericOAuth` plugin
against Zoho's OIDC discovery document, and two things gate every sign-in:

- `disableSignUp: true` plus a `databaseHooks.user.create.before` that always throws `FORBIDDEN`. The
  `user` table is an **allowlist** — rows are provisioned by `prisma/seed.ts` or by hand, never by
  the auth flow. First sign-in *links* a Zoho account onto an existing row, which is why
  `account.accountLinking.trustedProviders` must include `'zoho'`; without it you get
  `account_not_linked`.
- `databaseHooks.session.create.before` re-checks the email against `ALLOWED_EMAIL_DOMAIN` on every
  sign-in, not just the first.

Both rejections return the same vague message on purpose, so an outsider cannot distinguish
"unprovisioned" from "wrong domain" and enumerate staff. Preserve that if you touch the hooks. The
client mirrors it: `LoginPage.tsx` renders one fixed access-denied message for any `?error=` on the
callback and never surfaces the provider's reason.

Every server env var goes through a Zod schema in `src/lib/env.ts`, which imports `dotenv/config`
itself — so modules like `db.ts` and `email-domain.ts` no longer depend on the entry point having
loaded dotenv first. `env` is parsed at import time and throws with every problem listed at once
(`z.prettifyError`), not just the first. Read config through `env`, never `process.env`: the values
come out typed and already normalized — `PORT` is a number with a 3000 default, and
`ALLOWED_EMAIL_DOMAIN` is a single lowercased domain string.

Two details in that schema are easy to undo by accident:

- `PORT` is wrapped in a `z.preprocess` that maps `''` to `undefined`. A variable that is present but
  blank (`PORT=` in `.env`) is an empty string, not a missing key, so without it `z.coerce` turns
  `PORT=` into `0` and `.positive()` fails instead of the `3000` default applying. Any future
  optional variable with a default needs the same treatment.
- The URL variables are scheme-constrained rather than bare `z.url()`, which accepts any scheme:
  `DATABASE_URL` must be `postgres`/`postgresql`, `BETTER_AUTH_URL` and `ZOHO_ACCOUNTS_URL` must be
  `http`/`https`. That is what makes a value swapped into the wrong variable fail at boot with a
  clear message rather than deep inside Prisma or the OAuth flow.

Seed-only variables are deliberately **not** in that schema. `prisma/seed.ts` declares its own
`seedEnvSchema` and parses it inside `seedAdmin()`, so the API does not refuse to boot over
`SEED_ADMIN_*` it never reads. Keep new seed-only variables there, not in `src/lib/env.ts`.

`src/middleware/require-auth.ts` and `require-admin.ts` export `requireAuth`/`requireAdmin`
(`requireAdmin` delegates to `requireAuth`, then checks `Role.Admin`). Both are written for Phase 2
and not yet applied to any route. `requireAuth` puts the Better Auth session on `req.auth`, typed by
the global `Express.Request` augmentation in `src/types/express.d.ts`.

On the client, `src/lib/auth-client.ts` builds the `better-auth/react` client with
`genericOAuthClient()` plus `inferAdditionalFields` for the `role` field — without that,
`session.user.role` is not typed. `main.tsx` wraps `App` in `QueryClientProvider` then
`BrowserRouter` (react-router v8, imported from `react-router`, not `react-router-dom`); `App.tsx` is
routes only. `ProtectedRoute` renders
`AppLayout` (nav bar + `<Outlet />`) when a session exists, redirects to `/login` when not, and
renders a loading line while `isPending` — do not skip that third branch or the first paint bounces
authenticated users to the login page.

`@better-auth/cli` is deliberately **not** a dependency: it pins `better-auth@1.4.21` and an old
`drizzle-orm`, which pull 8 advisories into the tree. The schema is maintained by hand; if you ever
need to regenerate it, use `npx @better-auth/cli@latest generate --config src/lib/auth.ts` in a
throwaway shell and diff the result.

This is not an npm-workspaces monorepo. The root `package.json` is **tooling-only** — Husky and
commitlint, no `workspaces` field and no root dev/build scripts. `client/` and `server/` each have
their own `package.json` and `package-lock.json` and are installed independently. `core/` is the one
exception to that split: shared TypeScript source compiled into both programs, with no `package.json`
and no dependencies of its own — see the `core/` section under Architecture.

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

| Command               | Description                                     |
| --------------------- | ----------------------------------------------- |
| `npm run dev`         | `tsx watch src/index.ts`, reloads on change     |
| `npx tsc --noEmit`    | Typecheck (the config is `noEmit`, so `tsc` alone does the same) |
| `npm run db:generate` | `prisma generate` — writes the client to `src/generated/prisma` (gitignored) |
| `npm run db:migrate`  | `prisma migrate dev` — create and apply a migration, then run the seed |
| `npm run db:seed`     | `tsx prisma/seed.ts` — provision the `SEED_ADMIN_EMAIL` admin |
| `npm run db:studio`   | `prisma studio` — browse the database in a GUI  |

Both sides must be running for the client to reach the API. Copy `server/.env.example` to
`server/.env` and fill it in before starting the server — the `env` schema is parsed at import time,
so the server will not boot without `DATABASE_URL`, `ALLOWED_EMAIL_DOMAIN`, `BETTER_AUTH_URL`,
`ZOHO_ACCOUNTS_URL`, `ZOHO_CLIENT_ID` or `ZOHO_CLIENT_SECRET`. `PORT` is the one optional variable.
`BETTER_AUTH_SECRET` is read by Better Auth itself and is not in the schema.

`prisma/seed.ts` provisions **one** bootstrap admin, from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_NAME`.
It solves the chicken-and-egg problem that sign-up is disabled, so without it nobody can log in at
all. It is create-if-absent, not an upsert: an existing row is left untouched and logged as skipped,
so re-running never clobbers the display name Zoho wrote on first sign-in. Both variables are
required — either one missing fails the seed with exit code 1, which also surfaces as a failure at
the end of `migrate dev`, since the seed runs after every migration via `prisma.config.ts`'s
`migrations.seed`. An address outside `ALLOWED_EMAIL_DOMAIN` throws too, since it would produce a
row that can never sign in.

Everyone else is added by hand: `npm run db:studio`, add a row to `user` with a UUID you generate
for `id`, the person's `@dahnay.com` address, any `name` (Zoho overwrites it on first sign-in via
`updateUserInfoOnLink`), and the `role` you want. Leave `emailVerified` false, as the seed does —
`'zoho'` is a trusted provider, so linking does not depend on it.

The domain rule itself lives in `src/lib/email-domain.ts`, not `auth.ts`, so the seed can reuse it
without triggering `betterAuth()` initialization — which would demand the Zoho credentials just to
provision a user.

`npm install` does **not** generate the Prisma client — the `@prisma/engines` postinstall script is
blocked by npm's `allowScripts` policy and there is no `postinstall` hook. Run `npm run db:generate`
after cloning and after any schema change, otherwise `src/generated/prisma` is missing and the server
fails to start.

No test runner is configured. Testing lands in Phase 6 of the implementation plan; pick and wire up a
runner when you get there rather than assuming one exists.

## Architecture

**Single-origin in development.** The browser only ever talks to `:5173`. `client/vite.config.ts`
proxies `/api` to the Express server, so client code uses relative paths with no absolute origin —
`src/lib/api.ts` is an axios instance whose only configuration is `baseURL: '/api'`, and every call
goes through it (`api.get('/health')`). Preserve that — don't introduce absolute API URLs or a
`VITE_API_URL`-style env var without also reworking the proxy.

The API port is `3000` in `server/.env.example`, the `src/index.ts` default, the Vite proxy target,
and `errorMessages.apiDisconnected` in `core/messages.ts`. Changing it means changing all four.

Routing is client-side (`BrowserRouter`), and the Vite dev server serves `index.html` for unknown
paths on its own. Whatever hosts the built client will have to do the same, or a refresh on `/login`
404s.

This is why `BETTER_AUTH_URL` is `http://localhost:5173`, **not** the API port: it is the origin the
browser sees, so every URL Better Auth derives from it — OAuth redirect URI, cookie domain, the CORS
origin in `src/index.ts` — has to be the Vite one.

**Middleware order in `server/src/index.ts` is load-bearing.** `app.all('/api/auth/*splat', ...)`
must come *before* `app.use(express.json())`; Better Auth reads the raw request body itself, and a
JSON parser that consumes it first leaves auth requests hanging with no error. The wildcard is
Express 5's named form (`*splat`) — a bare `*` throws a path-to-regexp error at boot.

**Two independent TypeScript programs, deliberately different.**

- `server/` — ESM with `module: NodeNext`, `noEmit`, and strictness past `strict`:
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`. Indexed access yields `T | undefined` — write code that satisfies
  that rather than loosening the config. `src/*` and `core/*` path aliases are configured, and
  `include` covers `prisma.config.ts` and `prisma/seed.ts` so the seed can import through them, plus
  `../core`. Relative imports carry the `.js` extension, per `NodeNext`.
- `client/` — solution-style `tsconfig.json` referencing `tsconfig.app.json` (app source, `noEmit`,
  bundler resolution) and `tsconfig.node.json` (Vite config). Add app source under `src` only; edit
  the referenced configs, not the root one. `erasableSyntaxOnly` is on, so no enums or parameter
  properties in client code. The `@/*` → `./src/*` alias lives in `tsconfig.app.json` and is mirrored
  in `vite.config.ts`'s `resolve.alias`; both have to agree, or `tsc` accepts an import that fails to
  resolve at runtime. It is declared a **third** time, in the root `tsconfig.json` — the one thing
  that config carries besides `references`. `tsc` ignores it (`files` is empty), but the shadcn CLI
  reads the root config to validate the alias and refuses to run without it. Keep all three in sync.

Both set `verbatimModuleSyntax`, so type-only imports must be written `import type { ... }`.

**`core/` is shared source, compiled twice.** Two files so far:

- `core/messages.ts` — the single source of truth for messages: API error bodies, client error and
  status copy, console output, seed and env failures. Page content and labels are not messages and
  stay in the components; see the Conventions entry for where the line falls.
- `core/api-types.ts` — the request/response contract for `/api/*`. `HealthResponse` lives here and
  is applied on *both* ends: the client passes it to `api.get<HealthResponse>`, and the server types
  the handler's `res` as `Response<HealthResponse>`. That second half is the point — without it the
  client is just asserting a shape and the two drift silently. Type every new endpoint the same way,
  so a changed response body fails `tsc` on the server instead of surfacing as `undefined` in the
  browser.

Both are plain `.ts` with no imports, no dependencies, no `package.json`, and no build step: each
side simply pulls them into its own program through a `core/*` path alias. Because they compile
under *both* tsconfigs, they have to satisfy the stricter of the two rules — no enums or parameter
properties (client `erasableSyntaxOnly`), and nothing DOM- or Node-specific, since neither side's
`lib`/`types` covers the other's.

The wiring is five entries across four files, and all of it is load-bearing:

- `server/tsconfig.json` — `paths` maps `core/*` → `../core/*`, and `include` lists `../core`.
  Imports carry the `.js` extension (`core/messages.js`) like every other server import, per
  `NodeNext`; `tsx` resolves the alias at runtime, the same way `prisma/seed.ts` already imports
  through `src/*`.
- `client/tsconfig.app.json` — same `paths` entry plus `../core` in `include`. Client imports have
  **no** extension (`core/messages`), per bundler resolution.
- `client/tsconfig.json` — the alias's third declaration, for the shadcn CLI, as with `@/*`.
- `client/vite.config.ts` — `resolve.alias`. The alias is bare `core`, not `@core`, matching the
  server's bare `src/*`. That puts it in the same namespace as npm packages: Vite and TypeScript both
  resolve the alias first, so a future dependency actually named `core` would be unreachable. Only an
  exact `core` or a `core/`-prefixed specifier is rewritten, so package names like `core-js` are
  unaffected.
- `client/vite.config.ts` — `server.fs.allow`, which the dev server needs to serve a file from
  outside `client/` over `/@fs`. Setting it *replaces* Vite's default, so the client directory is
  listed explicitly alongside `../core`. Keep it to those two: the blunter `allow: ['..']` would also
  expose `server/.env` over the dev server.

Anything else shared later (Zod schemas for request bodies, shared domain types) belongs here too,
under the same constraints.

**Server state is TanStack Query; client state is Zustand. Neither is `useState` + `useEffect`.**

- **Anything that comes from the API goes through `useQuery`/`useMutation`**, with the axios instance
  from `src/lib/api.ts` as the `queryFn` body. Always forward the query's `signal` to axios
  (`api.get('/health', { signal })`) so React Query can cancel in flight. Render off the
  `isPending`/`isSuccess`/`isError` flags — do not copy query results into local state, and do not
  hand-roll a `{ state: 'checking' | 'ok' | 'error' }` union around a fetch, which is what
  `HomePage.tsx` used to do. The shared `QueryClient` lives in `src/lib/query-client.ts` and is
  mounted by `main.tsx`; its defaults are `retry: false` (a failed call surfaces immediately instead
  of after three silent retries) and `staleTime: 30_000`. Override per query rather than editing the
  defaults for one call site.
- **Everything else — UI state, and in particular any state shared across components — goes in a
  Zustand store** under `src/stores/`, e.g. `sign-in-store.ts`, which owns `LoginPage.tsx`'s sign-in
  state. Type the store with `create<T>()((set) => ({ … }))`, expose named actions rather than a raw
  setter, and subscribe with one selector per value (`useSignInStore((store) => store.error)`) so a
  component only re-renders for what it reads. A discriminated union is still the right *shape* for
  the state itself once there are three or more cases — it is the `useState`/`useEffect` plumbing
  around it that is gone. `sign-in-store.ts` is down to `error: string | null`, so a union would be
  ceremony; reach for one when a third state appears. Store modules are plain modules, so anything
  outside React can drive them via `useStore.getState().action()`.

**Do not add in-progress state around `signIn.oauth2()`.** It is tempting to disable the sign-in
button and swap its label to "Redirecting…" while the call runs. That state can never be cleared.
`oauth2()` hands the browser to Zoho, which freezes the page into the back/forward cache rather than
tearing it down; pressing Back resumes the exact same JS heap, so the flag is still set and the
button comes back permanently disabled. A bfcache restore runs **no** JavaScript — the module is not
re-evaluated, `LoginPage` does not remount, no effect or selector fires — so no store, Zustand or
otherwise, can notice it went stale. The only signal is a `window.addEventListener('pageshow', …)`
guarded on `event.persisted`, and this repo has deliberately chosen not to carry one: the button
stays enabled and unlabelled-for-progress instead. The same trap applies to any future state set
immediately before a redirect off-origin.

**Mood check-in is a privacy constraint, not just a feature.** One submission per employee per day
must be enforced *without* persisting any queryable link between an employee and their submission. No
role, including Admin, may retrieve an individual response — only aggregates. This shapes the schema,
so get it right when Phase 4 arrives; retrofitting it is not possible.

## Conventions

- **Centralize messages in `core/messages.ts`. Never centralize UI content.** This is a standing
  rule for all future work, not a description of what happens to be there now — `core/` is a message
  catalogue, not a content store, and it must not grow into one.

  The test: a **message** reports the outcome or state of an operation, and the same wording could
  plausibly be reused or asserted against elsewhere. **Content** is the copy a screen is made of —
  it belongs to the component that renders it and to nothing else.

  | Goes in `core/messages.ts`                     | Stays inline in the component / module         |
  | ---------------------------------------------- | ---------------------------------------------- |
  | Error copy shown to a user                      | Page and section headings                      |
  | Success and status/in-progress lines            | Button and link labels — **including** pending variants (`'Signing out…'`) |
  | HTTP error bodies                               | The app name and tagline                       |
  | `console.log` / `console.error` output          | Field labels, placeholders, table headers      |
  | Thrown `Error` messages, Zod refinement messages | Marketing/descriptive body copy                |

  When it is genuinely ambiguous, leave the string inline. Pulling a string out later is a two-line
  change; a `core/` full of page copy is not.

  Messages are named exports grouped by audience: `apiMessages` (HTTP error bodies), `errorMessages`
  and `statusMessages` (client-facing), `serverMessages` and `seedMessages` (operator-facing). Add
  new entries to an existing group rather than inventing parallel ones. Anything with an
  interpolated value is a function (`statusMessages.apiConnected(status)`) so the surrounding
  punctuation stays in one place.

  Two things to preserve: JSX entities like `&hellip;`/`&mdash;` become literal `…` and `—` once a
  string moves into `core/`, and `apiMessages.accessDenied` is deliberately terser than
  `errorMessages.accessDenied` — per the allowlist notes above, the server must not let an outsider
  distinguish "unprovisioned" from "wrong domain".
- **Do not write code comments in `client/` or `server/`.** No explanatory comments, no section
  banners, no JSDoc, no `// TODO`. Names and types carry the intent; if a line needs a comment to be
  understood, rename or restructure it instead. This applies to every file you add or edit under
  `client/` and `server/`, including config files (`vite.config.ts`, `tsconfig*.json`,
  `prisma.config.ts`) and `prisma/schema.prisma`. Non-obvious decisions — security constraints,
  ordering that is load-bearing, upstream bugs worked around — belong in this file or in `docs/`,
  not in the source. The one exception is a comment the tooling itself requires (for example a
  targeted oxlint suppression).
- **Styling is Tailwind v4 utilities plus shadcn/ui — no hand-written CSS.** There are no `.css`
  files next to components, no CSS modules and no inline `style` props; `client/src/index.css` is
  the only stylesheet, and it holds only what shadcn's `init` generated (imports, `@theme inline`
  token mapping, the `:root` palette, and the `@layer base` reset). Tailwind is wired through the
  `@tailwindcss/vite` plugin (v4 is CSS-first — there is no `tailwind.config.js` and there should
  not be).
- **Use theme tokens, not raw palette colors.** `bg-background`/`text-foreground`,
  `text-muted-foreground` for secondary copy, `text-destructive` for errors, `bg-card`, and a bare
  `border` for rules — `@layer base` already sets every element's border color to `--border`. Reach
  for `text-gray-600`-style literals only where the default theme has no token (the health-check
  success line uses `text-emerald-600 dark:text-emerald-400`, since there is no success token).
  Retheming then means editing the `:root` variables and nothing else. Preflight strips default
  heading sizes and margins, so every heading and gap still needs explicit utilities.
- **Dark mode follows the OS, and that is a deliberate edit to what shadcn generated.** `init`
  writes `@custom-variant dark (&:is(.dark *));` and a `.dark { … }` block, which needs a theme
  toggle to ever activate; there is no toggle here, so the app would have been light-only. That line
  is deleted — restoring Tailwind's built-in `prefers-color-scheme` `dark:` variant — and the dark
  tokens live under `@media (prefers-color-scheme: dark) { :root { … } }`. `<body>` in `index.html`
  carries `scheme-light-dark` so native controls and scrollbars follow too. **Re-running
  `shadcn init` will overwrite both back to the class form** — redo them, or add the ThemeProvider
  from shadcn's Vite dark-mode guide instead.
- **shadcn components are vendored source, not a dependency.** Add them with
  `npx shadcn@latest add <name>`; they land in `client/src/components/ui/` and are ours to edit. The
  installed style is `base-nova` (Base UI primitives, neutral base color, Geist, lucide icons) — see
  `components.json`. `button.tsx` and `card.tsx` are in; anything else needs the CLI. Treat these
  files as generated: the no-comments rule and the import style there are shadcn's, and reformatting
  them by hand only makes the next `add` noisier. `src/lib/utils.ts` exports `cn`, which every one
  of them imports.
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

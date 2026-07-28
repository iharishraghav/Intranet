# Implementation Plan

Based on [project-scope.md](./project-scope.md) and [teck-stack.md](./teck-stack.md).

## Dependency overview

```
Phase 0 (Infra)
   │
   ▼
Phase 1 (Auth & Roles) ──────────────┐
   │                                 │
   ▼                                 ▼
Phase 2 (Core CRUD: announcements,   Phase 5 (Mood check-in)
 events, blogs, resources, links)     — independent content model,
   │                                    only needs an authenticated
   ▼                                    user identity from Phase 1
Phase 3 (Employee directory &
 birthdays)
   │
   ▼
Phase 4 (Employee-facing views) ← reads from Phase 2 + Phase 3 APIs
   │
   ▼
Phase 6 (Auto-expiry automation) ← needs Phase 2's end-date/status fields
   │
   ▼
Phase 7 (Polish, testing, hardening) ← needs all features functionally complete
   │
   ▼
Phase 8 (Launch)
```

Phase 5 only depends on Phase 1 (needs a logged-in employee identity to enforce "one submission per day"), so it can be built in parallel with Phases 2–4 by a second engineer/track once Phase 1 ships.

Within Phase 2 and Phase 4, each entity (announcements / events / blogs / resources / quick links) is independent of the others — they can be split across engineers and built in parallel once the shared pattern (schema → API → admin UI → public view) is proven on the first entity.

---

## Phase 0 — Project Setup & Infrastructure

No dependencies. Must finish before any other phase starts.

1. Set up monorepo structure (`client/` React, `server/` Express)
2. Configure TypeScript, ESLint, Prettier for both client and server
3. Provision Azure resources: App Service (frontend + backend), Azure Database for PostgreSQL, Blob Storage container
4. Set up environment config/secrets management (Azure App Service configuration / Key Vault)
5. Set up CI/CD pipeline (build, test, deploy to Azure)
6. Register app with Zoho for SSO (OAuth client ID/secret) and Zoho Calendar API access
7. Choose and configure migrations tool (Prisma)
8. Define initial database schema: `users`, `roles` — this is a hard dependency for Phase 1

**Exit criteria:** empty client/server apps deploy successfully through CI/CD to an Azure dev environment; migrations run against the provisioned database.

---

## Phase 1 — Authentication & Roles

**Depends on:** Phase 0 (Azure resources, `users`/`roles` schema, Zoho OAuth credentials).
**Blocks:** Phase 2, Phase 5 (any endpoint needing a logged-in user). Phase 3/4/6 inherit this transitively through Phase 2.

1. Implement Zoho SSO login flow (OAuth2 redirect → callback → token exchange)
2. Create session/JWT handling on the backend
3. Implement `User` / `Admin` / `Superadmin` role model + middleware for role-based route protection (single reusable `requireRole()` middleware, so Superadmin-only checks can be added later without rework)
4. Build basic authenticated shell (logged-in layout, logout)
5. Seed initial Superadmin account

**Exit criteria:** a user can log in via Zoho SSO, land on an authenticated shell, and log out; a protected test route correctly rejects the wrong role.

---

## Phase 2 — Core Data Models & Admin CRUD

**Depends on:** Phase 1 (role middleware).
**Blocks:** Phase 3 (reuses this pattern), Phase 4 (reads this data), Phase 6 (reads the end-date/status fields added here).
**Internal parallelism:** announcements, events, blogs, resources, and quick links are independent of each other. Build the full vertical slice (schema → API → admin UI) for **announcements first** as the reference implementation, then parallelize the rest across engineers.

1. Design and migrate schema for: announcements, events, blogs, resources, quick links
   - Every entity gets an end-date field + manual status field (e.g. `Archived`) to support active/inactive filtering
2. Backend CRUD API endpoints per entity, create/edit/delete gated by `requireRole(['Admin', 'Superadmin'])`
3. Admin UI: list/create/edit/delete screens per entity
4. Wire the open Superadmin-only decision as a single extension point in `requireRole()` (e.g. `requireRole(['Superadmin'])` on specific routes) so it can be applied later without refactoring — do not build speculative UI for it until the feature list is confirmed

**Exit criteria:** Admin/Superadmin can create, edit, delete, and archive each of the five entities through the admin UI; User role is correctly blocked from all mutation endpoints.

---

## Phase 3 — Employee Directory & Birthdays

**Depends on:** Phase 2 (reuses the same CRUD pattern established there).
**Blocks:** Phase 4 (birthday widget reads this data).

1. Build employee record CRUD, gated by `requireRole(['Admin', 'Superadmin'])` — same permission level as Phase 2 entities
2. Manual data entry only (confirmed — no external HR system integration)
3. Implement "upcoming birthdays" query (next 30 days) and expose as an API endpoint

**Exit criteria:** Admin/Superadmin can manage employee records; birthdays endpoint returns the correct next-30-days set.

---

## Phase 4 — Employee-Facing Views

**Depends on:** Phase 2 (announcements/events/blogs/resources/links APIs), Phase 3 (birthdays API).
**Note:** frontend work on this phase can start **before** Phase 2/3 backends are fully done, as long as the API response shape for each entity is agreed upfront (contract-first) — frontend builds against a mock, backend swaps in later with no interface change.
**Internal parallelism:** each list/detail view is independent of the others.

1. Home/dashboard page assembling: active announcements, active events, upcoming birthdays, quick links, resources
2. Announcements list/detail view
3. Events list/detail view with **Add to Calendar** button — resolve the open decision (deep link vs. Zoho Calendar API) before starting this item specifically
4. Blogs list/detail view
5. Resources list view (file download from Blob Storage)
6. Quick links list view

**Exit criteria:** a logged-in User sees only active announcements/events/blogs, can download resources, click quick links, and successfully add an event to their Zoho Calendar.

---

## Phase 5 — Mood Check-In

**Depends on:** Phase 1 only (needs an authenticated employee identity). Independent of Phase 2/3/4 — can be built in parallel by a separate engineer/track once Phase 1 ships.
**Confirmed constraint:** submissions are anonymous/aggregate only — never linked to an identifiable employee, including for Admin/Superadmin. Enforce this at the schema level (do not store a user↔submission foreign key in a queryable form; e.g. hash+discard the identity after the one-per-day check, or use a separate write-once "already submitted today" record disjoint from the mood value table).

1. Backend: daily mood submission endpoint (emoji-based), enforce one submission per employee per day without persisting a queryable identity-to-submission link
2. Aggregate endpoint: org-wide mood trend (daily/weekly emoji distribution)
3. Frontend: emoji check-in widget on dashboard
4. Frontend: aggregate mood trend view, visible to Admin/Superadmin only

**Exit criteria:** an employee can submit one mood per day; a second same-day submission is rejected; Admin/Superadmin can view aggregate trends only, with no path to any individual's submission (verify this explicitly in Phase 7's access-control tests).

---

## Phase 6 — Automation & Scheduled Jobs

**Depends on:** Phase 2 (end-date/status fields must exist on announcements/events/blogs).

1. Build Azure Function (timer trigger) for auto-expiry: flip announcements/events/blogs out of "active" once end date passes
2. Add logging/monitoring for the scheduled job

**Exit criteria:** an item with a past end-date is automatically archived and disappears from Phase 4's public views without manual intervention.

---

## Phase 7 — Polish, Testing & Hardening

**Depends on:** Phases 2–6 functionally complete.

1. Responsive/mobile layout pass across all views
2. Input validation and error handling across API endpoints
3. Access control tests: role boundaries generally, plus explicit verification that no individual mood submission is ever retrievable by any role
4. End-to-end tests for critical flows: login, add announcement, add-to-calendar, mood check-in
5. File upload size/type validation for resources
6. Security review (auth flows, file upload handling, SQL injection/XSS checks)

**Exit criteria:** test suite green; security review sign-off; manual pass on mobile viewport for all employee-facing views.

---

## Phase 8 — Launch

**Depends on:** Phase 7.

1. Final UAT with a pilot group of employees
2. Production Azure environment cutover
3. Rollout announcement and onboarding doc for employees
4. Monitor error logs/usage post-launch

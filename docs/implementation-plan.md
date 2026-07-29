# Implementation Plan

Based on [project-scope.md](./project-scope.md) and [tech-stack.md](./tech-stack.md).

## Phase 0 — Project Setup & Infrastructure

1. Set up monorepo structure (`client/` React, `server/` Express)
2. Define the branch set (`dev`, `main`)
3. Setup Postgres database

---

## Phase 1 — Authentication & Roles

1. Build basic authentication shell (logged-in, logout layout)
2. Implement Zoho SSO login flow (domain restricted)
3. Implement `User` / `Admin` role model + middleware for role-based route protection.
4. Add route protection on the frontend (redirect to login if unauthenticated)

---

## Phase 2 — Core Data Models & Admin CRUD

1. Design and migrate schema for: announcements, events, blogs, employee, resources, quick links
2. Backend CRUD API endpoints per entity, create/edit/delete gated by RBAC
3. Create user and resource management page (admin only)

---

## Phase 3 — Employee-Facing Views

1. Home/dashboard page assembling: active announcements, active events, upcoming birthdays, quick links, resources
2. Announcements list/detail view
3. Events list/detail view with **Add to Calendar** button
4. Blogs list/detail view
5. Resources list view (file download from Blob Storage)
6. Quick links list view

---

## Phase 4 — Mood Check-In

1. Backend: daily mood submission endpoint (emoji-based), enforce one submission per employee per day without persisting a queryable identity-to-submission link
2. Aggregate endpoint: org-wide mood trend (daily/weekly emoji distribution)
3. Frontend: emoji check-in widget on dashboard
4. Frontend: aggregate mood trend view, visible to Admin only

---

## Phase 5 — Automation & Scheduled Jobs

1. Build Azure Function (timer trigger) for auto-expiry and employee record check: flip announcements/events out of "active" once end date passes and week employee directory addition and removal.
2. Add logging/monitoring for the scheduled job

---

## Phase 6 — Polish, Testing & Hardening

1. Responsive/mobile layout pass across all views
2. Input validation and error handling across API endpoints
3. Access control tests: role boundaries generally, plus explicit verification that no individual mood submission is ever retrievable by any role
4. End-to-end tests for critical flows: login, add announcement, add-to-calendar, mood check-in
5. File upload size/type validation for resources
6. Security review (auth flows, organization-restriction enforcement, file upload handling, SQL injection/XSS checks)
7. Enable dependency and secret scanning in the CI pipeline

---

## Phase 7 — Launch

1. Final UAT with a pilot group of employees
2. Write Dockerfile for server and client
3. Set up Docker Compose for local development
4. Write deployment configuration and automated CI phase.

# Problem

The organization currently lacks a centralized internal platform for day-to-day communication and coordination. Specifically:

- There is no announcements page where employees can view updates on a regular basis (e.g. quarterly meetings, other events).
- When an event is scheduled or added, there is no link provided to add it to Zoho Calendar.
- There is no place for employees to access internal blog posts.
- There is no staff directory to view upcoming employee birthdays.
- There is no resources tab to access the internal documentation.
- There is no lightweight way to gauge employee mood/sentiment day to day.

# Solution

Build an internal organization web application with three access levels:

- **Super Admin** — Full access to every feature, including maintenance mode toggle and admin action logs.
- **Admin** — Full access to content management, user management, settings, and dashboard, except maintenance mode toggle and admin logs. Has default access to the employee front-facing view.
- **Employee** — Access to the front-facing view only (announcements, events, blogs, resources, quick links, birthdays, mood check-in, profile).

# Authentication

- Login is restricted to the organization's Zoho domain email via **OAuth 2.0 / SSO with Zoho**. All roles (Employee, Admin, Super Admin) authenticate the same way; role is determined by internal user records, not by the IdP.
- Super Admins and Admins can access the employee front-facing view by default (no separate login).
- Sessions remain active for up to **1 day**, after which re-authentication is required (standard security practice).

# Integrations

## Zoho Calendar (Add to Calendar)

- When an employee clicks **Add Event** on an event in the front-facing view, they are redirected to Zoho Calendar with the event pre-filled, to be added to their own logged-in Zoho account.
- This is a deep-link/redirect integration (no per-user OAuth token storage required), relying on the employee already being signed into Zoho.

## GreyHR (Employee Onboarding/Offboarding)

- A daily cron job calls the GreyHR API to detect employees who have been added or removed in HR records, and syncs those changes into the platform's employee/user records.

# Features

## Employee-Facing (Front-Facing)

- Organization-restricted login (Zoho SSO)
- View announcements (active only; archived items are not shown)
- View events (active only), with **Add to Calendar** button that redirects to Zoho Calendar
- View blogs (active only)
- View resources
- View quick links
- View upcoming employee birthdays (no opt-out/consent — all employee birthdays are shown)
- Daily mood check-in (emoji-based, one submission per day per employee)
- Search and filter across announcements, events, blogs, resources, and quick links

Profile (All Users)
- View name, date of birth, and profile photo (profile photo is static/default, not user-uploaded)
- Can Edit these details only through admins

## Admin Panel

User Management
- Organization-restricted (admin-only) user management
- Employee records synced automatically via GreyHR integration (see above); manual add/edit/delete also supported

Content Management
- Add, edit, delete: announcements, events, blogs, employee records, resources, and quick links
- File attachments (for resources, blogs, etc., excluding profile photos) are stored in **Azure Blob Storage**

Settings
- Edit site name (header)
- Edit organization name (footer)
- Edit support email
- Edit code of conduct link
- Edit privacy policy link
- Toggle maintenance mode (super admin only)

Profile (All Users)
- View name, date of birth, and profile photo

Overview Dashboard
- Total blogs
- Active announcements
- Upcoming events
- Employee/staff profile count
- Traffic data (line chart) — login counts over a selected time frame; **visible to Super Admin only**
- Emotion/mood tracker (bar chart) — aggregated, anonymous employee mood submissions, viewable by daily, weekly, and monthly ranges (individual submissions are not tied to employee identity)

Logs
- Log of admin **CRUD actions only** (create/update/delete — read/GET actions are not logged), viewable by Super Admin only

# Notifications

- Email notifications are sent to all employees when a new **announcement**, **event**, or **blog** is added.
- No email notifications are sent for: employee record changes, resource additions, or quick link additions.

# Non-Functional Requirements

- **Accessibility** — conforms to the standard accessibility guideline (WCAG 2.1 AA).
- **Responsiveness** — fully usable on mobile devices, not just desktop.
- **Hosting** — Microsoft Azure, single containerized Azure Web App.
- **Storage** — Azure Blob Storage for file uploads (excluding profile photos, which are static).

# Tech Stack

- **Frontend** — React (Vite, TypeScript), React Router for navigation, Tailwind CSS for responsive/accessible styling, Recharts for the dashboard charts.
- **Backend** — Express.js (Node.js, TypeScript), Prisma as the ORM.
- **Database** — PostgreSQL (Azure Database for PostgreSQL Flexible Server) — fits the relational data (users/roles, announcements, events, blogs, resources, quick links, mood submissions, audit logs).
- **Auth** — Passport.js with a custom Zoho OAuth 2.0 strategy, domain-restricted to the org's Zoho tenant; `express-session` (store in PostgreSQL or Azure Cache for Redis) for the 1-day session lifetime, httpOnly/secure cookies.
- **GreyHR sync** — Azure Functions (Timer Trigger, daily) calling the GreyHR API, kept as a separate deployable from the Express API so retries/failures don't affect the main app. (Alternative: `node-cron` inside the Express app is simpler but risks duplicate runs if the API scales to multiple instances — avoid unless the app stays single-instance.)
- **Email** — Azure Communication Services or SendGrid for announcement/event/blog notification emails.
- **File storage** — Azure Blob Storage (`@azure/storage-blob`) for resource/blog attachments; profile photos remain static, not uploaded.
- **Hosting** — Single **Azure Web App**, containerized (Docker): the React build and Express API are served from the same containerized app; Azure Functions for the GreyHR cron job.
- **CI/CD** — GitHub Actions building the container image and deploying to Azure Web App.

# Error Handling

- When a dependent Azure service (Blob Storage, PostgreSQL, GreyHR API, email service) is unavailable or fails, the app surfaces the appropriate HTTP status code (e.g. 4xx for client-facing/validation issues, 5xx for upstream/service failures) rather than failing silently.

- **Accessibility** — conforms to the standard accessibility guideline (WCAG 2.1 AA).

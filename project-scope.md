# Problem

The organization currently lacks a centralized internal platform for day-to-day communication and coordination.

# Solution

Build an internal organizational web application that allows employees to view announcements, upcoming events (with "Add to Calendar"), upcoming employee birthdays, quick links, resources, and blogs.

# Features

- View announcements (active only)
- View events (active only), with **Add to Calendar** button that redirects to Zoho Calendar
- View blogs (active only)
- View resources
- View quick links
- View upcoming employee birthdays
- Daily mood check-in (emoji-based, one submission per day per employee)
  - Anonymous and aggregate only — individual submissions are not visible to anyone, including Admin/Superadmin
- Organization-restricted (superadmin or admin-only) user management
- Add, edit, delete: announcements, events, blogs, employee records, resources, and quick links (superadmin or admin-only)

# Authentication

- Login via Zoho SSO

# User Roles

- User
- Admin
- Superadmin — same permissions as Admin, plus a set of superadmin-only features (TBD)

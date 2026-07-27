# Problem

The organization currently lacks a centralized internal platform for day-to-day communication and coordination. Specifically:

- There is no announcements page where employees can view updates on a regular basis (e.g. quarterly meetings, other events).
- When an event is scheduled or added, there is no link provided to add it to Zoho Calendar.
- There is no place for employees to access internal blog posts.
- There is no staff directory to view upcoming employee birthdays.
- There is no resources tab to access the internal documentation.

# Solution

Build an internal organization web application with two access levels:

- Admin Panel — Admins can add, edit, and delete announcements, events, blogs, employees, and view logs and the resources.
- Employee View — Employees without admin access can view the list of events, announcements, resources, upcoming birthdays, and blogs.

# Features

## Employee-Facing (Front-Facing)

- Organization-restricted (login)

- View announcements
- View events (with option to add to Zoho Calendar)
- View blogs
- View resources
- View upcoming employee birthdays

Profile (All Users)
- View name, date of birth, and profile photo

## Admin Panel

User Management
- Organization-restricted (admin-only) user management

Content Management
- Add, edit, delete: announcements, events, blogs, employee records and resources

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
- Traffic data (line chart)
- Emotion tracker (bar chart)

Logs
- Log of admin actions (super admin only)
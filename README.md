# MyWebsite

Personal website with a space-retro theme.

## Admin-Only Guestbook Delete (Supabase)

The guestbook now supports two modes:

- `local` mode: browser-only storage, no secure admin delete
- `supabase` mode: shared guestbook, delete allowed only for admin email

### 1) Create Supabase table and policies

Run `supabase/guestbook.sql` in your Supabase SQL editor.

Before running, replace this email in the SQL:

- `your-admin@example.com` -> your real admin account email

### 2) Fill frontend config

Edit `js/config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
  supabaseAnonKey: "YOUR_ANON_KEY",
  adminEmail: "your-admin@example.com",
  guestbookTable: "guestbook_messages"
};
```

### 3) How admin delete works

- Anyone can read and post guestbook messages.
- Delete buttons are only shown when:
  - you are signed in
  - your signed-in email matches `adminEmail`
- Supabase RLS policy enforces delete authorization on the backend.

### 4) Admin login on the page

Use the Guestbook admin inputs:

- email
- password
- `Admin Login` button

After login as admin, `Remove` appears next to each message.

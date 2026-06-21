# Fidara Client Portal Production Handoff

Use this checklist before launching the Astro marketing site, client portal, and staff admin portal on Vercel.

## 1. Vercel Environment Variables

Required portal and Supabase variables:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=fidara-client-documents
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_SUPABASE_STORAGE_BUCKET=fidara-client-documents
SESSION_COOKIE_NAME=fidara_session
PUBLIC_SITE_URL=https://www.fidaragroup.com
```

`SUPABASE_SERVICE_ROLE_KEY` is server-side only. Do not expose it through any `PUBLIC_*` variable, client component, browser bundle, chatbot path, or static asset.

Required for the contact form if contact email delivery is enabled:

```env
CONTACT_TO=
CONTACT_FROM=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

Recommended for portal notification emails:

```env
PORTAL_EMAIL_FROM=
```

If `PORTAL_EMAIL_FROM` is blank, portal notifications use `CONTACT_FROM`.

Optional variables already supported by the repo:

```env
PUBLIC_GA4_ID=
PUBLIC_GOOGLE_SITE_VERIFICATION=
PUBLIC_BING_SITE_VERIFICATION=
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
PUBLIC_CLIENT_ERROR_REPORTING=false
CLIENT_ERROR_WEBHOOK=
CONTACT_ALERT_WEBHOOK=
MAX_JS_KB=380
MAX_CSS_KB=80
```

Cloudflare R2 variables are not required for the client portal.

## 2. Supabase SQL Order

Run these files manually in Supabase SQL Editor in this order:

1. `docs/client-portal-supabase.sql`
2. `docs/client-portal-production.sql`
3. `docs/client-portal-production-v2.sql`

The V2 migration adds archive/delete metadata, update timestamps, active-document indexes, and RLS policies that hide archived/deleted documents and archived messages from client portal reads.

## 3. Supabase Storage

Create one bucket:

```text
fidara-client-documents
```

Storage rules:

- The bucket must be private.
- Files are uploaded through signed upload URLs.
- Files are downloaded only through short-lived signed URLs.
- Do not make document paths public.
- Do not expose raw storage keys in UI.

## 4. Make A User Admin

After the user exists in Supabase Auth and `profiles`, run:

```sql
update profiles
set role = 'admin'
where email = 'seigetank99@gmail.com';
```

Only users with `profiles.role = 'admin'` can use `/api/admin`.

## 5. Staff Login Flow

Expected staff flow:

- `/staff-login` is the staff login page.
- `/staff-login` is `noindex,nofollow`.
- The footer Staff Login link points to `/staff-login`, not `/admin`.
- Staff login posts credentials to `POST /api/portal?action=login`.
- After login, staff login verifies admin access with `GET /api/admin?action=summary`.
- If the account is not an admin, the browser calls logout and shows `This account does not have staff access.`
- `/admin` is the protected admin dashboard.
- `/admin` initially shows `Verifying staff access...`.
- If unauthenticated, `/admin` redirects to `/staff-login`.
- If logged in but not admin, `/admin` shows Access Denied.
- Admin logout redirects to `/staff-login`.
- Client logout redirects to `/login`.

## 6. Client Onboarding

Current admin flow supports `Invite / Link Client User`.

1. Create the client in `/admin`.
2. In `Invite / Link Client User`, choose the client and enter the user's email and optional full name.
3. If the Supabase Auth user already exists, the API links that user to the client.
4. If the user does not exist and Supabase Admin invite email is available, the API calls `inviteUserByEmail` and redirects password setup to `/reset-password`.
5. If invite email is unavailable or fails, create the user manually in Supabase Auth first, then run the link step again in `/admin`.

Invite status:

- Invite emails are supported by the current admin API when Supabase Auth email settings and `inviteUserByEmail` are working.
- Manual onboarding is still the fallback.
- Do not send default passwords by email.
- Do not create insecure temporary passwords.

## 7. Password Reset

Routes:

- `/forgot-password`
- `/reset-password`

Reset behavior:

- `/forgot-password` uses Supabase Auth reset emails.
- The user-facing response should not reveal whether an email exists.
- `/reset-password` accepts Supabase code/hash reset links and updates the password in the browser through Supabase Auth.
- Configure Supabase Auth email templates and allowed redirect URLs before launch.

Required redirect URLs:

```text
https://www.fidaragroup.com/reset-password
http://localhost:4321/reset-password
```

Password reset audit events are not emitted by this app because the reset is handled by Supabase Auth in the browser. Use Supabase Auth logs for reset delivery and auth-level activity.

## 8. Billing

Billing uses hosted Stripe invoice URLs only.

Admin workflow:

1. Create the invoice in Stripe.
2. Copy the Stripe `hosted_invoice_url`.
3. Create or update the billing item in `/admin`.
4. Client opens `/portal` and clicks Pay Invoice.
5. Client leaves the Fidara site for the Stripe-hosted payment page.

Rules:

- No custom credit-card processing.
- No card entry forms in Fidara.
- No card details are stored by Fidara.
- Billing item records store invoice metadata and hosted links only.

## 9. Email Notifications

Portal notifications use `src/lib/portalEmail.js` and the existing SMTP/Nodemailer settings.

Notifications are wired for:

- New document request.
- New billing item.
- New portal message.
- Document marked completed.
- Client user linked or invited.

Notification rules:

- Email failure does not break the admin action.
- Missing SMTP logs a server-side warning and skips delivery.
- Emails do not attach documents.
- Emails do not include signed storage links.
- Emails tell the client to log into the portal.

Default subject used for new portal items:

```text
New item in your Fidara client portal
```

## 10. Admin Workflow Support

Implemented admin capabilities:

- View clients.
- Create client.
- Link existing Supabase Auth user to client.
- Invite client user through Supabase Auth when available.
- View uploaded documents.
- Download documents through signed URLs.
- Update document status to `received`, `reviewing`, or `completed`.
- Create document request.
- Edit, complete, or close document request.
- Create billing item.
- Edit billing item.
- Create portal message.
- Archive portal message.
- Archive document.
- Delete document file only after explicit confirmation.
- View recent audit events.

Delete behavior removes the physical file from Supabase Storage after confirmation, then marks the database row deleted so audit history can remain.

## 11. Archive And Delete Behavior

Expected behavior:

- Archived/deleted documents do not show in the client portal.
- Admin document list hides archived/deleted documents by default.
- Admin can filter Active, Archived, or All.
- Delete requires confirmation in the UI and `confirm: true` in the API.
- Delete removes from Supabase Storage only after confirmation.
- Archive/delete actions create audit events.
- Raw storage keys are not displayed in UI.

Prefer archive unless the file truly needs to be removed from storage.

## 12. Audit Logging

Audit events are written to `audit_events` for:

- Client created.
- Client user linked.
- Client user invited.
- Document uploaded.
- Client document download requested.
- Admin document download requested.
- Request created.
- Request updated, completed, or closed.
- Billing item created.
- Billing item updated.
- Portal message created.
- Portal message archived.
- Document status updated.
- Document archived.
- Document deleted.

Audit rules:

- Do not log passwords.
- Do not log service role keys.
- Do not log signed URLs.
- Do not log full private document contents.
- Do not log raw storage keys unless a future incident workflow explicitly requires it.

Password reset audit is not currently app-level because Supabase Auth owns that browser flow. Review Supabase Auth logs for reset activity.

## 13. Login Abuse And Contact Form Protection

Current protections:

- Login errors are generic.
- Password reset response does not reveal whether an email exists.
- Server API responses do not expose stack traces.
- Supabase Auth handles auth-level protections.
- Client and staff login forms add a short browser-side cooldown after repeated failures.
- Contact form uses an in-memory per-instance rate limit.
- Contact form supports Cloudflare Turnstile when `TURNSTILE_SECRET_KEY` is set.
- Contact form includes honeypot and minimum-fill-time checks.

## 14. Public Policy Pages

Before launch, review:

- `/privacy`
- `/terms`
- `/security`

These pages should remain plain-language and avoid overclaiming compliance certifications. They should mention portal data, uploaded documents, private storage, signed download links, staff/admin controls, audit logging, hosted Stripe billing, and user password responsibilities.

## 15. Final Launch Test Checklist

Local verification before deployment:

- Run `npm run ci`.
- Run `npm run test:e2e`.

Run these checks on the production deployment:

- Public site loads.
- Chatbot appears on public pages only.
- `/login` works for client.
- `/portal` loads.
- Client logout redirects to `/login`.
- Upload PDF works.
- Download PDF works.
- `/forgot-password` sends reset email end to end.
- `/reset-password` updates password end to end.
- `/staff-login` accepts admin user and opens `/admin`.
- `/staff-login` rejects non-admin user with the staff-access message.
- Direct `/admin` while logged out redirects to `/staff-login` and does not show admin data.
- Admin logout redirects to `/staff-login`.
- Admin can create client.
- Admin can link/invite user.
- Admin can create request.
- Admin can create billing item.
- Admin can create portal message.
- Client sees request/billing/message in `/portal`.
- Admin can update document status.
- Two-client isolation works: client A cannot see client B documents, requests, billing, messages, or audit events.
- Audit log updates.

Also confirm:

- Hosted Stripe invoice links open on Stripe-hosted pages.
- Portal notification emails send when SMTP is configured.
- Notification email failure does not block admin actions.
- Archived/deleted documents remain hidden from clients.
- Staff Login footer link points to `/staff-login` and remains discreet/muted.

## 16. Local Verification

Before deployment, run:

```sh
npm run ci
npm run build
```

If browser smoke tests can run without real Supabase credentials, run:

```sh
npm run test:e2e
```

The smoke tests should cover public routes, login/reset pages, legal/security pages, and unauthenticated `/portal` and `/admin` behavior without requiring production credentials.

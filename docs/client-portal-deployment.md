# Client Portal Deployment Checklist

## Supabase

1. Create Supabase project.
2. Run `docs/client-portal-supabase.sql` in Supabase SQL Editor.
3. Create at least one test user.
4. Create one test client row.
5. Link the test user to the test client in `client_users`.
6. Create a private Supabase Storage bucket named `fidara-client-documents`.

## Vercel Environment Variables

Add these to Vercel Project Settings:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_STORAGE_BUCKET=fidara-client-documents
PUBLIC_SUPABASE_STORAGE_BUCKET=fidara-client-documents

SESSION_COOKIE_NAME=fidara_session
```

`SUPABASE_STORAGE_BUCKET` defaults to `fidara-client-documents` if unset, but it should still be configured explicitly in production so the browser and server use the same bucket name.

Cloudflare R2 is no longer required for client portal document storage.

## Test Flow

1. Visit `/login`.
2. Log in with test client user.
3. Confirm redirect to `/portal`.
4. Upload one PDF.
5. Confirm document appears in portal.
6. Click download.
7. Confirm file opens from a signed Supabase Storage URL.

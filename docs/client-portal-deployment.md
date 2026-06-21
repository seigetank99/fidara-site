# Client Portal Deployment Checklist

## Supabase

1. Create Supabase project.
2. Run `docs/client-portal-supabase.sql` in Supabase SQL Editor.
3. Create at least one test user.
4. Create one test client row.
5. Link the test user to the test client in `client_users`.

## Cloudflare R2

1. Create private R2 bucket named `fidara-client-documents`.
2. Create R2 API token with Object Read & Write permissions.
3. Add R2 CORS policy for browser uploads.

Example CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://www.fidaragroup.com",
      "https://fidaragroup.com",
      "https://fidara-site.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Vercel Environment Variables

Add these to Vercel Project Settings:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=fidara-client-documents

SESSION_COOKIE_NAME=fidara_session
```

## Test Flow

1. Visit `/login`.
2. Log in with test client user.
3. Confirm redirect to `/portal`.
4. Upload one PDF.
5. Confirm document appears in portal.
6. Click download.
7. Confirm file opens from signed R2 URL.

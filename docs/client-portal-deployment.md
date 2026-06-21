# Client Portal Deployment Checklist

## Supabase

1. Create Supabase project.
2. Run `docs/client-portal-supabase.sql` in Supabase SQL Editor.
3. Run `docs/client-portal-v2.sql` to add billing, document requests, and portal messages.
4. Create at least one test user.
5. Create one test client row.
6. Link the test user to the test client in `client_users`.
7. Create a private Supabase Storage bucket named `fidara-client-documents`.

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

## Billing MVP

Billing in the portal uses stored hosted invoice URLs. The portal does not collect or store card details.

To add a test invoice manually:

```sql
insert into billing_items (
  client_id,
  title,
  description,
  amount_cents,
  currency,
  status,
  due_date,
  stripe_hosted_invoice_url,
  invoice_pdf_url
) values (
  'YOUR_CLIENT_ID_HERE',
  'Monthly accounting services',
  'June 2026 recurring bookkeeping and close support.',
  125000,
  'usd',
  'open',
  current_date + interval '7 days',
  'https://invoice.stripe.com/test_example',
  'https://example.com/invoice.pdf'
);
```

Real payment handling should remain on Stripe-hosted invoice or payment pages rather than custom card collection inside the portal.

## Test Flow

1. Visit `/login`.
2. Log in with test client user.
3. Confirm redirect to `/portal`.
4. Upload one PDF.
5. Confirm document appears in the Recent Documents section.
6. Insert a test invoice and confirm Billing shows the hosted payment link.
7. Insert a test document request and confirm Requested Items appears.
8. Click download.
9. Confirm file opens from a signed Supabase Storage URL.

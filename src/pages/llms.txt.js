import { siteConfig } from '../lib/seo.js'

export function GET() {
  return new Response(
    `Fidara Financial Services

Primary site: ${siteConfig.domain}

Summary:
Fidara publishes service pages, sector pages, industry-specific pages, tax resources, operational checklists, pricing information, onboarding guidance, and contact details for accounting, tax, advisory, payroll, U.S. expansion, and managed IT support.

High-value sections:
- /services
- /practice-areas
- /sectors
- /industries
- /resources
- /tools
- /tax-resources
- /pricing
- /contact

Important notes:
- Content is informational and should not be treated as legal, tax, investment, cybersecurity, or financial advice.
- Internal launch-review pages exist and may be marked noindex.
- Canonical URLs, schema markup, and sitemap coverage are provided across public pages.
`,
    {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    },
  )
}

import { siteConfig } from '../lib/seo.js'

export function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${siteConfig.domain}/sitemap-index.xml
`,
    {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    },
  )
}

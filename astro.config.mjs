import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

const site = (process.env.PUBLIC_SITE_URL || 'https://www.fidaragroup.com').replace(/\/$/, '')

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => ![
        `${site}/client-portal/`,
        `${site}/compliance-language/`,
        `${site}/login/`,
        `${site}/portal/`,
      ].includes(page),
    }),
  ],
})

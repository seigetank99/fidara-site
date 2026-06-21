import fs from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve('dist')
const MAX_JS_KB = Number(process.env.MAX_JS_KB || 380)
const MAX_CSS_KB = Number(process.env.MAX_CSS_KB || 80)
const SITE_URL = 'https://www.fidaragroup.com'

async function listFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await listFiles(full))
    else out.push(full)
  }
  return out
}

function fail(errors) {
  for (const error of errors) console.error(`✖ ${error}`)
  process.exit(1)
}

function assertIncludes(content, pattern, error, errors) {
  if (!pattern.test(content)) errors.push(error)
}

function isSearchVerificationHtml(file) {
  const basename = path.basename(file)
  return /^google[a-f0-9]+\.html$/i.test(basename) || /^BingSiteAuth\.xml$/i.test(basename)
}

async function main() {
  const errors = []
  const files = await listFiles(DIST_DIR)
  const htmlFiles = files.filter((f) => f.endsWith('.html') && !isSearchVerificationHtml(f))
  const jsFiles = files.filter((f) => f.endsWith('.js'))
  const cssFiles = files.filter((f) => f.endsWith('.css'))

  if (!htmlFiles.length) errors.push('No prerendered HTML files found in dist.')

  for (const file of jsFiles) {
    const stat = await fs.stat(file)
    const sizeKb = stat.size / 1024
    if (sizeKb > MAX_JS_KB) {
      errors.push(`JS budget exceeded: ${path.relative(DIST_DIR, file)} is ${sizeKb.toFixed(1)}KB (max ${MAX_JS_KB}KB).`)
    }
  }

  for (const file of cssFiles) {
    const stat = await fs.stat(file)
    const sizeKb = stat.size / 1024
    if (sizeKb > MAX_CSS_KB) {
      errors.push(`CSS budget exceeded: ${path.relative(DIST_DIR, file)} is ${sizeKb.toFixed(1)}KB (max ${MAX_CSS_KB}KB).`)
    }
  }

  for (const file of htmlFiles) {
    const rel = path.relative(DIST_DIR, file)
    const html = await fs.readFile(file, 'utf8')
    const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || ''
    const isNoindexPage = /noindex/i.test(robots)
    const isRedirectPage = /<meta http-equiv="refresh"/i.test(html)

    assertIncludes(html, /<title>[^<]+<\/title>/i, `${rel}: missing <title>.`, errors)
    assertIncludes(html, /<meta name="description" content="[^"]+"/i, `${rel}: missing meta description.`, errors)
    assertIncludes(html, /<link rel="canonical" href="[^"]+"/i, `${rel}: missing canonical link.`, errors)
    assertIncludes(html, /<meta name="robots" content="[^"]+"/i, `${rel}: missing robots meta.`, errors)

    if (!isNoindexPage && !isRedirectPage) {
      assertIncludes(html, /<meta property="og:title" content="[^"]+"/i, `${rel}: missing og:title.`, errors)
      assertIncludes(html, /<meta property="og:description" content="[^"]+"/i, `${rel}: missing og:description.`, errors)
      assertIncludes(html, /<meta property="og:site_name" content="[^"]+"/i, `${rel}: missing og:site_name.`, errors)
      assertIncludes(html, /<meta name="twitter:card" content="summary_large_image"/i, `${rel}: missing twitter:card.`, errors)
      assertIncludes(html, /<script type="application\/ld\+json">/i, `${rel}: missing structured data script.`, errors)
      assertIncludes(html, /id="main-content"/i, `${rel}: missing #main-content landmark.`, errors)
      assertIncludes(html, /<h1[\s>]/i, `${rel}: missing H1.`, errors)
    }

    if (/TODO|FIXME|Add phone number|example\.com/i.test(html)) {
      errors.push(`${rel}: contains placeholder or development copy.`)
    }

    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || ''
    const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || ''
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || ''

    if (title.length < 20 || title.length > 75) {
      errors.push(`${rel}: title length should be 20–75 chars, got ${title.length}.`)
    }

    if (!isRedirectPage && (description.length < 70 || description.length > 180)) {
      errors.push(`${rel}: meta description length should be 70–180 chars, got ${description.length}.`)
    }

    if (!canonical.startsWith(`${SITE_URL}/`)) {
      errors.push(`${rel}: canonical must use ${SITE_URL}/.`)
    }

    if (!isRedirectPage && !canonical.endsWith('/')) {
      errors.push(`${rel}: canonical should use trailing slash.`)
    }

    if (isNoindexPage && !/nofollow/i.test(robots)) {
      errors.push(`${rel}: noindex pages should also specify nofollow.`)
    }
  }

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml')
  const sitemapIndexPath = path.join(DIST_DIR, 'sitemap-index.xml')
  const robotsPath = path.join(DIST_DIR, 'robots.txt')

  let sitemapContent = ''
  try {
    sitemapContent = await fs.readFile(sitemapPath, 'utf8')
  } catch {
    try {
      sitemapContent = await fs.readFile(sitemapIndexPath, 'utf8')
      const sitemapRefs = [...sitemapContent.matchAll(/<loc>[^<]*\/([^/]+\.xml)<\/loc>/g)]
        .map((match) => match[1])

      if (!sitemapRefs.length) {
        errors.push('dist/sitemap-index.xml does not reference any sitemap files.')
      }

      for (const sitemapRef of sitemapRefs) {
        try {
          await fs.access(path.join(DIST_DIR, sitemapRef))
        } catch {
          errors.push(`Missing sitemap referenced by sitemap-index.xml: dist/${sitemapRef}`)
        }
      }
    } catch {
      errors.push('Missing dist/sitemap.xml or dist/sitemap-index.xml')
    }
  }

  if (sitemapContent && !/<(?:urlset|sitemapindex)\b/i.test(sitemapContent)) {
    errors.push('Generated sitemap is not a valid sitemap document.')
  }

  const noindexUrls = new Set()
  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8')
    if (!/<meta name="robots" content="[^"]*noindex/i.test(html)) continue
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]
    if (canonical) noindexUrls.add(canonical)
  }

  for (const file of files.filter((f) => f.endsWith('.xml') && f.includes('sitemap'))) {
    const xml = await fs.readFile(file, 'utf8')
    for (const noindexUrl of noindexUrls) {
      if (xml.includes(noindexUrl)) {
        errors.push(`Sitemap includes noindex URL: ${noindexUrl}`)
      }
    }
  }

  try { await fs.access(robotsPath) } catch { errors.push('Missing dist/robots.txt') }

  if (errors.length) fail(errors)
  console.log('✓ Launch gates passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

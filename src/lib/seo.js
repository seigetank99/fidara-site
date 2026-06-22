import {
  industryProfileBySlug,
  practiceAreaBySlug,
  resourceBySlug,
  sectorBySlug,
  serviceAreaBySlug,
  serviceBySlug,
  siteConfig,
  taxResourceBySlug,
  toolBySlug,
  usExpansionBySlug,
} from '../components/site-core.jsx'

export { siteConfig }

export function normalizeRoute(route) {
  if (!route) return '/'
  if (!route.startsWith('/')) route = `/${route}`
  if (route !== '/' && route.endsWith('/')) route = route.slice(0, -1)
  return route
}

export function getPageMeta(path) {
  const cleanPath = normalizeRoute(path)

  const defaultMeta = {
    title: 'Fidara | Accounting, Tax, Advisory & Managed IT',
    description:
      'Fidara Financial Services provides accounting, bookkeeping, tax, payroll, advisory, U.S. expansion, and managed IT support for growing businesses.',
  }

  const exact = {
    '/404': {
      title: 'Page Not Found | Fidara Financial Services',
      description:
        'The page you requested could not be found. Return to Fidara Financial Services to explore accounting, tax, advisory, payroll, and managed IT support.',
    },
    '/careers': {
      title: 'Careers | Fidara Financial Services',
      description:
        'Explore future opportunities with Fidara across accounting, tax, payroll, advisory, operations, systems, and managed IT support.',
    },
    '/case-studies': {
      title: 'Client Scenarios | Fidara Financial Services',
      description:
        'Review practical examples of how Fidara helps businesses clean up books, improve payroll and AP workflows, understand cash flow, and prepare for U.S. expansion.',
    },
    '/faq': {
      title: 'FAQ | Fidara Financial Services',
      description:
        'Answers to common questions about working with Fidara for accounting, bookkeeping, tax, payroll, advisory, U.S. expansion, and managed IT support.',
    },
    '/industries': {
      title: 'Industries | Fidara Financial Services',
      description:
        'Industry-specific accounting, tax, payroll, advisory, and systems support for restaurants, dental practices, construction, real estate, e-commerce, and more.',
    },
    '/newsletter': {
      title: 'Newsletter | Fidara Financial Services',
      description:
        'Subscribe for practical Fidara updates on bookkeeping, tax readiness, payroll, business operations, advisory planning, and financial systems.',
    },
    '/onboarding': {
      title: 'Client Onboarding | Fidara Financial Services',
      description:
        'Understand how Fidara organizes onboarding for accounting, bookkeeping, tax, payroll, advisory, documents, systems access, and recurring workflows.',
    },
    '/partners': {
      title: 'Professional Partners | Fidara Financial Services',
      description:
        'Fidara coordinates with attorneys, bankers, insurance advisors, technology vendors, and other professionals around shared client goals.',
    },
    '/privacy': {
      title: 'Privacy Policy | Fidara Financial Services',
      description:
        'Read Fidara Financial Services privacy information covering website use, inquiry details, client communications, and data handling expectations.',
    },
    '/referrals': {
      title: 'Referrals | Fidara Financial Services',
      description:
        'Refer a founder, family, operator, or growing business that needs calmer books, stronger systems, tax clarity, and year-round financial guidance.',
    },
    '/service-areas': {
      title: 'Service Areas | Fidara Financial Services',
      description:
        'Fidara supports clients locally and remotely across New York, New Jersey, Connecticut, and other appropriate service areas.',
    },
    '/terms': {
      title: 'Terms of Use | Fidara Financial Services',
      description:
        'Review Fidara Financial Services website terms covering informational content, professional advice limitations, website use, and communications.',
    },
    '/security': {
      title: 'Security | Fidara Financial Services',
      description:
        'Review Fidara Financial Services client portal security practices covering login access, private document storage, signed downloads, and audit activity.',
    },
    '/disclaimer': {
      title: 'Website Disclaimer | Fidara Financial Services',
      description:
        'Read Fidara Financial Services disclaimers about informational website content, professional advice limitations, third-party tools, and regulated services.',
    },
    '/us-expansion': {
      title: 'U.S. Expansion Support | Fidara Financial Services',
      description:
        'Accounting, payroll, tax-readiness, reporting, and systems setup for founders and businesses entering or growing in the U.S. market.',
    },
    '/who-we-help': {
      title: 'Who We Help | Fidara Financial Services',
      description:
        'Fidara supports individuals, families, small business owners, growing teams, U.S. expansion clients, and operators with messy books or advisory needs.',
    },
    '/tax-resources': {
      title: 'Tax Resource Library | Fidara Financial Services',
      description:
        'Tax organizers and planning guides for individuals, families, freelancers, and small business owners.',
    },
    '/client-document-checklist': {
      title: 'Client Document Checklist | Fidara Financial Services',
      description:
        'A practical checklist of records to prepare before working with Fidara on bookkeeping, tax, payroll, advisory, or managed IT.',
    },
    '/compliance-language': {
      title: 'Compliance Language Checklist | Fidara Financial Services',
      description:
        'Internal launch guidance for reviewing CPA, tax, managed IT, wealth, testimonial, and regulated website language.',
    },
    '/practice-areas': {
      title: 'Practice Areas | Fidara Financial Services',
      description:
        'Explore Fidara practice areas for individuals, families, small businesses, bookkeeping cleanup, tax planning, tax notices, monthly accounting, and owner advisory.',
    },
    '/business-health-check': {
      title: 'Business Health Check | Fidara Financial Services',
      description:
        'A quick self-assessment for small business owners covering bookkeeping, cash flow, payroll, taxes, controls, and managed IT readiness.',
    },
    '/tax-calendar': {
      title: 'Tax Calendar | Fidara Financial Services',
      description:
        'A practical tax, payroll, estimated tax, sales tax, and year-end planning reminder calendar for individuals and small business owners.',
    },
    '/tax-advice': {
      title: 'Tax Advice Center | Fidara Financial Services',
      description:
        'Common tax questions for everyday people and small business owners, explained clearly with educational guidance and reminders to seek professional advice.',
    },
    '/start': {
      title: 'Start Here | Fidara Financial Services',
      description:
        'Choose the Fidara path that best matches your needs, from messy books and payroll to U.S. expansion and managed IT support.',
    },
    '/': {
      title: 'Fidara | Modern accounting with a personal touch.',
      description:
        'Accounting, tax, advisory, payroll, technology, and strategic support for every stage of life and business.',
    },
    '/about': {
      title: 'About Fidara | Trust, Clarity & Calm Financial Structure',
      description:
        'Learn about Fidara Financial Services and the philosophy behind its accounting, advisory, tax, payroll, and technology support.',
    },
    '/services': {
      title: 'Services | Fidara Financial Services',
      description:
        'Explore Fidara services including bookkeeping, tax, CFO services, payroll, AP management, spend management, U.S. expansion, wealth coordination, and managed IT.',
    },
    '/sectors': {
      title: 'Sectors We Support | Fidara Financial Services',
      description:
        'Explore the sectors Fidara supports, including home services, health care practices, hospitality, retail, professional services, and mission-driven organizations.',
    },
    '/resources': {
      title: 'Resources | Fidara Financial Services',
      description:
        'Plain-English guides for bookkeeping, tax readiness, payroll, managed IT, CFO support, and better business operations.',
    },
    '/tools': {
      title: 'Tools & Checklists | Fidara Financial Services',
      description:
        'Practical checklists for monthly close, payroll onboarding, tax season, managed IT security, and business readiness.',
    },
    '/contact': {
      title: 'Contact Fidara | Book a Consultation',
      description:
        'Contact Fidara Financial Services to discuss accounting, tax, advisory, payroll, managed IT, or U.S. expansion support.',
    },
    '/thank-you': {
      title: 'Thank You | Fidara Financial Services',
      description:
        'Thank you for contacting Fidara Financial Services. Your inquiry has been received and will be reviewed for the next appropriate step.',
    },
    '/pricing': {
      title: 'Pricing & Engagements | Fidara Financial Services',
      description:
        'Explore Fidara engagement types for foundation, growth, and strategic accounting, advisory, and technology support.',
    },
    '/technology': {
      title: 'Technology Systems | Fidara Financial Services',
      description:
        'Technology support for accounting systems, payroll systems, document management, dashboards, cybersecurity basics, and managed IT.',
    },
  }

  if (exact[cleanPath]) return exact[cleanPath]

  if (cleanPath.startsWith('/services/')) {
    const service = serviceBySlug[cleanPath.replace('/services/', '')]
    if (service) {
      return {
        title: `${service.title} | Fidara Financial Services`,
        description: service.intro || service.description,
      }
    }
  }

  if (cleanPath.startsWith('/sectors/')) {
    const sector = sectorBySlug[cleanPath.replace('/sectors/', '')]
    if (sector) {
      return {
        title: `${sector.title} | Fidara Financial Services`,
        description: `Accounting, advisory, payroll, tax, and systems support for ${sector.title.toLowerCase()}.`,
      }
    }
  }

  if (cleanPath.startsWith('/industries/')) {
    const profile = industryProfileBySlug[cleanPath.replace('/industries/', '')]
    if (profile) {
      return {
        title: `${profile.title} Accounting & Advisory | Fidara`,
        description: profile.description,
      }
    }
  }

  if (cleanPath.startsWith('/practice-areas/')) {
    const page = practiceAreaBySlug[cleanPath.replace('/practice-areas/', '')]
    if (page) {
      return {
        title: `${page.title} | Fidara Financial Services`,
        description: page.description,
      }
    }
  }

  if (cleanPath.startsWith('/tax-resources/')) {
    const page = taxResourceBySlug[cleanPath.replace('/tax-resources/', '')]
    if (page) {
      return {
        title: `${page.title} | Fidara Financial Services`,
        description: page.description,
      }
    }
  }

  if (cleanPath.startsWith('/resources/')) {
    const article = resourceBySlug[cleanPath.replace('/resources/', '')]
    if (article) {
      return {
        title: `${article.title} | Fidara`,
        description: article.description,
      }
    }
  }

  if (cleanPath.startsWith('/service-areas/')) {
    const area = serviceAreaBySlug[cleanPath.replace('/service-areas/', '')]
    if (area) {
      return {
        title: `${area.title} | Fidara Financial Services`,
        description: area.description,
      }
    }
  }

  if (cleanPath.startsWith('/tools/')) {
    const tool = toolBySlug[cleanPath.replace('/tools/', '')]
    if (tool) {
      return {
        title: `${tool.title} | Fidara Financial Services`,
        description: tool.description,
      }
    }
  }

  if (cleanPath.startsWith('/us-expansion/')) {
    const page = usExpansionBySlug[cleanPath.replace('/us-expansion/', '')]
    if (page) {
      return {
        title: `${page.title} | Fidara Financial Services`,
        description: page.description,
      }
    }
  }

  return defaultMeta
}

export function getMetaImagePath(path) {
  const cleanPath = normalizeRoute(path)
  const exact = {
    '/about': '/images/about.png',
    '/contact': '/images/contact.png',
    '/resources': '/images/resource.png',
    '/sectors': '/images/sector.png',
    '/services': '/images/service.png',
  }
  if (exact[cleanPath]) return exact[cleanPath]
  if (cleanPath.startsWith('/services/')) return '/images/service.png'
  if (cleanPath.startsWith('/resources/')) return '/images/resource.png'
  if (cleanPath.startsWith('/sectors/')) return '/images/sector.png'
  if (cleanPath.startsWith('/industries/')) return '/images/sector.png'
  return '/images/hero-mountain.png'
}

export function getRobotsPolicy(path) {
  const cleanPath = normalizeRoute(path)
  const noIndexPaths = new Set(['/404', '/compliance-language', '/privacy', '/terms', '/disclaimer'])
  return noIndexPaths.has(cleanPath) ? 'noindex,nofollow' : 'index,follow'
}

function titleizeSegment(segment) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getCanonical(path) {
  const cleanPath = normalizeRoute(path)
  return `${siteConfig.domain}${cleanPath === '/' ? '/' : `${cleanPath}/`}`
}

export function getOgImageUrl(path) {
  return `${siteConfig.domain}${getMetaImagePath(path)}`
}

export function getStructuredData(path) {
  const cleanPath = normalizeRoute(path)
  const canonical = getCanonical(cleanPath)
  const meta = getPageMeta(cleanPath)
  const segments = cleanPath === '/' ? [] : cleanPath.slice(1).split('/')

  const organization = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'AccountingService', 'ProfessionalService'],
    name: siteConfig.companyName,
    legalName: siteConfig.legalName,
    url: siteConfig.domain,
    email: siteConfig.email,
    logo: `${siteConfig.domain}/images/logo.png`,
    image: getOgImageUrl(cleanPath),
    areaServed: siteConfig.serviceArea,
    sameAs: [],
  }

  if (siteConfig.phone) organization.telephone = siteConfig.phone

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.companyName,
    url: siteConfig.domain,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.domain}/resources?query={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const webpage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: canonical,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.companyName,
      url: siteConfig.domain,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.companyName,
      url: siteConfig.domain,
    },
    inLanguage: 'en-US',
  }

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteConfig.domain,
    },
  ]

  let pathAccumulator = ''
  segments.forEach((segment, index) => {
    pathAccumulator += `/${segment}`
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: index + 2,
      name: titleizeSegment(segment),
      item: `${siteConfig.domain}${pathAccumulator}`,
    })
  })

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  return [organization, website, webpage, breadcrumbs]
}

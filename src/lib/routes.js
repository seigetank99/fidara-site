import {
  industryProfileBySlug,
  practiceAreaBySlug,
  resourceBySlug,
  sectorBySlug,
  serviceAreaBySlug,
  serviceBySlug,
  taxResourceBySlug,
  toolBySlug,
  usExpansionBySlug,
} from '../components/site-core.jsx'
import AboutPage from '../site-pages/astro/AboutPage.astro'
import BusinessHealthCheckPage from '../site-pages/routes/BusinessHealthCheckPage.jsx'
import CareersPage from '../site-pages/astro/CareersPage.astro'
import CaseStudiesPage from '../site-pages/astro/CaseStudiesPage.astro'
import ClientDocumentChecklistPage from '../site-pages/astro/ClientDocumentChecklistPage.astro'
import ComplianceLanguagePage from '../site-pages/astro/ComplianceLanguagePage.astro'
import ContactPage from '../site-pages/routes/ContactPage.jsx'
import FAQPage from '../site-pages/astro/FAQPage.astro'
import HomePage from '../site-pages/astro/HomePage.astro'
import IndustriesIndexPage from '../site-pages/astro/IndustriesIndexPage.astro'
import IndustryProfilePage from '../site-pages/astro/IndustryProfilePage.astro'
import LegalPage from '../site-pages/astro/LegalPage.astro'
import NewsletterPage from '../site-pages/routes/NewsletterPage.jsx'
import NotFoundPage from '../site-pages/astro/NotFoundPage.astro'
import OnboardingPage from '../site-pages/astro/OnboardingPage.astro'
import PartnersPage from '../site-pages/astro/PartnersPage.astro'
import PracticeAreaPage from '../site-pages/astro/PracticeAreaPage.astro'
import PracticeAreasPage from '../site-pages/astro/PracticeAreasPage.astro'
import PricingPage from '../site-pages/astro/PricingPage.astro'
import ReferralsPage from '../site-pages/astro/ReferralsPage.astro'
import ResourceArticlePage from '../site-pages/astro/ResourceArticlePage.astro'
import ResourcesPage from '../site-pages/astro/ResourcesPage.astro'
import SectorPage from '../site-pages/astro/SectorPage.astro'
import SectorsIndexPage from '../site-pages/astro/SectorsIndexPage.astro'
import ServiceAreaDetailPage from '../site-pages/astro/ServiceAreaDetailPage.astro'
import ServiceAreasPage from '../site-pages/astro/ServiceAreasPage.astro'
import ServicePage from '../site-pages/astro/ServicePage.astro'
import ServicesIndexPage from '../site-pages/astro/ServicesIndexPage.astro'
import StartPage from '../site-pages/astro/StartPage.astro'
import TaxAdvicePage from '../site-pages/routes/TaxAdvicePage.jsx'
import TaxCalendarPage from '../site-pages/astro/TaxCalendarPage.astro'
import TaxResourceDetailPage from '../site-pages/astro/TaxResourceDetailPage.astro'
import TaxResourcesPage from '../site-pages/astro/TaxResourcesPage.astro'
import TechnologyPage from '../site-pages/astro/TechnologyPage.astro'
import ThankYouPage from '../site-pages/astro/ThankYouPage.astro'
import ToolDetailPage from '../site-pages/astro/ToolDetailPage.astro'
import ToolsPage from '../site-pages/astro/ToolsPage.astro'
import USExpansionDetailPage from '../site-pages/astro/USExpansionDetailPage.astro'
import USExpansionPage from '../site-pages/astro/USExpansionPage.astro'
import WhoWeHelpPage from '../site-pages/astro/WhoWeHelpPage.astro'

export const INTERACTIVE_ROUTES = new Set([
  '/business-health-check',
  '/contact',
  '/newsletter',
  '/tax-advice',
])

const staticRouteEntries = [
  ['/', HomePage],
  ['/start', StartPage],
  ['/about', AboutPage],
  ['/who-we-help', WhoWeHelpPage],
  ['/case-studies', CaseStudiesPage],
  ['/technology', TechnologyPage],
  ['/faq', FAQPage],
  ['/services', ServicesIndexPage],
  ['/practice-areas', PracticeAreasPage],
  ['/sectors', SectorsIndexPage],
  ['/industries', IndustriesIndexPage],
  ['/us-expansion', USExpansionPage],
  ['/tools', ToolsPage],
  ['/careers', CareersPage],
  ['/partners', PartnersPage],
  ['/referrals', ReferralsPage],
  ['/newsletter', NewsletterPage],
  ['/service-areas', ServiceAreasPage],
  ['/contact', ContactPage],
  ['/business-health-check', BusinessHealthCheckPage],
  ['/tax-calendar', TaxCalendarPage],
  ['/tax-advice', TaxAdvicePage],
  ['/thank-you', ThankYouPage],
  ['/tax-resources', TaxResourcesPage],
  ['/client-document-checklist', ClientDocumentChecklistPage],
  ['/compliance-language', ComplianceLanguagePage],
  ['/resources', ResourcesPage],
  ['/onboarding', OnboardingPage],
  ['/pricing', PricingPage],
  ['/privacy', LegalPage, { type: 'privacy' }],
  ['/terms', LegalPage, { type: 'terms' }],
  ['/disclaimer', LegalPage, { type: 'disclaimer' }],
]

const routeRegistry = new Map(
  staticRouteEntries.map(([path, component, props = {}]) => [
    path,
    { component, props, hydrate: INTERACTIVE_ROUTES.has(path) },
  ]),
)

for (const [slug, service] of Object.entries(serviceBySlug)) {
  routeRegistry.set(`/services/${slug}`, {
    component: ServicePage,
    props: { service },
    hydrate: false,
  })
}

for (const [slug, sector] of Object.entries(sectorBySlug)) {
  routeRegistry.set(`/sectors/${slug}`, {
    component: SectorPage,
    props: { sector },
    hydrate: false,
  })
}

for (const [slug, article] of Object.entries(resourceBySlug)) {
  routeRegistry.set(`/resources/${slug}`, {
    component: ResourceArticlePage,
    props: { article },
    hydrate: false,
  })
}

for (const [slug, profile] of Object.entries(industryProfileBySlug)) {
  routeRegistry.set(`/industries/${slug}`, {
    component: IndustryProfilePage,
    props: { profile },
    hydrate: false,
  })
}

for (const [slug, page] of Object.entries(usExpansionBySlug)) {
  routeRegistry.set(`/us-expansion/${slug}`, {
    component: USExpansionDetailPage,
    props: { page },
    hydrate: false,
  })
}

for (const [slug, tool] of Object.entries(toolBySlug)) {
  routeRegistry.set(`/tools/${slug}`, {
    component: ToolDetailPage,
    props: { tool },
    hydrate: false,
  })
}

for (const [slug, area] of Object.entries(serviceAreaBySlug)) {
  routeRegistry.set(`/service-areas/${slug}`, {
    component: ServiceAreaDetailPage,
    props: { area },
    hydrate: false,
  })
}

for (const [slug, page] of Object.entries(practiceAreaBySlug)) {
  routeRegistry.set(`/practice-areas/${slug}`, {
    component: PracticeAreaPage,
    props: { page },
    hydrate: false,
  })
}

for (const [slug, page] of Object.entries(taxResourceBySlug)) {
  routeRegistry.set(`/tax-resources/${slug}`, {
    component: TaxResourceDetailPage,
    props: { page },
    hydrate: false,
  })
}

export function getAllRoutes() {
  return Array.from(routeRegistry.keys()).sort((a, b) => a.localeCompare(b))
}

export function resolveRoute(path) {
  return routeRegistry.get(path) || { component: NotFoundPage, props: {}, hydrate: false }
}

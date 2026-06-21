import { Menu, X } from 'lucide-react'
import { industrySectors, services } from '../../data/index.jsx'
import { NavDropdown } from './nav-dropdown.jsx'
import { AnnouncementStrip } from './announcement-strip.jsx'
import { CookieBanner } from './cookie-banner.jsx'

function Header({ active = 'home' }) {
  const navMenus = [
    {
      label: 'Home',
      href: '/',
      active: active === 'home',
      items: [
        { label: 'Overview', href: '/' },
        { label: 'Start Here', href: '/start' },
        { label: 'Life’s Big Moments', href: '/#life-moments' },
        { label: 'Every Step of Growth', href: '/#business-cycle' },
        { label: 'Core Services', href: '/#services' },
        { label: 'Sectors We Support', href: '/#sectors' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      label: 'About',
      href: '/about',
      active: active === 'about',
      width: 'w-72',
      items: [
        { label: 'About Fidara', href: '/about' },
        { label: 'Who We Help', href: '/who-we-help' },
        { label: 'Start Here', href: '/start' },
        { label: 'Case Studies', href: '/case-studies' },
        { label: 'Technology', href: '/technology' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Careers', href: '/careers' },
        { label: 'Partners', href: '/partners' },
      ],
    },
    {
      label: 'Services',
      href: '/services',
      active: active === 'services',
      columns: 'grid-cols-1',
      width: 'w-72',
      items: [
        { label: 'All Services', href: '/services' },
        { label: 'Tax Advice Center', href: '/tax-advice' },
        { label: 'Tax Resource Library', href: '/tax-resources' },
        { label: 'U.S. Expansion Hub', href: '/us-expansion' },
        ...services.map((service) => ({
          label: service.title,
          href: `/services/${service.slug}`,
        })),
      ],
    },
    {
      label: 'Sectors',
      href: '/sectors',
      active: active === 'sectors',
      width: 'w-72',
      items: [
        { label: 'All Sectors', href: '/sectors' },
        { label: 'Industry Pages', href: '/industries' },
        ...industrySectors.map((sector) => ({
          label: sector.title,
          href: `/sectors/${sector.slug}`,
        })),
      ],
    },
    {
      label: 'Resources',
      href: '/resources',
      active: active === 'resources',
      width: 'w-80',
      items: [
        { label: 'All Resources', href: '/resources' },
        { label: 'Tax Advice Center', href: '/tax-advice' },
        { label: 'Tools & Checklists', href: '/tools' },
        { label: 'Business Health Check', href: '/business-health-check' },
        { label: 'Tax Calendar', href: '/tax-calendar' },
        { label: 'Client Document Checklist', href: '/client-document-checklist' },
        { label: 'Newsletter', href: '/newsletter' },
        { label: 'Compliance Language', href: '/compliance-language' },
        { label: 'Clean Up Messy Books', href: '/resources/clean-up-messy-books' },
        { label: 'When You Need CFO Services', href: '/resources/when-you-need-cfo-services' },
        { label: 'Payroll Checklist', href: '/resources/payroll-checklist' },
        { label: 'Managed IT Basics', href: '/resources/managed-it-basics' },
        { label: 'Onboarding', href: '/onboarding' },
        { label: 'Pricing / Engagements', href: '/pricing' },
      ],
    },
    {
      label: 'Contact',
      href: '/contact',
      active: active === 'contact',
      width: 'w-72',
      items: [
        { label: 'Book a Consultation', href: '/contact' },
        { label: 'Referrals', href: '/referrals' },
        { label: 'Service Areas', href: '/service-areas' },
        { label: 'Pricing / Engagements', href: '/pricing' },
        { label: 'Onboarding Process', href: '/onboarding' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Use', href: '/terms' },
        { label: 'Disclaimer', href: '/disclaimer' },
      ],
    },
  ]

  return (
      <>
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-slate-900 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <div className="sticky top-0 z-50 bg-[#f7f3eb]/95 shadow-sm backdrop-blur">
        <AnnouncementStrip />
        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-2 md:px-8 md:py-3">
          <a href="/" className="block" aria-label="Fidara Financial Services home">
            <img
                src="/images/logo.png"
                alt="Fidara Financial Services"
                className="h-20 w-auto mix-blend-multiply sm:h-24 md:h-36"
            />
          </a>

          <nav className="hidden items-center gap-8 text-sm text-slate-900 md:flex" aria-label="Primary navigation">
            {navMenus.map((menu) => (
                <NavDropdown
                    key={menu.label}
                    label={menu.label}
                    href={menu.href}
                    active={menu.active}
                    items={menu.items}
                    columns={menu.columns}
                    width={menu.width}
                />
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
                href="/login"
                className="rounded-md border border-slate-900 px-6 py-3 text-sm text-slate-900 transition hover:bg-slate-900 hover:text-white focus-visible:bg-slate-900 focus-visible:text-white active:bg-slate-900 active:text-white"
            >
              Client Login
            </a>
            <a
                href="/contact"
                className="rounded-md border border-emerald-600 px-7 py-3 text-sm text-slate-900 transition hover:bg-emerald-700 hover:text-white"
            >
              Book a Consultation
            </a>
          </div>

          <details className="relative md:hidden">
            <summary className="inline-flex list-none rounded-md border border-stone-300 bg-white/60 p-3 text-slate-900 shadow-sm marker:content-none">
              <Menu className="details-open:hidden h-5 w-5" />
              <X className="hidden h-5 w-5 details-open:block" />
            </summary>
              <div className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100vh-8rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-stone-200 bg-[#f7f3eb]/98 p-4 shadow-2xl backdrop-blur">
                <nav className="grid gap-5" aria-label="Mobile navigation">
                  {navMenus.map((menu) => (
                      <div key={menu.label} className="border-b border-stone-200 pb-4 last:border-b-0 last:pb-0">
                        <a
                            href={menu.href}
                            className="font-serif text-2xl text-slate-900"
                        >
                          {menu.label}
                        </a>

                        <div className="mt-3 grid gap-2">
                          {menu.items.map((item) => (
                              <a
                                  key={`${menu.label}-${item.label}`}
                                  href={item.href}
                                  className="rounded-md px-2 py-1.5 text-sm leading-5 text-slate-700 transition hover:bg-white/70 hover:text-emerald-800"
                              >
                                {item.label}
                              </a>
                          ))}
                        </div>
                      </div>
                  ))}

                  <a
                      href="/login"
                      className="rounded-md border border-slate-900 px-7 py-3 text-center text-sm font-medium text-slate-900 transition hover:bg-slate-900 hover:text-white focus-visible:bg-slate-900 focus-visible:text-white active:bg-slate-900 active:text-white"
                  >
                    Client Login
                  </a>

                  <a
                      href="/contact"
                      className="rounded-md bg-emerald-600 px-7 py-3 text-center text-sm font-medium text-white transition hover:bg-emerald-700"
                  >
                    Book a Consultation
                  </a>
                </nav>
              </div>
          </details>
        </header>
        </div>
        <CookieBanner />
      </>
  )
}

export { Header }

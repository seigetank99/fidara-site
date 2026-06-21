import { Mail } from 'lucide-react'
import { mailto } from '../../data/index.jsx'

function Footer() {
  const footerGroups = [
    {
      title: 'Services',
      links: [
        ['All Services', '/services'],
        ['Practice Areas', '/practice-areas'],
        ['Bookkeeping', '/services/bookkeeping'],
        ['Tax', '/services/tax'],
        ['CFO Services', '/services/cfo-services'],
        ['Managed IT Services', '/services/managed-it-services'],
        ['U.S. Expansion', '/us-expansion'],
      ],
    },
    {
      title: 'Sectors',
      links: [
        ['All Sectors', '/sectors'],
        ['Industry Pages', '/industries'],
        ['Restaurants', '/industries/restaurants'],
        ['Dental Practices', '/industries/dental-practices'],
        ['Construction', '/industries/construction'],
        ['E-Commerce', '/industries/ecommerce'],
      ],
    },
    {
      title: 'Resources',
      links: [
        ['Resources', '/resources'],
        ['Tax Advice Center', '/tax-advice'],
        ['Tools', '/tools'],
        ['Business Health Check', '/business-health-check'],
        ['Tax Calendar', '/tax-calendar'],
        ['Onboarding', '/onboarding'],
        ['Client Document Checklist', '/client-document-checklist'],
        ['Pricing', '/pricing'],
        ['Newsletter', '/newsletter'],
        ['FAQ', '/faq'],
      ],
    },
    {
      title: 'Company',
      links: [
        ['About', '/about'],
        ['Who We Help', '/who-we-help'],
        ['Case Studies', '/case-studies'],
        ['Technology', '/technology'],
        ['Client Login', '/login'],
        ['Careers', '/careers'],
      ],
    },
    {
      title: 'Legal',
      links: [
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
        ['Disclaimer', '/disclaimer'],
        ['Contact', '/contact'],
        ['Referrals', '/referrals'],
        ['Service Areas', '/service-areas'],
      ],
    },
  ]

  return (
      <footer className="border-t border-stone-200 px-8 py-10">
        <div className="mx-auto grid max-w-7xl gap-10">
          <div className="grid gap-8 md:grid-cols-[260px_1fr]">
            <div>
              <img
                  src="/images/logo.png"
                  alt="Fidara Financial Services"
                  className="h-28 w-auto mix-blend-multiply"
              />

              <p className="mt-4 text-sm leading-6 text-slate-700">
                Modern accounting, advisory, tax, payroll, and technology
                support for growing businesses and the people behind them.
              </p>

              <div className="mt-5 flex gap-4 text-slate-500">
                <a
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md transition hover:bg-white/70 hover:text-emerald-700"
                    href={mailto()}
                    aria-label="Email Fidara"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              {footerGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                      {group.title}
                    </h3>

                    <div className="mt-4 grid gap-2">
                      {group.links.map(([label, href]) => (
                          <a
                              key={`${group.title}-${label}`}
                              href={href}
                              className="text-sm leading-6 text-slate-600 transition hover:text-emerald-800"
                          >
                            {label}
                          </a>
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 text-xs leading-6 text-slate-500">
            <p>© 2024 Fidara Financial Services, LLC. All rights reserved.</p>
            <p className="mt-2">
              Website content is for general informational purposes only and is not tax,
              legal, investment, cybersecurity, or financial advice. No professional
              relationship is formed until an engagement is accepted in writing.
            </p>
          </div>
        </div>
      </footer>
  )
}

export { Footer }

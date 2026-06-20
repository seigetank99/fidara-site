import { expect, test } from '@playwright/test'

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - doc.clientWidth
  })

  expect(overflow).toBeLessThanOrEqual(1)
}

async function acceptCookiesIfPresent(page) {
  const accept = page.getByRole('button', { name: 'Accept' })
  if (await accept.isVisible().catch(() => false)) {
    await accept.click()
  }
}

test.describe('site smoke checks', () => {
  test('home page renders key content without horizontal overflow', async ({ page, isMobile }) => {
    await page.goto('/')
    await acceptCookiesIfPresent(page)

    await expect(page.getByRole('heading', { name: /Financial clarity\. Operational calm\./i })).toBeVisible()
    if (!isMobile) {
      await expect(page.getByRole('link', { name: 'Client Login' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Book a Consultation' }).first()).toBeVisible()
    }
    await expectNoHorizontalOverflow(page)
  })

  test('top navigation remains sticky while scrolling', async ({ page, isMobile }) => {
    await page.goto('/')
    await acceptCookiesIfPresent(page)
    await page.evaluate(() => window.scrollTo(0, 1200))

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const box = await header.boundingBox()
    expect(box?.y ?? 999).toBeLessThanOrEqual(isMobile ? 90 : 50)

    if (!isMobile) {
      await expect(page.getByRole('link', { name: 'Client Login' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Book a Consultation' }).first()).toBeVisible()
    }
  })

  test('mobile menu exposes client login and consultation actions', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile navigation check only runs on mobile project')

    await page.goto('/')
    await acceptCookiesIfPresent(page)
    await page.locator('details summary').click({ force: true })

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(mobileNav.getByRole('link', { name: 'Client Login' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Book a Consultation' }).last()).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('contact page includes phone field and no horizontal overflow', async ({ page }) => {
    await page.goto('/contact')

    await expect(page.getByRole('heading', { name: /Start with a conversation/i })).toBeVisible()
    await expect(page.getByLabel('Phone')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('thank-you page is concise and does not mention auto reply', async ({ page }) => {
    await page.goto('/thank-you')

    await expect(page.getByRole('heading', { name: /Thank you\. We value the opportunity/i })).toBeVisible()
    await expect(page.getByText(/automatic confirmation email/i)).toHaveCount(0)
    await expect(page.getByText(/Please check your inbox/i)).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })
})

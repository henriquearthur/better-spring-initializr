import { expect, test } from '@playwright/test'

test.describe('Curated preset hero strip', () => {
  test('shows hero strip as the single curated preset layout', async ({ page }) => {
    await page.goto('/')

    const surface = page.getByTestId('preset-surface-hero-strip')
    await expect(surface).toBeVisible({ timeout: 20_000 })
    await expect(surface).toContainText('No preset selected')
    await expect(page.getByRole('button', { name: 'Apply preset' })).toHaveCount(0)
  })

  test('clicking a preset applies dependencies automatically', async ({ page }) => {
    await page.goto('/')

    const dependencyBrowserToggle = page.getByRole('button', {
      name: /Dependency Browser/i,
    })
    await expect(dependencyBrowserToggle).toContainText('0 selected', { timeout: 20_000 })

    await page.getByRole('button', { name: /Reactive Microservice/i }).click()

    await expect(dependencyBrowserToggle).not.toContainText('0 selected')
  })
})

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

  test('clicking the selected preset again de-selects it and removes dependencies it applied', async ({ page }) => {
    await page.goto('/')

    const reactivePresetCard = page.getByRole('button', {
      name: /Reactive Microservice/i,
    })
    const dependencyBrowserToggle = page.getByRole('button', {
      name: /Dependency Browser/i,
    })
    await expect(reactivePresetCard).toBeVisible({ timeout: 20_000 })
    await expect(dependencyBrowserToggle).toContainText('0 selected')

    await reactivePresetCard.click()
    await expect(page.getByTestId('preset-surface-hero-strip')).not.toContainText('No preset selected')
    await expect(dependencyBrowserToggle).not.toContainText('0 selected')

    await reactivePresetCard.click()
    await expect(page.getByTestId('preset-surface-hero-strip')).toContainText('No preset selected')
    await expect(dependencyBrowserToggle).toContainText('0 selected')
  })
})

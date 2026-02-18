import { expect, test } from '@playwright/test'

test.describe('Smoke: generate + preview + download', () => {
  test('generates preview, opens file, and downloads project zip', async ({ page }) => {
    await page.goto('/')

    const fileRows = page.locator('button.preview-tree-row[aria-label^="Open "]')
    await expect(fileRows.first()).toBeVisible({ timeout: 30_000 })

    await fileRows.first().click()
    await expect(page.getByTestId('preview-code-pane')).toBeVisible({ timeout: 20_000 })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Download ZIP/i }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/\.zip$/i)
  })
})

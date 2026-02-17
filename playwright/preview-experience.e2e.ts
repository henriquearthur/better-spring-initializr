import { expect, test } from '@playwright/test'

test.describe('Workspace Preview Experience', () => {
  test('switching build tool to gradle updates preview without unavailable error', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Build Settings/i }).click()
    await page.locator('label:has-text("Gradle") input[type="radio"]').first().check()

    await expect(
      page.locator(
        'button.preview-tree-row[aria-label="Open gradle/wrapper/gradle-wrapper.properties"]',
      ),
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      page.getByText(
        'Spring Initializr preview is temporarily unavailable. Please try again in a moment.',
      ),
    ).toHaveCount(0)
  })

  test('opens nested files rapidly without blocking the code pane', async ({ page }) => {
    await page.goto('/')

    const fileRows = page.locator('button.preview-tree-row[aria-label^="Open "]')
    await expect(fileRows.first()).toBeVisible({ timeout: 20_000 })

    const clickCount = Math.min(await fileRows.count(), 10)

    for (let index = 0; index < clickCount; index += 1) {
      await fileRows.nth(index).click()
    }

    await expect(page.getByTestId('preview-code-pane')).toBeVisible()
    await expect(page.getByTestId('preview-highlighting-pill')).toHaveCount(0)
  })

  test('hovering tree rows keeps explorer stable for 3 seconds', async ({ page }) => {
    await page.goto('/')

    const fileRows = page.locator('button.preview-tree-row[aria-label^="Open "]')
    await expect(fileRows.first()).toBeVisible({ timeout: 20_000 })

    const start = Date.now()
    const rowCount = Math.min(await fileRows.count(), 8)

    while (Date.now() - start < 3_000) {
      for (let index = 0; index < rowCount; index += 1) {
        await fileRows.nth(index).hover()
      }
    }

    await expect(fileRows.first()).toBeVisible()
  })

  test('uses pointer cursor on tree rows and text cursor in code pane', async ({ page }) => {
    await page.goto('/')

    const row = page.locator('button.preview-tree-row[aria-label^="Open "]').first()
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.click()
    await expect(page.getByTestId('preview-code-pane')).toBeVisible({ timeout: 20_000 })

    const treeCursor = await row.evaluate((element) => window.getComputedStyle(element).cursor)
    const codeCursor = await page
      .getByTestId('preview-code-pane')
      .evaluate((element) => window.getComputedStyle(element).cursor)

    expect(treeCursor).toBe('pointer')
    expect(codeCursor).toBe('text')
  })

  test('explorer panel keeps readable internal padding without horizontal overflow', async ({ page }) => {
    await page.goto('/')

    const treeViewport = page.locator('.preview-tree-scroll').first()
    await expect(treeViewport).toBeVisible({ timeout: 20_000 })

    const { clientWidth, paddingLeft, paddingRight, scrollWidth } = await treeViewport.evaluate((element) => {
      const styles = window.getComputedStyle(element)
      return {
        clientWidth: element.clientWidth,
        paddingLeft: Number.parseFloat(styles.paddingLeft),
        paddingRight: Number.parseFloat(styles.paddingRight),
        scrollWidth: element.scrollWidth,
      }
    })

    expect(paddingLeft).toBeGreaterThanOrEqual(8)
    expect(paddingRight).toBeGreaterThanOrEqual(8)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })

  test('tree scroll can reach the true bottom of long lists', async ({ page }) => {
    await page.goto('/')

    const treeViewport = page.locator('.preview-tree-scroll').first()
    await expect(treeViewport).toBeVisible({ timeout: 20_000 })

    const canReachBottom = await treeViewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      const remaining = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop)
      return remaining <= 1
    })

    expect(canReachBottom).toBe(true)
    await expect(page.locator('button.preview-tree-row[aria-label="Open pom.xml"]')).toBeVisible()
  })

  test('tree viewport fills the explorer body after preview loading finishes', async ({ page }) => {
    await page.goto('/')

    const treeViewport = page.locator('.preview-tree-scroll').first()
    await expect(treeViewport).toBeVisible({ timeout: 20_000 })

    const { treeHeight, containerHeight } = await treeViewport.evaluate((element) => ({
      treeHeight: element.clientHeight,
      containerHeight: element.parentElement?.clientHeight ?? 0,
    }))

    expect(Math.abs(containerHeight - treeHeight)).toBeLessThanOrEqual(2)
  })
})

import { test, expect } from '@playwright/test'

test('app laadt zonder console errors', async ({ page }) => {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await page.goto('/')
  await expect(page.locator('#root')).not.toBeEmpty()
  expect(errors).toEqual([])
})

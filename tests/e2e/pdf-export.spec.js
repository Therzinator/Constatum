import { test, expect } from '@playwright/test'

const FAKE_MELDING = {
  id: 'DL-TEST-PDF',
  timestamp_local: '2026-06-01T10:00:00.000Z',
  timestamp_utc: '2026-06-01T10:00:00.000Z',
  date: '01-06-2026',
  time: '12:00',
  timezone: 'Europe/Amsterdam',
  type: 'spuitactiviteit',
  types: ['spuitactiviteit'],
  description: 'Testmelding voor PDF-export',
  gps: { lat: 52.1, lng: 5.1, accuracy: null, status: 'test' },
  hash: 'abc123testhash',
  rfc3161: null,
  weather: { status: 'niet beschikbaar' },
  bestanden: [],
  warnings: [],
  sync_status: 'lokaal'
}

test('PDF-dossier opent een nieuw venster met dossierinhoud', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate((melding) => {
    localStorage.setItem('spuitlog_meldingen', JSON.stringify([melding]))
  }, FAKE_MELDING)
  await page.reload()

  await page.getByRole('button', { name: /Export/ }).click()

  const [pdfPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('button', { name: /Open PDF-dossier/ }).click()
  ])
  await pdfPage.waitForLoadState()

  await expect(pdfPage.getByText('Juridisch dossier')).toBeVisible()
  await expect(pdfPage.getByText('Testmelding voor PDF-export')).toBeVisible()
})

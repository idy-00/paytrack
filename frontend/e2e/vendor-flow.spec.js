import { test, expect } from '@playwright/test'

test.describe('Vendor Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as vendor
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('fatou@phoneshop-dakar.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('dashboard shows KPIs', async ({ page }) => {
    await expect(page.getByText(/déjà encaissé/i)).toBeVisible()
    await expect(page.getByText(/ventes actives/i)).toBeVisible()
    await expect(page.getByText(/en retard/i)).toBeVisible()
    await expect(page.getByText(/soldées/i)).toBeVisible()
  })

  test('can navigate to sales page', async ({ page }) => {
    await page.getByRole('link', { name: /ventes/i }).first().click()
    await expect(page).toHaveURL('/ventes')
    await expect(page.getByRole('heading', { name: /ventes/i })).toBeVisible()
  })

  test('can navigate to clients page', async ({ page }) => {
    await page.getByRole('link', { name: /clients/i }).click()
    await expect(page).toHaveURL('/clients')
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
  })

  test('can navigate to payments page', async ({ page }) => {
    await page.getByRole('link', { name: /paiements/i }).click()
    await expect(page).toHaveURL('/paiements')
    await expect(page.getByRole('heading', { name: /paiements/i })).toBeVisible()
  })

  test('can open new sale form', async ({ page }) => {
    await page.getByRole('link', { name: /nouvelle vente/i }).click()
    await expect(page).toHaveURL('/ventes/nouvelle')
    await expect(page.getByText(/nouvelle vente/i)).toBeVisible()
  })

  test('export CSV button is visible on sales page', async ({ page }) => {
    await page.goto('/ventes')
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible()
  })

  test('export CSV button is visible on payments page', async ({ page }) => {
    await page.goto('/paiements')
    await expect(page.getByRole('button', { name: /exporter csv/i })).toBeVisible()
  })
})

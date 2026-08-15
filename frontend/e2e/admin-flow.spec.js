import { test, expect } from '@playwright/test'

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('moussa@phoneshop-dakar.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('admin section is visible in navigation', async ({ page }) => {
    await expect(page.getByText(/administration/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /boutiques/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /utilisateurs/i })).toBeVisible()
  })

  test('can navigate to shops page', async ({ page }) => {
    await page.getByRole('link', { name: /boutiques/i }).click()
    await expect(page).toHaveURL('/boutiques')
    await expect(page.getByRole('heading', { name: /boutiques/i })).toBeVisible()
  })

  test('can navigate to users page', async ({ page }) => {
    await page.getByRole('link', { name: /utilisateurs/i }).click()
    await expect(page).toHaveURL('/utilisateurs')
    await expect(page.getByRole('heading', { name: /utilisateurs/i })).toBeVisible()
  })

  test('can open create shop modal', async ({ page }) => {
    await page.goto('/boutiques')
    await page.getByRole('button', { name: /nouvelle boutique/i }).click()
    await expect(page.getByText(/nom \*/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /créer/i })).toBeVisible()
  })

  test('can open create user modal', async ({ page }) => {
    await page.goto('/utilisateurs')
    await page.getByRole('button', { name: /nouvel utilisateur/i }).click()
    await expect(page.getByText(/nom complet/i)).toBeVisible()
    await expect(page.getByText(/rôle/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /créer/i })).toBeVisible()
  })
})

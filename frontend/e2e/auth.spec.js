import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page displays correctly', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /bon retour/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()

    // Social login buttons
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /apple/i })).toBeVisible()
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('moussa@phoneshop-dakar.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText(/bonjour moussa/i)).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('invalid@test.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible({ timeout: 5000 })
  })

  test('logout returns to login page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('moussa@phoneshop-dakar.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /déconnexion/i }).click()
    await expect(page).toHaveURL('/login')
  })
})

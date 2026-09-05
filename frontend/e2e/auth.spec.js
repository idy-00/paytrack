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

  test('forgot password submits the OTP reset sequence', async ({ page }) => {
    const requests = []
    await page.route('**/api/otp/send', async route => {
      requests.push(await route.request().postDataJSON())
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ expires_in: 600 }) })
    })
    await page.route('**/api/otp/verify', async route => {
      requests.push(await route.request().postDataJSON())
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ reset_token: 'test-reset-token' }) })
    })
    await page.route('**/api/otp/reset-password', async route => {
      requests.push(await route.request().postDataJSON())
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ message: 'Mot de passe mis à jour.' }) })
    })

    await page.goto('/login')
    await page.getByRole('button', { name: /mot de passe oublié/i }).click()
    await page.getByLabel(/email/i).fill('client@paytrack.test')
    await page.getByRole('button', { name: /envoyer le code/i }).click()
    await page.getByLabel(/code de vérification/i).fill('123456')
    await page.getByRole('button', { name: /vérifier le code/i }).click()
    await page.getByLabel(/^nouveau mot de passe/i).fill('nouveaumotdepasse')
    await page.getByLabel(/confirmer le mot de passe/i).fill('nouveaumotdepasse')
    await page.getByRole('button', { name: /enregistrer le mot de passe/i }).click()

    await expect(page.getByRole('heading', { name: /mot de passe mis à jour/i })).toBeVisible()
    expect(requests).toEqual([
      { email: 'client@paytrack.test', type: 'password_reset' },
      { email: 'client@paytrack.test', code: '123456', type: 'password_reset' },
      { reset_token: 'test-reset-token', password: 'nouveaumotdepasse', password_confirmation: 'nouveaumotdepasse' },
    ])
  })

  test('login with an enterprise admin redirects to administration', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('moussa@phoneshop-dakar.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible()
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
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /déconnexion/i }).click()
    await expect(page).toHaveURL('/login')
  })
})

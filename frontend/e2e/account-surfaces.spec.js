import { test, expect } from '@playwright/test'

test('vendor can access notifications, profile and subscription in read-only mode', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('fatou@phoneshop-dakar.com')
  await page.getByLabel(/mot de passe/i).fill('demo1234')
  await page.getByRole('button', { name: /se connecter/i }).click()
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

  await page.goto('/notifications')
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()

  await page.goto('/profil')
  await expect(page.getByRole('heading', { name: 'Mon profil' })).toBeVisible()
  await expect(page.getByLabel(/nom complet/i)).toBeVisible()
  await expect(page.getByLabel(/^e-mail$/i)).toBeDisabled()
  await expect(page.getByLabel(/téléphone/i)).toBeVisible()

  await page.goto('/abonnement')
  await expect(page.getByRole('heading', { name: 'Abonnement' })).toBeVisible()
})

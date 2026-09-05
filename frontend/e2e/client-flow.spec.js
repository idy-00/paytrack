import { test, expect } from '@playwright/test'

test.describe('Client Flow', () => {
  test('client can review a dossier and start a fee-free payment', async ({ page }) => {
    const paymentRequests = []

    await page.route('**/api/sales/*/mobile-payment', async route => {
      paymentRequests.push(await route.request().postDataJSON())
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ checkout_url: 'http://localhost:5173/mock-dexpay-checkout' }),
      })
    })

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('aminata@gmail.com')
    await page.getByLabel(/mot de passe/i).fill('demo1234')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL('/client/dashboard', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /bonjour, aminata/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /mes dossiers/i })).toBeVisible()

    await page.getByRole('link', { name: /mes paiements/i }).click()
    await expect(page).toHaveURL('/client/paiements')
    await expect(page.getByRole('heading', { name: /mes paiements/i })).toBeVisible()

    await page.getByRole('link', { name: /mon dossier/i }).click()
    await expect(page).toHaveURL('/client/dashboard')
    await page.locator('a[href^="/client/vente/"]').first().click()
    await expect(page.getByRole('heading', { name: /payer mon échéance/i })).toBeVisible()
    await expect(page.getByText(/aucun frais ne vous est ajouté/i)).toBeVisible()

    await page.getByLabel(/montant à payer/i).fill('10000')
    await page.getByLabel(/numéro mobile money/i).fill('771234567')
    await page.getByRole('button', { name: /payer 10/i }).click()
    await expect(page).toHaveURL('/mock-dexpay-checkout')
    expect(paymentRequests).toEqual([{ gateway: 'dexpay', amount: 10000, phone: '771234567' }])
  })
})

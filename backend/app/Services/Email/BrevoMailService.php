<?php

namespace App\Services\Email;

use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * Brevo (ex-Sendinblue) transactional email service.
 *
 * Utilise l'API Brevo v3 directement (plus fiable que SMTP pour
 * les emails transactionnels à fort volume).
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 *
 * Required .env:
 *   BREVO_API_KEY=xkeysib-...     # Brevo → Account → SMTP & API → API Keys
 *   MAIL_FROM_ADDRESS=paytrack@yourdomain.com
 *   MAIL_FROM_NAME=PayTrack
 *
 * Alternative SMTP (.env) :
 *   MAIL_MAILER=smtp
 *   MAIL_HOST=smtp-relay.brevo.com
 *   MAIL_PORT=587
 *   MAIL_USERNAME=<votre_email_brevo>
 *   MAIL_PASSWORD=<master_password_brevo>
 *   MAIL_ENCRYPTION=tls
 */
class BrevoMailService
{
    private string $apiKey;
    private string $fromEmail;
    private string $fromName;
    private const BASE_URL = 'https://api.brevo.com/v3';

    public function __construct()
    {
        $this->apiKey    = config('services.brevo.api_key', '');
        $this->fromEmail = config('mail.from.address', 'paytrack@yourdomain.com');
        $this->fromName  = config('mail.from.name', 'PayTrack');
    }

    /**
     * Send receipt email after a payment.
     */
    public function sendReceipt(Sale $sale, Payment $payment): bool
    {
        if (! $sale->client->email) {
            return false;
        }

        if (empty($this->apiKey)) {
            // Fallback: utiliser le mailer Laravel standard (SMTP Brevo)
            return $this->sendViaLaravelMailer($sale, $payment);
        }

        try {
            $amountFormatted   = number_format($payment->amount, 0, '.', ' ') . ' FCFA';
            $remainingFormatted = number_format($sale->remaining_amount, 0, '.', ' ') . ' FCFA';
            $progressPct = $sale->total_amount > 0
                ? round(($sale->paid_amount / $sale->total_amount) * 100)
                : 0;

            $response = Http::withHeaders([
                'api-key'      => $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(15)
            ->post(self::BASE_URL . '/smtp/email', [
                'sender'  => ['name' => $this->fromName, 'email' => $this->fromEmail],
                'to'      => [['email' => $sale->client->email, 'name' => $sale->client->full_name]],
                'subject' => "✅ Reçu de paiement — {$payment->receipt_number}",
                'htmlContent' => $this->buildReceiptHtml(
                    $sale, $payment, $amountFormatted, $remainingFormatted, $progressPct
                ),
                'tags'    => ['receipt', 'payment'],
            ]);

            if ($response->failed()) {
                Log::error('brevo.receipt.failed', [
                    'sale'    => $sale->reference,
                    'status'  => $response->status(),
                    'error'   => $response->json('message'),
                ]);
                return false;
            }

            Log::info('brevo.receipt.sent', [
                'sale'    => $sale->reference,
                'receipt' => $payment->receipt_number,
                'to'      => $sale->client->email,
            ]);
            return true;

        } catch (\Throwable $e) {
            Log::error('brevo.receipt.exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send weekly summary to admin.
     */
    public function sendWeeklySummary(string $toEmail, array $stats): bool
    {
        if (empty($this->apiKey)) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
            ])
            ->timeout(10)
            ->post(self::BASE_URL . '/smtp/email', [
                'sender'      => ['name' => $this->fromName, 'email' => $this->fromEmail],
                'to'          => [['email' => $toEmail]],
                'subject'     => "📊 Résumé semaine PayTrack — {$stats['tenant_name']}",
                'htmlContent' => $this->buildWeeklySummaryHtml($stats),
                'tags'        => ['weekly-summary'],
            ]);

            return $response->successful();

        } catch (\Throwable $e) {
            Log::error('brevo.weekly_summary.exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    private function sendViaLaravelMailer(Sale $sale, Payment $payment): bool
    {
        try {
            \Illuminate\Support\Facades\Mail::to($sale->client->email)
                ->queue(new \App\Mail\PaymentReceiptMail($sale, $payment));
            return true;
        } catch (\Throwable $e) {
            Log::error('brevo.laravel_mailer.exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    private function buildReceiptHtml(Sale $sale, Payment $payment, string $amount, string $remaining, int $pct): string
    {
        $shopName = $sale->shop?->name ?? 'PayTrack';
        $qrUrl    = config('app.frontend_url', config('app.url')) . "/qr/{$sale->qr_uuid}";

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#F8FAFC; margin:0; padding:0; }
  .wrap { max-width:520px; margin:24px auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #E2E8F0; }
  .hdr  { background:#1E3A5F; padding:24px 28px; }
  .hdr h1 { color:white; margin:0; font-size:18px; font-weight:700; }
  .hdr p  { color:rgba(255,255,255,0.6); margin:4px 0 0; font-size:13px; }
  .body { padding:28px; }
  .amount { font-size:32px; font-weight:800; color:#16A34A; font-variant-numeric:tabular-nums; }
  .row { display:flex; justify-content:space-between; padding:10px 0; font-size:13px; border-bottom:1px solid #F1F5F9; }
  .row:last-child { border:none; }
  .label { color:#64748B; }
  .val   { font-weight:600; color:#0F172A; }
  .progress-track { height:8px; background:#E2E8F0; border-radius:99px; margin:12px 0 4px; overflow:hidden; }
  .progress-fill  { height:8px; background:#1E3A5F; border-radius:99px; }
  .btn { display:inline-block; background:#1E3A5F; color:white; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px; margin-top:16px; }
  .footer { background:#F8FAFC; padding:16px 28px; text-align:center; font-size:11px; color:#94A3B8; }
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>PayTrack</h1>
    <p>Reçu de paiement</p>
  </div>
  <div class="body">
    <p style="color:#64748B;font-size:13px;margin:0 0 4px">Bonjour,</p>
    <p style="font-size:15px;font-weight:600;color:#0F172A;margin:0 0 20px">{$sale->client->full_name}</p>
    <div class="amount">{$amount}</div>
    <p style="color:#94A3B8;font-size:12px;margin:4px 0 20px">Reçu confirmé · {$payment->receipt_number}</p>
    <div class="row"><span class="label">Article</span><span class="val">{$sale->article_name}</span></div>
    <div class="row"><span class="label">Référence</span><span class="val" style="font-family:monospace">{$sale->reference}</span></div>
    <div class="row"><span class="label">Total dossier</span><span class="val">{$this->fmt($sale->total_amount)} FCFA</span></div>
    <div class="row"><span class="label">Déjà payé</span><span class="val" style="color:#16A34A">{$this->fmt($sale->paid_amount)} FCFA</span></div>
    <div class="row"><span class="label">Reste à payer</span><span class="val" style="color:#1E3A5F">{$remaining}</span></div>
    <div class="progress-track"><div class="progress-fill" style="width:{$pct}%"></div></div>
    <p style="font-size:12px;color:#94A3B8;text-align:right">{$pct}% réglé</p>
    <a href="{$qrUrl}" class="btn">Voir mon dossier en ligne</a>
  </div>
  <div class="footer">{$shopName} · Généré automatiquement par PayTrack</div>
</div>
</body></html>
HTML;
    }

    private function buildWeeklySummaryHtml(array $stats): string
    {
        return <<<HTML
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;background:#F8FAFC;}</style></head>
<body><div style="max-width:500px;margin:24px auto;background:white;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
<div style="background:#1E3A5F;padding:20px 24px;"><h2 style="color:white;margin:0;font-size:16px;">Résumé semaine — {$stats['tenant_name']}</h2></div>
<div style="padding:24px;">
<p style="font-size:13px;color:#64748B;">Voici le résumé de votre activité cette semaine.</p>
<div style="display:flex;gap:12px;margin:16px 0;">
  <div style="flex:1;background:#F8FAFC;border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#16A34A;">{$this->fmt($stats['collected'])} FCFA</div>
    <div style="font-size:11px;color:#94A3B8;">Encaissé cette semaine</div>
  </div>
  <div style="flex:1;background:#FFF7ED;border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:22px;font-weight:800;color:#D97706;">{$stats['overdue_count']}</div>
    <div style="font-size:11px;color:#94A3B8;">Dossiers en retard</div>
  </div>
</div>
</div></div></body></html>
HTML;
    }

    private function fmt(int $amount): string
    {
        return number_format($amount, 0, '.', ' ');
    }
}

<?php

namespace App\Services\Email;

use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email service using Laravel's built-in mailer.
 * Driver configured by .env: MAIL_MAILER=mailgun|sendgrid|smtp|log
 *
 * Required .env (Mailgun):
 *   MAIL_MAILER=mailgun
 *   MAILGUN_DOMAIN=mg.yourdomain.com
 *   MAILGUN_SECRET=key-xxxxxxxx
 *   MAILGUN_ENDPOINT=api.eu.mailgun.net   # for EU region
 *   MAIL_FROM_ADDRESS=paytrack@yourdomain.com
 *   MAIL_FROM_NAME=PayTrack
 *
 * Required .env (SendGrid):
 *   MAIL_MAILER=smtp
 *   MAIL_HOST=smtp.sendgrid.net
 *   MAIL_PORT=587
 *   MAIL_USERNAME=apikey
 *   MAIL_PASSWORD=your_sendgrid_api_key
 *   MAIL_ENCRYPTION=tls
 *   MAIL_FROM_ADDRESS=paytrack@yourdomain.com
 */
class MailService
{
    /**
     * Send a receipt email with optional PDF attachment.
     */
    public function sendReceipt(Sale $sale, Payment $payment): bool
    {
        if (! $sale->client->email) {
            return false;
        }

        try {
            Mail::to($sale->client->email)
                ->queue(new \App\Mail\PaymentReceiptMail($sale, $payment));

            return true;
        } catch (\Throwable $e) {
            Log::error('mail.receipt.failed', [
                'sale'    => $sale->reference,
                'payment' => $payment->receipt_number,
                'error'   => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send a weekly summary to the vendor/admin.
     */
    public function sendWeeklySummary(string $toEmail, array $stats): bool
    {
        try {
            Mail::to($toEmail)->queue(new \App\Mail\WeeklySummaryMail($stats));
            return true;
        } catch (\Throwable $e) {
            Log::error('mail.weekly_summary.failed', ['email' => $toEmail, 'error' => $e->getMessage()]);
            return false;
        }
    }
}

<?php

namespace App\Notifications;

use App\Models\Payment;
use App\Models\Sale;
use App\Services\Notification\TwilioSmsService;
use App\Services\Notification\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Notification sent to the client after a payment is recorded.
 * Channels: mail + SMS (or WhatsApp, depending on tenant config).
 */
class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Sale    $sale,
        public Payment $payment,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if ($notifiable->email) {
            $channels[] = 'mail';
        }
        if ($notifiable->phone) {
            $channels[] = 'sms';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("✅ Paiement reçu — {$this->payment->receipt_number}")
            ->greeting("Bonjour {$notifiable->full_name},")
            ->line("Votre paiement de **{$this->formattedAmount($this->payment->amount)}** a bien été enregistré.")
            ->line("Référence dossier : {$this->sale->reference}")
            ->line("Reçu n° : {$this->payment->receipt_number}")
            ->line("Reste à payer : {$this->formattedAmount($this->sale->remaining_amount)}")
            ->action('Voir mon dossier', url("/qr/{$this->sale->qr_uuid}"))
            ->salutation("Merci pour votre confiance.");
    }

    public function toSms(object $notifiable): void
    {
        $vars = [
            'client_name' => $notifiable->full_name,
            'amount'      => number_format($this->payment->amount, 0, '.', ' '),
            'article'     => $this->sale->article_name,
            'receipt'     => $this->payment->receipt_number,
            'remaining'   => number_format($this->sale->remaining_amount, 0, '.', ' '),
            'shop_name'   => $this->sale->shop?->name ?? 'PayTrack',
        ];

        // Try WhatsApp first, fall back to SMS
        $whatsapp = app(WhatsAppService::class);
        $result   = $whatsapp->send($notifiable->phone, 'payment_received', $vars);

        if (! $result->success) {
            $sms = app(TwilioSmsService::class);
            $sms->send($notifiable->phone, 'payment_received', $vars);
        }
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'payment_received',
            'sale_id'    => $this->sale->id,
            'payment_id' => $this->payment->id,
            'amount'     => $this->payment->amount,
            'receipt'    => $this->payment->receipt_number,
        ];
    }

    private function formattedAmount(int $amount): string
    {
        return number_format($amount, 0, '.', ' ') . ' FCFA';
    }
}

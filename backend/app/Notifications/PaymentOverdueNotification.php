<?php

namespace App\Notifications;

use App\Models\Sale;
use App\Models\SaleSchedule;
use App\Services\Notification\TwilioSmsService;
use App\Services\Notification\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent when a scheduled installment is overdue.
 */
class PaymentOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Sale         $sale,
        public SaleSchedule $schedule,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($notifiable->email) $channels[] = 'mail';
        if ($notifiable->phone) $channels[] = 'sms';
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⚠️ Retard de paiement — {$this->sale->reference}")
            ->greeting("Bonjour {$notifiable->full_name},")
            ->line("Votre tranche n°{$this->schedule->installment_number} de **" . number_format($this->schedule->amount, 0, '.', ' ') . " FCFA** pour *{$this->sale->article_name}* était attendue le **" . $this->schedule->due_date->format('d/m/Y') . "**.")
            ->line("Elle n'a pas encore été reçue. Merci de régulariser rapidement.")
            ->action('Voir mon dossier', url("/qr/{$this->sale->qr_uuid}"))
            ->salutation("Cordialement.");
    }

    public function toSms(object $notifiable): void
    {
        $vars = [
            'client_name'     => $notifiable->full_name,
            'amount'          => number_format($this->schedule->amount, 0, '.', ' '),
            'article'         => $this->sale->article_name,
            'due_date'        => $this->schedule->due_date->format('d/m/Y'),
            'installment_num' => $this->schedule->installment_number,
            'shop_name'       => $this->sale->shop?->name ?? 'PayTrack',
        ];

        $whatsapp = app(WhatsAppService::class);
        $result   = $whatsapp->send($notifiable->phone, 'payment_overdue', $vars);

        if (! $result->success) {
            app(TwilioSmsService::class)->send($notifiable->phone, 'payment_overdue', $vars);
        }
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'payment_overdue',
            'sale_id'     => $this->sale->id,
            'schedule_id' => $this->schedule->id,
            'amount'      => $this->schedule->amount,
            'due_date'    => $this->schedule->due_date->toDateString(),
        ];
    }
}

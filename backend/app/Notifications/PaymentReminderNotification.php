<?php

namespace App\Notifications;

use App\Models\SaleSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PaymentReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        public SaleSchedule $schedule,
        public string $type = 'reminder' // 'reminder' | 'overdue'
    ) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $sale = $this->schedule->sale;
        $amount = number_format($this->schedule->amount, 0, ',', ' ');
        $dueDate = $this->schedule->due_date->format('d/m/Y');

        if ($this->type === 'overdue') {
            return (new MailMessage)
                ->subject("PayTrack - Échéance en retard")
                ->greeting("Bonjour {$notifiable->full_name},")
                ->line("Votre tranche de **{$amount} FCFA** pour {$sale->article_name} était prévue le {$dueDate}.")
                ->line("Merci de régulariser votre situation au plus vite.")
                ->line("Référence : {$sale->reference}");
        }

        return (new MailMessage)
            ->subject("PayTrack - Rappel échéance demain")
            ->greeting("Bonjour {$notifiable->full_name},")
            ->line("Votre tranche de **{$amount} FCFA** pour {$sale->article_name} est prévue demain ({$dueDate}).")
            ->line("Référence : {$sale->reference}")
            ->line("Merci de votre confiance.");
    }

    public function toArray($notifiable): array
    {
        return [
            'schedule_id' => $this->schedule->id,
            'sale_id' => $this->schedule->sale_id,
            'amount' => $this->schedule->amount,
            'due_date' => $this->schedule->due_date->toDateString(),
            'type' => $this->type,
        ];
    }
}

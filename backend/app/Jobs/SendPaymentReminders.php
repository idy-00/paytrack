<?php

namespace App\Jobs;

use App\Models\SaleSchedule;
use App\Notifications\PaymentOverdueNotification;
use App\Notifications\PaymentReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Dispatched daily by the scheduler.
 * Sends reminders for:
 *   - Schedules due tomorrow (reminder)
 *   - Schedules overdue (overdue notice)
 */
class SendPaymentReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $tomorrow = now()->addDay()->toDateString();
        $today    = now()->toDateString();

        // 1. Remind for tomorrow's due installments
        $reminders = SaleSchedule::withoutGlobalScopes()
            ->with('sale.client', 'sale.shop')
            ->where('due_date', $tomorrow)
            ->where('status', 'en_attente')
            ->whereHas('sale', fn($q) => $q->whereIn('status', ['actif', 'retard']))
            ->get();

        foreach ($reminders as $schedule) {
            try {
                $schedule->sale->client->notify(
                    new PaymentReminderNotification($schedule->sale, $schedule)
                );
            } catch (\Throwable $e) {
                Log::error('SendPaymentReminders.reminder.failed', [
                    'schedule_id' => $schedule->id,
                    'error'       => $e->getMessage(),
                ]);
            }
        }

        // 2. Mark overdue + send overdue notifications
        $overdueSchedules = SaleSchedule::withoutGlobalScopes()
            ->with('sale.client', 'sale.shop')
            ->where('due_date', '<', $today)
            ->where('status', 'en_attente')
            ->whereHas('sale', fn($q) => $q->whereIn('status', ['actif', 'retard']))
            ->get();

        foreach ($overdueSchedules as $schedule) {
            try {
                $schedule->update(['status' => 'retard']);

                // Mark the sale as overdue if not already
                if ($schedule->sale->status !== 'retard') {
                    $schedule->sale->update(['status' => 'retard']);
                }

                $schedule->sale->client->notify(
                    new PaymentOverdueNotification($schedule->sale, $schedule)
                );
            } catch (\Throwable $e) {
                Log::error('SendPaymentReminders.overdue.failed', [
                    'schedule_id' => $schedule->id,
                    'error'       => $e->getMessage(),
                ]);
            }
        }

        Log::info('SendPaymentReminders.done', [
            'reminders_sent' => $reminders->count(),
            'overdue_marked' => $overdueSchedules->count(),
        ]);
    }
}

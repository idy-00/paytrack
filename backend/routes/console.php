<?php

use App\Jobs\SendPaymentReminders;
use App\Jobs\SendWeeklySummary;
use App\Console\Commands\DataCleanupCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Scheduled jobs ────────────────────────────────────────────────────────────

// Daily at 08:00 — send payment reminders (J-1) + mark overdue
Schedule::job(new SendPaymentReminders)->dailyAt('08:00')
    ->name('send-payment-reminders')
    ->withoutOverlapping()
    ->onFailure(fn() => \Illuminate\Support\Facades\Log::error('Scheduler: SendPaymentReminders failed'));

// Every Monday at 08:00 — weekly summary to admins
Schedule::job(new SendWeeklySummary)->weeklyOn(1, '08:00')
    ->name('send-weekly-summary')
    ->withoutOverlapping();

// Daily at 02:00 — data retention cleanup (low-traffic window)
Schedule::command('paytrack:data-cleanup')
    ->dailyAt('02:00')
    ->name('data-cleanup')
    ->withoutOverlapping()
    ->runInBackground();

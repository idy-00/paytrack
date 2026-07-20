<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Models\Tenant;
use App\Services\Email\MailService;
use App\Services\Notification\TwilioSmsService;
use App\Services\Notification\Templates\MessageTemplates;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

/**
 * Dispatched every Monday at 08:00 by the scheduler.
 * Sends a weekly summary to each tenant's admin.
 */
class SendWeeklySummary implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(MailService $mail, TwilioSmsService $sms): void
    {
        $tenants = Tenant::where('is_active', true)->get();

        foreach ($tenants as $tenant) {
            $stats = $this->computeStats($tenant->id);
            $admin = $tenant->users()
                ->whereHas('roles', fn($q) => $q->whereIn('name', ['admin_entreprise']))
                ->first();

            if (! $admin) continue;

            if ($admin->email) {
                $mail->sendWeeklySummary($admin->email, array_merge($stats, ['tenant' => $tenant]));
            }

            if ($admin->phone) {
                $sms->send($admin->phone, 'weekly_summary', [
                    'shop_name'      => $tenant->name,
                    'collected'      => number_format($stats['collected'], 0, '.', ' '),
                    'overdue_count'  => $stats['overdue_count'],
                    'overdue_amount' => number_format($stats['overdue_amount'], 0, '.', ' '),
                    'active_count'   => $stats['active_count'],
                ]);
            }
        }
    }

    private function computeStats(int $tenantId): array
    {
        $weekAgo = now()->subWeek();

        $collected = Sale::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->whereHas('payments', fn($q) => $q->where('payment_date', '>=', $weekAgo))
            ->join('payments', 'sales.id', '=', 'payments.sale_id')
            ->where('payments.payment_date', '>=', $weekAgo)
            ->sum('payments.amount');

        $overdueSales = Sale::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'retard');

        return [
            'collected'      => (int) $collected,
            'overdue_count'  => $overdueSales->count(),
            'overdue_amount' => (int) $overdueSales->sum('remaining_amount'),
            'active_count'   => Sale::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->whereIn('status', ['actif', 'retard'])
                ->count(),
        ];
    }
}

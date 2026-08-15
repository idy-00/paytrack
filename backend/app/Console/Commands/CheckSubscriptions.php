<?php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckSubscriptions extends Command
{
    protected $signature = 'subscriptions:check';
    protected $description = 'Check for expiring/expired subscriptions and send alerts';

    public function handle(SubscriptionService $service): int
    {
        // Suspend expired subscriptions
        $suspended = $service->suspendExpired();
        if ($suspended > 0) {
            $this->info("Suspended {$suspended} expired subscriptions");
            Log::info("Subscriptions suspended", ['count' => $suspended]);
        }

        // Get expiring soon alerts
        $alerts = $service->checkExpiringSoon();
        foreach ($alerts as $alert) {
            $type = isset($alert['is_trial']) ? 'trial' : 'subscription';
            $this->warn("[{$alert['tenant_name']}] {$type} expires in {$alert['days_left']} days");

            // TODO: Send email/SMS notification
            Log::info("Subscription expiring soon", $alert);
        }

        $this->info('Subscription check complete');
        return self::SUCCESS;
    }
}

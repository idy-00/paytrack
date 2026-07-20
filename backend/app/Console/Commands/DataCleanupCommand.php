<?php

namespace App\Console\Commands;

use App\Models\Sale;
use App\Models\Client;
use App\Models\DataRetentionPolicy;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Cron: daily cleanup run
 * - Archives closed sales older than X years
 * - Anonymizes/purges data past retention period
 */
class DataCleanupCommand extends Command
{
    protected $signature = 'paytrack:data-cleanup {--dry-run : Preview without making changes}';
    protected $description = 'Apply data retention policies — archive old sales, anonymize expired data';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $policies = DataRetentionPolicy::all();

        foreach ($policies as $policy) {
            $this->processPolicy($policy, $dryRun);
        }

        if (! $dryRun) {
            DataRetentionPolicy::query()->update(['last_cleanup_at' => now()]);
        }

        $this->info('Data cleanup completed.');
        return 0;
    }

    private function processPolicy(DataRetentionPolicy $policy, bool $dryRun): void
    {
        $archiveThreshold = now()->subYears($policy->active_retention_years);
        $deleteThreshold  = now()->subYears($policy->active_retention_years + $policy->archive_retention_years);

        // Find sold/closed sales past active retention
        $toArchive = Sale::withTrashed()
            ->where('tenant_id', $policy->tenant_id)
            ->where('status', 'solde')
            ->where('updated_at', '<', $archiveThreshold)
            ->whereNull('deleted_at')
            ->count();

        // Find archived sales past total retention — anonymize
        $toAnonymize = Client::withTrashed()
            ->where('tenant_id', $policy->tenant_id)
            ->where('updated_at', '<', $deleteThreshold)
            ->whereNotNull('deleted_at')
            ->count();

        $this->info("Tenant {$policy->tenant_id}: {$toArchive} to archive, {$toAnonymize} to anonymize");

        if ($dryRun) return;

        // Archive (soft-delete) old closed sales
        Sale::withTrashed()
            ->where('tenant_id', $policy->tenant_id)
            ->where('status', 'solde')
            ->where('updated_at', '<', $archiveThreshold)
            ->whereNull('deleted_at')
            ->delete();

        // Anonymize clients past full retention
        Client::withTrashed()
            ->where('tenant_id', $policy->tenant_id)
            ->where('updated_at', '<', $deleteThreshold)
            ->whereNotNull('deleted_at')
            ->update([
                'full_name'   => 'CLIENT_SUPPRIME',
                'phone'       => '00000000000',
                'email'       => null,
                'address'     => null,
                'id_number'   => null,
                'id_photo_path' => null,
            ]);

        Log::info('paytrack.data_cleanup', [
            'tenant_id'  => $policy->tenant_id,
            'archived'   => $toArchive,
            'anonymized' => $toAnonymize,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Sale;
use App\Models\Client;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleScheduleCalculationTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_distributes_rounding_without_exceeding_the_remaining_amount(): void
    {
        $tenant = Tenant::create(['name' => 'Tenant test', 'slug' => 'tenant-test']);
        app()->instance('current_tenant_id', $tenant->id);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Boutique test']);
        $user = User::factory()->create(['tenant_id' => $tenant->id, 'shop_id' => $shop->id]);
        $client = Client::forceCreate(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'full_name' => 'Client test', 'phone' => '+221770000000']);
        $sale = Sale::forceCreate([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'client_id' => $client->id,
            'created_by' => $user->id,
            'reference' => 'TEST-SCHEDULE',
            'qr_uuid' => fake()->uuid(),
            'article_name' => 'Test',
            'total_amount' => 1,
            'down_payment' => 0,
            'paid_amount' => 0,
            'remaining_amount' => 1,
            'installment_count' => 3,
            'installment_amount' => 1,
            'frequency' => 'mensuel',
            'start_date' => Carbon::parse('2026-08-29'),
            'end_date' => Carbon::parse('2026-11-29'),
            'status' => 'actif',
        ]);

        $sale->generateSchedule();

        $this->assertSame(1, $sale->schedules()->sum('amount'));
        $this->assertSame([1, 0, 0], $sale->schedules()->pluck('amount')->all());
    }
}

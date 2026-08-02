<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PaymentDoubleSubmitTest extends TestCase
{
    use RefreshDatabase;

    protected User $vendor;
    protected Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);

        $tenant = Tenant::create(['name' => 'Double Submit Tenant', 'slug' => 'ds-tenant']);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'DS Shop']);
        $this->vendor = User::factory()->create(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'is_active' => true]);
        $this->vendor->assignRole('vendeur');

        $client = Client::forceCreate(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'full_name' => 'Test Client', 'phone' => '+221770000000']);

        $this->sale = Sale::forceCreate([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'client_id' => $client->id,
            'created_by' => $this->vendor->id,
            'reference' => 'VT-DS-001',
            'qr_uuid' => fake()->uuid(),
            'article_name' => 'Test Article',
            'total_amount' => 100000,
            'paid_amount' => 0,
            'remaining_amount' => 100000,
            'installment_count' => 4,
            'installment_amount' => 25000,
            'frequency' => 'mensuel',
            'start_date' => today(),
            'end_date' => today()->addMonths(4),
            'status' => 'actif',
        ]);
    }

    public function test_payment_exceeding_remaining_is_rejected(): void
    {
        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 150000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'solde',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_final_payment_sets_status_solde(): void
    {
        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 100000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'solde',
            ])
            ->assertCreated()
            ->assertJsonPath('sale.status', 'solde')
            ->assertJsonPath('sale.remaining_amount', 0);
    }

    public function test_payment_on_solde_sale_is_rejected(): void
    {
        $this->sale->update(['status' => 'solde', 'paid_amount' => 100000, 'remaining_amount' => 0]);

        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 10000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'tranche',
            ])
            ->assertUnprocessable();
    }

    public function test_payment_on_annule_sale_is_rejected(): void
    {
        $this->sale->update(['status' => 'annule']);

        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 10000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'tranche',
            ])
            ->assertUnprocessable();
    }

    public function test_partial_payment_updates_amounts_correctly(): void
    {
        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 30000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'wave',
                'payment_type' => 'tranche',
            ])
            ->assertCreated()
            ->assertJsonPath('sale.paid_amount', 30000)
            ->assertJsonPath('sale.remaining_amount', 70000)
            ->assertJsonPath('sale.status', 'actif');
    }

    public function test_multiple_partial_payments_accumulate_correctly(): void
    {
        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 25000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'tranche',
            ])
            ->assertCreated();

        $this->actingAs($this->vendor, 'sanctum')
            ->postJson("/api/sales/{$this->sale->id}/payments", [
                'amount' => 25000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'wave',
                'payment_type' => 'tranche',
            ])
            ->assertCreated()
            ->assertJsonPath('sale.paid_amount', 50000)
            ->assertJsonPath('sale.remaining_amount', 50000);

        $this->assertDatabaseCount('payments', 2);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Client;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected Shop $shopA;
    protected Shop $shopB;
    protected User $vendorA;
    protected User $vendorB;
    protected Client $clientA;
    protected Client $clientB;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'admin_entreprise', 'guard_name' => 'web']);

        $this->tenantA = Tenant::create(['name' => 'Tenant A', 'slug' => 'tenant-a']);
        $this->tenantB = Tenant::create(['name' => 'Tenant B', 'slug' => 'tenant-b']);

        $this->shopA = Shop::forceCreate(['tenant_id' => $this->tenantA->id, 'name' => 'Shop A']);
        $this->shopB = Shop::forceCreate(['tenant_id' => $this->tenantB->id, 'name' => 'Shop B']);

        $this->vendorA = User::factory()->create(['tenant_id' => $this->tenantA->id, 'shop_id' => $this->shopA->id, 'is_active' => true]);
        $this->vendorA->assignRole('vendeur');

        $this->vendorB = User::factory()->create(['tenant_id' => $this->tenantB->id, 'shop_id' => $this->shopB->id, 'is_active' => true]);
        $this->vendorB->assignRole('vendeur');

        $this->clientA = Client::forceCreate(['tenant_id' => $this->tenantA->id, 'shop_id' => $this->shopA->id, 'full_name' => 'Client A', 'phone' => '+221771111111']);
        $this->clientB = Client::forceCreate(['tenant_id' => $this->tenantB->id, 'shop_id' => $this->shopB->id, 'full_name' => 'Client B', 'phone' => '+221772222222']);
    }

    public function test_vendor_cannot_see_other_tenant_clients(): void
    {
        $this->actingAs($this->vendorA, 'sanctum')
            ->getJson('/api/clients')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.full_name', 'Client A');
    }

    public function test_vendor_cannot_view_other_tenant_client(): void
    {
        $this->actingAs($this->vendorA, 'sanctum')
            ->getJson("/api/clients/{$this->clientB->id}")
            ->assertNotFound();
    }

    public function test_vendor_cannot_create_sale_with_cross_tenant_client(): void
    {
        $this->actingAs($this->vendorA, 'sanctum')
            ->postJson('/api/sales', [
                'client_id' => $this->clientB->id,
                'article_name' => 'Test',
                'total_amount' => 50000,
                'installment_count' => 1,
                'frequency' => 'mensuel',
                'start_date' => today()->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['client_id']);
    }

    public function test_vendor_cannot_create_sale_with_cross_tenant_article(): void
    {
        $articleB = Article::forceCreate(['tenant_id' => $this->tenantB->id, 'name' => 'Article B', 'price' => 10000, 'stock' => 5, 'is_active' => true]);

        $this->actingAs($this->vendorA, 'sanctum')
            ->postJson('/api/sales', [
                'client_id' => $this->clientA->id,
                'article_id' => $articleB->id,
                'article_name' => 'Test',
                'total_amount' => 50000,
                'installment_count' => 1,
                'frequency' => 'mensuel',
                'start_date' => today()->toDateString(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['article_id']);
    }

    public function test_vendor_cannot_view_other_tenant_sale(): void
    {
        $saleB = Sale::forceCreate([
            'tenant_id' => $this->tenantB->id,
            'shop_id' => $this->shopB->id,
            'client_id' => $this->clientB->id,
            'created_by' => $this->vendorB->id,
            'reference' => 'VT-TEST-001',
            'qr_uuid' => fake()->uuid(),
            'article_name' => 'Test',
            'total_amount' => 50000,
            'paid_amount' => 0,
            'remaining_amount' => 50000,
            'installment_count' => 1,
            'installment_amount' => 50000,
            'frequency' => 'mensuel',
            'start_date' => today(),
            'end_date' => today()->addMonth(),
            'status' => 'actif',
        ]);

        $this->actingAs($this->vendorA, 'sanctum')
            ->getJson("/api/sales/{$saleB->id}")
            ->assertNotFound();
    }

    public function test_vendor_cannot_record_payment_on_other_tenant_sale(): void
    {
        $saleB = Sale::forceCreate([
            'tenant_id' => $this->tenantB->id,
            'shop_id' => $this->shopB->id,
            'client_id' => $this->clientB->id,
            'created_by' => $this->vendorB->id,
            'reference' => 'VT-TEST-002',
            'qr_uuid' => fake()->uuid(),
            'article_name' => 'Test',
            'total_amount' => 50000,
            'paid_amount' => 0,
            'remaining_amount' => 50000,
            'installment_count' => 1,
            'installment_amount' => 50000,
            'frequency' => 'mensuel',
            'start_date' => today(),
            'end_date' => today()->addMonth(),
            'status' => 'actif',
        ]);

        $this->actingAs($this->vendorA, 'sanctum')
            ->postJson("/api/sales/{$saleB->id}/payments", [
                'amount' => 10000,
                'payment_date' => today()->toDateString(),
                'payment_method' => 'especes',
                'payment_type' => 'tranche',
            ])
            ->assertNotFound();
    }
}

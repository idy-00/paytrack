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

class QRPublicSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);

        $tenant = Tenant::create(['name' => 'QR Tenant', 'slug' => 'qr-tenant']);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'QR Shop']);
        $vendor = User::factory()->create(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'is_active' => true]);
        $vendor->assignRole('vendeur');

        $client = Client::forceCreate([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'full_name' => 'Mamadou Diallo',
            'phone' => '+221771234567',
            'email' => 'mamadou@test.com',
        ]);

        $this->sale = Sale::forceCreate([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'client_id' => $client->id,
            'created_by' => $vendor->id,
            'reference' => 'VT-QR-001',
            'qr_uuid' => 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'article_name' => 'iPhone 15 Pro Max',
            'total_amount' => 850000,
            'paid_amount' => 200000,
            'remaining_amount' => 650000,
            'installment_count' => 6,
            'installment_amount' => 108334,
            'frequency' => 'mensuel',
            'start_date' => today(),
            'end_date' => today()->addMonths(6),
            'status' => 'actif',
        ]);
    }

    public function test_public_qr_returns_masked_name(): void
    {
        $response = $this->getJson("/api/qr/{$this->sale->qr_uuid}")
            ->assertOk()
            ->assertJsonStructure(['reference', 'status', 'client_name', 'article']);

        $data = $response->json();
        $this->assertStringNotContainsString('Mamadou', $data['client_name']);
        $this->assertStringNotContainsString('Diallo', $data['client_name']);
        $this->assertStringContainsString('•', $data['client_name']);
    }

    public function test_public_qr_does_not_expose_phone(): void
    {
        $response = $this->getJson("/api/qr/{$this->sale->qr_uuid}")->assertOk();
        $this->assertArrayNotHasKey('phone', $response->json());
        $this->assertStringNotContainsString('771234567', json_encode($response->json()));
    }

    public function test_public_qr_does_not_expose_email(): void
    {
        $response = $this->getJson("/api/qr/{$this->sale->qr_uuid}")->assertOk();
        $this->assertArrayNotHasKey('email', $response->json());
        $this->assertStringNotContainsString('mamadou@test.com', json_encode($response->json()));
    }

    public function test_public_qr_does_not_expose_amounts(): void
    {
        $response = $this->getJson("/api/qr/{$this->sale->qr_uuid}")->assertOk();
        $data = $response->json();

        $this->assertArrayNotHasKey('total_amount', $data);
        $this->assertArrayNotHasKey('paid_amount', $data);
        $this->assertArrayNotHasKey('remaining_amount', $data);
        $this->assertArrayNotHasKey('installment_amount', $data);
    }

    public function test_public_qr_does_not_expose_payment_history(): void
    {
        $response = $this->getJson("/api/qr/{$this->sale->qr_uuid}")->assertOk();
        $data = $response->json();

        $this->assertArrayNotHasKey('payments', $data);
        $this->assertArrayNotHasKey('schedules', $data);
    }

    public function test_invalid_qr_uuid_returns_404(): void
    {
        $this->getJson('/api/qr/invalid-uuid-format')->assertNotFound();
        $this->getJson('/api/qr/00000000-0000-0000-0000-000000000000')->assertNotFound();
    }
}

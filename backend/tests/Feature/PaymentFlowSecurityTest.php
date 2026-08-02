<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Client;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PaymentFlowSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_cannot_list_tenant_clients(): void
    {
        $tenant = Tenant::create(['name' => 'Tenant A', 'slug' => 'tenant-a']);
        Role::create(['name' => 'client', 'guard_name' => 'web']);
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        $user->assignRole('client');

        $this->actingAs($user, 'sanctum')->getJson('/api/clients')->assertForbidden();
    }

    public function test_vendor_creates_cash_sale_and_stock_is_decremented(): void
    {
        $tenant = Tenant::create(['name' => 'Tenant B', 'slug' => 'tenant-b']);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Boutique B']);
        Role::create(['name' => 'vendeur', 'guard_name' => 'web']);
        $vendor = User::factory()->create(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'is_active' => true]);
        $vendor->assignRole('vendeur');
        $this->assertTrue($vendor->hasRole('vendeur'));
        $client = Client::forceCreate(['tenant_id' => $tenant->id, 'shop_id' => $shop->id, 'full_name' => 'Awa Ndiaye', 'phone' => '+221770000000']);
        $article = Article::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Téléphone', 'price' => 100000, 'stock' => 2, 'is_active' => true]);

        $this->actingAs($vendor, 'sanctum')->postJson('/api/sales', [
            'client_id' => $client->id,
            'article_id' => $article->id,
            'article_name' => 'Téléphone',
            'total_amount' => 100000,
            'down_payment' => 100000,
            'payment_mode' => 'comptant',
            'installment_count' => 1,
            'frequency' => 'mensuel',
            'start_date' => today()->toDateString(),
        ])->assertCreated()->assertJsonPath('status', 'solde')->assertJsonPath('remaining_amount', 0);

        $this->assertDatabaseHas('articles', ['id' => $article->id, 'stock' => 1]);
        $this->assertDatabaseCount('sale_schedules', 0);
    }
}

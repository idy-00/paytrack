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

class SaleStockQuantityTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_decrements_the_exact_quantity_atomically(): void
    {
        Role::firstOrCreate(['name' => 'vendeur', 'guard_name' => 'web']);
        $tenant = Tenant::create(['name' => 'Tenant stock', 'slug' => 'tenant-stock']);
        app()->instance('current_tenant_id', $tenant->id);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Boutique stock']);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'is_active' => true,
        ]);
        $user->assignRole('vendeur');
        $client = Client::forceCreate([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'full_name' => 'Client stock',
            'phone' => '+221770000000',
        ]);
        $article = Article::forceCreate([
            'tenant_id' => $tenant->id,
            'name' => 'Article test',
            'price' => 1000,
            'stock' => 5,
            'is_active' => true,
        ]);

        $payload = [
            'client_id' => $client->id,
            'article_id' => $article->id,
            'article_name' => $article->name,
            'quantity' => 3,
            'total_amount' => 3000,
            'down_payment' => 3000,
            'payment_mode' => 'comptant',
            'installment_count' => 1,
            'frequency' => 'mensuel',
            'start_date' => today()->toDateString(),
        ];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/sales', $payload)
            ->assertCreated()
            ->assertJsonPath('quantity', 3);

        $this->assertSame(2, $article->fresh()->stock);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/sales', $payload)
            ->assertUnprocessable();

        $this->assertSame(2, $article->fresh()->stock);
        $this->assertDatabaseCount('sales', 1);
    }
}

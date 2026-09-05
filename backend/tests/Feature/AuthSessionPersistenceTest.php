<?php

namespace Tests\Feature;

use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthSessionPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_login_does_not_revoke_the_web_session(): void
    {
        Role::create(['name' => 'vendeur', 'guard_name' => 'web']);
        $tenant = Tenant::create(['name' => 'Tenant Session', 'slug' => 'tenant-session']);
        $shop = Shop::forceCreate(['tenant_id' => $tenant->id, 'name' => 'Boutique Session']);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'email' => 'session@paytrack.test',
            'password' => Hash::make('motdepasse123'),
            'is_active' => true,
        ]);
        $user->assignRole('vendeur');
        $user->createToken('api:paytrack-web');

        $this->postJson('/api/auth/login', [
            'email' => 'session@paytrack.test',
            'password' => 'motdepasse123',
            'device_name' => 'PayTrack Mobile',
        ])->assertOk()->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'api:paytrack-web',
        ]);
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'api:paytrack-mobile',
        ]);
    }
}

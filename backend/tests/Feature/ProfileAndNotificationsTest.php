<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProfileAndNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_profile_and_read_notifications(): void
    {
        $tenant = Tenant::create(['name' => 'Tenant Profil', 'slug' => 'tenant-profil']);
        $user = User::factory()->create(['name' => 'Ancien nom', 'tenant_id' => $tenant->id, 'is_active' => true]);
        $notificationId = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id' => $notificationId,
            'type' => 'App\\Notifications\\PaymentReminder',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode(['title' => 'Échéance', 'message' => 'Votre paiement arrive à échéance.']),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')->putJson('/api/auth/profile', [
            'name' => 'Nouveau nom',
            'phone' => '771234567',
        ])->assertOk();

        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Nouveau nom', 'phone' => '771234567']);
        $this->getJson('/api/notifications')->assertOk()->assertJsonPath('data.0.id', $notificationId);
        $this->postJson("/api/notifications/{$notificationId}/read")->assertOk();
        $this->assertDatabaseMissing('notifications', ['id' => $notificationId, 'read_at' => null]);
    }
}

<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_reset_a_password_after_verifying_a_password_reset_otp(): void
    {
        Mail::fake();
        $user = User::factory()->create([
            'email' => 'client@paytrack.test',
            'password' => Hash::make('ancienmotdepasse'),
        ]);

        $this->postJson('/api/otp/send', [
            'email' => $user->email,
            'type' => 'password_reset',
        ])->assertOk()->assertJsonPath('expires_in', 600);

        Mail::assertSent(OtpCodeMail::class, fn (OtpCodeMail $mail) => $mail->hasTo($user->email));
        $code = OtpCode::query()->where('email', $user->email)->value('code');

        $verification = $this->postJson('/api/otp/verify', [
            'email' => $user->email,
            'code' => $code,
            'type' => 'password_reset',
        ])->assertOk()->assertJsonStructure(['reset_token']);

        $this->postJson('/api/otp/reset-password', [
            'reset_token' => $verification->json('reset_token'),
            'password' => 'nouveaumotdepasse',
            'password_confirmation' => 'nouveaumotdepasse',
        ])->assertOk();

        $this->assertTrue(Hash::check('nouveaumotdepasse', $user->fresh()->password));
    }
}

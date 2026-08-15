<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = [
        'email',
        'code',
        'type',
        'expires_at',
        'verified_at',
        'attempts',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    /**
     * Generate a new OTP code for the given email and type.
     */
    public static function generate(string $email, string $type = 'login'): self
    {
        // Invalidate any existing codes for this email/type
        self::where('email', $email)
            ->where('type', $type)
            ->whereNull('verified_at')
            ->delete();

        return self::create([
            'email' => $email,
            'code' => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'type' => $type,
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);
    }

    /**
     * Verify an OTP code.
     */
    public static function verify(string $email, string $code, string $type = 'login'): ?self
    {
        $otp = self::where('email', $email)
            ->where('type', $type)
            ->whereNull('verified_at')
            ->where('expires_at', '>', now())
            ->where('attempts', '<', 5)
            ->latest()
            ->first();

        if (!$otp) {
            return null;
        }

        $otp->increment('attempts');

        if ($otp->code !== $code) {
            return null;
        }

        $otp->update(['verified_at' => now()]);

        return $otp;
    }

    /**
     * Check if the OTP is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if max attempts reached.
     */
    public function isBlocked(): bool
    {
        return $this->attempts >= 5;
    }
}

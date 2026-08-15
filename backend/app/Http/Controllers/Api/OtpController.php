<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpCodeMail;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class OtpController extends Controller
{
    /**
     * Send OTP code to email.
     * POST /api/otp/send
     */
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'type' => 'required|in:login,register,password_reset',
        ]);

        $email = strtolower($request->email);
        $type = $request->type;

        // Rate limiting: max 3 OTP requests per email per 10 minutes
        $key = "otp-send:{$email}";
        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        // For login/password_reset, check if user exists
        $user = User::where('email', $email)->first();

        if ($type === 'login' && !$user) {
            return response()->json([
                'message' => 'Aucun compte trouvé avec cet email.',
            ], 404);
        }

        if ($type === 'register' && $user) {
            return response()->json([
                'message' => 'Un compte existe déjà avec cet email.',
            ], 409);
        }

        // Generate OTP
        $otp = OtpCode::generate($email, $type);

        // Send email
        Mail::to($email)->send(new OtpCodeMail(
            code: $otp->code,
            type: $type,
            userName: $user?->name,
        ));

        return response()->json([
            'message' => 'Code envoyé à ' . $this->maskEmail($email),
            'expires_in' => 600, // 10 minutes
        ]);
    }

    /**
     * Verify OTP code and login.
     * POST /api/otp/verify
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'type' => 'required|in:login,register,password_reset',
        ]);

        $email = strtolower($request->email);
        $code = $request->code;
        $type = $request->type;

        // Rate limiting: max 5 verification attempts per email per 10 minutes
        $key = "otp-verify:{$email}";
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'message' => "Trop de tentatives. Réessayez dans {$seconds} secondes.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        // Verify OTP
        $otp = OtpCode::verify($email, $code, $type);

        if (!$otp) {
            return response()->json([
                'message' => 'Code incorrect ou expiré.',
            ], 422);
        }

        // Handle based on type
        if ($type === 'login') {
            return $this->handleLoginVerification($email);
        }

        if ($type === 'register') {
            return response()->json([
                'message' => 'Email vérifié. Vous pouvez maintenant créer votre compte.',
                'email_verified' => true,
                'verification_token' => encrypt(['email' => $email, 'expires' => now()->addHour()]),
            ]);
        }

        if ($type === 'password_reset') {
            return response()->json([
                'message' => 'Code vérifié. Vous pouvez maintenant changer votre mot de passe.',
                'reset_token' => encrypt(['email' => $email, 'expires' => now()->addMinutes(30)]),
            ]);
        }

        return response()->json(['message' => 'Code vérifié.']);
    }

    /**
     * Reset password with verified OTP.
     * POST /api/otp/reset-password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $data = decrypt($request->reset_token);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Token invalide.'], 422);
        }

        if (!isset($data['email'], $data['expires']) || now()->isAfter($data['expires'])) {
            return response()->json(['message' => 'Token expiré.'], 422);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.',
        ]);
    }

    /**
     * Handle login after OTP verification.
     */
    private function handleLoginVerification(string $email): JsonResponse
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé.'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        // Create token
        $token = $user->createToken('otp-login')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->getRoleNames()->first() ?? 'user',
                'tenant_id' => $user->tenant_id,
                'shop_id' => $user->shop_id,
            ],
        ]);
    }

    /**
     * Mask email for display.
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1];

        $maskedName = substr($name, 0, 2) . str_repeat('*', max(0, strlen($name) - 4)) . substr($name, -2);

        return $maskedName . '@' . $domain;
    }
}

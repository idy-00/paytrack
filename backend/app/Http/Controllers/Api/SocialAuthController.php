<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialAuthController extends Controller
{
    public function redirectGoogle()
    {
        if (!config('services.google.client_id')) {
            return response()->json([
                'message' => 'Google OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in .env',
            ], 501);
        }

        $params = http_build_query([
            'client_id'     => config('services.google.client_id'),
            'redirect_uri'  => config('services.google.redirect'),
            'response_type' => 'code',
            'scope'         => 'openid email profile',
            'access_type'   => 'offline',
            'prompt'        => 'select_account',
        ]);

        return redirect("https://accounts.google.com/o/oauth2/v2/auth?{$params}");
    }

    public function callbackGoogle(Request $request): JsonResponse
    {
        if (!config('services.google.client_id')) {
            return response()->json(['message' => 'Google OAuth not configured'], 501);
        }

        $code = $request->get('code');
        if (!$code) {
            return response()->json(['message' => 'No authorization code provided'], 400);
        }

        // TODO: Exchange code for token, get user info, create/login user
        // This requires laravel/socialite or manual HTTP calls
        // For now, return placeholder
        return response()->json([
            'message' => 'Google OAuth callback received. Full implementation requires GOOGLE_CLIENT_SECRET.',
            'code'    => substr($code, 0, 20) . '...',
        ], 501);
    }

    public function redirectApple()
    {
        if (!config('services.apple.client_id')) {
            return response()->json([
                'message' => 'Apple OAuth not configured. Set APPLE_CLIENT_ID, APPLE_CLIENT_SECRET, APPLE_REDIRECT_URI in .env',
            ], 501);
        }

        $params = http_build_query([
            'client_id'     => config('services.apple.client_id'),
            'redirect_uri'  => config('services.apple.redirect'),
            'response_type' => 'code id_token',
            'scope'         => 'name email',
            'response_mode' => 'form_post',
        ]);

        return redirect("https://appleid.apple.com/auth/authorize?{$params}");
    }

    public function callbackApple(Request $request): JsonResponse
    {
        if (!config('services.apple.client_id')) {
            return response()->json(['message' => 'Apple OAuth not configured'], 501);
        }

        // TODO: Validate Apple ID token, create/login user
        return response()->json([
            'message' => 'Apple OAuth callback received. Full implementation requires Apple Developer credentials.',
        ], 501);
    }
}

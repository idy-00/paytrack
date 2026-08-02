<?php

return [

    // ── Laravel defaults (gardés pour compatibilité) ──────────────────────────
    'postmark' => ['key' => env('POSTMARK_API_KEY')],
    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── Google OAuth ──────────────────────────────────────────────────────────
    // Console: console.cloud.google.com → APIs & Services → Credentials
    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI', '/api/auth/google/callback'),
    ],

    // ── Apple Sign In ───────────────────────────────────────────────────────────
    // Console: developer.apple.com → Certificates, IDs & Profiles → Keys
    'apple' => [
        'client_id'     => env('APPLE_CLIENT_ID'),     // Service ID
        'client_secret' => env('APPLE_CLIENT_SECRET'), // Generated JWT
        'redirect'      => env('APPLE_REDIRECT_URI', '/api/auth/apple/callback'),
        'team_id'       => env('APPLE_TEAM_ID'),
        'key_id'        => env('APPLE_KEY_ID'),
    ],

    // ── Wave Business (ACTIF — ATAABA, numéro 78 751 72 72) ──────────────────
    // Dashboard: business.wave.com → Settings → API Keys
    'wave' => [
        'api_key'        => env('WAVE_API_KEY'),
        'webhook_secret' => env('WAVE_WEBHOOK_SECRET'),
        'base_url'       => env('WAVE_BASE_URL', 'https://api.wave.com/v1'),
    ],

    // ── Orange Money Senegal (EN ATTENTE — code marchand en validation) ───────
    // Feature flag: ORANGE_MONEY_ENABLED=false jusqu'à validation
    'orange_money' => [
        'enabled'           => env('ORANGE_MONEY_ENABLED', false),  // ← toggle
        'client_id'         => env('ORANGE_MONEY_CLIENT_ID'),
        'client_secret'     => env('ORANGE_MONEY_CLIENT_SECRET'),
        'merchant_key'      => env('ORANGE_MONEY_MERCHANT_KEY'),
        'base_url'          => env('ORANGE_MONEY_BASE_URL', 'https://api.orange.com'),
        'authorization_url' => env('ORANGE_MONEY_AUTHORIZATION_URL', 'https://api.orange.com/oauth/v3/token'),
        'country'           => env('ORANGE_MONEY_COUNTRY', 'SN'),
        'webhook_secret'    => env('ORANGE_MONEY_WEBHOOK_SECRET'),
    ],

    // ── Free Money (SKIP V1 — pas prioritaire) ────────────────────────────────
    'free_money' => [
        'enabled' => false,  // Désactivé définitivement pour la V1
    ],

    // ── WhatsApp Business (ACTIF — ATAABA, numéro 78 751 72 72) ──────────────
    // Provider: meta (Cloud API directe) ou twilio (intermédiaire)
    'whatsapp' => [
        'provider'   => env('WHATSAPP_PROVIDER', 'meta'),
        'meta' => [
            'access_token'   => env('WHATSAPP_META_ACCESS_TOKEN'),
            'phone_id'       => env('WHATSAPP_META_PHONE_ID'),
            'business_id'    => env('WHATSAPP_META_BUSINESS_ID'),
            'version'        => env('WHATSAPP_META_VERSION', 'v19.0'),
            'verify_token'   => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
        ],
    ],

    // ── Africa's Talking — SMS ────────────────────────────────────────────────
    // Compte: africastalking.com → Dashboard → Settings → API Key
    // Sandbox: username=sandbox (pour tests sans coût)
    'africastalking' => [
        'username' => env('AFRICASTALKING_USERNAME', 'sandbox'),
        'api_key'  => env('AFRICASTALKING_API_KEY'),
        'from'     => env('AFRICASTALKING_FROM', 'PayTrack'),
    ],

    // ── Brevo (ex-Sendinblue) — Email transactionnel ──────────────────────────
    // API Key: Brevo → Account → SMTP & API → API Keys → New API Key
    'brevo' => [
        'api_key' => env('BREVO_API_KEY'),
    ],

    // ── Firebase FCM — Notifications push mobile (Flutter) ───────────────────
    // Créer projet: console.firebase.google.com
    // Nom suggéré: paytrack-production
    // Service account: Project Settings → Service accounts → Generate new private key
    'fcm' => [
        'project_id'                  => env('FCM_PROJECT_ID'),
        'service_account_json'        => env('FCM_SERVICE_ACCOUNT_JSON'),
        'service_account_credentials' => env('FCM_SERVICE_ACCOUNT_CREDENTIALS'),
    ],
];

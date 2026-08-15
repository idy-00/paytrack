<?php
// Script temporaire de déploiement - À SUPPRIMER après utilisation
// Accès: https://lightsalmon-eel-638395.hostingersite.com/backend/public/deploy_intech_temp.php?key=DEPLOY2026

$SECRET_KEY = 'DEPLOY2026';

if (($_GET['key'] ?? '') !== $SECRET_KEY) {
    http_response_code(403);
    die('Forbidden');
}

header('Content-Type: text/plain');
echo "=== PayTrack Intech Deployment ===\n\n";

$basePath = dirname(__DIR__);
chdir($basePath);

// 1. Ajouter les variables Intech au .env
echo "1. Updating .env...\n";
$envPath = $basePath . '/.env';
$envContent = file_get_contents($envPath);

if (strpos($envContent, 'INTECH_API_KEY') === false) {
    $intechConfig = "\n# INTECH API (CashOut)\nINTECH_API_KEY=a30dd0860b8fe70ed189f682ed7799718fb5315d2f5eb9ed1085155d224442f6\nINTECH_API_SECRET=dd95c7bfc0a10ccc0652328b8bd03bf56758b690f8413e8e7fde292e23087e65\nINTECH_BASE_URL=https://api.intech.sn\nINTECH_ENV=prod\n";
    file_put_contents($envPath, $envContent . $intechConfig);
    echo "   - Intech keys added to .env\n";
} else {
    echo "   - Intech keys already present\n";
}

// 2. Exécuter les migrations
echo "\n2. Running migrations...\n";
$output = shell_exec('php artisan migrate --force 2>&1');
echo $output . "\n";

// 3. Vider les caches
echo "3. Clearing caches...\n";
echo shell_exec('php artisan config:cache 2>&1') . "\n";
echo shell_exec('php artisan route:cache 2>&1') . "\n";

// 4. Vérifier que IntechService existe
echo "4. Checking files...\n";
$files = [
    'app/Services/IntechService.php',
    'app/Http/Controllers/Api/Webhook/IntechWebhookController.php',
    'app/Http/Controllers/Api/KycController.php',
    'app/Models/TenantKycDocument.php',
];

foreach ($files as $file) {
    $exists = file_exists($basePath . '/' . $file) ? 'OK' : 'MISSING';
    echo "   - $file: $exists\n";
}

echo "\n=== Deployment complete ===\n";
echo "\n⚠️  DELETE THIS FILE NOW: rm public/deploy_intech_temp.php\n";

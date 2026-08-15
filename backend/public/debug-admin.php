<?php
if (!isset($_GET['key']) || $_GET['key'] !== 'paytrack2026') die('No');

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Sale;
use App\Models\Shop;
use App\Models\Payment;

echo "<pre>";
echo "=== Debug Admin Stats ===\n\n";

try {
    $user = User::where('email', 'moussa@phoneshop-dakar.com')->first();
    echo "User: {$user->name} (ID: {$user->id})\n";
    echo "Tenant ID: {$user->tenant_id}\n";
    echo "Has admin_entreprise role: " . ($user->hasRole('admin_entreprise') ? 'YES' : 'NO') . "\n\n";

    $tenantId = $user->tenant_id;

    echo "1. Total Revenue (solde sales)...\n";
    $totalRevenue = Sale::where('tenant_id', $tenantId)->where('status', 'solde')->sum('total_amount');
    echo "   Result: $totalRevenue\n\n";

    echo "2. Active Sales (en_cours)...\n";
    $activeSales = Sale::where('tenant_id', $tenantId)->where('status', 'en_cours')->count();
    echo "   Result: $activeSales\n\n";

    echo "3. Overdue Sales (retard)...\n";
    $overdueSales = Sale::where('tenant_id', $tenantId)->where('status', 'retard')->count();
    echo "   Result: $overdueSales\n\n";

    echo "4. Total Encaisse (payments)...\n";
    $totalEncaisse = Payment::whereHas('sale', function ($q) use ($tenantId) {
        $q->where('tenant_id', $tenantId);
    })->sum('amount');
    echo "   Result: $totalEncaisse\n\n";

    echo "5. Shops Count...\n";
    $shopsCount = Shop::where('tenant_id', $tenantId)->count();
    echo "   Result: $shopsCount\n\n";

    echo "6. Users Count...\n";
    $usersCount = User::where('tenant_id', $tenantId)->count();
    echo "   Result: $usersCount\n\n";

    echo "=== ALL OK ===\n";

} catch (Exception $e) {
    echo "\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nTrace:\n" . $e->getTraceAsString() . "\n";
}
echo "</pre>";

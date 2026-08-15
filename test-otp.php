<?php
$secret = 'paytrack2026test';
if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    die('Access denied.');
}

chdir(__DIR__ . '/..');
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\OtpCode;
use App\Mail\OtpCodeMail;
use Illuminate\Support\Facades\Mail;

echo "<pre>";
echo "=== PayTrack OTP Test ===\n\n";

$testEmail = $_GET['email'] ?? 'idykane03@gmail.com';
$type = $_GET['type'] ?? 'login';

echo "Email: {$testEmail}\n";
echo "Type: {$type}\n\n";

try {
    // Generate OTP
    echo "1. Generating OTP code...\n";
    $otp = OtpCode::generate($testEmail, $type);
    echo "   Code: {$otp->code}\n";
    echo "   Expires: {$otp->expires_at}\n\n";

    // Send email
    echo "2. Sending email via Brevo...\n";
    Mail::to($testEmail)->send(new OtpCodeMail(
        code: $otp->code,
        type: $type,
        userName: 'Test User',
    ));
    echo "   Email sent!\n\n";

    echo "=== SUCCESS ===\n";
    echo "Check your inbox at {$testEmail}\n";

} catch (Exception $e) {
    echo "\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n⚠️ DELETE THIS FILE NOW!\n";
echo "</pre>";

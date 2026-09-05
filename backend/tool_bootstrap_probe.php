<?php

echo "A autoload\n";
require __DIR__ . '/vendor/autoload.php';
echo "B app\n";
$app = require __DIR__ . '/bootstrap/app.php';
echo "C kernel\n";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo "D bootstrapped\n";

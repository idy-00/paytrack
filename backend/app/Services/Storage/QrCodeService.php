<?php

namespace App\Services\Storage;

use App\Models\Sale;
use Illuminate\Support\Facades\Log;

/**
 * Generates QR codes server-side and stores them.
 *
 * Required package (add to composer.json manually or run when network available):
 *   composer require endroid/qr-code
 *
 * Required .env:
 *   APP_URL=https://app.paytrack.sn      # Used to build the QR URL
 *   FILESYSTEM_DISK=s3                   # Where to store generated QR PNGs
 */
class QrCodeService
{
    public function __construct(
        private FileStorageService $storage,
    ) {}

    /**
     * Generate QR code PNG for a sale and store it.
     * Returns the storage path.
     */
    public function generateAndStore(Sale $sale): string
    {
        $url  = config('app.url') . "/qr/{$sale->qr_uuid}";
        $path = "tenants/{$sale->tenant_id}/qr/{$sale->qr_uuid}.png";

        if ($this->storage->exists($path)) {
            return $path;
        }

        $pngContent = $this->generatePng($url);
        $this->storage->storeQrCode($sale->tenant_id, $sale->qr_uuid, $pngContent);

        Log::info('qr.generated', [
            'sale'      => $sale->reference,
            'qr_uuid'   => $sale->qr_uuid,
            'path'      => $path,
        ]);

        return $path;
    }

    /**
     * Returns a signed URL to download the QR PNG.
     */
    public function getUrl(Sale $sale, int $minutesTtl = 30): string
    {
        $path = $this->generateAndStore($sale);
        return $this->storage->temporaryUrl($path, $minutesTtl);
    }

    private function generatePng(string $url): string
    {
        // Uses endroid/qr-code if installed.
        // Falls back to Google Charts API (no dependency needed, but external call).
        if (class_exists(\Endroid\QrCode\QrCode::class)) {
            return $this->generateWithEndroid($url);
        }

        return $this->generateWithGoogleCharts($url);
    }

    private function generateWithEndroid(string $url): string
    {
        $qrCode = \Endroid\QrCode\QrCode::create($url)
            ->setSize(400)
            ->setMargin(20)
            ->setEncoding(new \Endroid\QrCode\Encoding\Encoding('UTF-8'))
            ->setErrorCorrectionLevel(\Endroid\QrCode\ErrorCorrectionLevel::High);

        $writer = new \Endroid\QrCode\Writer\PngWriter();
        $result = $writer->write($qrCode);

        return $result->getString();
    }

    private function generateWithGoogleCharts(string $url): string
    {
        // Last resort — avoid in production (external dependency, privacy concern).
        // Replace with endroid/qr-code as soon as API keys allow Composer install.
        $apiUrl = 'https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=' . urlencode($url) . '&choe=UTF-8';
        return file_get_contents($apiUrl);
    }
}

<?php

namespace App\Services\Storage;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Abstraction over Laravel's filesystem.
 * Disk is configured by .env:
 *   - 'local'  — for dev (files in storage/app)
 *   - 's3'     — for Cloudflare R2 or AWS S3 (S3-compatible)
 *
 * Required .env (Cloudflare R2):
 *   FILESYSTEM_DISK=s3
 *   AWS_ACCESS_KEY_ID=your_r2_access_key_id
 *   AWS_SECRET_ACCESS_KEY=your_r2_secret_key
 *   AWS_DEFAULT_REGION=auto
 *   AWS_BUCKET=paytrack-files
 *   AWS_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
 *   AWS_USE_PATH_STYLE_ENDPOINT=true
 *   STORAGE_URL=https://files.yourdomain.com   # Custom R2 public domain
 *
 * Required .env (AWS S3):
 *   FILESYSTEM_DISK=s3
 *   AWS_ACCESS_KEY_ID=
 *   AWS_SECRET_ACCESS_KEY=
 *   AWS_DEFAULT_REGION=eu-west-3
 *   AWS_BUCKET=paytrack-files
 */
class FileStorageService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = config('filesystems.default', 'local');
    }

    /**
     * Store a QR code PNG and return its storage path.
     * Files are organized by tenant to prevent cross-tenant access.
     */
    public function storeQrCode(int $tenantId, string $saleUuid, string $pngContent): string
    {
        $path = "tenants/{$tenantId}/qr/{$saleUuid}.png";
        Storage::disk($this->disk)->put($path, $pngContent, 'public');
        return $path;
    }

    /**
     * Store a PDF receipt.
     */
    public function storeReceipt(int $tenantId, string $receiptNumber, string $pdfContent): string
    {
        $path = "tenants/{$tenantId}/receipts/{$receiptNumber}.pdf";
        Storage::disk($this->disk)->put($path, $pdfContent, 'private');
        return $path;
    }

    /**
     * Store an identity document photo (encrypted disk recommended).
     * Access is logged every time this method is called.
     */
    public function storeIdPhoto(int $tenantId, int $clientId, UploadedFile $file): string
    {
        $ext  = $file->getClientOriginalExtension();
        $path = "tenants/{$tenantId}/id-photos/{$clientId}-" . Str::random(12) . ".{$ext}";
        Storage::disk(config('paytrack.id_photo_disk', 'local'))->putFileAs(
            dirname($path),
            $file,
            basename($path),
            'private'
        );
        return $path;
    }

    /**
     * Get a temporary signed URL valid for $minutes.
     * For public QR codes, use a public URL instead.
     */
    public function temporaryUrl(string $path, int $minutes = 15): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $path,
            now()->addMinutes($minutes)
        );
    }

    /**
     * Get a permanent public URL (for QR codes only — non-sensitive).
     */
    public function publicUrl(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    public function delete(string $path): void
    {
        Storage::disk($this->disk)->delete($path);
    }

    public function exists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaytechWebhook extends Model
{
    protected $fillable = [
        'paytech_transaction_id', 'event_type', 'payload',
        'signature_received', 'signature_valid', 'ip_address',
        'processing_status', 'processing_notes',
    ];

    protected $casts = [
        'payload' => 'array',
        'signature_valid' => 'boolean',
    ];

    public function markProcessed(string $notes = null): void
    {
        $this->update([
            'processing_status' => 'processed',
            'processing_notes' => $notes,
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'processing_status' => 'failed',
            'processing_notes' => $reason,
        ]);
    }

    public function markIgnored(string $reason): void
    {
        $this->update([
            'processing_status' => 'ignored',
            'processing_notes' => $reason,
        ]);
    }
}

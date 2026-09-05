<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DexpayWebhook extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'checkout_session_id',
        'reference',
        'event_type',
        'payload',
        'signature_received',
        'signature_valid',
        'ip_address',
        'processing_status',
        'processing_notes',
        'processed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'signature_valid' => 'boolean',
        'processed_at' => 'datetime',
    ];

    public function markAsProcessed(?string $notes = null): void
    {
        $this->update([
            'processing_status' => 'processed',
            'processing_notes' => $notes,
            'processed_at' => now(),
        ]);
    }

    public function markAsFailed(string $reason): void
    {
        $this->update([
            'processing_status' => 'failed',
            'processing_notes' => $reason,
        ]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;
use Carbon\Carbon;

class SaleSchedule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'sale_id', 'installment_number', 'due_date',
        'amount', 'status', 'paid_date', 'paid_amount',
    ];

    protected $casts = [
        'due_date'           => 'date',
        'paid_date'          => 'date',
        'amount'             => 'integer',
        'paid_amount'        => 'integer',
        'installment_number' => 'integer',
    ];

    public function sale() { return $this->belongsTo(Sale::class); }

    public function isOverdue(): bool
    {
        return $this->status === 'en_attente' && $this->due_date->isPast();
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'en_attente')
                     ->where('due_date', '<', now()->toDateString());
    }

    public function scopeUpcoming($query, int $days = 7)
    {
        return $query->where('status', 'en_attente')
                     ->whereBetween('due_date', [
                         now()->toDateString(),
                         now()->addDays($days)->toDateString(),
                     ]);
    }
}

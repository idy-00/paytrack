<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Traits\BelongsToTenant;

class Payment extends Model
{
    use BelongsToTenant, LogsActivity;

    protected $fillable = [
        // tenant_id is intentionally excluded — managed automatically by BelongsToTenant trait
        'sale_id', 'sale_schedule_id', 'recorded_by',
        'receipt_number', 'amount', 'payment_date',
        'payment_type', 'payment_method', 'notes',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'integer',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->dontSubmitEmptyLogs();
    }

    public function sale()         { return $this->belongsTo(Sale::class); }
    public function schedule()     { return $this->belongsTo(SaleSchedule::class, 'sale_schedule_id'); }
    public function recordedBy()   { return $this->belongsTo(User::class, 'recorded_by'); }
}

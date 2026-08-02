<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Traits\BelongsToTenant;

class Sale extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, LogsActivity;

    protected $fillable = [
        // tenant_id is intentionally excluded — managed automatically by BelongsToTenant trait
        'shop_id', 'client_id', 'article_id', 'created_by',
        'reference', 'qr_uuid', 'article_name',
        'total_amount', 'down_payment', 'paid_amount', 'remaining_amount',
        'payment_mode',
        'installment_count', 'installment_amount', 'frequency',
        'start_date', 'end_date', 'status', 'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'total_amount'     => 'integer',
        'down_payment'     => 'integer',
        'paid_amount'      => 'integer',
        'remaining_amount' => 'integer',
        'installment_amount' => 'integer',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function client()      { return $this->belongsTo(Client::class); }
    public function article()     { return $this->belongsTo(Article::class); }
    public function shop()        { return $this->belongsTo(Shop::class); }
    public function createdBy()   { return $this->belongsTo(User::class, 'created_by'); }
    public function schedules()   { return $this->hasMany(SaleSchedule::class)->orderBy('installment_number'); }
    public function payments()    { return $this->hasMany(Payment::class)->orderBy('payment_date'); }

    // Generate installment schedule
    public function generateSchedule(): void
    {
        $remaining = $this->total_amount - $this->down_payment;
        $perInstallment = (int) ceil($remaining / $this->installment_count);
        $current = $this->start_date->copy();

        for ($i = 1; $i <= $this->installment_count; $i++) {
            $dueDate = match ($this->frequency) {
                'hebdomadaire' => $current->copy()->addWeeks($i),
                'bimestriel'   => $current->copy()->addWeeks($i * 2),
                'mensuel'      => $current->copy()->addMonths($i),
                'trimestriel'  => $current->copy()->addMonths($i * 3),
                default        => $current->copy()->addMonths($i),
            };

            // Last installment adjusts for rounding
            $amount = ($i === $this->installment_count)
                ? $remaining - ($perInstallment * ($this->installment_count - 1))
                : $perInstallment;

            $this->schedules()->create([
                'tenant_id'           => $this->tenant_id,
                'installment_number'  => $i,
                'due_date'            => $dueDate,
                'amount'              => max(0, $amount),
                'status'              => 'en_attente',
            ]);
        }
    }
}

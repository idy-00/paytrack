<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'name', 'contact_name', 'phone',
        'email', 'address', 'city', 'notes', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function orders() { return $this->hasMany(SupplierOrder::class); }

    public function scopeActive($q) { return $q->where('is_active', true); }

    public function totalDebt(): int
    {
        return $this->orders()->sum('remaining_amount');
    }
}

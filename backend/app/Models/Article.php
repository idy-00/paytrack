<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;

class Article extends Model
{
    use SoftDeletes, BelongsToTenant;

    protected $fillable = [
        'shop_id', 'name', 'category', 'reference',
        'price', 'description', 'is_active',
    ];

    protected $casts = [
        'price'     => 'integer',
        'is_active' => 'boolean',
    ];

    public function sales() { return $this->hasMany(Sale::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }
}

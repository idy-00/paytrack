<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'email', 'phone',
        'address', 'city', 'country', 'currency', 'is_active',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'trial_ends_at' => 'datetime',
    ];

    public function users()   { return $this->hasMany(User::class); }
    public function sales()   { return $this->hasMany(Sale::class); }
    public function clients() { return $this->hasMany(Client::class); }

    public function scopeActive($query) { return $query->where('is_active', true); }
}

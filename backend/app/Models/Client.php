<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Traits\BelongsToTenant;

class Client extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, LogsActivity, Notifiable;

    protected $fillable = [
        'shop_id', 'user_id', 'full_name', 'phone', 'email',
        'city', 'address', 'id_type', 'notes',
        // tenant_id géré par BelongsToTenant, JAMAIS dans fillable
        // id_number et id_photo_path JAMAIS dans fillable (données sensibles)
    ];

    protected $hidden = ['id_number', 'id_photo_path']; // ne jamais exposer via API
    protected $appends = ['name'];

    protected $casts = ['created_at' => 'datetime'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->dontSubmitEmptyLogs();
    }

    public function sales() { return $this->hasMany(Sale::class); }
    public function shop()  { return $this->belongsTo(Shop::class); }
    public function user()  { return $this->belongsTo(User::class); }

    public function scopeActive($query) { return $query->whereNull('deleted_at'); }

    public function getNameAttribute(): string { return $this->full_name; }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('full_name', 'like', "%{$term}%")
              ->orWhere('phone', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%");
        });
    }
}

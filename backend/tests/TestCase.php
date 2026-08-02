<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Contracts\Auth\Authenticatable;

abstract class TestCase extends BaseTestCase
{
    public function actingAs(Authenticatable $user, $guard = null): static
    {
        if ($user instanceof User && $user->tenant_id) {
            app()->instance('current_tenant_id', $user->tenant_id);
        }
        return parent::actingAs($user, $guard);
    }
}

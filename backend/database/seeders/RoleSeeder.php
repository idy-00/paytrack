<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles/permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Tenants
            'tenants.manage',
            // Users
            'users.view', 'users.create', 'users.update', 'users.delete',
            // Clients
            'clients.view', 'clients.create', 'clients.update', 'clients.delete',
            // Sales
            'sales.view', 'sales.create', 'sales.update', 'sales.delete',
            // Payments
            'payments.record', 'payments.view',
            // Reports
            'reports.view', 'reports.export',
            // Settings
            'settings.manage',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $roles = [
            'super_admin' => $permissions, // all
            'admin_entreprise' => [
                'users.view', 'users.create', 'users.update',
                'clients.view', 'clients.create', 'clients.update', 'clients.delete',
                'sales.view', 'sales.create', 'sales.update', 'sales.delete',
                'payments.record', 'payments.view',
                'reports.view', 'reports.export',
                'settings.manage',
            ],
            'responsable_boutique' => [
                'clients.view', 'clients.create', 'clients.update',
                'sales.view', 'sales.create', 'sales.update',
                'payments.record', 'payments.view',
                'reports.view',
            ],
            'vendeur' => [
                'clients.view', 'clients.create',
                'sales.view', 'sales.create',
                'payments.record', 'payments.view',
            ],
            'client' => [
                'sales.view',
                'payments.view',
            ],
        ];

        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Client;
use App\Models\Shop;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles first
        $this->call(RoleSeeder::class);

        // Demo tenant
        $tenant = Tenant::create([
            'name' => 'Phone Shop Dakar',
            'slug' => 'phoneshop-dakar',
            'email' => 'contact@phoneshop-dakar.sn',
            'phone' => '+221 77 123 45 67',
            'city' => 'Dakar',
            'country' => 'SN',
            'is_active' => true,
        ]);

        // Demo shop
        $shop = Shop::create([
            'tenant_id' => $tenant->id,
            'name' => 'Boutique Centre-Ville',
            'address' => '12 Avenue Léopold Sédar Senghor',
            'city' => 'Dakar',
            'phone' => '+221 77 123 45 67',
            'is_active' => true,
        ]);

        // Demo users
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'name' => 'Moussa Diallo',
            'email' => 'moussa@phoneshop-dakar.com',
            'phone' => '+221 77 123 45 67',
            'password' => Hash::make('demo1234'),
            'is_active' => true,
        ]);
        $admin->assignRole('admin_entreprise');

        $vendeur = User::create([
            'tenant_id' => $tenant->id,
            'shop_id' => $shop->id,
            'name' => 'Fatou Sow',
            'email' => 'fatou@phoneshop-dakar.com',
            'phone' => '+221 78 234 56 78',
            'password' => Hash::make('demo1234'),
            'is_active' => true,
        ]);
        $vendeur->assignRole('vendeur');

        // Demo articles
        $articles = [
            ['name' => 'iPhone 15 Pro Max 256Go', 'category' => 'Téléphone', 'price' => 850000, 'stock' => 5],
            ['name' => 'Samsung Galaxy S24 Ultra', 'category' => 'Téléphone', 'price' => 720000, 'stock' => 8],
            ['name' => 'Laptop HP Victus 15', 'category' => 'Informatique', 'price' => 550000, 'stock' => 3],
            ['name' => 'Tablette iPad Air 5', 'category' => 'Tablette', 'price' => 480000, 'stock' => 6],
            ['name' => 'AirPods Pro 2ème Gen', 'category' => 'Accessoire', 'price' => 185000, 'stock' => 12],
        ];

        foreach ($articles as $data) {
            Article::create([
                'tenant_id' => $tenant->id,
                ...$data,
                'is_active' => true,
            ]);
        }

        // Demo clients
        $clients = [
            ['full_name' => 'Aminata Ndiaye', 'phone' => '+221 77 234 56 78', 'email' => 'aminata@gmail.com', 'city' => 'Dakar'],
            ['full_name' => 'Ibrahima Fall', 'phone' => '+221 76 890 12 34', 'city' => 'Thiès'],
            ['full_name' => 'Fatou Sarr', 'phone' => '+221 78 456 78 90', 'email' => 'fatou.sarr@outlook.fr', 'city' => 'Dakar'],
            ['full_name' => 'Cheikh Mbaye', 'phone' => '+221 70 123 45 67', 'city' => 'Saint-Louis'],
            ['full_name' => 'Rokhaya Diop', 'phone' => '+221 77 567 89 01', 'email' => 'rokhaya.diop@gmail.com', 'city' => 'Dakar'],
        ];

        foreach ($clients as $data) {
            Client::create([
                'tenant_id' => $tenant->id,
                'shop_id' => $shop->id,
                ...$data,
            ]);
        }

        // Client user (linked to client Aminata)
        $clientUser = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Aminata Ndiaye',
            'email' => 'aminata@gmail.com',
            'phone' => '+221 77 234 56 78',
            'password' => Hash::make('demo1234'),
            'is_active' => true,
        ]);
        $clientUser->assignRole('client');
    }
}

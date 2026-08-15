<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\Sale;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin_entreprise')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $tenantId = $user->tenant_id;

        $totalRevenue = Sale::where('tenant_id', $tenantId)
            ->where('status', 'solde')
            ->sum('total_amount');

        $activeSales = Sale::where('tenant_id', $tenantId)
            ->where('status', 'en_cours')
            ->count();

        $overdueSales = Sale::where('tenant_id', $tenantId)
            ->where('status', 'retard')
            ->count();

        $totalEncaisse = Payment::whereHas('sale', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId);
        })->sum('amount');

        $shopsCount = Shop::where('tenant_id', $tenantId)->count();
        $usersCount = User::where('tenant_id', $tenantId)->count();

        return response()->json([
            'totalRevenue' => (int) $totalRevenue,
            'totalEncaisse' => (int) $totalEncaisse,
            'activeSales' => (int) $activeSales,
            'overdueSales' => (int) $overdueSales,
            'shopsCount' => (int) $shopsCount,
            'usersCount' => (int) $usersCount,
        ]);
    }

    public function reports(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin_entreprise')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $tenantId = $user->tenant_id;
        $period = $request->query('period', 'month');

        $startDate = match($period) {
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $salesByShop = Shop::where('tenant_id', $tenantId)
            ->withCount(['sales as active_sales_count' => function ($q) {
                $q->where('status', 'en_cours');
            }])
            ->withCount(['sales as overdue_sales_count' => function ($q) {
                $q->where('status', 'retard');
            }])
            ->withSum(['sales as total_revenue' => function ($q) use ($startDate) {
                $q->where('created_at', '>=', $startDate);
            }], 'total_amount')
            ->get();

        $monthlySales = Sale::where('tenant_id', $tenantId)
            ->where('created_at', '>=', now()->subMonths(12))
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total_amount) as total, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $paymentMethods = Payment::whereHas('sale', fn($q) => $q->where('tenant_id', $tenantId))
            ->where('created_at', '>=', $startDate)
            ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'salesByShop' => $salesByShop,
            'monthlySales' => $monthlySales,
            'paymentMethods' => $paymentMethods,
            'period' => $period,
        ]);
    }

    public function activity(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin_entreprise')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $tenantId = $user->tenant_id;

        $recentSales = Sale::where('tenant_id', $tenantId)
            ->with(['client:id,full_name', 'article:id,name', 'shop:id,name'])
            ->latest()
            ->take(10)
            ->get(['id', 'reference', 'total_amount', 'status', 'client_id', 'article_id', 'shop_id', 'created_at']);

        $recentPayments = Payment::whereHas('sale', fn($q) => $q->where('tenant_id', $tenantId))
            ->with(['sale:id,reference,client_id', 'sale.client:id,full_name'])
            ->latest()
            ->take(10)
            ->get(['id', 'sale_id', 'amount', 'payment_method', 'payment_date']);

        return response()->json([
            'recentSales' => $recentSales,
            'recentPayments' => $recentPayments,
        ]);
    }

    public function getSettings(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin_entreprise')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json([
            'company_name' => config('app.name'),
            'currency' => 'XOF',
            'late_payment_days' => 3,
            'sms_enabled' => false,
            'email_enabled' => false,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('admin_entreprise')) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['message' => 'Paramètres mis à jour']);
    }
}

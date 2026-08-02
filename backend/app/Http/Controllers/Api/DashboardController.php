<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\AuditLog;
use App\Models\SaleSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $stats = Sale::where('tenant_id', $tenantId)
            ->selectRaw('
                SUM(paid_amount) as total_encaisse,
                SUM(remaining_amount) as total_restant,
                COUNT(CASE WHEN status IN ("actif", "retard") THEN 1 END) as ventes_actives,
                COUNT(CASE WHEN status = "retard" THEN 1 END) as ventes_en_retard,
                COUNT(CASE WHEN status = "solde" THEN 1 END) as ventes_soldees
            ')->first();

        $driver = DB::getDriverName();
        $dateFormat = $driver === 'sqlite'
            ? "strftime('%Y-%m', payments.payment_date)"
            : "DATE_FORMAT(payments.payment_date, '%Y-%m')";

        $monthly = DB::table('payments')
            ->join('sales', 'payments.sale_id', '=', 'sales.id')
            ->where('sales.tenant_id', $tenantId)
            ->whereNull('sales.deleted_at')
            ->whereBetween('payments.payment_date', [
                now()->subMonths(5)->startOfMonth(),
                now()->endOfMonth(),
            ])
            ->selectRaw("{$dateFormat} as month, SUM(payments.amount) as encaisse")
            ->groupByRaw($dateFormat)
            ->orderBy('month')
            ->get();

        return response()->json([
            ...(array) $stats,
            'monthly_data' => $monthly,
        ]);
    }

    public function recentActivity(Request $request): JsonResponse
    {
        $activity = AuditLog::forTenant($request->user()->tenant_id)
            ->recent(20)
            ->get();

        return response()->json($activity);
    }

    public function upcomingSchedules(Request $request): JsonResponse
    {
        $schedules = SaleSchedule::with('sale.client')
            ->upcoming(7)
            ->orderBy('due_date')
            ->get();

        return response()->json($schedules);
    }
}

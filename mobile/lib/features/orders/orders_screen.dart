import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

final ordersProvider = StateNotifierProvider<OrdersNotifier, OrdersState>(
    (ref) => OrdersNotifier());

class OrdersState {
  final List<dynamic> orders;
  final bool loading;
  final String? error;
  OrdersState({this.orders = const [], this.loading = false, this.error});
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  OrdersNotifier() : super(OrdersState());

  Future<void> fetchOrders({String? status}) async {
    state = OrdersState(orders: state.orders, loading: true);
    try {
      final res = await ApiService.getOrders(status: status);
      state = OrdersState(orders: res['data'] ?? []);
    } catch (e) {
      state = OrdersState(orders: [], error: e.toString());
    }
  }

  Future<void> updateStatus(int orderId, String newStatus) async {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (e) {
      state = OrdersState(orders: state.orders, error: e.toString());
    }
  }
}

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  String _filter = '';

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(ordersProvider.notifier).fetchOrders());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Retour',
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/dashboard');
            }
          },
        ),
        title: Text('Commandes',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => context.push('/commandes/nouvelle'),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.fromLTRB(16, 6, 16, 0),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.blue,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .16),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.local_shipping_outlined,
                      color: Colors.white),
                ),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Flux des commandes',
                            style: GoogleFonts.sourceSans3(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                        const SizedBox(height: 3),
                        Text(
                            '${state.orders.length} commande${state.orders.length > 1 ? 's' : ''} à suivre aujourd’hui',
                            style: GoogleFonts.sourceSans3(
                                fontSize: 12,
                                color: Colors.white.withValues(alpha: .76))),
                      ]),
                ),
                Semantics(
                  button: true,
                  label: 'Créer une commande',
                  child: GestureDetector(
                    onTap: () => context.push('/commandes/nouvelle'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 9, vertical: 6),
                      decoration: BoxDecoration(
                          color: AppColors.green,
                          borderRadius: BorderRadius.circular(99)),
                      child: const Icon(Icons.add_rounded,
                          color: Colors.white, size: 17),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Filters
          Container(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Toutes', ''),
                  _buildFilterChip('En attente', 'pending'),
                  _buildFilterChip('Confirmées', 'confirmed'),
                  _buildFilterChip('Livrées', 'delivered'),
                ],
              ),
            ),
          ),
          // List
          Expanded(
            child: state.loading
                ? const Center(child: CircularProgressIndicator())
                : state.orders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.shopping_cart_outlined,
                                size: 64, color: AppColors.muted),
                            const SizedBox(height: 16),
                            Text('Aucune commande',
                                style: GoogleFonts.sourceSans3(
                                    color: AppColors.sub)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => ref
                            .read(ordersProvider.notifier)
                            .fetchOrders(
                                status: _filter.isEmpty ? null : _filter),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: state.orders.length,
                          itemBuilder: (_, i) =>
                              _buildOrderCard(state.orders[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final selected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) {
          setState(() => _filter = value);
          ref
              .read(ordersProvider.notifier)
              .fetchOrders(status: value.isEmpty ? null : value);
        },
        backgroundColor: AppColors.surface,
        selectedColor: AppColors.greenLight,
        labelStyle: GoogleFonts.sourceSans3(
          color: selected ? AppColors.greenDeep : AppColors.sub,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
        ),
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status'] ?? 'pending';
    final statusConfig = _getStatusConfig(status);

    return GestureDetector(
      onTap: () => context.push('/commandes/${order['id']}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border:
              Border.all(color: statusConfig['color'].withValues(alpha: .22)),
          boxShadow: AppColors.cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                    width: 4,
                    height: 34,
                    margin: const EdgeInsets.only(right: 11),
                    decoration: BoxDecoration(
                        color: statusConfig['color'],
                        borderRadius: BorderRadius.circular(99))),
                Expanded(
                  child: Text(
                    order['reference'] ?? 'N/A',
                    style: GoogleFonts.sourceSans3(
                        fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusConfig['color'].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    statusConfig['label'],
                    style: GoogleFonts.sourceSans3(
                      color: statusConfig['color'],
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              order['client']?['full_name'] ?? 'Client inconnu',
              style:
                  GoogleFonts.sourceSans3(color: AppColors.ink, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  formatAmount(order['total_amount'] ?? 0),
                  style: GoogleFonts.sourceSans3(
                      fontWeight: FontWeight.w700, color: AppColors.blue),
                ),
                const Spacer(),
                if (status == 'pending')
                  TextButton(
                    onPressed: () => ref
                        .read(ordersProvider.notifier)
                        .updateStatus(order['id'], 'confirmed'),
                    child: Text('Confirmer',
                        style: GoogleFonts.sourceSans3(fontSize: 12)),
                  ),
                if (status == 'ready')
                  TextButton(
                    onPressed: () => ref
                        .read(ordersProvider.notifier)
                        .updateStatus(order['id'], 'delivered'),
                    child: Text('Livrer',
                        style: GoogleFonts.sourceSans3(fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status) {
      case 'pending':
        return {'label': 'En attente', 'color': Colors.grey};
      case 'confirmed':
        return {'label': 'Confirmée', 'color': AppColors.blue};
      case 'preparing':
        return {'label': 'Préparation', 'color': Colors.orange};
      case 'ready':
        return {'label': 'Prête', 'color': Colors.purple};
      case 'delivered':
        return {'label': 'Livrée', 'color': AppColors.success};
      case 'cancelled':
        return {'label': 'Annulée', 'color': Colors.red};
      default:
        return {'label': status, 'color': Colors.grey};
    }
  }
}

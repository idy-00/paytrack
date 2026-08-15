import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';
import '../../data/models/sale.dart';

class SalesState {
  final List<Sale> sales;
  final bool isLoading;
  final String? error;

  const SalesState({
    this.sales = const [],
    this.isLoading = false,
    this.error,
  });
}

class SalesNotifier extends StateNotifier<SalesState> {
  SalesNotifier() : super(const SalesState());

  Future<void> fetchSales({String? status, String? search}) async {
    state = SalesState(sales: state.sales, isLoading: true);

    try {
      final response = await ApiService.getSales(status: status, search: search);
      final data = response['data'] as List<dynamic>? ?? response as List<dynamic>? ?? [];
      final sales = data.map((json) => Sale.fromJson(json)).toList();
      state = SalesState(sales: sales, isLoading: false);
    } on ApiException catch (e) {
      state = SalesState(sales: state.sales, isLoading: false, error: e.message);
    } catch (e) {
      state = SalesState(sales: state.sales, isLoading: false, error: 'Erreur: $e');
    }
  }

  Future<Sale?> getSale(int id) async {
    try {
      final json = await ApiService.getSale(id);
      return Sale.fromJson(json);
    } catch (e) {
      return null;
    }
  }

  Future<void> recordPayment(int saleId, int amount, String method) async {
    try {
      await ApiService.createPayment(saleId, {
        'amount': amount,
        'payment_date': DateTime.now().toIso8601String().split('T')[0],
        'payment_method': method,
        'payment_type': 'tranche',
      });
      await fetchSales();
    } on ApiException catch (e) {
      state = SalesState(sales: state.sales, error: e.message);
      rethrow;
    }
  }
}

final salesProvider = StateNotifierProvider<SalesNotifier, SalesState>(
  (ref) => SalesNotifier(),
);

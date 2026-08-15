import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';

class PaymentEntry {
  final int id;
  final String receipt;
  final String clientName;
  final int amount;
  final String paidDate;
  final String mode;

  const PaymentEntry({
    required this.id,
    required this.receipt,
    required this.clientName,
    required this.amount,
    required this.paidDate,
    required this.mode,
  });

  factory PaymentEntry.fromJson(Map<String, dynamic> json) {
    // Map payment_method to display name
    final methodMap = {
      'especes': 'Espèces',
      'wave': 'Wave',
      'orange_money': 'Orange',
      'free_money': 'Free',
      'virement': 'Virement',
      'cheque': 'Chèque',
    };
    final rawMethod = json['payment_method'] ?? 'especes';

    return PaymentEntry(
      id: json['id'] ?? 0,
      receipt: json['receipt_number'] ?? 'RC-${json['id']}',
      clientName: json['sale']?['client']?['full_name'] ?? json['sale']?['client']?['name'] ?? '',
      amount: json['amount'] ?? 0,
      paidDate: json['payment_date'] ?? json['created_at'] ?? '',
      mode: methodMap[rawMethod] ?? rawMethod,
    );
  }
}

class PaymentsState {
  final List<PaymentEntry> payments;
  final int totalAmount;
  final int thisMonthAmount;
  final bool isLoading;
  final String? error;

  const PaymentsState({
    this.payments = const [],
    this.totalAmount = 0,
    this.thisMonthAmount = 0,
    this.isLoading = true,
    this.error,
  });

  PaymentsState copyWith({
    List<PaymentEntry>? payments,
    int? totalAmount,
    int? thisMonthAmount,
    bool? isLoading,
    String? error,
  }) {
    return PaymentsState(
      payments: payments ?? this.payments,
      totalAmount: totalAmount ?? this.totalAmount,
      thisMonthAmount: thisMonthAmount ?? this.thisMonthAmount,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

final paymentsProvider = StateNotifierProvider<PaymentsNotifier, PaymentsState>((ref) {
  return PaymentsNotifier();
});

class PaymentsNotifier extends StateNotifier<PaymentsState> {
  PaymentsNotifier() : super(const PaymentsState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await ApiService.get('/payments');
      final list = (data['data'] as List).map((e) => PaymentEntry.fromJson(e)).toList();

      final now = DateTime.now();
      int total = 0;
      int thisMois = 0;

      for (final p in list) {
        total += p.amount;
        final d = DateTime.tryParse(p.paidDate);
        if (d != null && d.year == now.year && d.month == now.month) {
          thisMois += p.amount;
        }
      }

      state = PaymentsState(
        payments: list,
        totalAmount: total,
        thisMonthAmount: thisMois,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refresh() => load();
}

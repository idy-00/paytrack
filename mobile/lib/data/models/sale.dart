enum SaleStatus { actif, retard, litige, solde, annule, enAttente }

SaleStatus saleStatusFromString(String s) {
  switch (s) {
    case 'actif':
      return SaleStatus.actif;
    case 'retard':
      return SaleStatus.retard;
    case 'litige':
      return SaleStatus.litige;
    case 'solde':
      return SaleStatus.solde;
    case 'annule':
      return SaleStatus.annule;
    default:
      return SaleStatus.enAttente;
  }
}

class SaleScheduleItem {
  final int num;
  final String dueDate;
  final int amount;
  final SaleStatus status;
  final String? paidDate;

  const SaleScheduleItem({
    required this.num,
    required this.dueDate,
    required this.amount,
    required this.status,
    this.paidDate,
  });

  factory SaleScheduleItem.fromJson(Map<String, dynamic> j) =>
      SaleScheduleItem(
        num: j['num'] as int,
        dueDate: j['due_date'] as String,
        amount: j['amount'] as int,
        status: saleStatusFromString(j['status'] as String),
        paidDate: j['paid_date'] as String?,
      );
}

class Sale {
  final int id;
  final String reference;
  final String qrUuid;
  final String clientName;
  final String clientCity;
  final String? clientPhone;
  final String articleName;
  final int totalAmount;
  final int downPayment;
  final int paidAmount;
  final int remainingAmount;
  final int installmentCount;
  final int installmentAmount;
  final String frequency;
  final String startDate;
  final String endDate;
  final SaleStatus status;
  final List<SaleScheduleItem> schedule;

  const Sale({
    required this.id,
    required this.reference,
    required this.qrUuid,
    required this.clientName,
    required this.clientCity,
    this.clientPhone,
    required this.articleName,
    required this.totalAmount,
    required this.downPayment,
    required this.paidAmount,
    required this.remainingAmount,
    required this.installmentCount,
    required this.installmentAmount,
    required this.frequency,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.schedule,
  });

  int get progressPercent {
    if (totalAmount == 0) return 0;
    return ((paidAmount / totalAmount) * 100).round().clamp(0, 100);
  }

  SaleScheduleItem? get nextDueSchedule {
    try {
      return schedule.firstWhere(
        (s) =>
            s.status == SaleStatus.enAttente ||
            s.status == SaleStatus.retard,
      );
    } catch (_) {
      return null;
    }
  }

  factory Sale.fromJson(Map<String, dynamic> j) => Sale(
        id: j['id'] as int,
        reference: j['reference'] as String,
        qrUuid: j['qr_uuid'] as String,
        clientName:
            (j['client'] as Map?)?['name'] as String? ??
                j['client_name'] as String? ??
                '',
        clientCity: (j['client'] as Map?)?['city'] as String? ?? '',
        clientPhone: (j['client'] as Map?)?['phone'] as String?,
        articleName: j['article_name'] as String? ?? '',
        totalAmount: j['total_amount'] as int,
        downPayment: j['down_payment'] as int? ?? 0,
        paidAmount: j['paid_amount'] as int,
        remainingAmount: j['remaining_amount'] as int,
        installmentCount: j['installment_count'] as int,
        installmentAmount: j['installment_amount'] as int,
        frequency: j['frequency'] as String? ?? 'mensuel',
        startDate: j['start_date'] as String,
        endDate: j['end_date'] as String,
        status: saleStatusFromString(j['status'] as String),
        schedule: (j['schedule'] as List<dynamic>? ?? [])
            .map((s) =>
                SaleScheduleItem.fromJson(s as Map<String, dynamic>))
            .toList(),
      );
}

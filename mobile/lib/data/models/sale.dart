import '../../core/utils/json_parsers.dart';

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

  factory SaleScheduleItem.fromJson(Map<String, dynamic> j) => SaleScheduleItem(
        num: jsonInt(j['installment_number'] ?? j['num']),
        dueDate: jsonString(j['due_date']),
        amount: jsonInt(j['amount']),
        status: saleStatusFromString(
            jsonString(j['status'], fallback: 'en_attente')),
        paidDate: j['paid_date'] == null ? null : jsonString(j['paid_date']),
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
            s.status == SaleStatus.enAttente || s.status == SaleStatus.retard,
      );
    } catch (_) {
      return null;
    }
  }

  factory Sale.fromJson(Map<String, dynamic> j) => Sale(
        id: jsonInt(j['id']),
        reference: jsonString(j['reference'], fallback: '—'),
        qrUuid: jsonString(j['qr_uuid']),
        clientName:
            jsonString(jsonMap(j['client'])['name'] ?? j['client_name']),
        clientCity: jsonString(jsonMap(j['client'])['city']),
        clientPhone: jsonMap(j['client'])['phone'] == null
            ? null
            : jsonString(jsonMap(j['client'])['phone']),
        articleName:
            jsonString(j['article_name'] ?? jsonMap(j['article'])['name']),
        totalAmount: jsonInt(j['total_amount']),
        downPayment: jsonInt(j['down_payment']),
        paidAmount: jsonInt(j['paid_amount']),
        remainingAmount: jsonInt(j['remaining_amount']),
        installmentCount: jsonInt(j['installment_count']),
        installmentAmount: jsonInt(j['installment_amount']),
        frequency: jsonString(j['frequency'], fallback: 'mensuel'),
        startDate: jsonString(j['start_date']),
        endDate: jsonString(j['end_date']),
        status: saleStatusFromString(
            jsonString(j['status'], fallback: 'en_attente')),
        schedule: jsonList(j['schedules'] ?? j['schedule'])
            .map((s) => SaleScheduleItem.fromJson(jsonMap(s)))
            .toList(),
      );
}

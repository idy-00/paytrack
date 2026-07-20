import 'package:intl/intl.dart';

String formatAmount(int amount) {
  final formatter = NumberFormat('#,##0', 'fr_FR');
  return '${formatter.format(amount)} FCFA';
}

String formatDate(String? dateStr) {
  if (dateStr == null) return '—';
  try {
    final date = DateTime.parse(dateStr);
    return DateFormat('dd MMM yyyy', 'fr_FR').format(date);
  } catch (_) {
    return dateStr;
  }
}

int getProgressPercent(int paid, int total) {
  if (total == 0) return 0;
  return ((paid / total) * 100).round().clamp(0, 100);
}

String maskName(String name) {
  return name.split(' ').map((part) {
    if (part.length <= 2) return part;
    return '${part[0]}${'•' * (part.length - 1)}';
  }).join(' ');
}

/// Distributes an amount over installments without ever exceeding [total].
///
/// Any indivisible remainder is added one FCFA at a time to the first
/// installments. This keeps the last installment predictable and guarantees
/// that the generated amounts sum exactly to the outstanding balance.
List<int> distributeInstallments(int total, int count) {
  if (total <= 0 || count <= 0) return const [];

  final base = total ~/ count;
  final remainder = total % count;
  return List<int>.generate(
    count,
    (index) => base + (index < remainder ? 1 : 0),
    growable: false,
  );
}

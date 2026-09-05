import 'package:flutter_test/flutter_test.dart';
import 'package:paytrack_mobile/core/utils/schedule_calculator.dart';

void main() {
  group('distributeInstallments', () {
    test('never exceeds the outstanding balance when division is uneven', () {
      final installments = distributeInstallments(1000, 3);

      expect(installments, [334, 333, 333]);
      expect(installments.reduce((a, b) => a + b), 1000);
      expect(installments.last, lessThanOrEqualTo(installments.first));
    });

    test('supports more installments than FCFA without inventing money', () {
      final installments = distributeInstallments(3, 5);

      expect(installments, [1, 1, 1, 0, 0]);
      expect(installments.reduce((a, b) => a + b), 3);
    });

    test('returns an empty schedule for invalid inputs', () {
      expect(distributeInstallments(0, 3), isEmpty);
      expect(distributeInstallments(1000, 0), isEmpty);
      expect(distributeInstallments(-50, 2), isEmpty);
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:paytrack_mobile/core/utils/json_parsers.dart';
import 'package:paytrack_mobile/data/models/client.dart';
import 'package:paytrack_mobile/data/models/sale.dart';
import 'package:paytrack_mobile/features/dashboard/dashboard_provider.dart';
import 'package:paytrack_mobile/features/payments/payments_provider.dart';

void main() {
  group('normalisation des réponses API', () {
    test('convertit les montants chaîne, entier et décimal', () {
      expect(jsonInt('12500'), 12500);
      expect(jsonInt(12500.4), 12500);
      expect(jsonInt(null), 0);
      expect(jsonInt('invalide'), 0);
    });

    test('les statistiques supportent les types JSON hétérogènes', () {
      final stats = DashboardStats.fromJson({
        'total_encaisse': '322500',
        'total_restant': 577500.0,
        'ventes_actives': '2',
        'ventes_en_retard': null,
        'ventes_soldees': 3,
      });
      expect(stats.totalEncaisse, 322500);
      expect(stats.totalRestant, 577500);
      expect(stats.ventesActives, 2);
      expect(stats.ventesEnRetard, 0);
    });

    test('une vente incomplète reste affichable sans crash', () {
      final sale = Sale.fromJson({
        'id': '7',
        'reference': 2026007,
        'total_amount': '100000',
        'paid_amount': 25000.0,
        'remaining_amount': '75000',
        'installment_count': '4',
        'installment_amount': '25000',
        'status': null,
        'schedules': [
          {'installment_number': '1', 'amount': '25000', 'status': 'actif'}
        ],
      });
      expect(sale.id, 7);
      expect(sale.totalAmount, 100000);
      expect(sale.schedule.single.amount, 25000);
    });

    test('client et paiement tolèrent les champs optionnels', () {
      final client = Client.fromJson({'id': '9', 'name': 42});
      final payment = PaymentEntry.fromJson({
        'id': '4',
        'amount': '15000',
        'sale': {
          'client': {'name': 'Awa'}
        }
      });
      expect(client.id, 9);
      expect(client.name, '42');
      expect(payment.amount, 15000);
      expect(payment.clientName, 'Awa');
    });
  });
}

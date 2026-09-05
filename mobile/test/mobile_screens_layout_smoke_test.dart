import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:paytrack_mobile/core/theme/app_theme.dart';
import 'package:paytrack_mobile/features/auth/auth_provider.dart';
import 'package:paytrack_mobile/features/auth/login_screen.dart';
import 'package:paytrack_mobile/features/auth/register_screen.dart';
import 'package:paytrack_mobile/features/clients/clients_screen.dart';
import 'package:paytrack_mobile/features/dashboard/client_dashboard_screen.dart';
import 'package:paytrack_mobile/features/inventory/inventory_screen.dart';
import 'package:paytrack_mobile/features/orders/new_order_screen.dart';
import 'package:paytrack_mobile/features/orders/order_detail_screen.dart';
import 'package:paytrack_mobile/features/orders/orders_screen.dart';
import 'package:paytrack_mobile/features/payments/payments_screen.dart';
import 'package:paytrack_mobile/features/profile/profile_screen.dart';
import 'package:paytrack_mobile/features/sales/new_sale_screen.dart';
import 'package:paytrack_mobile/features/sales/sale_detail_screen.dart';
import 'package:paytrack_mobile/features/sales/sales_list_screen.dart';
import 'package:paytrack_mobile/features/stock/stock_screen.dart';
import 'package:paytrack_mobile/features/subscription/subscription_screen.dart';
import 'package:paytrack_mobile/features/suppliers/supplier_orders_screen.dart';
import 'package:paytrack_mobile/features/suppliers/suppliers_screen.dart';
import 'package:paytrack_mobile/features/wallet/wallet_screen.dart';

class _AuthenticatedUser extends AuthNotifier {
  _AuthenticatedUser() {
    state = const AuthState(
      user: AuthUser(
        id: 1,
        name: 'Moussa Ndiaye',
        email: 'moussa@example.test',
        role: 'vendeur',
        shop: 'Boutique Moussa',
      ),
    );
  }
}

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

  final screens = <String, Widget>{
    'connexion': const LoginScreen(),
    'inscription': const RegisterScreen(),
    'espace client': const ClientDashboardScreen(),
    'clients': const ClientsScreen(),
    'ventes': const SalesListScreen(),
    'nouvelle vente': const NewSaleScreen(),
    'détail vente': const SaleDetailScreen(saleId: 1),
    'commandes': const OrdersScreen(),
    'nouvelle commande': const NewOrderScreen(),
    'détail commande': const OrderDetailScreen(orderId: 1),
    'paiements': const PaymentsScreen(),
    'stock': const StockScreen(),
    'inventaires': const InventoryScreen(),
    'fournisseurs': const SuppliersScreen(),
    'commandes fournisseurs': const SupplierOrdersScreen(),
    'portefeuille': const WalletScreen(),
    'profil': const ProfileScreen(),
    'abonnement': const SubscriptionScreen(),
  };

  for (final entry in screens.entries) {
    testWidgets('${entry.key} construit son état mobile sans erreur', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1;
      tester.view.platformDispatcher.textScaleFactorTestValue = 1.15;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      addTearDown(tester.view.platformDispatcher.clearTextScaleFactorTestValue);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [authProvider.overrideWith((ref) => _AuthenticatedUser())],
          child: MaterialApp(theme: AppTheme.light, home: entry.value),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));

      // Toute exception de rendu non consommée fait échouer le test avec le
      // composant et la ligne exacts, ce qui garde le diagnostic exploitable.
    });
  }
}

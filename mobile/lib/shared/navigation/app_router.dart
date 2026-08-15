import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/clients/clients_screen.dart';
import '../../features/dashboard/client_dashboard_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/payments/payments_screen.dart';
import '../../features/qr_scan/qr_scan_screen.dart';
import '../../features/sales/sale_detail_screen.dart';
import '../../features/sales/sales_list_screen.dart';
import '../../features/orders/orders_screen.dart';
import '../../features/orders/order_detail_screen.dart';
import '../../features/subscription/subscription_screen.dart';
import '../../features/wallet/wallet_screen.dart';
import '../../features/suppliers/suppliers_screen.dart';
import '../../features/suppliers/supplier_orders_screen.dart';
import '../../features/inventory/inventory_screen.dart';
import '../../features/payments/payment_webview_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/legal/legal_screen.dart';
import '../../features/stock/stock_screen.dart';
import '../../features/sales/new_sale_screen.dart';
import '../../features/orders/new_order_screen.dart';

// Notifier qui expose l'état d'auth à GoRouter sans trigger de rebuild
// GoRouter écoute via refreshListenable — la navigation se fait APRÈS le login
// sans reconstruire la page de login pendant la saisie
class _AuthNotifierWrapper extends ChangeNotifier {
  _AuthNotifierWrapper(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
    // Check existing token at startup
    Future.microtask(() => _ref.read(authProvider.notifier).checkAuth());
  }
  final Ref _ref;
  AuthState get auth => _ref.read(authProvider);
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = _AuthNotifierWrapper(ref);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: notifier,
    redirect: (context, state) {
      final auth = notifier.auth;

      // Pendant le chargement — ne pas rediriger
      if (auth.isLoading) return null;

      final loggedIn  = auth.isLoggedIn;
      final location  = state.matchedLocation;
      final onLogin   = location == '/login';
      final onRegister = location == '/register';

      // Non connecté → login (sauf si déjà dessus ou sur register)
      if (!loggedIn && !onLogin && !onRegister) return '/login';

      // Connecté et sur login → rediriger vers le bon dashboard
      if (loggedIn && onLogin) {
        return auth.user?.role == 'client' ? '/client-dashboard' : '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login',            builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register',         builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/dashboard',        builder: (_, __) => const DashboardScreen()),
      GoRoute(path: '/client-dashboard', builder: (_, __) => const ClientDashboardScreen()),
      GoRoute(path: '/ventes',           builder: (_, __) => const SalesListScreen()),
      GoRoute(
        path: '/ventes/:id',
        builder: (_, s) => SaleDetailScreen(
          saleId: int.parse(s.pathParameters['id']!),
        ),
      ),
      GoRoute(path: '/clients',   builder: (_, __) => const ClientsScreen()),
      GoRoute(path: '/paiements', builder: (_, __) => const PaymentsScreen()),
      GoRoute(path: '/qr-scan',   builder: (_, __) => const QRScanScreen()),
      GoRoute(path: '/commandes', builder: (_, __) => const OrdersScreen()),
      GoRoute(path: '/commandes/:id', builder: (_, s) => OrderDetailScreen(orderId: int.parse(s.pathParameters['id']!))),
      GoRoute(path: '/abonnement', builder: (_, __) => const SubscriptionScreen()),
      GoRoute(path: '/portefeuille', builder: (_, __) => const WalletScreen()),
      GoRoute(path: '/fournisseurs', builder: (_, __) => const SuppliersScreen()),
      GoRoute(path: '/commandes-fournisseurs', builder: (_, __) => const SupplierOrdersScreen()),
      GoRoute(path: '/inventaires', builder: (_, __) => const InventoryScreen()),
      GoRoute(path: '/stock', builder: (_, __) => const StockScreen()),
      GoRoute(path: '/profil', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/mentions-legales', builder: (_, __) => const MentionsLegalesScreen()),
      GoRoute(path: '/cgu', builder: (_, __) => const CGUScreen()),
      GoRoute(path: '/confidentialite', builder: (_, __) => const ConfidentialiteScreen()),
      GoRoute(path: '/ventes/nouvelle', builder: (_, __) => const NewSaleScreen()),
      GoRoute(path: '/commandes/nouvelle', builder: (_, __) => const NewOrderScreen()),
      GoRoute(
        path: '/paiement-web',
        builder: (_, state) {
          final extra = state.extra as Map<String, dynamic>;
          return PaymentWebViewScreen(
            paymentUrl: extra['paymentUrl'],
            successUrl: extra['successUrl'],
            cancelUrl: extra['cancelUrl'],
            title: extra['title'],
          );
        },
      ),
    ],
    errorBuilder: (_, s) => Scaffold(
      body: Center(child: Text('Page introuvable : ${s.uri}')),
    ),
  );
});

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/auth/login_screen.dart';
import '../../features/clients/clients_screen.dart';
import '../../features/dashboard/client_dashboard_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/payments/payments_screen.dart';
import '../../features/qr_scan/qr_scan_screen.dart';
import '../../features/sales/sale_detail_screen.dart';
import '../../features/sales/sales_list_screen.dart';

// Notifier qui expose l'état d'auth à GoRouter sans trigger de rebuild
// GoRouter écoute via refreshListenable — la navigation se fait APRÈS le login
// sans reconstruire la page de login pendant la saisie
class _AuthNotifierWrapper extends ChangeNotifier {
  _AuthNotifierWrapper(this._ref) {
    _ref.listen<AuthState>(authProvider, (_, __) => notifyListeners());
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

      // Non connecté → login (sauf si déjà dessus)
      if (!loggedIn && !onLogin) return '/login';

      // Connecté et sur login → rediriger vers le bon dashboard
      if (loggedIn && onLogin) {
        return auth.user?.role == 'client' ? '/client-dashboard' : '/dashboard';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login',            builder: (_, __) => const LoginScreen()),
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
    ],
    errorBuilder: (_, s) => Scaffold(
      body: Center(child: Text('Page introuvable : ${s.uri}')),
    ),
  );
});

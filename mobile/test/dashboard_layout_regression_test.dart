import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:paytrack_mobile/core/theme/app_theme.dart';
import 'package:paytrack_mobile/features/auth/auth_provider.dart';
import 'package:paytrack_mobile/features/dashboard/dashboard_provider.dart';
import 'package:paytrack_mobile/features/dashboard/dashboard_screen.dart';
import 'package:paytrack_mobile/features/sales/sales_provider.dart';

class _DashboardFixture extends DashboardNotifier {
  _DashboardFixture() {
    state = const DashboardState(
      stats: DashboardStats(
        totalEncaisse: 322500,
        totalRestant: 577500,
        ventesActives: 2,
        ventesEnRetard: 0,
        ventesSoldees: 0,
      ),
    );
  }

  @override
  Future<void> fetchDashboard() async {}
}

class _SalesFixture extends SalesNotifier {
  @override
  Future<void> fetchSales({String? status, String? search}) async {}
}

class _AuthFixture extends AuthNotifier {
  _AuthFixture() {
    state = const AuthState(
      user: AuthUser(
        id: 1,
        name: 'Moussa Ndiaye',
        email: 'moussa@example.test',
        role: 'vendeur',
      ),
    );
  }
}

void main() {
  setUpAll(() async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await initializeDateFormatting('fr_FR');
  });

  for (final size in <Size>[
    const Size(320, 640),
    const Size(360, 800),
    const Size(393, 852),
    const Size(540, 960),
  ]) {
    testWidgets('le tableau de bord reste compact sur ${size.width.toInt()} px',
        (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authProvider.overrideWith((ref) => _AuthFixture()),
            dashboardProvider.overrideWith((ref) => _DashboardFixture()),
            salesProvider.overrideWith((ref) => _SalesFixture()),
          ],
          child: MaterialApp(
            theme: AppTheme.light,
            locale: const Locale('fr', 'FR'),
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [Locale('fr', 'FR')],
            home: const DashboardScreen(),
          ),
        ),
      );
      await tester.pump();

      expect(tester.takeException(), isNull);
      final hero = find.byKey(const ValueKey('dashboard-treasury-card'));
      expect(hero, findsOneWidget);
      expect(tester.getSize(hero).height, lessThan(300));
      expect(find.text('À sécuriser'), findsOneWidget);
      expect(find.text('Progression'), findsOneWidget);
    });
  }
}

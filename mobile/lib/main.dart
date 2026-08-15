import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'shared/navigation/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const ProviderScope(child: PayTrackApp()));
}

/// Initialize services after app is running (safer)
Future<void> _initializeServices() async {
  try {
    await NotificationService.initialize();
  } catch (e) {
    debugPrint('Notification init failed: $e');
  }
}

class PayTrackApp extends ConsumerStatefulWidget {
  const PayTrackApp({super.key});

  @override
  ConsumerState<PayTrackApp> createState() => _PayTrackAppState();
}

class _PayTrackAppState extends ConsumerState<PayTrackApp> {
  @override
  void initState() {
    super.initState();
    // Initialize notifications after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeServices();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'PayTrack',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      locale: const Locale('fr', 'FR'),
      supportedLocales: const [
        Locale('fr', 'FR'),
        Locale('en', 'US'),
      ],
    );
  }
}

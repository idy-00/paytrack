import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'permission_service.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static bool _initialized = false;

  /// Initialize notification service
  static Future<void> initialize({bool requestPermission = false}) async {
    if (_initialized) return;

    // Permission is requested only after an explicit action in the settings
    // screen. Asking at cold launch makes the first experience feel broken.
    if (requestPermission) await PermissionService.requestNotificationPermission();

    // Android settings
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _initialized = true;
  }

  /// Handle notification tap
  static void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap - navigate to relevant screen
    // Navigation is delegated to the app router. Never log notification
    // payloads: they can contain identifiers or payment metadata.
    response.payload;
  }

  /// Show a local notification
  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'paytrack_channel',
      'PayTrack Notifications',
      channelDescription: 'Notifications pour rappels de paiement',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(id, title, body, details, payload: payload);
  }

  /// Show payment reminder notification
  static Future<void> showPaymentReminder({
    required String clientName,
    required String amount,
    required String dueDate,
    required int saleId,
  }) async {
    await showNotification(
      id: saleId,
      title: 'Rappel de paiement',
      body: '$clientName - $amount FCFA prévu le $dueDate',
      payload: 'sale:$saleId',
    );
  }

  /// Show payment received notification
  static Future<void> showPaymentReceived({
    required String amount,
    required String clientName,
    required int paymentId,
  }) async {
    await showNotification(
      id: paymentId,
      title: 'Paiement reçu ✓',
      body: '$amount FCFA reçu de $clientName',
      payload: 'payment:$paymentId',
    );
  }
}

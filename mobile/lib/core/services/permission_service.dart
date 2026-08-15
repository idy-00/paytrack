import 'dart:io';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  /// Request notification permission (required for Android 13+)
  static Future<bool> requestNotificationPermission() async {
    if (Platform.isAndroid) {
      final status = await Permission.notification.status;

      if (status.isGranted) {
        return true;
      }

      if (status.isDenied) {
        final result = await Permission.notification.request();
        return result.isGranted;
      }

      if (status.isPermanentlyDenied) {
        // User permanently denied, open settings
        await openAppSettings();
        return false;
      }
    }

    // iOS handles this differently via Firebase
    return true;
  }

  /// Request camera permission (for QR scanning)
  static Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.status;

    if (status.isGranted) {
      return true;
    }

    if (status.isDenied) {
      final result = await Permission.camera.request();
      return result.isGranted;
    }

    if (status.isPermanentlyDenied) {
      await openAppSettings();
      return false;
    }

    return false;
  }

  /// Request all permissions at app startup
  static Future<Map<String, bool>> requestAllPermissions() async {
    final results = <String, bool>{};

    results['notification'] = await requestNotificationPermission();
    results['camera'] = await requestCameraPermission();

    return results;
  }

  /// Show permission rationale dialog
  static Future<bool> showPermissionDialog(
    BuildContext context, {
    required String title,
    required String message,
    required String permissionName,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Plus tard'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Autoriser'),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  /// Check if notification permission is granted
  static Future<bool> hasNotificationPermission() async {
    if (Platform.isAndroid) {
      return await Permission.notification.isGranted;
    }
    return true;
  }

  /// Check if camera permission is granted
  static Future<bool> hasCameraPermission() async {
    return await Permission.camera.isGranted;
  }
}

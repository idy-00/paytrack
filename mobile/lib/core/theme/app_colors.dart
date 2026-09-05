import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Fond & surfaces ──────────────────────────────────────────────────────
  static const Color background = Color(0xFFF5F6F8);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDim = Color(0xFFF1F4F8);
  static const Color elevated = Color(0xFFFFFFFF);

  // ── Bleu PayTrack (charte graphique officielle) ───────────────────────────
  static const Color blue = Color(0xFF3768AF);
  static const Color blueVibrant = Color(0xFF4A7BC4);
  static const Color blueLight = Color(0xFFEAF1FA);
  static const Color blueMid = Color(0xFFB8D0EC);
  static const Color blueDark = Color(0xFF2D5A9E);

  // ── Vert PayTrack (charte graphique officielle) ──────────────────────────
  static const Color green = Color(0xFF44AC45);
  static const Color greenDeep = Color(0xFF267B3D);
  static const Color greenLight = Color(0xFFE8F5E8);
  static const Color greenMid = Color(0xFFA8D8A9);
  static const Color greenGlow = Color(0xFFCFF2D7);

  // ── Texte ────────────────────────────────────────────────────────────────
  static const Color ink = Color(0xFF10243E);
  static const Color sub = Color(0xFF53657B);
  static const Color muted = Color(0xFF9CA8B7);
  static const Color hint = Color(0xFFB8C1CC);

  // ── Bordures & séparateurs ───────────────────────────────────────────────
  static const Color border = Color(0xFFDCE3EC);
  static const Color borderSoft = Color(0xFFEDF1F6);

  // ── Statuts ──────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF44AC45);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerLight = Color(0xFFFEE2E2);

  // ── Surfaces de marque, volontairement sans dégradés ────────────────────
  static const Color hero = Color(0xFF10243E);
  static const Color greenSurface = Color(0xFF44AC45);
  static const Color darkSurface = Color(0xFF10243E);

  // ── Ombres riches ────────────────────────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: const Color(0xFF3768AF).withValues(alpha: 0.04),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.03),
          blurRadius: 6,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: const Color(0xFF3768AF).withValues(alpha: 0.08),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.04),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get heroShadow => [
        BoxShadow(
          color: const Color(0xFF3768AF).withValues(alpha: 0.30),
          blurRadius: 32,
          offset: const Offset(0, 12),
        ),
      ];

  // ── Alias compat (ancien gold → nouveau green) ───────────────────────────
  static const Color gold = green;
  static const Color goldLight = greenLight;
  static const Color goldMid = greenMid;
  static const Color goldGradient = greenSurface;

  static const Color brandPrimary = blue;
  static const Color brandAccent = green;
  static const Color textPrimary = ink;
  static const Color textSecondary = sub;
  static const Color textMuted = muted;
  static const Color borderColor = border;
  static const Color surfaceBase = background;
  static const Color surfaceCard = surface;
  static const Color sapphColor = blue;
  static const Color sahelColor = warning;
  static const Color savanaColor = success;
  static const Color bordeauxColor = danger;
}

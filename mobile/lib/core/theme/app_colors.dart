import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Fond & surfaces ──────────────────────────────────────────────────────
  static const Color background = Color(0xFFF5F3EE);
  static const Color surface    = Color(0xFFFFFFFF);
  static const Color surfaceDim = Color(0xFFF0EDE7);
  static const Color elevated   = Color(0xFFFFFFFF);

  // ── Bleu primaire — plus profond, plus luxe ──────────────────────────────
  static const Color blue       = Color(0xFF0F52BA);
  static const Color blueVibrant= Color(0xFF2563EB);
  static const Color blueLight  = Color(0xFFEBF2FF);
  static const Color blueMid    = Color(0xFFBFD7FF);
  static const Color blueDark   = Color(0xFF0A3B8A);

  // ── Accent doré/ambre — signature PayTrack ───────────────────────────────
  static const Color gold       = Color(0xFFD4A017);
  static const Color goldLight  = Color(0xFFFFF8E7);
  static const Color goldMid    = Color(0xFFFFE4A0);

  // ── Texte ────────────────────────────────────────────────────────────────
  static const Color ink        = Color(0xFF0F1419);
  static const Color sub        = Color(0xFF5B6578);
  static const Color muted      = Color(0xFF9CA8B7);
  static const Color hint       = Color(0xFFB8C1CC);

  // ── Bordures & séparateurs ───────────────────────────────────────────────
  static const Color border     = Color(0xFFE4DFD7);
  static const Color borderSoft = Color(0xFFF0EBE3);

  // ── Statuts ──────────────────────────────────────────────────────────────
  static const Color success    = Color(0xFF059669);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color warning    = Color(0xFFD97706);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color danger     = Color(0xFFDC2626);
  static const Color dangerLight = Color(0xFFFEE2E2);

  // ── Gradients ────────────────────────────────────────────────────────────
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F52BA), Color(0xFF1A6FE8), Color(0xFF2E7CF6)],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFD4A017), Color(0xFFF0C040)],
  );

  static const LinearGradient darkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0F1419), Color(0xFF1C2A3A)],
  );

  // ── Ombres riches ────────────────────────────────────────────────────────
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: const Color(0xFF0F52BA).withValues(alpha: 0.04),
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
      color: const Color(0xFF0F52BA).withValues(alpha: 0.08),
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
      color: const Color(0xFF0F52BA).withValues(alpha: 0.30),
      blurRadius: 32,
      offset: const Offset(0, 12),
    ),
  ];

  // ── Alias compat ─────────────────────────────────────────────────────────
  static const Color brandPrimary  = blue;
  static const Color brandAccent   = gold;
  static const Color textPrimary   = ink;
  static const Color textSecondary = sub;
  static const Color textMuted     = muted;
  static const Color borderColor   = border;
  static const Color surfaceBase   = background;
  static const Color surfaceCard   = surface;
  static const Color sapphColor    = blue;
  static const Color sahelColor    = warning;
  static const Color savanaColor   = success;
  static const Color bordeauxColor = danger;
}

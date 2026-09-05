import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        primary: AppColors.green,
        secondary: AppColors.blue,
        error: AppColors.danger,
        surface: AppColors.surface,
        onSurface: AppColors.ink,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
      ),
      textTheme: GoogleFonts.sourceSans3TextTheme(base.textTheme).copyWith(
        displayLarge: GoogleFonts.sourceSans3(
          fontSize: 48,
          fontWeight: FontWeight.w800,
          color: AppColors.ink,
          letterSpacing: -1.5,
        ),
        displayMedium: GoogleFonts.sourceSans3(
          fontSize: 36,
          fontWeight: FontWeight.w800,
          color: AppColors.ink,
          letterSpacing: -1.0,
        ),
        headlineLarge: GoogleFonts.sourceSans3(
          fontSize: 28,
          fontWeight: FontWeight.w800,
          color: AppColors.ink,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.sourceSans3(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
          letterSpacing: -0.3,
        ),
        headlineSmall: GoogleFonts.sourceSans3(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
        titleLarge: GoogleFonts.sourceSans3(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
        titleMedium: GoogleFonts.sourceSans3(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
        titleSmall: GoogleFonts.sourceSans3(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
        bodyLarge: GoogleFonts.sourceSans3(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: AppColors.ink,
          height: 1.6,
        ),
        bodyMedium: GoogleFonts.sourceSans3(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: AppColors.sub,
        ),
        bodySmall: GoogleFonts.sourceSans3(
          fontSize: 11,
          fontWeight: FontWeight.w400,
          color: AppColors.sub,
        ),
        labelLarge: GoogleFonts.sourceSans3(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.ink,
        ),
        labelMedium: GoogleFonts.sourceSans3(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.sub,
        ),
        labelSmall: GoogleFonts.sourceSans3(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: AppColors.muted,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        titleTextStyle: GoogleFonts.sourceSans3(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.borderSoft),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.green,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: GoogleFonts.sourceSans3(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.greenDeep,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: const BorderSide(color: AppColors.border, width: 1.5),
          textStyle: GoogleFonts.sourceSans3(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          elevation: 0,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 15,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.green, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        hintStyle: GoogleFonts.sourceSans3(
          color: AppColors.hint,
          fontSize: 14,
        ),
        labelStyle: GoogleFonts.sourceSans3(
          color: AppColors.sub,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        floatingLabelStyle: GoogleFonts.sourceSans3(
          color: AppColors.greenDeep,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        errorStyle: GoogleFonts.sourceSans3(
          color: AppColors.danger,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.green,
        foregroundColor: Colors.white,
        elevation: 2,
        focusElevation: 3,
        hoverElevation: 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.green,
        linearTrackColor: AppColors.greenLight,
        circularTrackColor: AppColors.greenLight,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.ink,
        contentTextStyle: GoogleFonts.sourceSans3(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        behavior: SnackBarBehavior.floating,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        modalBackgroundColor: AppColors.surface,
        modalBarrierColor: Color(0x9910243E),
        showDragHandle: true,
        dragHandleColor: AppColors.border,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
        titleTextStyle: GoogleFonts.sourceSans3(
          color: AppColors.ink,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        contentTextStyle: GoogleFonts.sourceSans3(
          color: AppColors.sub,
          fontSize: 14,
          height: 1.45,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.blueLight,
        selectedColor: AppColors.greenLight,
        side: const BorderSide(color: AppColors.borderSoft),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        labelStyle: GoogleFonts.sourceSans3(
          color: AppColors.ink,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.greenDeep,
        unselectedItemColor: AppColors.muted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: GoogleFonts.sourceSans3(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.sourceSans3(fontSize: 10),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderSoft,
        thickness: 1,
        space: 1,
      ),
    );
  }
}

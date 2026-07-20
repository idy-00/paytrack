import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/models/sale.dart';
import '../../core/theme/app_colors.dart';

class PayTrackProgressBar extends StatelessWidget {
  final int percent;
  final SaleStatus status;
  final bool showLabel;
  final double height;

  const PayTrackProgressBar({
    super.key,
    required this.percent,
    required this.status,
    this.showLabel = false,
    this.height = 6,
  });

  Color get _color {
    switch (status) {
      case SaleStatus.solde:
        return AppColors.success;
      case SaleStatus.actif:
        return AppColors.blue;
      case SaleStatus.retard:
        return AppColors.warning;
      case SaleStatus.litige:
        return AppColors.danger;
      case SaleStatus.enAttente:
        return AppColors.muted;
      case SaleStatus.annule:
        return AppColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: height,
            decoration: BoxDecoration(
              color: AppColors.surfaceDim,
              borderRadius: BorderRadius.circular(height / 2),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: (percent / 100).clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _color,
                      _color.withValues(alpha: 0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(height / 2),
                  boxShadow: [
                    BoxShadow(
                      color: _color.withValues(alpha: 0.3),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (showLabel) ...[
          const SizedBox(width: 10),
          Text(
            '$percent%',
            style: GoogleFonts.spaceGrotesk(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: _color,
              fontFeatures: [const FontFeature.tabularFigures()],
            ),
          ),
        ],
      ],
    );
  }
}

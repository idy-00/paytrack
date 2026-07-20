import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/models/sale.dart';

class StatusBadge extends StatelessWidget {
  final SaleStatus status;
  final bool compact;
  const StatusBadge({super.key, required this.status, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig();
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: config.bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: config.dot.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 5 : 6,
            height: compact ? 5 : 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: config.dot,
              boxShadow: [
                BoxShadow(
                  color: config.dot.withValues(alpha: 0.4),
                  blurRadius: 4,
                ),
              ],
            ),
          ),
          SizedBox(width: compact ? 4 : 6),
          Text(
            config.label,
            style: GoogleFonts.inter(
              fontSize: compact ? 10 : 11,
              fontWeight: FontWeight.w600,
              color: config.text,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  _StatusConfig _getConfig() {
    switch (status) {
      case SaleStatus.actif:
        return const _StatusConfig(
          bg: Color(0xFFEBF2FF),
          text: Color(0xFF1E40AF),
          dot: Color(0xFF2563EB),
          label: 'Actif',
        );
      case SaleStatus.retard:
        return const _StatusConfig(
          bg: Color(0xFFFEF3C7),
          text: Color(0xFF92400E),
          dot: Color(0xFFD97706),
          label: 'Retard',
        );
      case SaleStatus.solde:
        return const _StatusConfig(
          bg: Color(0xFFD1FAE5),
          text: Color(0xFF065F46),
          dot: Color(0xFF059669),
          label: 'Soldé',
        );
      case SaleStatus.litige:
        return const _StatusConfig(
          bg: Color(0xFFFEE2E2),
          text: Color(0xFF991B1B),
          dot: Color(0xFFDC2626),
          label: 'Litige',
        );
      case SaleStatus.annule:
        return const _StatusConfig(
          bg: Color(0xFFF3F4F6),
          text: Color(0xFF4B5563),
          dot: Color(0xFF9CA3AF),
          label: 'Annulé',
        );
      case SaleStatus.enAttente:
        return const _StatusConfig(
          bg: Color(0xFFF3F4F6),
          text: Color(0xFF4B5563),
          dot: Color(0xFF6B7280),
          label: 'En attente',
        );
    }
  }
}

class _StatusConfig {
  final Color bg;
  final Color text;
  final Color dot;
  final String label;
  const _StatusConfig({
    required this.bg,
    required this.text,
    required this.dot,
    required this.label,
  });
}

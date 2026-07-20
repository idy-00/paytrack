import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/mock/mock_data.dart';
import '../../data/models/sale.dart';

class _PaymentEntry {
  final String receipt;
  final String clientName;
  final int amount;
  final String paidDate;
  final String mode;

  const _PaymentEntry({
    required this.receipt,
    required this.clientName,
    required this.amount,
    required this.paidDate,
    required this.mode,
  });
}

List<_PaymentEntry> _buildPayments() {
  final entries = <_PaymentEntry>[];
  const modes = ['Wave', 'Orange Money', 'Wave', 'Orange Money', 'Wave',
      'Orange Money', 'Wave', 'Wave', 'Orange Money'];
  int idx = 0;

  for (final sale in mockSales) {
    for (final item in sale.schedule) {
      if (item.status == SaleStatus.solde && item.paidDate != null) {
        entries.add(_PaymentEntry(
          receipt: '${sale.reference} · T${item.num}',
          clientName: sale.clientName,
          amount: item.amount,
          paidDate: item.paidDate!,
          mode: modes[idx % modes.length],
        ));
        idx++;
      }
    }
  }

  entries.sort((a, b) => b.paidDate.compareTo(a.paidDate));
  return entries;
}

class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final payments = _buildPayments();
    final totalEncaisse = payments.fold(0, (sum, p) => sum + p.amount);
    final now = DateTime.now();
    final thisMois = payments
        .where((p) {
          final d = DateTime.tryParse(p.paidDate);
          if (d == null) return false;
          return d.year == now.year && d.month == now.month;
        })
        .fold(0, (sum, p) => sum + p.amount);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Header ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Text(
                  'Paiements',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ),

            // ── KPI Cards ──────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _buildKpiCard(
                      label: 'Total encaissé',
                      value: formatAmount(totalEncaisse),
                      icon: Icons.trending_up_rounded,
                      gradient: AppColors.heroGradient,
                      isLight: true,
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _buildKpiCard(
                      label: 'Ce mois',
                      value: formatAmount(thisMois),
                      icon: Icons.calendar_today_rounded,
                      gradient: AppColors.goldGradient,
                      isLight: true,
                    )),
                  ],
                ),
              ),
            ),

            // ── Count ──────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Historique',
                      style: GoogleFonts.spaceGrotesk(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${payments.length} entrées',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.sub,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── List ───────────────────────────────────────────────────
            payments.isEmpty
                ? SliverFillRemaining(child: _buildEmpty())
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => _buildPaymentCard(payments[i]),
                        childCount: payments.length,
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String label,
    required String value,
    required IconData icon,
    required LinearGradient gradient,
    required bool isLight,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: gradient.colors.first.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 16, color: Colors.white),
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFeatures: [const FontFeature.tabularFigures()],
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard(_PaymentEntry payment) {
    final isWave = payment.mode == 'Wave';
    final modeColor = isWave ? const Color(0xFF0094E1) : const Color(0xFFE85D04);
    final modeBg = isWave
        ? const Color(0xFFE0F5FF)
        : const Color(0xFFFFF3E0);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSoft),
        boxShadow: AppColors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.successLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              size: 20,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment.receipt,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    fontFeatures: [const FontFeature.tabularFigures()],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  payment.clientName,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.sub,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatAmount(payment.amount),
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.success,
                  fontFeatures: [const FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    formatDate(payment.paidDate),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: AppColors.muted,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: modeBg,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: modeColor.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Text(
                      payment.mode,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: modeColor,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.surfaceDim,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.account_balance_wallet_outlined,
              size: 40,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Aucun paiement enregistré',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: AppColors.sub,
            ),
          ),
        ],
      ),
    );
  }
}

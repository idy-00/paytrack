import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/mock/mock_data.dart';
import '../../data/models/sale.dart';
import '../../shared/widgets/status_badge.dart';

class SaleDetailScreen extends StatefulWidget {
  final int saleId;
  const SaleDetailScreen({super.key, required this.saleId});

  @override
  State<SaleDetailScreen> createState() => _SaleDetailScreenState();
}

class _SaleDetailScreenState extends State<SaleDetailScreen> {
  final _amountCtrl = TextEditingController();
  String _paymentMode = 'especes';

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Sale? get _sale {
    try {
      return mockSales.firstWhere((s) => s.id == widget.saleId);
    } catch (_) {
      return null;
    }
  }

  void _showQrSheet(Sale sale) {
    final qrUrl = 'https://paytrack.app/ventes/${sale.qrUuid}';
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'QR Code',
              style: GoogleFonts.spaceGrotesk(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              sale.reference,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 12,
                color: AppColors.sub,
                fontFeatures: [const FontFeature.tabularFigures()],
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.borderSoft),
                borderRadius: BorderRadius.circular(20),
                boxShadow: AppColors.cardShadow,
              ),
              child: QrImageView(
                data: qrUrl,
                version: QrVersions.auto,
                size: 200,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: AppColors.ink,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: AppColors.ink,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              sale.clientName,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showPaymentSheet(Sale sale) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => StatefulBuilder(
        builder: (context, setSheetState) {
          final enteredAmount = int.tryParse(_amountCtrl.text) ?? 0;
          final reste = sale.remainingAmount - enteredAmount;
          return Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Enregistrer un paiement',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${sale.clientName} — ${sale.articleName}',
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.sub),
                ),
                const SizedBox(height: 24),
                Text(
                  'Montant',
                  style: GoogleFonts.inter(
                    fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (_) => setSheetState(() {}),
                  style: GoogleFonts.spaceGrotesk(fontSize: 18, color: AppColors.ink, fontWeight: FontWeight.w600),
                  cursorColor: AppColors.blue,
                  decoration: InputDecoration(
                    hintText: '0',
                    hintStyle: GoogleFonts.spaceGrotesk(fontSize: 18, color: AppColors.hint),
                    suffixText: 'FCFA',
                    suffixStyle: GoogleFonts.inter(color: AppColors.sub, fontSize: 13),
                    filled: true,
                    fillColor: AppColors.surfaceDim,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: AppColors.blue, width: 1.5),
                    ),
                  ),
                ),
                if (enteredAmount > 0) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Reste après : ${formatAmount(reste.clamp(0, sale.remainingAmount))}',
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 12,
                      color: reste <= 0 ? AppColors.success : AppColors.warning,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                Text(
                  'Mode de paiement',
                  style: GoogleFonts.inter(
                    fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: _paymentMode,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.surfaceDim,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  dropdownColor: Colors.white,
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.ink),
                  items: const [
                    DropdownMenuItem(value: 'especes', child: Text('Espèces')),
                    DropdownMenuItem(value: 'wave', child: Text('Wave')),
                    DropdownMenuItem(value: 'orange_money', child: Text('Orange Money')),
                    DropdownMenuItem(value: 'virement', child: Text('Virement bancaire')),
                  ],
                  onChanged: (v) {
                    if (v != null) setSheetState(() => _paymentMode = v);
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: AppColors.heroGradient,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.blue.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () {
                        final amount = int.tryParse(_amountCtrl.text) ?? 0;
                        if (amount <= 0 || amount > sale.remainingAmount) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Montant invalide', style: GoogleFonts.inter(color: Colors.white)),
                              backgroundColor: AppColors.danger,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          );
                          return;
                        }
                        Navigator.pop(context);
                        _amountCtrl.clear();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Paiement enregistré (mode démo)',
                              style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w500),
                            ),
                            backgroundColor: AppColors.success,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      },
                      child: Text(
                        'Confirmer le paiement',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sale = _sale;
    if (sale == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Text('Vente introuvable', style: GoogleFonts.inter(color: AppColors.sub)),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: AppColors.heroGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.blue.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          onPressed: () => _showPaymentSheet(sale),
          icon: const Icon(Icons.add_rounded, size: 18),
          label: Text(
            'Paiement',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Hero header ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.heroGradient,
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () => context.go('/ventes'),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.arrow_back_rounded, size: 18, color: Colors.white),
                            ),
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: () => _showQrSheet(sale),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.qr_code_rounded, size: 18, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        sale.reference,
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.6),
                          fontFeatures: [const FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        formatAmount(sale.totalAmount),
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 36,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          letterSpacing: -1.0,
                          fontFeatures: [const FontFeature.tabularFigures()],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        sale.articleName,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Progress
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: sale.progressPercent / 100.0,
                          backgroundColor: Colors.white.withValues(alpha: 0.2),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                          minHeight: 6,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${sale.progressPercent}% remboursé',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.7),
                            ),
                          ),
                          StatusBadge(status: sale.status, compact: true),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Content ────────────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Stats row
                Row(
                  children: [
                    _buildStatChip('Payé', formatAmount(sale.paidAmount), AppColors.success),
                    const SizedBox(width: 8),
                    _buildStatChip('Restant', formatAmount(sale.remainingAmount), AppColors.warning),
                    const SizedBox(width: 8),
                    _buildStatChip('Tranches', '${sale.installmentCount}×', AppColors.blue),
                  ],
                ),
                const SizedBox(height: 24),

                // Client section
                _buildSectionTitle('Client'),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.borderSoft),
                    boxShadow: AppColors.cardShadow,
                  ),
                  child: Column(
                    children: [
                      _buildInfoRow(Icons.person_outline_rounded, sale.clientName),
                      if (sale.clientPhone != null) ...[
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Container(height: 1, color: AppColors.borderSoft),
                        ),
                        _buildInfoRow(Icons.phone_outlined, sale.clientPhone!),
                      ],
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Container(height: 1, color: AppColors.borderSoft),
                      ),
                      _buildInfoRow(Icons.location_on_outlined, sale.clientCity),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Schedule section
                _buildSectionTitle('Échéancier · ${sale.installmentCount} tranches'),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.borderSoft),
                    boxShadow: AppColors.cardShadow,
                  ),
                  child: Column(
                    children: sale.schedule.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final isLast = index == sale.schedule.length - 1;
                      return Column(
                        children: [
                          _buildScheduleItem(item),
                          if (!isLast) Container(
                            height: 1,
                            margin: const EdgeInsets.only(left: 56),
                            color: AppColors.borderSoft,
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ),

                const SizedBox(height: 100),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.12)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(fontSize: 10, color: AppColors.sub),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
                fontFeatures: [const FontFeature.tabularFigures()],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 18,
          decoration: BoxDecoration(
            color: AppColors.blue,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: GoogleFonts.spaceGrotesk(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.surfaceDim,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: AppColors.sub),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.ink),
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleItem(SaleScheduleItem item) {
    IconData icon;
    Color iconColor;

    switch (item.status) {
      case SaleStatus.solde:
        icon = Icons.check_circle_rounded;
        iconColor = AppColors.success;
        break;
      case SaleStatus.retard:
        icon = Icons.warning_amber_rounded;
        iconColor = AppColors.warning;
        break;
      case SaleStatus.litige:
        icon = Icons.cancel_rounded;
        iconColor = AppColors.danger;
        break;
      default:
        icon = Icons.radio_button_unchecked_rounded;
        iconColor = AppColors.muted;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: iconColor),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tranche ${item.num}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.paidDate != null
                      ? 'Payé le ${formatDate(item.paidDate)}'
                      : 'Échéance : ${formatDate(item.dueDate)}',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.sub),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatAmount(item.amount),
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                  fontFeatures: [const FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 2),
              StatusBadge(status: item.status, compact: true),
            ],
          ),
        ],
      ),
    );
  }
}

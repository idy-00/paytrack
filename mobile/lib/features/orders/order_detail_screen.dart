import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  final int orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  Map<String, dynamic>? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    try {
      final res = await ApiService.getOrder(widget.orderId);
      setState(() {
        _order = res;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }

  Future<void> _updateStatus(String status) async {
    try {
      await ApiService.updateOrderStatus(widget.orderId, status);
      _loadOrder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Statut mis à jour')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }

  Future<void> _recordPayment() async {
    final amountController = TextEditingController(text: '${_order?['remaining_amount'] ?? 0}');
    String method = 'especes';

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Enregistrer un paiement', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Montant (FCFA)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: method,
                decoration: InputDecoration(
                  labelText: 'Mode de paiement',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: const [
                  DropdownMenuItem(value: 'especes', child: Text('Espèces')),
                  DropdownMenuItem(value: 'wave', child: Text('Wave')),
                  DropdownMenuItem(value: 'orange_money', child: Text('Orange Money')),
                ],
                onChanged: (v) => method = v ?? 'especes',
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    try {
                      await ApiService.recordOrderPayment(widget.orderId, {
                        'amount': int.parse(amountController.text),
                        'payment_method': method,
                      });
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Enregistrer', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (result == true) _loadOrder();
  }

  Future<void> _payOnline() async {
    final remaining = _order?['remaining_amount'] ?? 0;
    if (remaining < 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Montant minimum: 100 FCFA')),
      );
      return;
    }

    // Amount selection
    final amountController = TextEditingController(text: '$remaining');
    final amount = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Paiement en ligne', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Via Wave, Orange Money, Free Money ou carte bancaire', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Montant (FCFA)',
                  helperText: 'Reste à payer: ${formatAmount(remaining)}',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    final val = int.tryParse(amountController.text) ?? 0;
                    if (val < 100) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Minimum 100 FCFA')));
                      return;
                    }
                    Navigator.pop(ctx, val);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Continuer', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (amount == null || !mounted) return;

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final baseUrl = 'https://lightsalmon-eel-638395.hostingersite.com';
      final result = await ApiService.initiateOrderPayment(widget.orderId, {
        'amount': amount,
        'success_url': '$baseUrl/payment/success',
        'cancel_url': '$baseUrl/payment/cancel',
      });

      if (!mounted) return;
      Navigator.pop(context); // Close loading

      final paymentUrl = result['payment_url'];
      if (paymentUrl == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erreur: URL de paiement non reçue')),
        );
        return;
      }

      // Open WebView
      final paymentResult = await context.push<Map<String, dynamic>>(
        '/paiement-web',
        extra: {
          'paymentUrl': paymentUrl,
          'successUrl': '$baseUrl/payment/success',
          'cancelUrl': '$baseUrl/payment/cancel',
          'title': 'Payer ${formatAmount(amount)}',
        },
      );

      if (paymentResult?['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Paiement effectué avec succès!'), backgroundColor: Colors.green),
        );
        _loadOrder();
      } else if (paymentResult != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(paymentResult['message'] ?? 'Paiement annulé')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Commande'), backgroundColor: AppColors.surface),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_order == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Commande'), backgroundColor: AppColors.surface),
        body: const Center(child: Text('Commande non trouvée')),
      );
    }

    final status = _order!['status'] ?? 'pending';
    final remaining = _order!['remaining_amount'] ?? 0;
    final total = _order!['total_amount'] ?? 0;
    final paid = total - remaining;
    final progress = total > 0 ? paid / total : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_order!['reference'] ?? 'Commande', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrder,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppColors.heroGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _buildStatusBadge(status),
                        const Spacer(),
                        Text(
                          _order!['client']?['full_name'] ?? '',
                          style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('Total', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                    Text(formatAmount(total), style: GoogleFonts.spaceGrotesk(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.white24,
                        valueColor: const AlwaysStoppedAnimation(Colors.white),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Payé: ${formatAmount(paid)}', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                        Text('Reste: ${formatAmount(remaining)}', style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Articles
              Text('Articles', style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              ...(_order!['items'] as List? ?? []).map((item) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderSoft),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['article_name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                          Text('${item['quantity']} x ${formatAmount(item['unit_price'] ?? 0)}', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 12)),
                        ],
                      ),
                    ),
                    Text(formatAmount(item['total_price'] ?? 0), style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
                  ],
                ),
              )),

              const SizedBox(height: 20),

              // Payments
              if ((_order!['payments'] as List?)?.isNotEmpty == true) ...[
                Text('Paiements', style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                ...(_order!['payments'] as List).map((p) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppColors.success, size: 20),
                      const SizedBox(width: 8),
                      Expanded(child: Text(p['payment_method'] ?? '', style: GoogleFonts.inter(fontSize: 13))),
                      Text(formatAmount(p['amount'] ?? 0), style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700, color: AppColors.success)),
                    ],
                  ),
                )),
                const SizedBox(height: 20),
              ],

              // Actions
              if (remaining > 0) ...[
                // Online payment button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _payOnline,
                    icon: const Icon(Icons.credit_card, color: Colors.white),
                    label: Text('Payer en ligne (Wave, OM...)', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.blue,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Manual payment button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _recordPayment,
                    icon: const Icon(Icons.money),
                    label: Text('Paiement manuel (espèces)', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 12),

              if (status == 'pending')
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _updateStatus('cancelled'),
                        style: OutlinedButton.styleFrom(foregroundColor: Colors.red, padding: const EdgeInsets.symmetric(vertical: 12)),
                        child: const Text('Annuler'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _updateStatus('confirmed'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, padding: const EdgeInsets.symmetric(vertical: 12)),
                        child: Text('Confirmer', style: GoogleFonts.inter(color: Colors.white)),
                      ),
                    ),
                  ],
                ),

              if (status == 'confirmed')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _updateStatus('preparing'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text('Démarrer préparation', style: GoogleFonts.inter(color: Colors.white)),
                  ),
                ),

              if (status == 'preparing')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _updateStatus('ready'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.purple, padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text('Marquer prête', style: GoogleFonts.inter(color: Colors.white)),
                  ),
                ),

              if (status == 'ready')
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _updateStatus('delivered'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text('Confirmer livraison', style: GoogleFonts.inter(color: Colors.white)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final config = {
      'pending': {'label': 'En attente', 'color': Colors.grey},
      'confirmed': {'label': 'Confirmée', 'color': AppColors.blue},
      'preparing': {'label': 'Préparation', 'color': Colors.orange},
      'ready': {'label': 'Prête', 'color': Colors.purple},
      'delivered': {'label': 'Livrée', 'color': AppColors.success},
      'cancelled': {'label': 'Annulée', 'color': Colors.red},
    };
    final c = config[status] ?? config['pending']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Text(c['label'] as String, style: GoogleFonts.inter(color: c['color'] as Color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

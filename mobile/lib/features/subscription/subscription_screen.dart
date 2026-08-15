import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  List<dynamic> _plans = [];
  Map<String, dynamic>? _subscription;
  bool _loading = true;
  bool _yearly = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final plans = await ApiService.getPlans();
      final sub = await ApiService.getSubscription();
      setState(() {
        _plans = plans;
        _subscription = sub['subscription'];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _changePlan(int planId) async {
    try {
      await ApiService.changePlan(planId, _yearly ? 'yearly' : 'monthly');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plan modifié')));
      _loadData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Abonnement', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Current subscription
                    if (_subscription != null) _buildCurrentPlan(),

                    const SizedBox(height: 24),

                    // Billing toggle
                    Center(
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderSoft),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildToggle('Mensuel', !_yearly, () => setState(() => _yearly = false)),
                            _buildToggle('Annuel -17%', _yearly, () => setState(() => _yearly = true)),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Plans
                    ..._plans.map((plan) => _buildPlanCard(plan)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildCurrentPlan() {
    final plan = _subscription!['plan'];
    final status = _subscription!['status'];
    final endsAt = _subscription!['ends_at'];
    final isTrial = status == 'trial';
    final isExpired = status == 'expired' || status == 'suspended';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isExpired ? Colors.red.shade50 : isTrial ? Colors.amber.shade50 : Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isExpired ? Colors.red.shade200 : isTrial ? Colors.amber.shade200 : Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(
            isExpired ? Icons.warning_amber : isTrial ? Icons.hourglass_bottom : Icons.check_circle,
            color: isExpired ? Colors.red : isTrial ? Colors.amber.shade700 : Colors.green,
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isExpired ? 'Abonnement expiré' : isTrial ? 'Période d\'essai' : 'Plan ${plan?['name'] ?? ''}',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
                ),
                if (endsAt != null)
                  Text(
                    'Expire le ${_formatDate(endsAt)}',
                    style: GoogleFonts.inter(color: AppColors.sub, fontSize: 12),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggle(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.blue : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: selected ? Colors.white : AppColors.sub,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> plan) {
    final currentPlanId = _subscription?['plan']?['id'];
    final isCurrent = plan['id'] == currentPlanId;
    final price = _yearly ? plan['price_yearly'] : plan['price_monthly'];
    final slug = plan['slug'] ?? '';

    final colors = {
      'essentiel': AppColors.blue,
      'pro': Colors.purple,
      'business': Colors.amber.shade700,
    };
    final color = colors[slug] ?? AppColors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isCurrent ? color : AppColors.borderSoft, width: isCurrent ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(_getPlanIcon(slug), color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(plan['name'] ?? '', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700, fontSize: 18)),
                    if (isCurrent)
                      Text('Plan actuel', style: GoogleFonts.inter(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatAmount(price ?? 0), style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700, fontSize: 24)),
              Text(_yearly ? '/an' : '/mois', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 16),
          _buildFeature('${plan['max_products'] ?? 'Illimité'} produits'),
          _buildFeature('${plan['max_users']} utilisateur(s)'),
          if (plan['advanced_stock'] == true) _buildFeature('Stock avancé'),
          if (plan['supplier_orders'] == true) _buildFeature('Gestion fournisseurs'),
          if (plan['multi_shop'] == true) _buildFeature('Multi-boutiques'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isCurrent ? null : () => _changePlan(plan['id']),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCurrent ? AppColors.muted : color,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isCurrent ? 'Plan actuel' : 'Choisir ce plan',
                style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeature(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(Icons.check, color: AppColors.success, size: 16),
          const SizedBox(width: 8),
          Text(text, style: GoogleFonts.inter(fontSize: 13, color: AppColors.ink)),
        ],
      ),
    );
  }

  IconData _getPlanIcon(String slug) {
    switch (slug) {
      case 'essentiel':
        return Icons.bolt;
      case 'pro':
        return Icons.workspace_premium;
      case 'business':
        return Icons.business;
      default:
        return Icons.star;
    }
  }

  String _formatDate(String date) {
    try {
      final d = DateTime.parse(date);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return date;
    }
  }
}

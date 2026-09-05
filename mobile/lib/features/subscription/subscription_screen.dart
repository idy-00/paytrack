import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../shared/widgets/error_view.dart';

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  List<dynamic> _plans = [];
  Map<String, dynamic>? _subscription;
  bool _loading = true;
  String _billingCycle = 'monthly';
  String? _error;

  static const _billingOptions = [
    {'key': 'daily', 'label': 'Jour'},
    {'key': 'weekly', 'label': 'Semaine'},
    {'key': 'monthly', 'label': 'Mois'},
    {'key': 'quarterly', 'label': '3 mois', 'discount': '-8%'},
    {'key': 'yearly', 'label': 'An', 'discount': '-17%'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final plans = await ApiService.getPlans();
      final sub = await ApiService.getSubscription();
      if (!mounted) return;
      setState(() {
        _plans = plans;
        _subscription = sub['subscription'];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _changePlan(int planId) async {
    try {
      await ApiService.changePlan(planId, _billingCycle);
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Plan modifié')));
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erreur: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Retour',
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/dashboard');
            }
          },
        ),
        title: Text('Abonnement',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorView(message: 'Erreur: $_error', onRetry: _loadData)
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
                            child: Wrap(
                              spacing: 4,
                              children: _billingOptions.map((opt) {
                                final key = opt['key'] as String;
                                final label = opt['label'] as String;
                                final discount = opt['discount'];
                                return _buildToggle(
                                  discount != null ? '$label $discount' : label,
                                  _billingCycle == key,
                                  () => setState(() => _billingCycle = key),
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                        if (_billingCycle == 'yearly')
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Center(
                              child: Text(
                                '1 mois offert sur l\'abonnement annuel',
                                style: GoogleFonts.sourceSans3(
                                    color: AppColors.success,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600),
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
        color: isExpired
            ? Colors.red.shade50
            : isTrial
                ? Colors.amber.shade50
                : Colors.green.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: isExpired
                ? Colors.red.shade200
                : isTrial
                    ? Colors.amber.shade200
                    : Colors.green.shade200),
      ),
      child: Row(
        children: [
          Icon(
            isExpired
                ? Icons.warning_amber
                : isTrial
                    ? Icons.hourglass_bottom
                    : Icons.check_circle,
            color: isExpired
                ? Colors.red
                : isTrial
                    ? Colors.amber.shade700
                    : Colors.green,
            size: 32,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isExpired
                      ? 'Abonnement expiré'
                      : isTrial
                          ? 'Période d\'essai'
                          : 'Plan ${plan?['name'] ?? ''}',
                  style: GoogleFonts.sourceSans3(
                      fontWeight: FontWeight.w600, fontSize: 15),
                ),
                if (endsAt != null)
                  Text(
                    'Expire le ${_formatDate(endsAt)}',
                    style: GoogleFonts.sourceSans3(
                        color: AppColors.sub, fontSize: 12),
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
          style: GoogleFonts.sourceSans3(
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
    final price = plan['price_$_billingCycle'] ?? plan['price_monthly'];
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
        border: Border.all(
            color: isCurrent ? color : AppColors.borderSoft,
            width: isCurrent ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12)),
                child: Icon(_getPlanIcon(slug), color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(plan['name'] ?? '',
                        style: GoogleFonts.sourceSans3(
                            fontWeight: FontWeight.w700, fontSize: 18)),
                    if (isCurrent)
                      Text('Plan actuel',
                          style: GoogleFonts.sourceSans3(
                              color: color,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatAmount(price ?? 0),
                  style: GoogleFonts.sourceSans3(
                      fontWeight: FontWeight.w700, fontSize: 24)),
              Text(
                  '/${_billingOptions.firstWhere((o) => o['key'] == _billingCycle)['label']?.toString().toLowerCase() ?? 'mois'}',
                  style: GoogleFonts.sourceSans3(
                      color: AppColors.sub, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 16),
          _buildFeature('${plan['max_products'] ?? 'Illimité'} produits'),
          _buildFeature('${plan['max_users']} utilisateur(s)'),
          if (plan['advanced_stock'] == true) _buildFeature('Stock avancé'),
          if (plan['supplier_orders'] == true)
            _buildFeature('Gestion fournisseurs'),
          if (plan['multi_shop'] == true) _buildFeature('Multi-boutiques'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isCurrent ? null : () => _changePlan(plan['id']),
              style: ElevatedButton.styleFrom(
                backgroundColor: isCurrent ? AppColors.muted : color,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                isCurrent ? 'Plan actuel' : 'Choisir ce plan',
                style: GoogleFonts.sourceSans3(
                    color: Colors.white, fontWeight: FontWeight.w600),
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
          const Icon(Icons.check, color: AppColors.success, size: 16),
          const SizedBox(width: 8),
          Text(text,
              style:
                  GoogleFonts.sourceSans3(fontSize: 13, color: AppColors.ink)),
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

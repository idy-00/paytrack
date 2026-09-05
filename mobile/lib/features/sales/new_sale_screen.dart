import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/json_parsers.dart';
import '../../core/utils/schedule_calculator.dart';

class NewSaleScreen extends ConsumerStatefulWidget {
  const NewSaleScreen({super.key});

  @override
  ConsumerState<NewSaleScreen> createState() => _NewSaleScreenState();
}

class _NewSaleScreenState extends ConsumerState<NewSaleScreen> {
  List<dynamic> _clients = [];
  List<dynamic> _articles = [];
  bool _loading = true;
  bool _saving = false;

  int? _selectedClientId;
  int? _selectedArticleId;
  int _quantity = 1;
  int _unitPrice = 0;
  int _advanceAmount = 0;
  int _installmentCount = 3;
  int _customIntervalDays = 14;
  String _paymentMode = 'tranche';
  String _frequency = 'mensuel';
  DateTime? _dueDate;
  final _notesController = TextEditingController();
  final _priceController = TextEditingController();
  final _advanceController = TextEditingController();

  static const _frequencies = <String, String>{
    'quotidien': 'Chaque jour',
    'hebdomadaire': 'Chaque semaine',
    'bimestriel': 'Toutes les 2 semaines',
    'mensuel': 'Chaque mois',
    'trimestriel': 'Tous les 3 mois',
    'personnalise': 'Personnalisé',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _notesController.dispose();
    _priceController.dispose();
    _advanceController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getClients(),
        ApiService.getArticles(),
      ]);
      if (!mounted) return;
      setState(() {
        _clients = jsonList(jsonMap(results[0])['data']);
        _articles = jsonList(jsonMap(results[1])['data']);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  int get _totalAmount => _quantity * _unitPrice;
  bool get _isCash => _paymentMode == 'comptant';
  int get _safeAdvance => _isCash ? _totalAmount : _advanceAmount;
  int get _remainingAmount => _isCash ? 0 : _totalAmount - _advanceAmount;

  List<int> get _schedulePreview {
    if (_isCash) return const [];
    return distributeInstallments(_remainingAmount, _installmentCount);
  }

  Future<void> _selectDueDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      if (!mounted) return;
      setState(() => _dueDate = date);
    }
  }

  Future<void> _saveSale() async {
    if (_selectedClientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sélectionnez un client')));
      return;
    }
    if (_selectedArticleId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sélectionnez un article')));
      return;
    }
    if (_unitPrice <= 0) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Prix invalide')));
      return;
    }
    if (!_isCash && (_advanceAmount < 0 || _advanceAmount >= _totalAmount)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('L’acompte doit être inférieur au total.'),
        ),
      );
      return;
    }
    if (_dueDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sélectionnez la date de la vente.')),
      );
      return;
    }

    final article = jsonMap(_articles.firstWhere(
      (item) => jsonInt(jsonMap(item)['id']) == _selectedArticleId,
      orElse: () => <String, dynamic>{},
    ));
    final availableStock = jsonInt(article['stock'] ?? article['quantity']);
    if (availableStock < _quantity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            availableStock <= 0
                ? 'Cet article est en rupture de stock.'
                : 'Stock insuffisant : $availableStock disponible(s).',
          ),
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.createSale({
        'client_id': _selectedClientId,
        'article_id': _selectedArticleId,
        'article_name': jsonString(article['name'], fallback: 'Article'),
        'quantity': _quantity,
        'total_amount': _totalAmount,
        'down_payment': _safeAdvance,
        'payment_mode': _paymentMode,
        'installment_count': _isCash ? 1 : _installmentCount,
        'frequency': _isCash ? 'mensuel' : _frequency,
        'custom_interval_days': !_isCash && _frequency == 'personnalise'
            ? _customIntervalDays
            : null,
        'start_date': _dueDate!.toIso8601String().split('T')[0],
        'notes': _notesController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Vente créée')));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _createQuickClient() async {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();

    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nouveau client',
                  style: GoogleFonts.sourceSans3(
                      fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Nom *',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Téléphone',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (nameController.text.isEmpty) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                          const SnackBar(content: Text('Nom requis')));
                      return;
                    }
                    try {
                      final res = await ApiService.createClient({
                        'full_name': nameController.text.trim(),
                        'phone': phoneController.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx, res['client'] ?? res);
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx)
                            .showSnackBar(SnackBar(content: Text('$e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.green,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Créer',
                      style: GoogleFonts.sourceSans3(
                          color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (result != null) {
      setState(() {
        _clients.add(result);
        _selectedClientId = result['id'];
      });
    }
  }

  Future<void> _createQuickArticle() async {
    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context, isScrollControlled: true,
      builder: (ctx) => Padding(padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom), child: Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Nouvel article', style: GoogleFonts.sourceSans3(fontSize: 20, fontWeight: FontWeight.w700)), const SizedBox(height: 16),
        TextField(controller: nameController, decoration: InputDecoration(labelText: 'Nom de l’article *', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))), const SizedBox(height: 12),
        TextField(controller: priceController, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: 'Prix unitaire (FCFA) *', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))), const SizedBox(height: 20),
        SizedBox(width: double.infinity, height: 50, child: FilledButton(style: FilledButton.styleFrom(backgroundColor: AppColors.green), onPressed: () async { final price = int.tryParse(priceController.text.trim()); if (nameController.text.trim().isEmpty || price == null || price < 0) { ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Saisissez un nom et un prix valide.'))); return; } try { final article = await ApiService.createArticle({'name': nameController.text.trim(), 'price': price, 'stock': 0}); if (ctx.mounted) Navigator.pop(ctx, article); } catch (e) { if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e'))); } }, child: const Text('Ajouter'))),
      ]))),
    );
    nameController.dispose(); priceController.dispose();
    if (result != null && mounted) setState(() { _articles.add(result); _selectedArticleId = jsonInt(result['id']); _unitPrice = jsonInt(result['price']); _priceController.text = '$_unitPrice'; });
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
              context.go('/ventes');
            }
          },
        ),
        title: Text('Nouvelle vente',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.blue,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: AppColors.cardShadow,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: AppColors.green,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.point_of_sale_rounded,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Une vente claire, sans surprise',
                                style: GoogleFonts.sourceSans3(
                                  color: Colors.white,
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Client · article · conditions · confirmation',
                                style: GoogleFonts.sourceSans3(
                                  color: Colors.white.withValues(alpha: 0.78),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  _buildStepTitle(
                    1,
                    'Mode de paiement',
                    'Le récapitulatif s’adapte immédiatement.',
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildPaymentModeCard(
                          value: 'comptant',
                          icon: Icons.payments_outlined,
                          title: 'Comptant',
                          description: 'Tout est réglé aujourd’hui',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildPaymentModeCard(
                          value: 'tranche',
                          icon: Icons.calendar_month_outlined,
                          title: 'À crédit',
                          description: 'Acompte puis échéances',
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Client
                  _buildStepTitle(
                    2,
                    'Client et article',
                    'Choisissez précisément ce qui sera porté au reçu.',
                  ),
                  const SizedBox(height: 14),
                  _buildSectionTitle('Client'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          initialValue: _selectedClientId,
                          decoration: InputDecoration(
                            hintText: 'Sélectionner un client',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 14),
                          ),
                          items: _clients.map<DropdownMenuItem<int>>((c) {
                            return DropdownMenuItem(
                                value: c['id'], child: Text(c['name']));
                          }).toList(),
                          onChanged: (v) =>
                              setState(() => _selectedClientId = v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        tooltip: 'Ajouter un client',
                        onPressed: _createQuickClient,
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.blueLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.add,
                              color: AppColors.blue, size: 20),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Article
                  _buildSectionTitle('Article'),
                  const SizedBox(height: 8),
                  Row(children: [Expanded(child: DropdownButtonFormField<int>(
                    initialValue: _selectedArticleId,
                    decoration: InputDecoration(
                      hintText: 'Sélectionner un article',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 14),
                    ),
                    items: _articles.map<DropdownMenuItem<int>>((a) {
                      return DropdownMenuItem(
                          value: a['id'],
                          child: Text(
                              '${a['name']} - ${formatAmount(a['price'])}'));
                    }).toList(),
                    onChanged: (v) {
                      final article = _articles.firstWhere((a) => a['id'] == v,
                          orElse: () => null);
                      setState(() {
                        _selectedArticleId = v;
                        if (article != null) {
                          _unitPrice = jsonInt(article['price']);
                          _priceController.text = '$_unitPrice';
                        }
                      });
                    },
                  )), const SizedBox(width: 8), FilledButton.tonalIcon(onPressed: _createQuickArticle, icon: const Icon(Icons.add_rounded), label: const Text('Ajouter'))]),

                  const SizedBox(height: 24),

                  // Quantité et Prix
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSectionTitle('Quantité'),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                IconButton(
                                  onPressed: _quantity > 1
                                      ? () => setState(() => _quantity--)
                                      : null,
                                  icon: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                          color: AppColors.borderSoft),
                                    ),
                                    child: const Icon(Icons.remove, size: 20),
                                  ),
                                ),
                                Text('$_quantity',
                                    style: GoogleFonts.sourceSans3(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700)),
                                IconButton(
                                  onPressed: () => setState(() => _quantity++),
                                  icon: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: AppColors.blueLight,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.add,
                                        size: 20, color: AppColors.blue),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildSectionTitle('Prix unitaire'),
                            const SizedBox(height: 8),
                            TextField(
                              keyboardType: TextInputType.number,
                              controller: _priceController,
                              onChanged: (v) => setState(
                                  () => _unitPrice = int.tryParse(v) ?? 0),
                              decoration: InputDecoration(
                                suffixText: 'FCFA',
                                border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  _buildStepTitle(
                    3,
                    'Conditions',
                    _isCash
                        ? 'Le total sera marqué comme encaissé.'
                        : 'Définissez un échéancier réaliste avec le client.',
                  ),
                  const SizedBox(height: 14),

                  if (!_isCash) ...[
                    _buildSectionTitle('Acompte initial'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _advanceController,
                      keyboardType: TextInputType.number,
                      onChanged: (v) => setState(
                        () => _advanceAmount = int.tryParse(v.trim()) ?? 0,
                      ),
                      decoration: InputDecoration(
                        hintText: '0',
                        suffixText: 'FCFA',
                        errorText:
                            _advanceAmount >= _totalAmount && _totalAmount > 0
                                ? 'L’acompte doit rester inférieur au total'
                                : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionTitle('Nombre de tranches'),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        IconButton.outlined(
                          tooltip: 'Retirer une tranche',
                          onPressed: _installmentCount > 1
                              ? () => setState(() => _installmentCount--)
                              : null,
                          icon: const Icon(Icons.remove_rounded),
                        ),
                        Container(
                          width: 64,
                          alignment: Alignment.center,
                          child: Text(
                            '$_installmentCount',
                            style: GoogleFonts.sourceSans3(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink,
                            ),
                          ),
                        ),
                        IconButton.filled(
                          tooltip: 'Ajouter une tranche',
                          onPressed: _installmentCount < 120
                              ? () => setState(() => _installmentCount++)
                              : null,
                          icon: const Icon(Icons.add_rounded),
                        ),
                        const SizedBox(width: 12),
                        if (_schedulePreview.isNotEmpty)
                          Expanded(
                            child: Text(
                              'Dès ${formatAmount(_schedulePreview.first)} par échéance',
                              style: GoogleFonts.sourceSans3(
                                color: AppColors.greenDeep,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildSectionTitle('Fréquence'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _frequencies.entries.map((entry) {
                        final selected = _frequency == entry.key;
                        return ChoiceChip(
                          selected: selected,
                          label: Text(entry.value),
                          onSelected: (_) =>
                              setState(() => _frequency = entry.key),
                        );
                      }).toList(),
                    ),
                    if (_frequency == 'personnalise') ...[
                      const SizedBox(height: 12),
                      TextFormField(
                        initialValue: '$_customIntervalDays',
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Intervalle personnalisé',
                          suffixText: 'jours',
                        ),
                        onChanged: (value) => setState(() {
                          _customIntervalDays = int.tryParse(value.trim())
                                  ?.clamp(1, 365)
                                  .toInt() ??
                              14;
                        }),
                      ),
                    ],
                  ],

                  const SizedBox(height: 24),

                  // Échéance
                  _buildSectionTitle(
                    _isCash ? 'Date de vente' : 'Début de l’échéancier',
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _selectDueDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.borderSoft),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today,
                              color: AppColors.sub, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            _dueDate != null
                                ? '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}'
                                : 'Sélectionner la date',
                            style: GoogleFonts.sourceSans3(
                                color: _dueDate != null
                                    ? AppColors.ink
                                    : AppColors.sub),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Notes
                  _buildSectionTitle('Notes (optionnel)'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText: 'Remarques...',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Récap
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderSoft),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: _isCash
                                    ? AppColors.greenLight
                                    : AppColors.blueLight,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                _isCash ? 'COMPTANT' : 'VENTE À CRÉDIT',
                                style: GoogleFonts.sourceSans3(
                                  color: _isCash
                                      ? AppColors.greenDeep
                                      : AppColors.blueDark,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(
                              Icons.verified_rounded,
                              size: 18,
                              color: AppColors.green,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        _buildRecapRow('Total', formatAmount(_totalAmount)),
                        const SizedBox(height: 8),
                        _buildRecapRow(
                          _isCash ? 'Encaissé' : 'Acompte',
                          formatAmount(_safeAdvance),
                        ),
                        const Divider(color: AppColors.borderSoft),
                        _buildRecapRow(
                            'Reste à payer', formatAmount(_remainingAmount),
                            isBold: true,
                            color: _remainingAmount > 0
                                ? Colors.amber.shade700
                                : Colors.green),
                        if (!_isCash && _schedulePreview.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.blueLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Aperçu réel · $_installmentCount tranches',
                                  style: GoogleFonts.sourceSans3(
                                    color: AppColors.blueDark,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${formatAmount(_schedulePreview.first)} au départ · '
                                  '${formatAmount(_schedulePreview.last)} pour la dernière',
                                  style: GoogleFonts.sourceSans3(
                                    color: AppColors.ink,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Les ${_remainingAmount % _installmentCount} FCFA d’arrondi '
                                  'sont répartis sur les premières tranches. La somme reste exactement égale au reste à payer.',
                                  style: GoogleFonts.sourceSans3(
                                    color: AppColors.sub,
                                    fontSize: 12,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _saveSale,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.green,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : Text(
                              _isCash
                                  ? 'Confirmer la vente comptant'
                                  : 'Créer la vente à crédit',
                              style: GoogleFonts.sourceSans3(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16)),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.sourceSans3(
          fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.sub),
    );
  }

  Widget _buildStepTitle(int number, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.green,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Text(
            '$number',
            style: GoogleFonts.sourceSans3(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.sourceSans3(
                  color: AppColors.ink,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.sourceSans3(
                  color: AppColors.sub,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentModeCard({
    required String value,
    required IconData icon,
    required String title,
    required String description,
  }) {
    final selected = _paymentMode == value;
    return Semantics(
      button: true,
      selected: selected,
      label: '$title. $description',
      child: InkWell(
        onTap: () => setState(() => _paymentMode = value),
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected ? AppColors.greenLight : AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.green : AppColors.border,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                icon,
                color: selected ? AppColors.greenDeep : AppColors.blue,
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: GoogleFonts.sourceSans3(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: GoogleFonts.sourceSans3(
                  color: AppColors.sub,
                  fontSize: 11,
                  height: 1.25,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecapRow(String label, String value,
      {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.sourceSans3(color: AppColors.sub)),
        Text(
          value,
          style: GoogleFonts.sourceSans3(
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
            color: color ?? AppColors.ink,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }
}

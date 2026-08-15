import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

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
  DateTime? _dueDate;
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getClients(),
        ApiService.getArticles(),
      ]);
      setState(() {
        _clients = results[0]['data'] ?? [];
        _articles = results[1]['data'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  int get _totalAmount => _quantity * _unitPrice;
  int get _remainingAmount => _totalAmount - _advanceAmount;

  Future<void> _selectDueDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _dueDate = date);
    }
  }

  Future<void> _saveSale() async {
    if (_selectedClientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sélectionnez un client')));
      return;
    }
    if (_selectedArticleId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sélectionnez un article')));
      return;
    }
    if (_unitPrice <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Prix invalide')));
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.createSale({
        'client_id': _selectedClientId,
        'article_id': _selectedArticleId,
        'quantity': _quantity,
        'unit_price': _unitPrice,
        'advance_amount': _advanceAmount,
        'due_date': _dueDate?.toIso8601String().split('T')[0],
        'notes': _notesController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vente créée')));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      setState(() => _saving = false);
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
              Text('Nouveau client', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Nom *',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Téléphone',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (nameController.text.isEmpty) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Nom requis')));
                      return;
                    }
                    try {
                      final res = await ApiService.createClient({
                        'name': nameController.text,
                        'phone': phoneController.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx, res['client'] ?? res);
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Créer', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Nouvelle vente', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
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
                  // Client
                  _buildSectionTitle('Client'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          value: _selectedClientId,
                          decoration: InputDecoration(
                            hintText: 'Sélectionner un client',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          ),
                          items: _clients.map<DropdownMenuItem<int>>((c) {
                            return DropdownMenuItem(value: c['id'], child: Text(c['name']));
                          }).toList(),
                          onChanged: (v) => setState(() => _selectedClientId = v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _createQuickClient,
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.blueLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.add, color: AppColors.blue, size: 20),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Article
                  _buildSectionTitle('Article'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<int>(
                    value: _selectedArticleId,
                    decoration: InputDecoration(
                      hintText: 'Sélectionner un article',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                    items: _articles.map<DropdownMenuItem<int>>((a) {
                      return DropdownMenuItem(value: a['id'], child: Text('${a['name']} - ${formatAmount(a['price'])}'));
                    }).toList(),
                    onChanged: (v) {
                      final article = _articles.firstWhere((a) => a['id'] == v, orElse: () => null);
                      setState(() {
                        _selectedArticleId = v;
                        if (article != null) {
                          _unitPrice = article['price'] ?? 0;
                        }
                      });
                    },
                  ),

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
                                  onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                                  icon: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppColors.borderSoft),
                                    ),
                                    child: const Icon(Icons.remove, size: 20),
                                  ),
                                ),
                                Text('$_quantity', style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w700)),
                                IconButton(
                                  onPressed: () => setState(() => _quantity++),
                                  icon: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: AppColors.blueLight,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(Icons.add, size: 20, color: AppColors.blue),
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
                              controller: TextEditingController(text: '$_unitPrice'),
                              onChanged: (v) => setState(() => _unitPrice = int.tryParse(v) ?? 0),
                              decoration: InputDecoration(
                                suffixText: 'FCFA',
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Avance
                  _buildSectionTitle('Avance (acompte)'),
                  const SizedBox(height: 8),
                  TextField(
                    keyboardType: TextInputType.number,
                    onChanged: (v) => setState(() => _advanceAmount = int.tryParse(v) ?? 0),
                    decoration: InputDecoration(
                      hintText: '0',
                      suffixText: 'FCFA',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Échéance
                  _buildSectionTitle('Date d\'échéance'),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _selectDueDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.borderSoft),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.calendar_today, color: AppColors.sub, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            _dueDate != null ? '${_dueDate!.day}/${_dueDate!.month}/${_dueDate!.year}' : 'Sélectionner une date',
                            style: GoogleFonts.inter(color: _dueDate != null ? AppColors.ink : AppColors.sub),
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
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
                        _buildRecapRow('Total', formatAmount(_totalAmount)),
                        const SizedBox(height: 8),
                        _buildRecapRow('Avance', formatAmount(_advanceAmount)),
                        Divider(color: AppColors.borderSoft),
                        _buildRecapRow('Reste à payer', formatAmount(_remainingAmount), isBold: true, color: _remainingAmount > 0 ? Colors.amber.shade700 : Colors.green),
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
                        backgroundColor: AppColors.blue,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _saving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text('Créer la vente', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
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
      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.sub),
    );
  }

  Widget _buildRecapRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(color: AppColors.sub)),
        Text(
          value,
          style: GoogleFonts.spaceGrotesk(
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
            color: color ?? AppColors.ink,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class NewOrderScreen extends ConsumerStatefulWidget {
  const NewOrderScreen({super.key});

  @override
  ConsumerState<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends ConsumerState<NewOrderScreen> {
  List<dynamic> _clients = [];
  List<dynamic> _articles = [];
  bool _loading = true;
  bool _saving = false;

  int? _selectedClientId;
  List<Map<String, dynamic>> _items = [];
  DateTime? _deliveryDate;
  final _notesController = TextEditingController();
  String _deliveryAddress = '';

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

  int get _totalAmount => _items.fold(0, (sum, item) => sum + ((item['quantity'] as int) * (item['unit_price'] as int)));

  void _addItem() {
    setState(() {
      _items.add({'article_id': null, 'name': '', 'quantity': 1, 'unit_price': 0});
    });
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  void _updateItem(int index, String field, dynamic value) {
    setState(() {
      _items[index][field] = value;
      if (field == 'article_id' && value != null) {
        final article = _articles.firstWhere((a) => a['id'] == value, orElse: () => null);
        if (article != null) {
          _items[index]['name'] = article['name'];
          _items[index]['unit_price'] = article['price'] ?? 0;
        }
      }
    });
  }

  Future<void> _selectDeliveryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _deliveryDate ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() => _deliveryDate = date);
    }
  }

  Future<void> _saveOrder() async {
    if (_selectedClientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sélectionnez un client')));
      return;
    }
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ajoutez au moins un article')));
      return;
    }
    if (_items.any((item) => item['article_id'] == null)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sélectionnez tous les articles')));
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.createOrder({
        'client_id': _selectedClientId,
        'items': _items.map((item) => {
          'article_id': item['article_id'],
          'quantity': item['quantity'],
          'unit_price': item['unit_price'],
        }).toList(),
        'delivery_date': _deliveryDate?.toIso8601String().split('T')[0],
        'delivery_address': _deliveryAddress,
        'notes': _notesController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Commande créée')));
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Nouvelle commande', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Client
                        _buildSectionTitle('Client'),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<int>(
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

                        const SizedBox(height: 24),

                        // Articles
                        Row(
                          children: [
                            Expanded(child: _buildSectionTitle('Articles')),
                            TextButton.icon(
                              onPressed: _addItem,
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Ajouter'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        if (_items.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.borderSoft),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.shopping_cart_outlined, size: 40, color: AppColors.muted),
                                  const SizedBox(height: 8),
                                  Text('Aucun article', style: GoogleFonts.inter(color: AppColors.sub)),
                                  TextButton(onPressed: _addItem, child: const Text('+ Ajouter')),
                                ],
                              ),
                            ),
                          )
                        else
                          ..._items.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final item = entry.value;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.borderSoft),
                              ),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: DropdownButtonFormField<int>(
                                          value: item['article_id'],
                                          decoration: InputDecoration(
                                            hintText: 'Article',
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                            isDense: true,
                                          ),
                                          items: _articles.map<DropdownMenuItem<int>>((a) {
                                            return DropdownMenuItem(value: a['id'], child: Text(a['name'], overflow: TextOverflow.ellipsis));
                                          }).toList(),
                                          onChanged: (v) => _updateItem(idx, 'article_id', v),
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                        onPressed: () => _removeItem(idx),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      SizedBox(
                                        width: 80,
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.center,
                                          decoration: InputDecoration(
                                            labelText: 'Qté',
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                            isDense: true,
                                          ),
                                          controller: TextEditingController(text: '${item['quantity']}'),
                                          onChanged: (v) => _updateItem(idx, 'quantity', int.tryParse(v) ?? 1),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          decoration: InputDecoration(
                                            labelText: 'Prix unit.',
                                            suffixText: 'FCFA',
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                                            isDense: true,
                                          ),
                                          controller: TextEditingController(text: '${item['unit_price']}'),
                                          onChanged: (v) => _updateItem(idx, 'unit_price', int.tryParse(v) ?? 0),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        formatAmount((item['quantity'] as int) * (item['unit_price'] as int)),
                                        style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700, color: AppColors.blue),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),

                        const SizedBox(height: 24),

                        // Date livraison
                        _buildSectionTitle('Date de livraison'),
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: _selectDeliveryDate,
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
                                  _deliveryDate != null ? '${_deliveryDate!.day}/${_deliveryDate!.month}/${_deliveryDate!.year}' : 'Sélectionner',
                                  style: GoogleFonts.inter(color: _deliveryDate != null ? AppColors.ink : AppColors.sub),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Adresse
                        _buildSectionTitle('Adresse de livraison'),
                        const SizedBox(height: 8),
                        TextField(
                          onChanged: (v) => _deliveryAddress = v,
                          decoration: InputDecoration(
                            hintText: 'Adresse...',
                            prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Notes
                        _buildSectionTitle('Notes'),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _notesController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            hintText: 'Instructions...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                // Footer avec total
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border(top: BorderSide(color: AppColors.borderSoft)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Total', style: GoogleFonts.inter(fontSize: 16, color: AppColors.sub)),
                          Text(formatAmount(_totalAmount), style: GoogleFonts.spaceGrotesk(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.ink)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saving || _items.isEmpty ? null : _saveOrder,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.blue,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _saving
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : Text('Créer la commande', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 16)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.sub),
    );
  }
}

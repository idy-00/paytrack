import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/json_parsers.dart';

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
  final List<Map<String, dynamic>> _items = [];
  DateTime? _deliveryDate;
  final _notesController = TextEditingController();
  String _deliveryAddress = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _notesController.dispose();
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
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  int get _totalAmount => _items.fold(
      0,
      (sum, item) =>
          sum + jsonInt(item['quantity']) * jsonInt(item['unit_price']));

  void _addItem() {
    setState(() {
      _items.add(
          {'article_id': null, 'name': '', 'quantity': 1, 'unit_price': 0});
    });
  }

  void _removeItem(int index) {
    setState(() => _items.removeAt(index));
  }

  void _updateItem(int index, String field, dynamic value) {
    setState(() {
      _items[index][field] = value;
      if (field == 'article_id' && value != null) {
        final article =
            _articles.firstWhere((a) => a['id'] == value, orElse: () => null);
        if (article != null) {
          _items[index]['name'] = article['name'];
          _items[index]['unit_price'] = jsonInt(article['price']);
        }
      }
    });
  }

  Future<void> _createQuickClient() async {
    final name = TextEditingController();
    final phone = TextEditingController();
    final created = await _quickCreateSheet(
      title: 'Ajouter un client',
      fields: [
        TextField(controller: name, textCapitalization: TextCapitalization.words, decoration: _fieldDecoration('Nom complet *')),
        const SizedBox(height: 12),
        TextField(controller: phone, keyboardType: TextInputType.phone, decoration: _fieldDecoration('Téléphone')),
      ],
      onCreate: () async {
        if (name.text.trim().isEmpty) throw ApiException('Le nom du client est requis.');
        return ApiService.createClient({'full_name': name.text.trim(), 'phone': phone.text.trim()});
      },
    );
    name.dispose(); phone.dispose();
    if (created != null && mounted) setState(() { _clients.add(created); _selectedClientId = jsonInt(created['id']); });
  }

  Future<void> _createQuickArticle({int? itemIndex}) async {
    final name = TextEditingController();
    final price = TextEditingController();
    final stock = TextEditingController(text: '0');
    final created = await _quickCreateSheet(
      title: 'Ajouter un article',
      fields: [
        TextField(controller: name, textCapitalization: TextCapitalization.sentences, decoration: _fieldDecoration('Nom de l’article *')),
        const SizedBox(height: 12),
        TextField(controller: price, keyboardType: TextInputType.number, decoration: _fieldDecoration('Prix unitaire (FCFA) *')),
        const SizedBox(height: 12),
        TextField(controller: stock, keyboardType: TextInputType.number, decoration: _fieldDecoration('Stock initial')),
      ],
      onCreate: () async {
        final amount = int.tryParse(price.text.trim());
        if (name.text.trim().isEmpty || amount == null || amount < 0) throw ApiException('Saisissez un nom et un prix valide.');
        return ApiService.createArticle({'name': name.text.trim(), 'price': amount, 'stock': int.tryParse(stock.text.trim()) ?? 0});
      },
    );
    name.dispose(); price.dispose(); stock.dispose();
    if (created != null && mounted) setState(() {
      _articles.add(created);
      if (itemIndex != null) _updateItem(itemIndex, 'article_id', jsonInt(created['id']));
    });
  }

  InputDecoration _fieldDecoration(String label) => InputDecoration(labelText: label, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)));

  Future<Map<String, dynamic>?> _quickCreateSheet({required String title, required List<Widget> fields, required Future<Map<String, dynamic>> Function() onCreate}) async {
    return showModalBottomSheet<Map<String, dynamic>>(context: context, isScrollControlled: true, builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: StatefulBuilder(builder: (ctx, setLocalState) {
        var saving = false;
        return Padding(padding: const EdgeInsets.all(20), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: GoogleFonts.sourceSans3(fontSize: 20, fontWeight: FontWeight.w700)), const SizedBox(height: 18), ...fields, const SizedBox(height: 20),
          SizedBox(width: double.infinity, height: 50, child: FilledButton(style: FilledButton.styleFrom(backgroundColor: AppColors.green), onPressed: saving ? null : () async { setLocalState(() => saving = true); try { final result = await onCreate(); if (ctx.mounted) Navigator.pop(ctx, result); } on ApiException catch (e) { if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(e.message))); } finally { if (ctx.mounted) setLocalState(() => saving = false); } }, child: saving ? const CircularProgressIndicator(color: Colors.white) : const Text('Ajouter'))),
        ]));
      }),
    ));
  }

  Future<void> _selectDeliveryDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _deliveryDate ?? DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      if (!mounted) return;
      setState(() => _deliveryDate = date);
    }
  }

  Future<void> _saveOrder() async {
    if (_selectedClientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sélectionnez un client')));
      return;
    }
    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ajoutez au moins un article')));
      return;
    }
    if (_items.any((item) => item['article_id'] == null)) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sélectionnez tous les articles')));
      return;
    }
    if (_items.any((item) => jsonInt(item['quantity']) <= 0)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chaque quantité doit être positive.')),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ApiService.createOrder({
        'client_id': _selectedClientId,
        'items': _items
            .map((item) => {
                  'article_id': item['article_id'],
                  'quantity': item['quantity'],
                })
            .toList(),
        'delivery_date': _deliveryDate?.toIso8601String().split('T')[0],
        'delivery_address': _deliveryAddress,
        'notes': _notesController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Commande créée')));
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
              context.go('/commandes');
            }
          },
        ),
        title: Text('Nouvelle commande',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
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
                        Row(children: [Expanded(child: DropdownButtonFormField<int>(
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
                        )), const SizedBox(width: 8), FilledButton.tonalIcon(onPressed: _createQuickClient, icon: const Icon(Icons.person_add_alt_1_rounded), label: const Text('Ajouter'))]),

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
                                  const Icon(Icons.shopping_cart_outlined,
                                      size: 40, color: AppColors.muted),
                                  const SizedBox(height: 8),
                                  Text('Aucun article',
                                      style: GoogleFonts.sourceSans3(
                                          color: AppColors.sub)),
                                  TextButton(
                                      onPressed: _addItem,
                                      child: const Text('+ Ajouter')),
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
                                          initialValue: item['article_id'],
                                          decoration: InputDecoration(
                                            hintText: 'Article',
                                            border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8)),
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 10,
                                                    vertical: 10),
                                            isDense: true,
                                          ),
                                          items: _articles
                                              .map<DropdownMenuItem<int>>((a) {
                                            return DropdownMenuItem(
                                                value: a['id'],
                                                child: Text(a['name'],
                                                    overflow:
                                                        TextOverflow.ellipsis));
                                          }).toList(),
                                          onChanged: (v) =>
                                              _updateItem(idx, 'article_id', v),
                                        ),
                                      ),
                                      IconButton(tooltip: 'Ajouter un article', icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.green), onPressed: () => _createQuickArticle(itemIndex: idx)),
                                      IconButton(
                                        tooltip: 'Supprimer',
                                        icon: const Icon(Icons.delete_outline,
                                            color: Colors.red, size: 20),
                                        onPressed: () => _removeItem(idx),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      SizedBox(
                                        width: 80,
                                        child: TextFormField(
                                          key: ValueKey(
                                            'quantity-${item['article_id']}-$idx',
                                          ),
                                          initialValue: '${item['quantity']}',
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.center,
                                          decoration: InputDecoration(
                                            labelText: 'Qté',
                                            border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(8)),
                                            contentPadding:
                                                const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 10),
                                            isDense: true,
                                          ),
                                          onChanged: (v) => _updateItem(idx,
                                              'quantity', int.tryParse(v) ?? 1),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 11,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.blueLight,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            '${formatAmount(jsonInt(item['unit_price']))} / unité',
                                            style: GoogleFonts.sourceSans3(
                                              color: AppColors.blueDark,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        formatAmount(
                                          jsonInt(item['quantity']) *
                                              jsonInt(item['unit_price']),
                                        ),
                                        style: GoogleFonts.sourceSans3(
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.blue),
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
                                  _deliveryDate != null
                                      ? '${_deliveryDate!.day}/${_deliveryDate!.month}/${_deliveryDate!.year}'
                                      : 'Sélectionner',
                                  style: GoogleFonts.sourceSans3(
                                      color: _deliveryDate != null
                                          ? AppColors.ink
                                          : AppColors.sub),
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
                            prefixIcon: const Icon(Icons.location_on_outlined,
                                size: 20),
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
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
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
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
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border:
                        Border(top: BorderSide(color: AppColors.borderSoft)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Total',
                              style: GoogleFonts.sourceSans3(
                                  fontSize: 16, color: AppColors.sub)),
                          Text(formatAmount(_totalAmount),
                              style: GoogleFonts.sourceSans3(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed:
                              _saving || _items.isEmpty ? null : _saveOrder,
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
                              : Text('Créer la commande',
                                  style: GoogleFonts.sourceSans3(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16)),
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
      style: GoogleFonts.sourceSans3(
          fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.sub),
    );
  }
}

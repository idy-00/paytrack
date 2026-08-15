import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class SupplierOrdersScreen extends ConsumerStatefulWidget {
  const SupplierOrdersScreen({super.key});

  @override
  ConsumerState<SupplierOrdersScreen> createState() => _SupplierOrdersScreenState();
}

class _SupplierOrdersScreenState extends ConsumerState<SupplierOrdersScreen> {
  List<dynamic> _orders = [];
  List<dynamic> _suppliers = [];
  List<dynamic> _products = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getSupplierOrders(),
        ApiService.getSuppliers(),
        ApiService.getArticles(),
      ]);
      setState(() {
        _orders = results[0]['data'] ?? [];
        _suppliers = results[1]['data'] ?? [];
        _products = results[2]['data'] ?? [];
        _loading = false;
        _error = null;
      });
    } on ApiException catch (e) {
      setState(() {
        _loading = false;
        _error = e.statusCode == 403 ? 'Cette fonctionnalité nécessite le plan Business' : e.message;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _createOrder() async {
    if (_suppliers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Créez d\'abord un fournisseur')),
      );
      return;
    }

    int? selectedSupplierId;
    List<Map<String, dynamic>> items = [];
    final notesController = TextEditingController();

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          int total = items.fold(0, (sum, item) => sum + ((item['quantity'] as int) * (item['unit_cost'] as int)));

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Nouvelle commande fournisseur',
                          style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),

                // Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Supplier
                        Text('Fournisseur *', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<int>(
                          value: selectedSupplierId,
                          decoration: InputDecoration(
                            hintText: 'Sélectionner',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          ),
                          items: _suppliers.map<DropdownMenuItem<int>>((s) {
                            return DropdownMenuItem(value: s['id'], child: Text(s['name']));
                          }).toList(),
                          onChanged: (v) => setModalState(() => selectedSupplierId = v),
                        ),

                        const SizedBox(height: 20),

                        // Items header
                        Row(
                          children: [
                            Expanded(
                              child: Text('Articles *', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                            ),
                            TextButton.icon(
                              onPressed: () {
                                setModalState(() {
                                  items.add({'article_id': null, 'name': '', 'quantity': 1, 'unit_cost': 0});
                                });
                              },
                              icon: const Icon(Icons.add, size: 18),
                              label: const Text('Ajouter'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Items list
                        if (items.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Column(
                                children: [
                                  Icon(Icons.inventory_2_outlined, size: 40, color: Colors.grey.shade400),
                                  const SizedBox(height: 8),
                                  Text('Aucun article', style: GoogleFonts.inter(color: Colors.grey)),
                                  TextButton(
                                    onPressed: () {
                                      setModalState(() {
                                        items.add({'article_id': null, 'name': '', 'quantity': 1, 'unit_cost': 0});
                                      });
                                    },
                                    child: const Text('+ Ajouter un article'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ...items.asMap().entries.map((entry) {
                            final idx = entry.key;
                            final item = entry.value;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12),
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
                                          items: _products.map<DropdownMenuItem<int>>((p) {
                                            return DropdownMenuItem(value: p['id'], child: Text(p['name'], overflow: TextOverflow.ellipsis));
                                          }).toList(),
                                          onChanged: (v) {
                                            final product = _products.firstWhere((p) => p['id'] == v, orElse: () => null);
                                            setModalState(() {
                                              items[idx]['article_id'] = v;
                                              items[idx]['name'] = product?['name'] ?? '';
                                              items[idx]['unit_cost'] = product?['purchase_price'] ?? product?['price'] ?? 0;
                                            });
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                        onPressed: () => setModalState(() => items.removeAt(idx)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          decoration: InputDecoration(
                                            labelText: 'Qté',
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                            isDense: true,
                                          ),
                                          controller: TextEditingController(text: '${item['quantity']}'),
                                          onChanged: (v) => setModalState(() => items[idx]['quantity'] = int.tryParse(v) ?? 1),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        flex: 2,
                                        child: TextField(
                                          keyboardType: TextInputType.number,
                                          decoration: InputDecoration(
                                            labelText: 'Prix achat',
                                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                            isDense: true,
                                          ),
                                          controller: TextEditingController(text: '${item['unit_cost']}'),
                                          onChanged: (v) => setModalState(() => items[idx]['unit_cost'] = int.tryParse(v) ?? 0),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          }),

                        // Total
                        if (items.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.blueLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Total', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                                Text(formatAmount(total), style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.blue)),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 16),

                        // Notes
                        Text('Notes', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: notesController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            hintText: 'Optionnel',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Footer
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    border: Border(top: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: items.isEmpty || selectedSupplierId == null
                              ? null
                              : () async {
                                  try {
                                    await ApiService.createSupplierOrder({
                                      'supplier_id': selectedSupplierId,
                                      'notes': notesController.text,
                                      'items': items.where((i) => i['article_id'] != null).map((i) => {
                                        'article_id': i['article_id'],
                                        'quantity': i['quantity'],
                                        'unit_cost': i['unit_cost'],
                                      }).toList(),
                                      'status': 'ordered',
                                    });
                                    if (ctx.mounted) Navigator.pop(ctx, true);
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
              ],
            ),
          );
        },
      ),
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Commande créée')));
      _loadData();
    }
  }

  Future<void> _receiveOrder(int orderId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Réceptionner'),
        content: const Text('Confirmer la réception ? Le stock sera mis à jour.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirmer')),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService.updateSupplierOrderStatus(orderId, 'received');
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Commande réceptionnée, stock mis à jour')));
        _loadData();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Commandes fournisseurs', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _createOrder),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lock, size: 48, color: AppColors.muted),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.inter(color: AppColors.sub)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => Navigator.pushNamed(context, '/subscription'),
                          child: const Text('Voir les plans'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: _orders.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.6,
                              child: Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.muted),
                                    const SizedBox(height: 16),
                                    Text('Aucune commande', style: GoogleFonts.inter(color: AppColors.sub)),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      onPressed: _createOrder,
                                      icon: const Icon(Icons.add),
                                      label: const Text('Nouvelle commande'),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _orders.length,
                          itemBuilder: (_, i) => _buildOrderCard(_orders[i]),
                        ),
                ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status'] ?? 'draft';
    final statusConfig = {
      'draft': {'label': 'Brouillon', 'color': Colors.grey},
      'ordered': {'label': 'Commandée', 'color': Colors.blue},
      'partial': {'label': 'Partielle', 'color': Colors.amber},
      'received': {'label': 'Reçue', 'color': Colors.green},
      'cancelled': {'label': 'Annulée', 'color': Colors.red},
    };
    final config = statusConfig[status] ?? statusConfig['draft']!;
    final remaining = (order['total_amount'] ?? 0) - (order['paid_amount'] ?? 0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(order['reference'] ?? '', style: GoogleFonts.spaceMono(fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(order['supplier']?['name'] ?? '', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 13)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (config['color'] as Color).withAlpha(25),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  config['label'] as String,
                  style: GoogleFonts.inter(color: config['color'] as Color, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 11)),
                    Text(formatAmount(order['total_amount'] ?? 0), style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Reste', style: GoogleFonts.inter(color: AppColors.sub, fontSize: 11)),
                    Text(
                      remaining > 0 ? formatAmount(remaining) : 'Soldé',
                      style: GoogleFonts.spaceGrotesk(
                        fontWeight: FontWeight.w700,
                        color: remaining > 0 ? Colors.amber.shade700 : Colors.green,
                      ),
                    ),
                  ],
                ),
              ),
              if (status == 'ordered')
                ElevatedButton(
                  onPressed: () => _receiveOrder(order['id']),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('Réceptionner', style: GoogleFonts.inter(color: Colors.white, fontSize: 12)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

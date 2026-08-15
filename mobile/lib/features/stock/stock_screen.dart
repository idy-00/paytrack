import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class StockScreen extends ConsumerStatefulWidget {
  const StockScreen({super.key});

  @override
  ConsumerState<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends ConsumerState<StockScreen> {
  List<dynamic> _articles = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.getArticles(activeOnly: false);
      setState(() {
        _articles = res['data'] ?? [];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  List<dynamic> get _filteredArticles {
    if (_search.isEmpty) return _articles;
    return _articles.where((a) {
      final name = (a['name'] ?? '').toLowerCase();
      final ref = (a['reference'] ?? '').toLowerCase();
      return name.contains(_search.toLowerCase()) || ref.contains(_search.toLowerCase());
    }).toList();
  }

  Future<void> _adjustStock(Map<String, dynamic> article) async {
    final controller = TextEditingController();
    String adjustmentType = 'add';
    String? reason;

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
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
                Text('Ajuster le stock', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(article['name'], style: GoogleFonts.inter(color: AppColors.sub)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.blueLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Stock actuel: ${article['stock'] ?? article['quantity'] ?? 0}',
                    style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w600, color: AppColors.blue),
                  ),
                ),
                const SizedBox(height: 20),

                // Type
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setModalState(() => adjustmentType = 'add'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: adjustmentType == 'add' ? Colors.green.shade50 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: adjustmentType == 'add' ? Colors.green : Colors.grey.shade300,
                              width: adjustmentType == 'add' ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(Icons.add_circle, color: adjustmentType == 'add' ? Colors.green : Colors.grey),
                              const SizedBox(height: 4),
                              Text('Ajouter', style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                color: adjustmentType == 'add' ? Colors.green : Colors.grey,
                              )),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setModalState(() => adjustmentType = 'remove'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: adjustmentType == 'remove' ? Colors.red.shade50 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: adjustmentType == 'remove' ? Colors.red : Colors.grey.shade300,
                              width: adjustmentType == 'remove' ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(Icons.remove_circle, color: adjustmentType == 'remove' ? Colors.red : Colors.grey),
                              const SizedBox(height: 4),
                              Text('Retirer', style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600,
                                color: adjustmentType == 'remove' ? Colors.red : Colors.grey,
                              )),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Quantité',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),

                const SizedBox(height: 12),

                DropdownButtonFormField<String>(
                  value: reason,
                  decoration: InputDecoration(
                    labelText: 'Raison',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'reception', child: Text('Réception marchandise')),
                    DropdownMenuItem(value: 'correction', child: Text('Correction inventaire')),
                    DropdownMenuItem(value: 'casse', child: Text('Casse / Perte')),
                    DropdownMenuItem(value: 'vol', child: Text('Vol')),
                    DropdownMenuItem(value: 'retour', child: Text('Retour client')),
                    DropdownMenuItem(value: 'autre', child: Text('Autre')),
                  ],
                  onChanged: (v) => setModalState(() => reason = v),
                ),

                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final qty = int.tryParse(controller.text) ?? 0;
                      if (qty <= 0) {
                        ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Quantité invalide')));
                        return;
                      }
                      try {
                        await ApiService.adjustStock({
                          'article_id': article['id'],
                          'type': adjustmentType,
                          'quantity': qty,
                          'reason': reason ?? 'correction',
                        });
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e')));
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: adjustmentType == 'add' ? Colors.green : Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      adjustmentType == 'add' ? 'Ajouter au stock' : 'Retirer du stock',
                      style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock ajusté')));
      _loadData();
    }
  }

  Future<void> _addArticle() async {
    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final purchasePriceController = TextEditingController();
    final stockController = TextEditingController(text: '0');

    final result = await showModalBottomSheet<bool>(
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
              Text('Nouvel article', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Nom *',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: purchasePriceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Prix achat',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: priceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Prix vente *',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: stockController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Stock initial',
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
                      await ApiService.post('/articles', {
                        'name': nameController.text,
                        'price': int.tryParse(priceController.text) ?? 0,
                        'purchase_price': int.tryParse(purchasePriceController.text) ?? 0,
                        'stock': int.tryParse(stockController.text) ?? 0,
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
      ),
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Article créé')));
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final lowStock = _articles.where((a) => (a['stock'] ?? a['quantity'] ?? 0) <= (a['stock_alert'] ?? 5)).length;
    final totalValue = _articles.fold<int>(0, (sum, a) => sum + ((a['stock'] ?? a['quantity'] ?? 0) as int) * ((a['price'] ?? 0) as int));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Stock', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _addArticle),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: Column(
                children: [
                  // Stats
                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(child: _buildStatCard('Articles', '${_articles.length}', Icons.inventory_2, AppColors.blue)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildStatCard('Alertes', '$lowStock', Icons.warning_amber, Colors.amber)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildStatCard('Valeur', formatAmount(totalValue), Icons.attach_money, Colors.green)),
                      ],
                    ),
                  ),

                  // Search
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: 'Rechercher un article...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // List
                  Expanded(
                    child: _filteredArticles.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.inventory_2_outlined, size: 64, color: AppColors.muted),
                                const SizedBox(height: 16),
                                Text('Aucun article', style: GoogleFonts.inter(color: AppColors.sub)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredArticles.length,
                            itemBuilder: (_, i) => _buildArticleCard(_filteredArticles[i]),
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700, fontSize: 14)),
          Text(label, style: GoogleFonts.inter(color: AppColors.sub, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildArticleCard(Map<String, dynamic> article) {
    final stock = article['stock'] ?? article['quantity'] ?? 0;
    final alertLevel = article['stock_alert'] ?? 5;
    final isLow = stock <= alertLevel;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isLow ? Colors.amber.shade200 : AppColors.borderSoft),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isLow ? Colors.amber.shade50 : AppColors.blueLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isLow ? Icons.warning_amber : Icons.inventory_2,
              color: isLow ? Colors.amber.shade700 : AppColors.blue,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(article['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(formatAmount(article['price'] ?? 0), style: GoogleFonts.inter(color: AppColors.sub, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isLow ? Colors.amber.shade50 : Colors.green.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$stock',
                  style: GoogleFonts.spaceGrotesk(
                    fontWeight: FontWeight.w700,
                    color: isLow ? Colors.amber.shade700 : Colors.green,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: () => _adjustStock(article),
                child: Text('Ajuster', style: GoogleFonts.inter(color: AppColors.blue, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

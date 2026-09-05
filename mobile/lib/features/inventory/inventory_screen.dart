import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_parsers.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});
  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  List<dynamic> _inventories = [];
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
        ApiService.getInventories(),
        ApiService.getArticles(),
      ]);
      if (!mounted) return;
      setState(() {
        _inventories = results[0]['data'] ?? [];
        _products = results[1]['data'] ?? [];
        _loading = false;
        _error = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error =
            e.statusCode == 403 ? 'Plan Pro ou Business requis' : e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = '$e';
      });
    }
  }

  Future<void> _createInventory() async {
    if (_products.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aucun article en stock')),
      );
      return;
    }

    final nameController = TextEditingController(
      text:
          'Inventaire - ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
    );
    final notesController = TextEditingController();
    List<Map<String, dynamic>> countItems = _products
        .map((p) => {
              'article_id': p['id'],
              'name': p['name'],
              'system_quantity': jsonInt(p['stock'] ?? p['quantity']),
              'counted_quantity': null as int?,
            })
        .toList();

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final countedCount =
              countItems.where((i) => i['counted_quantity'] != null).length;

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.9,
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
                    border:
                        Border(bottom: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Nouvel inventaire',
                              style: GoogleFonts.sourceSans3(
                                  fontSize: 18, fontWeight: FontWeight.w700),
                            ),
                          ),
                          IconButton(
                            tooltip: 'Fermer',
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: nameController,
                        decoration: InputDecoration(
                          labelText: 'Nom de l\'inventaire',
                          border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 14),
                        ),
                      ),
                    ],
                  ),
                ),

                // Progress
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: Colors.grey.shade50,
                  child: Row(
                    children: [
                      const Icon(Icons.inventory_2, size: 18, color: AppColors.blue),
                      const SizedBox(width: 8),
                      Text(
                        '$countedCount / ${countItems.length} articles comptés',
                        style: GoogleFonts.sourceSans3(
                            fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      const Spacer(),
                      if (countedCount > 0)
                        Text(
                          '${((countedCount / countItems.length) * 100).round()}%',
                          style: GoogleFonts.sourceSans3(
                              color: AppColors.blue,
                              fontWeight: FontWeight.w700),
                        ),
                    ],
                  ),
                ),

                // Items
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: countItems.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final item = countItems[i];
                      final counted = item['counted_quantity'] as int?;
                      final system = jsonInt(item['system_quantity']);
                      final diff = counted != null ? counted - system : null;

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: counted != null
                              ? (diff == 0
                                  ? Colors.green.shade50
                                  : Colors.amber.shade50)
                              : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: counted != null
                                ? (diff == 0
                                    ? Colors.green.shade200
                                    : Colors.amber.shade200)
                                : Colors.grey.shade200,
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['name'],
                                      style: GoogleFonts.sourceSans3(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14)),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Stock système: $system',
                                    style: GoogleFonts.sourceSans3(
                                        color: AppColors.sub, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              width: 80,
                              child: TextField(
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                decoration: InputDecoration(
                                  hintText: '-',
                                  border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 10),
                                  isDense: true,
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                                onChanged: (v) {
                                  setModalState(() {
                                    countItems[i]['counted_quantity'] =
                                        v.isNotEmpty ? int.tryParse(v) : null;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 50,
                              child: diff != null
                                  ? Text(
                                      '${diff > 0 ? '+' : ''}$diff',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.sourceSans3(
                                        fontWeight: FontWeight.w700,
                                        color: diff > 0
                                            ? Colors.green
                                            : (diff < 0
                                                ? Colors.red
                                                : Colors.grey),
                                      ),
                                    )
                                  : const SizedBox(),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Footer
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    border:
                        Border(top: BorderSide(color: Colors.grey.shade200)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Annuler'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: countedCount == 0
                              ? null
                              : () async {
                                  try {
                                    final items = countItems
                                        .where((i) =>
                                            i['counted_quantity'] != null)
                                        .map((i) => {
                                              'article_id': i['article_id'],
                                              'system_quantity':
                                                  i['system_quantity'],
                                              'counted_quantity':
                                                  i['counted_quantity'],
                                            })
                                        .toList();
                                    await ApiService.createInventory({
                                      'name': nameController.text,
                                      'notes': notesController.text,
                                      'items': items,
                                    });
                                    if (ctx.mounted) Navigator.pop(ctx, true);
                                  } catch (e) {
                                    if (ctx.mounted) {
                                      ScaffoldMessenger.of(ctx).showSnackBar(
                                          SnackBar(content: Text('$e')));
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
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600)),
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

    if (!mounted) return;
    if (result == true) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Inventaire créé')));
      _loadData();
    }
  }

  Future<void> _completeInventory(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Terminer l\'inventaire'),
        content:
            const Text('Les écarts seront appliqués au stock. Confirmer ?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Confirmer')),
        ],
      ),
    );

    if (!mounted) return;
    if (confirm == true) {
      try {
        await ApiService.completeInventory(id);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Inventaire terminé, stock ajusté')));
        _loadData();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
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
        title: Text('Inventaires',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        actions: [
          IconButton(tooltip: 'Créer un inventaire', icon: const Icon(Icons.add), onPressed: _createInventory),
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
                        const Icon(Icons.lock, size: 48, color: AppColors.muted),
                        const SizedBox(height: 16),
                        Text(_error!,
                            textAlign: TextAlign.center,
                            style:
                                GoogleFonts.sourceSans3(color: AppColors.sub)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () =>
                              Navigator.pushNamed(context, '/subscription'),
                          child: const Text('Voir les plans'),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: _inventories.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(
                              height: MediaQuery.of(context).size.height * 0.6,
                              child: Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.inventory_outlined,
                                        size: 64, color: AppColors.muted),
                                    const SizedBox(height: 16),
                                    Text('Aucun inventaire',
                                        style: GoogleFonts.sourceSans3(
                                            color: AppColors.sub)),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      onPressed: _createInventory,
                                      icon: const Icon(Icons.add),
                                      label: const Text('Nouvel inventaire'),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _inventories.length,
                          itemBuilder: (_, i) => _buildCard(_inventories[i]),
                        ),
                ),
    );
  }

  Widget _buildCard(Map<String, dynamic> inv) {
    final status = inv['status'] ?? 'in_progress';
    final isCompleted = status == 'completed';
    final isCancelled = status == 'cancelled';
    final adjustment = inv['total_adjustment'] ?? 0;

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
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isCompleted
                      ? Colors.green.shade50
                      : isCancelled
                          ? Colors.red.shade50
                          : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isCompleted
                      ? Icons.check_circle
                      : isCancelled
                          ? Icons.cancel
                          : Icons.pending,
                  color: isCompleted
                      ? Colors.green
                      : isCancelled
                          ? Colors.red
                          : Colors.amber,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(inv['name'] ?? inv['reference'] ?? '',
                        style: GoogleFonts.sourceSans3(
                            fontWeight: FontWeight.w600)),
                    Text(
                      _formatDate(inv['created_at'] ?? ''),
                      style: GoogleFonts.sourceSans3(
                          color: AppColors.sub, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    isCompleted
                        ? 'Terminé'
                        : isCancelled
                            ? 'Annulé'
                            : 'En cours',
                    style: GoogleFonts.sourceSans3(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isCompleted
                          ? Colors.green
                          : isCancelled
                              ? Colors.red
                              : Colors.amber.shade700,
                    ),
                  ),
                  if (isCompleted && adjustment != 0)
                    Text(
                      '${adjustment > 0 ? '+' : ''}$adjustment',
                      style: GoogleFonts.sourceSans3(
                        fontWeight: FontWeight.w700,
                        color: adjustment > 0 ? Colors.green : Colors.red,
                      ),
                    ),
                ],
              ),
            ],
          ),
          if (status == 'in_progress') ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      try {
                        await ApiService.cancelInventory(inv['id']);
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Inventaire annulé')));
                        _loadData();
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context)
                            .showSnackBar(SnackBar(content: Text('$e')));
                      }
                    },
                    style:
                        OutlinedButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Annuler'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _completeInventory(inv['id']),
                    style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.green),
                    child: Text('Terminer',
                        style: GoogleFonts.sourceSans3(color: Colors.white)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
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

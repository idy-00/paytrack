import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_parsers.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _items = const [];
  bool _loading = true;
  bool _markingAll = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ApiService.getNotifications();
      if (!mounted) return;
      setState(() {
        _items = jsonList(jsonMap(response)['data']);
        _loading = false;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  Future<void> _markRead(Map<String, dynamic> item) async {
    if (item['read_at'] != null) return;
    try {
      await ApiService.markNotificationRead(jsonString(item['id']));
      if (!mounted) return;
      setState(() => item['read_at'] = DateTime.now().toIso8601String());
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _markAllRead() async {
    setState(() => _markingAll = true);
    try {
      await ApiService.markAllNotificationsRead();
      if (!mounted) return;
      setState(() {
        for (final item in _items) {
          jsonMap(item)['read_at'] = DateTime.now().toIso8601String();
        }
      });
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _markingAll = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((item) => jsonMap(item)['read_at'] == null).length;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(tooltip: 'Retour', icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.canPop() ? context.pop() : context.go('/dashboard')),
        title: Text('Notifications', style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700, color: AppColors.ink)),
        actions: [if (unread > 0) TextButton(onPressed: _markingAll ? null : _markAllRead, child: Text('Tout lire', style: GoogleFonts.sourceSans3(color: AppColors.greenDeep, fontWeight: FontWeight.w700)))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ErrorState(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _items.isEmpty
                      ? const _EmptyState()
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, index) => _NotificationTile(item: jsonMap(_items[index]), onTap: () => _markRead(jsonMap(_items[index]))),
                        ),
                ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.item, required this.onTap});
  final Map<String, dynamic> item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final data = jsonMap(item['data']);
    final unread = item['read_at'] == null;
    final withdrawal = data['category'] == 'withdrawal';
    return Material(
      color: unread ? AppColors.greenLight : AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16), onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: unread ? AppColors.green.withValues(alpha: .35) : AppColors.borderSoft)),
          child: Row(children: [
            Container(width: 42, height: 42, decoration: BoxDecoration(color: withdrawal ? Colors.amber.withValues(alpha: .16) : AppColors.blueLight, borderRadius: BorderRadius.circular(13)), child: Icon(withdrawal ? Icons.account_balance_wallet_outlined : Icons.notifications_outlined, color: withdrawal ? Colors.amber.shade800 : AppColors.blue)),
            const SizedBox(width: 13),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(jsonString(data['title'], fallback: 'Notification'), style: GoogleFonts.sourceSans3(fontWeight: unread ? FontWeight.w700 : FontWeight.w600, color: AppColors.ink)),
              const SizedBox(height: 3),
              Text(jsonString(data['message']), style: GoogleFonts.sourceSans3(fontSize: 13, color: AppColors.sub, height: 1.35)),
            ])),
            if (unread) Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.green, shape: BoxShape.circle)),
          ]),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) => ListView(children: const [SizedBox(height: 130), Center(child: Icon(Icons.notifications_none_rounded, size: 56, color: AppColors.muted)), SizedBox(height: 16), Center(child: Text('Aucune notification pour le moment'))]);
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [Text(message, textAlign: TextAlign.center), const SizedBox(height: 14), FilledButton(onPressed: onRetry, child: const Text('Réessayer'))])));
}

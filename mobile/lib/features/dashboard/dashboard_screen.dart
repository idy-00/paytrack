import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/sale.dart';
import '../../features/auth/auth_provider.dart';
import '../../features/dashboard/dashboard_provider.dart';
import '../../features/sales/sales_provider.dart';
import '../../shared/widgets/status_badge.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _navIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(dashboardProvider.notifier).fetchDashboard();
      ref.read(salesProvider.notifier).fetchSales();
    });
  }

  void _onNavTap(int index) {
    if (index == 4) {
      _showMoreDrawer();
      return;
    }
    setState(() => _navIndex = index);
    switch (index) {
      case 0: context.go('/dashboard'); break;
      case 1: context.go('/commandes'); break;
      case 2: context.go('/ventes'); break;
      case 3: context.go('/portefeuille'); break;
    }
  }

  void _showMoreDrawer() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Menu',
      barrierColor: Colors.black.withValues(alpha: 0.5),
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (_, __, ___) => const SizedBox(),
      transitionBuilder: (ctx, anim, _, __) {
        final slideAnim = Tween<Offset>(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic));

        return Stack(
          children: [
            // Drawer
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: 280,
              child: SlideTransition(
                position: slideAnim,
                child: Material(
                  color: AppColors.surface,
                  child: SafeArea(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 20, 12, 16),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  gradient: AppColors.heroGradient,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.apps_rounded, color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Menu',
                                style: GoogleFonts.spaceGrotesk(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.ink,
                                ),
                              ),
                              const Spacer(),
                              IconButton(
                                onPressed: () => Navigator.pop(ctx),
                                icon: Icon(Icons.close, color: AppColors.sub),
                              ),
                            ],
                          ),
                        ),
                        Divider(color: AppColors.borderSoft, height: 1),

                        // Menu items
                        Expanded(
                          child: ListView(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            children: [
                              _buildDrawerSection('Gestion'),
                              _buildDrawerItem(ctx, Icons.people_rounded, 'Clients', '/clients'),
                              _buildDrawerItem(ctx, Icons.payments_rounded, 'Paiements', '/paiements'),
                              _buildDrawerItem(ctx, Icons.qr_code_scanner_rounded, 'Scanner QR', '/qr-scan'),

                              const SizedBox(height: 8),
                              _buildDrawerSection('Stock'),
                              _buildDrawerItem(ctx, Icons.inventory_2_rounded, 'Articles', '/stock'),
                              _buildDrawerItem(ctx, Icons.checklist_rounded, 'Inventaires', '/inventaires'),
                              _buildDrawerItem(ctx, Icons.local_shipping_rounded, 'Fournisseurs', '/fournisseurs'),
                              _buildDrawerItem(ctx, Icons.receipt_long_rounded, 'Cmd fournisseurs', '/commandes-fournisseurs'),

                              const SizedBox(height: 8),
                              _buildDrawerSection('Compte'),
                              _buildDrawerItem(ctx, Icons.person_rounded, 'Profil', '/profil'),
                              _buildDrawerItem(ctx, Icons.star_rounded, 'Abonnement', '/abonnement'),
                            ],
                          ),
                        ),

                        // Footer
                        Divider(color: AppColors.borderSoft, height: 1),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            'PayTrack v1.0',
                            style: GoogleFonts.inter(fontSize: 11, color: AppColors.muted),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDrawerSection(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.muted,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(BuildContext ctx, IconData icon, String label, String route) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.pop(ctx);
          context.go(route);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.blueLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.blue, size: 18),
              ),
              const SizedBox(width: 14),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.ink,
                ),
              ),
              const Spacer(),
              Icon(Icons.chevron_right_rounded, color: AppColors.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final firstName = user?.name.split(' ').first ?? 'vous';

    final dashState = ref.watch(dashboardProvider);
    final salesState = ref.watch(salesProvider);

    final stats = dashState.stats;
    final sales = salesState.sales;

    final retardSales = sales.where((s) => s.status == SaleStatus.retard).toList();
    final recentSales = sales.take(4).toList();
    final soldeCount = stats?.ventesSoldees ?? 0;
    final actifCount = stats?.ventesActives ?? 0;
    final totalRestant = stats?.totalRestant ?? 0;
    final totalEncaisse = stats?.totalEncaisse ?? 0;
    final encaisseMois = 0; // API doesn't return this yet
    final today = DateFormat('EEEE d MMMM', 'fr_FR').format(DateTime.now());

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      bottomNavigationBar: _buildNavBar(),
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Header ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Bonjour, $firstName',
                            style: GoogleFonts.spaceGrotesk(
                              fontSize: 24,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            today,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.sub,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _buildAvatarMenu(user),
                  ],
                ),
              ),
            ),

            // ── Hero revenue card ───────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: _buildHeroCard(totalEncaisse, totalRestant, encaisseMois),
              ),
            ),

            // ── KPI row ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _buildMiniKpi(
                      icon: Icons.check_circle_rounded,
                      iconColor: AppColors.success,
                      label: 'Soldées',
                      value: '$soldeCount',
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMiniKpi(
                      icon: Icons.autorenew_rounded,
                      iconColor: AppColors.blue,
                      label: 'Actives',
                      value: '$actifCount',
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMiniKpi(
                      icon: Icons.warning_amber_rounded,
                      iconColor: AppColors.warning,
                      label: 'Retards',
                      value: '${retardSales.length}',
                    )),
                  ],
                ),
              ),
            ),

            // ── Retards section ─────────────────────────────────────────
            if (retardSales.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                  child: Row(
                    children: [
                      Container(
                        width: 4,
                        height: 20,
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Retards',
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.warningLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${retardSales.length}',
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.warning,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 100,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: retardSales.length,
                    itemBuilder: (_, i) => _buildRetardCard(retardSales[i], i),
                  ),
                ),
              ),
            ],

            // ── Ventes récentes ──────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.blue,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Ventes récentes',
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => context.go('/ventes'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.blueLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Voir tout',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.blue,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _buildRecentSaleCard(recentSales[i]),
                  childCount: recentSales.length,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Hero Card ─────────────────────────────────────────────────────────────
  Widget _buildHeroCard(int totalEncaisse, int totalRestant, int encaisseMois) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: AppColors.heroShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.trending_up_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Total encaissé',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
                ),
                child: Text(
                  'Ce mois : ${formatAmount(encaisseMois)}',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            formatAmount(totalEncaisse),
            style: GoogleFonts.spaceGrotesk(
              fontSize: 34,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: -1.0,
              fontFeatures: [const FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 18),
          Container(
            height: 1,
            color: Colors.white.withValues(alpha: 0.15),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildHeroStat('À encaisser', formatAmount(totalRestant)),
              Container(
                width: 1,
                height: 32,
                margin: const EdgeInsets.symmetric(horizontal: 20),
                color: Colors.white.withValues(alpha: 0.15),
              ),
              _buildHeroStat('Taux', '${(totalEncaisse + totalRestant) > 0 ? ((totalEncaisse / (totalEncaisse + totalRestant)) * 100).round() : 0}%'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeroStat(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.6),
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              fontFeatures: [const FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }

  // ── Mini KPI ──────────────────────────────────────────────────────────────
  Widget _buildMiniKpi({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSoft),
        boxShadow: AppColors.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 17, color: iconColor),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.sub,
              fontWeight: FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }

  // ── Retard Card (horizontal scroll) ───────────────────────────────────────
  Widget _buildRetardCard(Sale sale, int index) {
    final colors = [
      const Color(0xFFFF6B35),
      const Color(0xFFD97706),
      const Color(0xFFE85D04),
    ];
    final color = colors[index % colors.length];

    return GestureDetector(
      onTap: () => context.push('/ventes/${sale.id}'),
      child: Container(
        width: 240,
        margin: EdgeInsets.only(right: index < 10 ? 12 : 0),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: AppColors.cardShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  sale.clientName.split(' ').map((p) => p[0]).take(2).join(),
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    sale.clientName,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sale.articleName,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppColors.sub,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    formatAmount(sale.remainingAmount),
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: color,
                      fontFeatures: [const FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: AppColors.muted,
            ),
          ],
        ),
      ),
    );
  }

  // ── Recent Sale Card ──────────────────────────────────────────────────────
  Widget _buildRecentSaleCard(Sale sale) {
    final initials = sale.clientName
        .split(' ')
        .map((p) => p.isNotEmpty ? p[0] : '')
        .take(2)
        .join();

    return GestureDetector(
      onTap: () => context.push('/ventes/${sale.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.borderSoft),
          boxShadow: AppColors.cardShadow,
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.blue.withValues(alpha: 0.1),
                    AppColors.blue.withValues(alpha: 0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.blue.withValues(alpha: 0.1),
                ),
              ),
              child: Center(
                child: Text(
                  initials,
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.blue,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sale.clientName,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sale.articleName,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.sub,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                StatusBadge(status: sale.status, compact: true),
                const SizedBox(height: 6),
                Text(
                  formatAmount(sale.totalAmount),
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                    fontFeatures: [const FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ── Avatar Popup Menu ──────────────────────────────────────────────────────
  OverlayEntry? _avatarOverlay;
  final LayerLink _avatarLayerLink = LayerLink();

  Widget _buildAvatarMenu(user) {
    final initials = user?.name
        .split(' ')
        .map((p) => p.isNotEmpty ? p[0] : '')
        .take(2)
        .join() ?? 'MD';

    return CompositedTransformTarget(
      link: _avatarLayerLink,
      child: GestureDetector(
        onTap: () => _showAvatarMenu(user),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: AppColors.darkGradient,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: AppColors.ink.withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: Text(
              initials,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 14,
                color: Colors.white.withValues(alpha: 0.9),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showAvatarMenu(user) {
    _avatarOverlay?.remove();
    _avatarOverlay = OverlayEntry(
      builder: (ctx) => Stack(
        children: [
          // Backdrop
          Positioned.fill(
            child: GestureDetector(
              onTap: _hideAvatarMenu,
              child: Container(color: Colors.transparent),
            ),
          ),
          // Menu
          Positioned(
            right: 20,
            top: 80,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              builder: (_, value, child) => Transform.scale(
                scale: 0.9 + (0.1 * value),
                alignment: Alignment.topRight,
                child: Opacity(opacity: value, child: child),
              ),
              child: Material(
                color: Colors.transparent,
                child: Container(
                  width: 220,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                gradient: AppColors.heroGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Center(
                                child: Text(
                                  user?.name?.split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join() ?? 'MD',
                                  style: GoogleFonts.spaceGrotesk(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.name ?? 'Utilisateur',
                                    style: GoogleFonts.spaceGrotesk(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    user?.email ?? '',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: AppColors.sub,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Divider(height: 1, color: AppColors.borderSoft),
                      // Menu items
                      _buildAvatarMenuItem(Icons.person_outline_rounded, 'Profil', () {
                        _hideAvatarMenu();
                      }),
                      _buildAvatarMenuItem(Icons.star_outline_rounded, 'Abonnement', () {
                        _hideAvatarMenu();
                        context.go('/abonnement');
                      }),
                      _buildAvatarMenuItem(Icons.notifications_none_rounded, 'Notifications', () {
                        _hideAvatarMenu();
                      }),
                      Divider(height: 1, color: AppColors.borderSoft),
                      _buildAvatarMenuItem(Icons.logout_rounded, 'Déconnexion', () {
                        _hideAvatarMenu();
                        ref.read(authProvider.notifier).logout();
                        context.go('/login');
                      }, isDestructive: true),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
    Overlay.of(context).insert(_avatarOverlay!);
  }

  void _hideAvatarMenu() {
    _avatarOverlay?.remove();
    _avatarOverlay = null;
  }

  Widget _buildAvatarMenuItem(IconData icon, String label, VoidCallback onTap, {bool isDestructive = false}) {
    final color = isDestructive ? AppColors.danger : AppColors.ink;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 12),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Navigation Bar ────────────────────────────────────────────────────────
  Widget _buildNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(color: AppColors.borderSoft, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(0, Icons.home_outlined, Icons.home_rounded, 'Accueil'),
              _buildNavItem(1, Icons.shopping_bag_outlined, Icons.shopping_bag_rounded, 'Commandes'),
              _buildNavItem(2, Icons.receipt_long_outlined, Icons.receipt_long_rounded, 'Ventes'),
              _buildNavItem(3, Icons.account_balance_wallet_outlined, Icons.account_balance_wallet_rounded, 'Portefeuille'),
              _buildNavItem(4, Icons.menu_rounded, Icons.menu_rounded, 'Plus'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final isActive = _navIndex == index;
    return GestureDetector(
      onTap: () => _onNavTap(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.blueLight : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 22,
              color: isActive ? AppColors.blue : AppColors.muted,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? AppColors.blue : AppColors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

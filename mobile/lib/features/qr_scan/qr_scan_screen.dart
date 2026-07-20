import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/theme/app_colors.dart';
import '../../data/mock/mock_data.dart';

class QRScanScreen extends StatefulWidget {
  const QRScanScreen({super.key});

  @override
  State<QRScanScreen> createState() => _QRScanScreenState();
}

class _QRScanScreenState extends State<QRScanScreen>
    with WidgetsBindingObserver, SingleTickerProviderStateMixin {
  final MobileScannerController _controller = MobileScannerController();
  final _manualCtrl = TextEditingController();
  bool _hasPermission = true;
  bool _scanned = false;
  bool _showManual = false;

  // Scan-line animation
  late AnimationController _lineAnim;
  late Animation<double> _linePos;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _lineAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _linePos = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _lineAnim, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    _manualCtrl.dispose();
    _lineAnim.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_controller.value.isInitialized) return;
    if (state == AppLifecycleState.resumed) {
      _controller.start();
    } else if (state == AppLifecycleState.paused) {
      _controller.stop();
    }
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    for (final barcode in capture.barcodes) {
      final raw = barcode.rawValue;
      if (raw == null) continue;
      _handleScannedValue(raw);
      break;
    }
  }

  void _handleScannedValue(String value) {
    final uuid = value.split('/').last.trim();
    final sale = mockSales
        .where((s) => s.qrUuid == uuid || s.qrUuid == value || s.reference == value)
        .firstOrNull;

    if (sale != null) {
      setState(() => _scanned = true);
      _controller.stop();
      context.push('/ventes/${sale.id}').then((_) {
        if (mounted) {
          setState(() => _scanned = false);
          _controller.start();
        }
      });
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Aucune vente trouvée pour ce code',
            style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
          ),
          backgroundColor: AppColors.danger,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        ),
      );
    }
  }

  void _manualSearch() {
    final query = _manualCtrl.text.trim();
    if (query.isEmpty) return;
    _handleScannedValue(query);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F2744),
      body: SafeArea(
        child: _hasPermission ? _buildScannerBody() : _buildPermissionDenied(),
      ),
    );
  }

  Widget _buildScannerBody() {
    return Column(
      children: [
        // ── Top bar ──────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 22),
                onPressed: () => context.go('/dashboard'),
                tooltip: 'Fermer',
              ),
              Expanded(
                child: Text(
                  'Scanner un QR',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.flash_on_outlined,
                    color: Colors.white70, size: 22),
                onPressed: () => _controller.toggleTorch(),
                tooltip: 'Lampe torche',
              ),
            ],
          ),
        ),

        // ── Camera view ───────────────────────────────────────────────────────
        Expanded(
          child: Stack(
            children: [
              // Camera
              MobileScanner(
                controller: _controller,
                onDetect: _onDetect,
                errorBuilder: (context, error, child) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) setState(() => _hasPermission = false);
                  });
                  return _buildPermissionDenied();
                },
              ),

              // Dark vignette overlay (4 semi-transparent bands outside frame)
              _buildVignette(),

              // Scan frame with animated corners + scan line
              Center(child: _buildScanFrame()),
            ],
          ),
        ),

        // ── Bottom: instructions + manual entry ───────────────────────────────
        Container(
          color: const Color(0xFF0F2744),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          child: Column(
            children: [
              Text(
                'Scanner le QR Code',
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Placez le code QR dans le cadre ci-dessus',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: Colors.white54,
                ),
              ),
              const SizedBox(height: 20),

              // Toggle manual entry
              GestureDetector(
                onTap: () => setState(() => _showManual = !_showManual),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _showManual
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard,
                      size: 16,
                      color: AppColors.blue,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Saisie manuelle',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.blue,
                      ),
                    ),
                  ],
                ),
              ),

              if (_showManual) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _manualCtrl,
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                        cursorColor: AppColors.blue,
                        decoration: InputDecoration(
                          hintText: 'Référence VT-2026-XXXX',
                          hintStyle: GoogleFonts.outfit(
                            color: Colors.white38,
                            fontSize: 13,
                          ),
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.08),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 13,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(
                              color: AppColors.blue,
                              width: 1.5,
                            ),
                          ),
                        ),
                        onSubmitted: (_) => _manualSearch(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.blue,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(56, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                        onPressed: _manualSearch,
                        child: Text(
                          'Rechercher',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // ── Vignette: dark overlay masking outside the scan frame ─────────────────
  Widget _buildVignette() {
    const frameSize = 240.0;
    return LayoutBuilder(builder: (context, constraints) {
      final w = constraints.maxWidth;
      final h = constraints.maxHeight;
      final cx = w / 2;
      final cy = h / 2;
      const half = frameSize / 2;

      return Stack(
        children: [
          // Top
          Positioned(
            top: 0, left: 0, right: 0,
            height: cy - half,
            child: ColoredBox(color: Colors.black.withValues(alpha: 0.55)),
          ),
          // Bottom
          Positioned(
            bottom: 0, left: 0, right: 0,
            height: cy - half,
            child: ColoredBox(color: Colors.black.withValues(alpha: 0.55)),
          ),
          // Left
          Positioned(
            top: cy - half, bottom: cy - half, left: 0,
            width: cx - half,
            child: ColoredBox(color: Colors.black.withValues(alpha: 0.55)),
          ),
          // Right
          Positioned(
            top: cy - half, bottom: cy - half, right: 0,
            width: cx - half,
            child: ColoredBox(color: Colors.black.withValues(alpha: 0.55)),
          ),
        ],
      );
    });
  }

  // ── Scan frame: 4 corners + animated scan line ────────────────────────────
  Widget _buildScanFrame() {
    const frameSize = 240.0;
    const cornerW = 8.0;
    const cornerLen = 40.0;
    const color = AppColors.blue;

    return SizedBox(
      width: frameSize,
      height: frameSize,
      child: Stack(
        children: [
          // Top-left corner
          Positioned(
            top: 0, left: 0,
            child: _corner(cornerW, cornerLen, color, top: true, left: true),
          ),
          // Top-right corner
          Positioned(
            top: 0, right: 0,
            child: _corner(cornerW, cornerLen, color, top: true, left: false),
          ),
          // Bottom-left corner
          Positioned(
            bottom: 0, left: 0,
            child: _corner(cornerW, cornerLen, color, top: false, left: true),
          ),
          // Bottom-right corner
          Positioned(
            bottom: 0, right: 0,
            child: _corner(cornerW, cornerLen, color, top: false, left: false),
          ),

          // Animated scan line
          AnimatedBuilder(
            animation: _linePos,
            builder: (_, __) {
              final topOffset = _linePos.value * (frameSize - 4);
              return Positioned(
                top: topOffset,
                left: 10,
                right: 10,
                child: Container(
                  height: 2,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        AppColors.blue.withValues(alpha: 0.9),
                        Colors.transparent,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(1),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _corner(
    double thickness,
    double length,
    Color color, {
    required bool top,
    required bool left,
  }) {
    return SizedBox(
      width: length,
      height: length,
      child: CustomPaint(
        painter: _CornerPainter(
          color: color,
          thickness: thickness,
          top: top,
          left: left,
        ),
      ),
    );
  }

  // ── Permission denied state ───────────────────────────────────────────────
  Widget _buildPermissionDenied() {
    return Container(
      color: const Color(0xFF0F2744),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.06),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.no_photography_outlined,
                  size: 48,
                  color: Colors.white38,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Accès caméra refusé',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Autorisez l\'accès à la caméra dans les paramètres de votre appareil pour scanner des QR codes.',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: Colors.white54,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: Colors.white24),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    onPressed: () => context.go('/dashboard'),
                    child: Text(
                      'Retour',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      elevation: 0,
                    ),
                    onPressed: () {
                      setState(() {
                        _hasPermission = true;
                        _scanned = false;
                      });
                      _controller.start();
                    },
                    child: Text(
                      'Réessayer',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Corner painter ────────────────────────────────────────────────────────────
class _CornerPainter extends CustomPainter {
  final Color color;
  final double thickness;
  final bool top;
  final bool left;

  const _CornerPainter({
    required this.color,
    required this.thickness,
    required this.top,
    required this.left,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final w = size.width;
    final h = size.height;

    if (top && left) {
      canvas.drawLine(const Offset(0, 0), Offset(w, 0), paint);
      canvas.drawLine(const Offset(0, 0), Offset(0, h), paint);
    } else if (top && !left) {
      canvas.drawLine(const Offset(0, 0), Offset(w, 0), paint);
      canvas.drawLine(Offset(w, 0), Offset(w, h), paint);
    } else if (!top && left) {
      canvas.drawLine(const Offset(0, 0), Offset(0, h), paint);
      canvas.drawLine(Offset(0, h), Offset(w, h), paint);
    } else {
      canvas.drawLine(Offset(w, 0), Offset(w, h), paint);
      canvas.drawLine(Offset(0, h), Offset(w, h), paint);
    }
  }

  @override
  bool shouldRepaint(_CornerPainter old) => old.color != color;
}

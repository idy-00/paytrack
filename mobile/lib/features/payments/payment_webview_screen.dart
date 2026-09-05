import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/theme/app_colors.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;
  final String successUrl;
  final String cancelUrl;
  final String? title;

  const PaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
    required this.successUrl,
    required this.cancelUrl,
    this.title,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _loading = true),
        onPageFinished: (_) => setState(() => _loading = false),
        onProgress: (p) => setState(() => _progress = p / 100),
        onNavigationRequest: (request) {
          final url = request.url;

          // Check success redirect
          if (url.startsWith(widget.successUrl) ||
              url.contains('payment/success') ||
              url.contains('success=true')) {
            _handleSuccess();
            return NavigationDecision.prevent;
          }

          // Check cancel redirect
          if (url.startsWith(widget.cancelUrl) ||
              url.contains('payment/cancel') ||
              url.contains('cancel=true')) {
            _handleCancel();
            return NavigationDecision.prevent;
          }

          return NavigationDecision.navigate;
        },
        onWebResourceError: (error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erreur: ${error.description}')),
          );
        },
      ))
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  void _handleSuccess() {
    if (mounted) {
      context
          .pop({'success': true, 'message': 'Paiement effectue avec succes'});
    }
  }

  void _handleCancel() {
    if (mounted) {
      context.pop({'success': false, 'message': 'Paiement annule'});
    }
  }

  Future<bool> _onWillPop() async {
    final canGoBack = await _controller.canGoBack();
    if (canGoBack) {
      _controller.goBack();
      return false;
    }
    if (!mounted) return false;

    // Confirm exit
    final exit = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Annuler le paiement ?',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        content:
            const Text('Voulez-vous vraiment quitter et annuler ce paiement ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Non, continuer'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Oui, annuler'),
          ),
        ],
      ),
    );

    if (exit == true && mounted) {
      context.pop({'success': false, 'message': 'Paiement annule'});
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onWillPop();
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          title: Text(
            widget.title ?? 'Paiement',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700),
          ),
          leading: IconButton(
            tooltip: 'Fermer',
            icon: const Icon(Icons.close),
            onPressed: _onWillPop,
          ),
          bottom: _loading
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(3),
                  child: LinearProgressIndicator(
                    value: _progress,
                    backgroundColor: AppColors.borderSoft,
                    valueColor:
                        const AlwaysStoppedAnimation<Color>(AppColors.blue),
                  ),
                )
              : null,
        ),
        body: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_loading && _progress < 0.1)
              Container(
                color: AppColors.background,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: AppColors.blue),
                      const SizedBox(height: 16),
                      Text(
                        'Chargement du paiement...',
                        style: GoogleFonts.sourceSans3(color: AppColors.sub),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

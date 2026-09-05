import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/paytrack_mark.dart';

/// Branded launch moment grounded in the everyday commerce PayTrack serves.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1150))
      ..forward();
    Timer(const Duration(milliseconds: 2050), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reveal =
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/splash_shop_payment_v2.png',
              fit: BoxFit.cover),
          DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.ink.withValues(alpha: .56),
            ),
          ),
          SafeArea(
            child: FadeTransition(
              opacity: reveal,
              child: ScaleTransition(
                scale: Tween<double>(begin: .94, end: 1).animate(reveal),
                child: Column(
                  children: [
                    const Spacer(flex: 4),
                    Container(
                      width: 92,
                      height: 92,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .96),
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.black.withValues(alpha: .25),
                              blurRadius: 30,
                              offset: const Offset(0, 14))
                        ],
                      ),
                      child: const PayTrackMark(size: 60),
                    ),
                    const SizedBox(height: 20),
                    Text('PayTrack',
                        style: GoogleFonts.sourceSans3(
                            color: Colors.white,
                            fontSize: 31,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -1)),
                    const SizedBox(height: 8),
                    Text('Chaque paiement construit votre élan.',
                        style: GoogleFonts.sourceSans3(
                            color: Colors.white.withValues(alpha: .82),
                            fontSize: 14,
                            fontWeight: FontWeight.w500)),
                    const Spacer(flex: 3),
                    Container(
                        width: 44,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 28),
                        decoration: BoxDecoration(
                            color: AppColors.green,
                            borderRadius: BorderRadius.circular(99))),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

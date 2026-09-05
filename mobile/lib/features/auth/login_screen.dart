import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/paytrack_mark.dart';
import 'auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscure = true;
  bool _rememberMe = false;
  bool _isLoading = false;
  String? _error;

  late final AnimationController _animCtrl;
  late final Animation<double> _fadeAnim;
  late final Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: const Interval(0.0, 0.7, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animCtrl,
      curve: const Interval(0.1, 1.0, curve: Curves.easeOutCubic),
    ));
    _animCtrl.forward();
    _loadSavedEmail();
  }

  Future<void> _loadSavedEmail() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('remember_email') ?? '';
    if (saved.isNotEmpty) {
      setState(() {
        _emailCtrl.text = saved;
        _rememberMe = true;
      });
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    await ref.read(authProvider.notifier).login(email, password);
    if (!mounted) return;

    final auth = ref.read(authProvider);

    if (!auth.isLoggedIn) {
      setState(() {
        _isLoading = false;
        _error = auth.error ?? 'Email ou mot de passe incorrect.';
      });
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    if (_rememberMe) {
      await prefs.setString('remember_email', email);
    } else {
      await prefs.remove('remember_email');
    }

    if (!mounted) return;
    if (auth.user!.role == 'client') {
      context.go('/client-dashboard');
    } else {
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 48),

                    // ── Logo ────────────────────────────────────────────────
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            padding: const EdgeInsets.all(11),
                            decoration: BoxDecoration(
                              color: AppColors.greenLight,
                              borderRadius: BorderRadius.circular(22),
                              border: Border.all(
                                  color: AppColors.green.withValues(alpha: .2)),
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      AppColors.green.withValues(alpha: 0.22),
                                  blurRadius: 20,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const PayTrackMark(size: 45),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'PayTrack',
                            style: GoogleFonts.sourceSans3(
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Suivi de paiements intelligent',
                            style: GoogleFonts.sourceSans3(
                              fontSize: 13,
                              color: AppColors.sub,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 40),

                    // ── Titre ────────────────────────────────────────────────
                    Text(
                      'Connexion',
                      style: GoogleFonts.sourceSans3(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Accédez à votre espace',
                      style: GoogleFonts.sourceSans3(
                        fontSize: 14,
                        color: AppColors.sub,
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── Email ────────────────────────────────────────────────
                    _fieldLabel('Adresse e-mail'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autocorrect: false,
                      style: GoogleFonts.sourceSans3(
                        fontSize: 15,
                        color: AppColors.ink,
                      ),
                      cursorColor: AppColors.blue,
                      decoration: _fieldDeco(
                        hint: 'vous@boutique.com',
                        prefix: Icons.email_outlined,
                      ),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return 'Email requis';
                        }
                        final re = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
                        if (!re.hasMatch(v.trim())) {
                          return 'Format e-mail invalide';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    // ── Mot de passe ─────────────────────────────────────────
                    _fieldLabel('Mot de passe'),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _passCtrl,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) {
                        if (!_isLoading) _submit();
                      },
                      style: GoogleFonts.sourceSans3(
                        fontSize: 15,
                        color: AppColors.ink,
                      ),
                      cursorColor: AppColors.blue,
                      decoration: _fieldDeco(
                        hint: '••••••••',
                        prefix: Icons.lock_outline_rounded,
                        suffixWidget: GestureDetector(
                          onTap: () => setState(() => _obscure = !_obscure),
                          child: Padding(
                            padding: const EdgeInsets.only(right: 14),
                            child: Icon(
                              _obscure
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              size: 18,
                              color: AppColors.sub,
                            ),
                          ),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Mot de passe requis';
                        }
                        if (v.length < 8) return 'Minimum 8 caractères';
                        return null;
                      },
                    ),

                    const SizedBox(height: 16),

                    // ── Se souvenir + oublié ────────────────────────────────
                    Wrap(
                      alignment: WrapAlignment.spaceBetween,
                      runSpacing: 4,
                      children: [
                        GestureDetector(
                          onTap: () =>
                              setState(() => _rememberMe = !_rememberMe),
                          child: Row(
                            children: [
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  color: _rememberMe
                                      ? AppColors.blue
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: _rememberMe
                                        ? AppColors.blue
                                        : AppColors.border,
                                    width: 1.5,
                                  ),
                                ),
                                child: _rememberMe
                                    ? const Icon(Icons.check,
                                        size: 14, color: Colors.white)
                                    : null,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Se souvenir',
                                style: GoogleFonts.sourceSans3(
                                  fontSize: 13,
                                  color: AppColors.sub,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push('/mot-de-passe-oublie'),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            foregroundColor: AppColors.blue,
                          ),
                          child: Text(
                            'Mot de passe oublié ?',
                            style: GoogleFonts.sourceSans3(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // ── Erreur ───────────────────────────────────────────────
                    if (_error != null) ...[
                      const SizedBox(height: 18),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.dangerLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.danger.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline_rounded,
                              size: 16,
                              color: AppColors.danger,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _error!,
                                style: GoogleFonts.sourceSans3(
                                  fontSize: 13,
                                  color: AppColors.danger,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),

                    // ── Bouton ───────────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: _isLoading
                              ? AppColors.green.withValues(alpha: 0.5)
                              : AppColors.green,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: _isLoading
                              ? null
                              : [
                                  BoxShadow(
                                    color:
                                        AppColors.blue.withValues(alpha: 0.3),
                                    blurRadius: 16,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                        ),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: _isLoading ? null : _submit,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  'Se connecter',
                                  style: GoogleFonts.sourceSans3(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // ── Lien inscription ─────────────────────────────────────
                    Center(
                      child: Wrap(
                        alignment: WrapAlignment.center,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 3,
                        children: [
                          Text(
                            'Pas encore de compte ?',
                            style: GoogleFonts.sourceSans3(
                              fontSize: 13,
                              color: AppColors.sub,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/register'),
                            child: Text(
                              "S'inscrire",
                              style: GoogleFonts.sourceSans3(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.blue,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _fieldLabel(String text) => Text(
        text,
        style: GoogleFonts.sourceSans3(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.ink,
        ),
      );

  InputDecoration _fieldDeco({
    required String hint,
    required IconData prefix,
    Widget? suffixWidget,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.sourceSans3(
        fontSize: 14,
        color: AppColors.hint,
      ),
      prefixIcon: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Icon(prefix, size: 18, color: AppColors.sub),
      ),
      prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      suffixIcon: suffixWidget,
      suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      filled: true,
      fillColor: AppColors.surface,
      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.blue, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.danger, width: 1.5),
      ),
      errorStyle: GoogleFonts.sourceSans3(
        fontSize: 11,
        color: AppColors.danger,
      ),
    );
  }
}

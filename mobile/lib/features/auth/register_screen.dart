import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/services/api_service.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _shopNameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();

  bool _obscurePass = true;
  bool _obscureConfirm = true;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _shopNameCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() { _isLoading = true; _error = null; });

    try {
      await ApiService.post('/auth/register', {
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'shop_name': _shopNameCtrl.text.trim(),
        'password': _passCtrl.text,
        'password_confirmation': _confirmCtrl.text,
      });

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Compte créé ! Connectez-vous maintenant.'),
          backgroundColor: AppColors.success,
        ),
      );
      context.go('/login');
    } on ApiException catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.message;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Erreur de connexion. Réessayez.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),

                // Back button
                GestureDetector(
                  onTap: () => context.go('/login'),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.arrow_back, size: 20, color: AppColors.ink),
                  ),
                ),

                const SizedBox(height: 24),

                // Title
                Text(
                  'Créer un compte',
                  style: GoogleFonts.spaceGrotesk(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Rejoignez PayTrack gratuitement',
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.sub),
                ),

                const SizedBox(height: 28),

                // Name
                _fieldLabel('Nom complet'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nameCtrl,
                  textCapitalization: TextCapitalization.words,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('Moussa Diallo', Icons.person_outline),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Nom requis' : null,
                ),

                const SizedBox(height: 18),

                // Email
                _fieldLabel('Adresse e-mail'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('vous@exemple.com', Icons.email_outlined),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email requis';
                    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v)) {
                      return 'Email invalide';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 18),

                // Phone
                _fieldLabel('Téléphone'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('+221 77 123 45 67', Icons.phone_outlined),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Téléphone requis' : null,
                ),

                const SizedBox(height: 18),

                // Shop name
                _fieldLabel('Nom de la boutique'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _shopNameCtrl,
                  textCapitalization: TextCapitalization.words,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('Ma Boutique', Icons.store_outlined),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Nom de boutique requis' : null,
                ),

                const SizedBox(height: 18),

                // Password
                _fieldLabel('Mot de passe'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscurePass,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('Minimum 8 caractères', Icons.lock_outline).copyWith(
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _obscurePass = !_obscurePass),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 14),
                        child: Icon(
                          _obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          size: 18,
                          color: AppColors.sub,
                        ),
                      ),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Mot de passe requis';
                    if (v.length < 8) return 'Minimum 8 caractères';
                    return null;
                  },
                ),

                const SizedBox(height: 18),

                // Confirm password
                _fieldLabel('Confirmer le mot de passe'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmCtrl,
                  obscureText: _obscureConfirm,
                  style: GoogleFonts.inter(fontSize: 15, color: AppColors.ink),
                  decoration: _inputDeco('Retapez votre mot de passe', Icons.lock_outline).copyWith(
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 14),
                        child: Icon(
                          _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          size: 18,
                          color: AppColors.sub,
                        ),
                      ),
                    ),
                  ),
                  validator: (v) {
                    if (v != _passCtrl.text) return 'Les mots de passe ne correspondent pas';
                    return null;
                  },
                ),

                // Error
                if (_error != null) ...[
                  const SizedBox(height: 18),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.dangerLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.danger.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, size: 16, color: AppColors.danger),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _error!,
                            style: GoogleFonts.inter(fontSize: 13, color: AppColors.danger),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 28),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: _isLoading ? null : AppColors.heroGradient,
                      color: _isLoading ? AppColors.blue.withValues(alpha: 0.5) : null,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: _isLoading ? null : [
                        BoxShadow(
                          color: AppColors.blue.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _isLoading ? null : _submit,
                      child: _isLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                            )
                          : Text(
                              "S'inscrire",
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    Expanded(child: Divider(color: AppColors.border)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('ou continuer avec', style: GoogleFonts.inter(fontSize: 12, color: AppColors.sub)),
                    ),
                    Expanded(child: Divider(color: AppColors.border)),
                  ],
                ),

                const SizedBox(height: 20),

                // OAuth buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: Image.network(
                          'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                          width: 20,
                          height: 20,
                          errorBuilder: (_, __, ___) => const Icon(Icons.g_mobiledata, size: 24),
                        ),
                        label: Text('Google', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.ink)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.apple, size: 22, color: Colors.black),
                        label: Text('Apple', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.ink)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Login link
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Déjà un compte ? ', style: GoogleFonts.inter(fontSize: 13, color: AppColors.sub)),
                      GestureDetector(
                        onTap: () => context.go('/login'),
                        child: Text(
                          'Se connecter',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.blue),
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
    );
  }

  Widget _fieldLabel(String text) => Text(
    text,
    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.ink),
  );

  InputDecoration _inputDeco(String hint, IconData icon) => InputDecoration(
    hintText: hint,
    hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.hint),
    prefixIcon: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Icon(icon, size: 18, color: AppColors.sub),
    ),
    prefixIconConstraints: const BoxConstraints(minWidth: 0),
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
  );
}

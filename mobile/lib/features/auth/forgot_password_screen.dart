import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';

/// A three-step recovery flow backed by the API OTP endpoints.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirmation = TextEditingController();
  int _step = 0;
  bool _loading = false;
  bool _obscure = true;
  String? _resetToken;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _password.dispose();
    _confirmation.dispose();
    super.dispose();
  }

  Future<void> _continue() async {
    final email = _email.text.trim();
    if (_step == 0 && !RegExp(r'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$').hasMatch(email)) {
      setState(() => _error = 'Saisissez une adresse email valide.');
      return;
    }
    if (_step == 1 && !RegExp(r'^\\d{6}$').hasMatch(_code.text.trim())) {
      setState(() => _error = 'Le code comporte 6 chiffres.');
      return;
    }
    if (_step == 2 && (_password.text.length < 8 || _password.text != _confirmation.text)) {
      setState(() => _error = _password.text.length < 8
          ? 'Le mot de passe doit comporter au moins 8 caractères.'
          : 'Les deux mots de passe ne correspondent pas.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      if (_step == 0) {
        await ApiService.sendPasswordResetCode(email);
        if (mounted) setState(() => _step = 1);
      } else if (_step == 1) {
        final response = await ApiService.verifyPasswordResetCode(email, _code.text.trim());
        final token = response['reset_token'] as String?;
        if (token == null || token.isEmpty) throw ApiException('Réponse de sécurité invalide.');
        if (mounted) setState(() { _resetToken = token; _step = 2; });
      } else {
        await ApiService.resetPassword(
          resetToken: _resetToken!, password: _password.text, confirmation: _confirmation.text,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Mot de passe mis à jour. Connectez-vous.')));
          context.go('/login');
        }
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Une erreur est survenue. Réessayez.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final titles = ['Retrouver votre accès', 'Vérifier le code', 'Nouveau mot de passe'];
    final subtitles = [
      'Nous vous envoyons un code de sécurité par email.',
      'Saisissez le code à 6 chiffres reçu par email.',
      'Choisissez un mot de passe solide pour votre compte.',
    ];
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.background, elevation: 0, leading: IconButton(tooltip: 'Retour', onPressed: () => context.go('/login'), icon: const Icon(Icons.arrow_back_rounded))),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 36),
          children: [
            Container(width: 52, height: 52, alignment: Alignment.center, decoration: BoxDecoration(color: AppColors.green.withValues(alpha: .13), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.lock_reset_rounded, color: AppColors.green, size: 27)),
            const SizedBox(height: 24),
            Text(titles[_step], style: GoogleFonts.sourceSans3(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.ink)),
            const SizedBox(height: 8),
            Text(subtitles[_step], style: GoogleFonts.sourceSans3(fontSize: 16, color: AppColors.sub)),
            const SizedBox(height: 30),
            _progress(),
            const SizedBox(height: 30),
            if (_step == 0) _field(_email, 'Adresse email', keyboard: TextInputType.emailAddress),
            if (_step == 1) _field(_code, 'Code de sécurité', keyboard: TextInputType.number, hint: '000000'),
            if (_step == 2) ...[
              _field(_password, 'Nouveau mot de passe', obscure: _obscure, suffix: IconButton(tooltip: _obscure ? 'Afficher le mot de passe' : 'Masquer le mot de passe', onPressed: () => setState(() => _obscure = !_obscure), icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined))),
              const SizedBox(height: 18),
              _field(_confirmation, 'Confirmer le mot de passe', obscure: _obscure),
            ],
            if (_error != null) ...[const SizedBox(height: 18), Text(_error!, style: GoogleFonts.sourceSans3(color: AppColors.danger, fontWeight: FontWeight.w600))],
            const SizedBox(height: 28),
            SizedBox(height: 54, child: FilledButton(onPressed: _loading ? null : _continue, style: FilledButton.styleFrom(backgroundColor: AppColors.green, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))), child: _loading ? const CircularProgressIndicator(color: Colors.white) : Text(_step == 2 ? 'Enregistrer le mot de passe' : 'Continuer', style: GoogleFonts.sourceSans3(fontSize: 16, fontWeight: FontWeight.w700)))),
          ],
        ),
      ),
    );
  }

  Widget _progress() => Row(children: List.generate(3, (i) => Expanded(child: Container(height: 4, margin: EdgeInsets.only(right: i == 2 ? 0 : 6), decoration: BoxDecoration(color: i <= _step ? AppColors.green : AppColors.border, borderRadius: BorderRadius.circular(9))))));
  Widget _field(TextEditingController controller, String label, {TextInputType? keyboard, String? hint, bool obscure = false, Widget? suffix}) => TextField(controller: controller, keyboardType: keyboard, obscureText: obscure, decoration: InputDecoration(labelText: label, hintText: hint, suffixIcon: suffix, border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16)));
}

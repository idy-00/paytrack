import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _saving = false;
  bool _changingPassword = false;
  bool _showPasswordSection = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController.text = user?.name ?? '';
    _emailController.text = user?.email ?? '';
    _phoneController.text = '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _saving = true);
    try {
      await ApiService.put('/auth/profile', {
        'name': _nameController.text,
        'phone': _phoneController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil mis à jour')),
        );
        ref.read(authProvider.notifier).checkAuth();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() => _saving = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Les mots de passe ne correspondent pas')),
      );
      return;
    }
    if (_newPasswordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum 8 caractères')),
      );
      return;
    }

    setState(() => _changingPassword = true);
    try {
      await ApiService.put('/auth/password', {
        'current_password': _currentPasswordController.text,
        'password': _newPasswordController.text,
        'password_confirmation': _confirmPasswordController.text,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mot de passe modifié')),
        );
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        setState(() => _showPasswordSection = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() => _changingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

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
        title: Text('Mon profil',
            style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.green,
                  borderRadius: BorderRadius.circular(40),
                ),
                child: Center(
                  child: Text(
                    user?.name
                            .split(' ')
                            .map((p) => p.isNotEmpty ? p[0] : '')
                            .take(2)
                            .join() ??
                        'U',
                    style: GoogleFonts.sourceSans3(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                user?.role ?? '',
                style:
                    GoogleFonts.sourceSans3(color: AppColors.sub, fontSize: 13),
              ),
            ),

            const SizedBox(height: 32),

            // Info section
            _buildSectionTitle('Informations'),
            const SizedBox(height: 12),
            _buildTextField(
                'Nom complet', _nameController, Icons.person_outline),
            const SizedBox(height: 12),
            _buildTextField('Email', _emailController, Icons.email_outlined,
                enabled: false),
            const SizedBox(height: 12),
            _buildTextField(
                'Téléphone', _phoneController, Icons.phone_outlined),

            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.green,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                child: _saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : Text('Enregistrer',
                        style: GoogleFonts.sourceSans3(
                            color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),

            const SizedBox(height: 32),

            // Password section
            _buildSectionTitle('Sécurité'),
            const SizedBox(height: 12),

            if (!_showPasswordSection)
              OutlinedButton.icon(
                onPressed: () => setState(() => _showPasswordSection = true),
                icon: const Icon(Icons.lock_outline),
                label: const Text('Changer le mot de passe'),
                style: OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderSoft),
                ),
                child: Column(
                  children: [
                    _buildPasswordField(
                        'Mot de passe actuel', _currentPasswordController),
                    const SizedBox(height: 12),
                    _buildPasswordField(
                        'Nouveau mot de passe', _newPasswordController),
                    const SizedBox(height: 12),
                    _buildPasswordField(
                        'Confirmer', _confirmPasswordController),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () =>
                                setState(() => _showPasswordSection = false),
                            child: const Text('Annuler'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed:
                                _changingPassword ? null : _changePassword,
                            style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.green),
                            child: _changingPassword
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white))
                                : Text('Modifier',
                                    style: GoogleFonts.sourceSans3(
                                        color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 32),

            // Legal section
            _buildSectionTitle('Légal'),
            const SizedBox(height: 12),
            _buildLegalItem(
                'Mentions légales', () => context.push('/mentions-legales')),
            _buildLegalItem('CGU', () => context.push('/cgu')),
            _buildLegalItem('Politique de confidentialité',
                () => context.push('/confidentialite')),

            const SizedBox(height: 32),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/login');
                },
                icon: const Icon(Icons.logout, color: Colors.red),
                label: Text('Déconnexion',
                    style: GoogleFonts.sourceSans3(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.sourceSans3(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
    );
  }

  Widget _buildTextField(
      String label, TextEditingController controller, IconData icon,
      {bool enabled = true}) {
    return TextField(
      controller: controller,
      enabled: enabled,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: !enabled,
        fillColor: enabled ? null : AppColors.background,
      ),
    );
  }

  Widget _buildPasswordField(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      obscureText: true,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildLegalItem(String title, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AppColors.borderSoft)),
          ),
          child: Row(
            children: [
              Expanded(
                  child: Text(title,
                      style: GoogleFonts.sourceSans3(fontSize: 14))),
              const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

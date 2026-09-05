import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/client.dart';
import '../../shared/widgets/error_view.dart';
import 'clients_provider.dart';

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});

  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  String _searchQuery = '';

  Future<void> _createClient() async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController();
    final cityController = TextEditingController(text: 'Dakar');
    var submitting = false;

    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            12,
            20,
            MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Nouveau client',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Les coordonnées servent aux rappels et aux reçus.',
                    style: TextStyle(color: AppColors.sub, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: nameController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Nom complet',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty
                        ? 'Indiquez le nom du client'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Téléphone',
                      hintText: '77 000 00 00',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (value) =>
                        value == null || value.trim().length < 8
                            ? 'Indiquez un numéro valide'
                            : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: cityController,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(
                      labelText: 'Ville',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'E-mail (facultatif)',
                      prefixIcon: Icon(Icons.mail_outline_rounded),
                    ),
                    validator: (value) {
                      final email = value?.trim() ?? '';
                      if (email.isNotEmpty && !email.contains('@')) {
                        return 'Indiquez un e-mail valide';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: submitting
                          ? null
                          : () async {
                              if (!formKey.currentState!.validate()) return;
                              setSheetState(() => submitting = true);
                              try {
                                await ref
                                    .read(clientsProvider.notifier)
                                    .create({
                                  'full_name': nameController.text.trim(),
                                  'phone': phoneController.text.trim(),
                                  'city': cityController.text.trim(),
                                  'email': emailController.text.trim(),
                                });
                                if (sheetContext.mounted) {
                                  Navigator.pop(sheetContext, true);
                                }
                              } catch (error) {
                                if (sheetContext.mounted) {
                                  setSheetState(() => submitting = false);
                                  ScaffoldMessenger.of(sheetContext)
                                      .showSnackBar(
                                    SnackBar(content: Text('$error')),
                                  );
                                }
                              }
                            },
                      icon: submitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.person_add_alt_1_rounded),
                      label: Text(submitting ? 'Création…' : 'Créer le client'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    nameController.dispose();
    phoneController.dispose();
    emailController.dispose();
    cityController.dispose();

    if (created == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Client ajouté avec succès')),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(clientsProvider.notifier).load());
  }

  List<Client> _filter(List<Client> clients) {
    if (_searchQuery.isEmpty) return clients;
    final q = _searchQuery.toLowerCase();
    return clients
        .where((c) =>
            c.name.toLowerCase().contains(q) ||
            c.phone.contains(q) ||
            c.city.toLowerCase().contains(q) ||
            c.email.toLowerCase().contains(q))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsProvider);

    return clientsAsync.when(
      loading: () => Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(context),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        backgroundColor: AppColors.background,
        appBar: _buildAppBar(context),
        body: ErrorView(
          message: 'Erreur: $err',
          onRetry: () => ref.read(clientsProvider.notifier).refresh(),
        ),
      ),
      data: (clients) => _buildContent(clients),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
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
      title: Text('Clients',
          style: GoogleFonts.sourceSans3(fontWeight: FontWeight.w700)),
      backgroundColor: AppColors.surface,
      elevation: 0,
    );
  }

  Widget _buildContent(List<Client> clients) {
    final filtered = _filter(clients);

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: Container(
        decoration: BoxDecoration(
          color: AppColors.green,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.blue.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          elevation: 0,
          onPressed: _createClient,
          tooltip: 'Nouveau client',
          child: const Icon(Icons.person_add_outlined, size: 22),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/dashboard');
                      }
                    },
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderSoft),
                      ),
                      child: const Icon(
                        Icons.arrow_back_rounded,
                        size: 18,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Clients',
                    style: GoogleFonts.sourceSans3(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.blueLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${clients.length}',
                      style: GoogleFonts.sourceSans3(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.blue,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.borderSoft),
                  boxShadow: AppColors.cardShadow,
                ),
                child: TextField(
                  onChanged: (v) => setState(() => _searchQuery = v),
                  style: GoogleFonts.sourceSans3(
                    fontSize: 14,
                    color: AppColors.ink,
                  ),
                  cursorColor: AppColors.blue,
                  decoration: InputDecoration(
                    hintText: 'Rechercher un client...',
                    hintStyle: GoogleFonts.sourceSans3(
                      fontSize: 13,
                      color: AppColors.hint,
                    ),
                    prefixIcon: const Padding(
                      padding: EdgeInsets.only(left: 14, right: 10),
                      child: Icon(Icons.search_rounded,
                          size: 20, color: AppColors.muted),
                    ),
                    prefixIconConstraints: const BoxConstraints(minWidth: 0),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            tooltip: 'Effacer la recherche',
                            icon: const Icon(Icons.clear_rounded, size: 16),
                            color: AppColors.sub,
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.transparent,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                  ),
                ),
              ),
            ),
            if (_searchQuery.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '${filtered.length} résultat${filtered.length != 1 ? 's' : ''}',
                    style: GoogleFonts.sourceSans3(
                      fontSize: 12,
                      color: AppColors.sub,
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Expanded(
              child: filtered.isEmpty
                  ? _buildEmpty()
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 80),
                      itemCount: filtered.length,
                      itemBuilder: (_, i) => _buildClientCard(filtered[i], i),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClientCard(Client client, int index) {
    final avatarColors = [
      AppColors.blue,
      const Color(0xFF7C3AED),
      const Color(0xFF059669),
      const Color(0xFFD97706),
      const Color(0xFFDC2626),
    ];
    final color = avatarColors[index % avatarColors.length];

    return Container(
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
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: Text(
                client.initials,
                style: GoogleFonts.sourceSans3(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
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
                  client.name,
                  style: GoogleFonts.sourceSans3(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined,
                        size: 12, color: AppColors.muted),
                    const SizedBox(width: 4),
                    Text(
                      client.phone,
                      style: GoogleFonts.sourceSans3(
                        fontSize: 12,
                        color: AppColors.sub,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.surfaceDim,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 12, color: AppColors.sub),
                const SizedBox(width: 3),
                Text(
                  client.city,
                  style: GoogleFonts.sourceSans3(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: AppColors.sub,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.surfaceDim,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.people_outline_rounded,
              size: 40,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Aucun client trouvé',
            style: GoogleFonts.sourceSans3(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: AppColors.sub,
            ),
          ),
        ],
      ),
    );
  }
}

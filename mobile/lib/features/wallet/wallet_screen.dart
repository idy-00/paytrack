import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  Map<String, dynamic>? _wallet;
  Map<String, dynamic>? _kyc;
  List<dynamic> _transactions = [];
  List<dynamic> _withdrawals = [];
  bool _loading = true;
  bool _uploadingKyc = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final wallet = await ApiService.getWallet();
      final tx = await ApiService.getWalletTransactions();
      final wd = await ApiService.getWithdrawals();
      final kyc = await ApiService.getKycStatus();
      setState(() {
        _wallet = wallet['wallet'] ?? wallet;
        _transactions = tx['data'] ?? [];
        _withdrawals = wd['data'] ?? [];
        _kyc = kyc;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  bool get _canWithdraw => _kyc?['can_withdraw'] == true;
  String get _kycStatus => _kyc?['kyc_status'] ?? 'none';

  int get _pendingTotal => _withdrawals
      .where((w) => w['status'] == 'pending' || w['status'] == 'processing')
      .fold(0, (sum, w) => sum + (w['amount'] as int? ?? 0));

  int get _availableBalance => (_wallet?['balance'] ?? 0) - _pendingTotal;

  Future<void> _uploadDocument(String type) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;

    setState(() => _uploadingKyc = true);
    try {
      await ApiService.uploadKycDocument(
        documentType: type,
        filePath: file.path,
        fileName: file.name,
      );
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Document uploadé')));
      _loadData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      setState(() => _uploadingKyc = false);
    }
  }

  void _showKycModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Vérification d\'identité (KYC)', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Pour effectuer des retraits, soumettez vos documents.',
              style: GoogleFonts.inter(color: AppColors.sub, fontSize: 13),
            ),
            const SizedBox(height: 20),

            _buildKycDocumentRow(
              title: 'Pièce d\'identité',
              subtitle: 'CNI, Passeport ou Permis',
              type: 'identity',
              doc: _kyc?['documents']?['identity'],
            ),
            const SizedBox(height: 12),
            _buildKycDocumentRow(
              title: 'Justificatif de domicile',
              subtitle: 'Facture ou attestation < 3 mois',
              type: 'address_proof',
              doc: _kyc?['documents']?['address_proof'],
            ),

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.blue,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Fermer', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKycDocumentRow({
    required String title,
    required String subtitle,
    required String type,
    Map<String, dynamic>? doc,
  }) {
    final status = doc?['status'];
    final isApproved = status == 'approved';
    final isPending = status == 'pending';
    final isRejected = status == 'rejected';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isApproved ? Colors.green.shade50 : isPending ? Colors.amber.shade50 : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.description,
              color: isApproved ? Colors.green : isPending ? Colors.amber.shade700 : AppColors.sub,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                Text(subtitle, style: GoogleFonts.inter(color: AppColors.sub, fontSize: 11)),
                if (isRejected && doc?['rejection_reason'] != null)
                  Text(doc!['rejection_reason'], style: GoogleFonts.inter(color: Colors.red, fontSize: 11)),
              ],
            ),
          ),
          if (isApproved)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.green.shade100, borderRadius: BorderRadius.circular(8)),
              child: Text('Validé', style: GoogleFonts.inter(color: Colors.green.shade700, fontSize: 11, fontWeight: FontWeight.w600)),
            )
          else if (isPending)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(8)),
              child: Text('En attente', style: GoogleFonts.inter(color: Colors.amber.shade700, fontSize: 11, fontWeight: FontWeight.w600)),
            )
          else
            TextButton(
              onPressed: _uploadingKyc ? null : () => _uploadDocument(type),
              child: _uploadingKyc
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(isRejected ? 'Re-uploader' : 'Uploader', style: GoogleFonts.inter(fontSize: 12)),
            ),
        ],
      ),
    );
  }

  Future<void> _requestWithdrawal() async {
    if (!_canWithdraw) {
      _showKycModal();
      return;
    }

    final amountController = TextEditingController();
    final accountController = TextEditingController();
    String method = 'wave';

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Demander un retrait', style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Disponible: ${formatAmount(_availableBalance)}', style: GoogleFonts.inter(color: AppColors.sub)),
              const SizedBox(height: 16),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Montant (FCFA)',
                  hintText: 'Min 1000',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              StatefulBuilder(
                builder: (ctx, setLocalState) => DropdownButtonFormField<String>(
                  value: method,
                  decoration: InputDecoration(
                    labelText: 'Méthode',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'wave', child: Text('Wave (frais 2%)')),
                    DropdownMenuItem(value: 'orange_money', child: Text('Orange Money (frais 1.5%)')),
                    DropdownMenuItem(value: 'free_money', child: Text('Free Money (frais 1.5%)')),
                  ],
                  onChanged: (v) {
                    setLocalState(() => method = v ?? 'wave');
                  },
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: accountController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Numéro de téléphone',
                  hintText: '77 123 45 67',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final amount = int.tryParse(amountController.text) ?? 0;
                    if (amount < 1000) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Minimum 1000 FCFA')));
                      return;
                    }
                    if (amount > _availableBalance) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Solde insuffisant')));
                      return;
                    }
                    try {
                      await ApiService.requestWithdrawal(
                        amount: amount,
                        payoutMethod: method,
                        payoutAccount: accountController.text,
                      );
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('$e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.blue,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Envoyer', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée')));
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Portefeuille', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // KYC Alert
                    if (!_canWithdraw)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber, color: Colors.amber.shade700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Vérification requise',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.amber.shade800),
                                  ),
                                  Text(
                                    'Soumettez vos documents KYC pour retirer',
                                    style: GoogleFonts.inter(fontSize: 12, color: Colors.amber.shade700),
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: _showKycModal,
                              child: const Text('Soumettre'),
                            ),
                          ],
                        ),
                      ),

                    // KYC Status Badge
                    if (_kycStatus != 'none')
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          children: [
                            Icon(
                              Icons.verified_user,
                              size: 16,
                              color: _kycStatus == 'approved' ? Colors.green : Colors.grey,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'KYC: ${_kycStatus == 'approved' ? 'Validé' : _kycStatus == 'pending' ? 'En attente' : 'Rejeté'}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _kycStatus == 'approved' ? Colors.green : _kycStatus == 'pending' ? Colors.amber.shade700 : Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Balance card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: AppColors.heroGradient,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Solde disponible', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
                          const SizedBox(height: 8),
                          Text(
                            formatAmount(_availableBalance),
                            style: GoogleFonts.spaceGrotesk(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w700),
                          ),
                          if (_pendingTotal > 0)
                            Text(
                              '${formatAmount(_pendingTotal)} en attente',
                              style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
                            ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _availableBalance >= 1000 ? _requestWithdrawal : null,
                              icon: Icon(_canWithdraw ? Icons.send : Icons.verified_user, size: 18),
                              label: Text(_canWithdraw ? 'Demander un retrait' : 'Valider mon identité'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.blue,
                                disabledBackgroundColor: Colors.white.withAlpha(128),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Pending withdrawals
                    if (_withdrawals.any((w) => w['status'] == 'pending' || w['status'] == 'processing')) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.hourglass_bottom, color: Colors.amber.shade700, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  'Retraits en cours',
                                  style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.amber.shade800),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            ..._withdrawals
                                .where((w) => w['status'] == 'pending' || w['status'] == 'processing')
                                .map((w) => Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text('${w['payout_method']} - ${w['payout_account']}', style: GoogleFonts.inter(fontSize: 12)),
                                          Text(
                                            formatAmount(w['amount'] ?? 0),
                                            style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      ),
                                    )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Transactions
                    Text('Historique', style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),

                    if (_transactions.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            children: [
                              Icon(Icons.receipt_long, size: 48, color: AppColors.muted),
                              const SizedBox(height: 8),
                              Text('Aucune transaction', style: GoogleFonts.inter(color: AppColors.sub)),
                            ],
                          ),
                        ),
                      )
                    else
                      ..._transactions.map((tx) => _buildTransactionItem(tx)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTransactionItem(Map<String, dynamic> tx) {
    final isCredit = tx['type'] == 'credit';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isCredit ? Colors.green.shade50 : Colors.red.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isCredit ? Colors.green : Colors.red,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx['description'] ?? (isCredit ? 'Paiement reçu' : 'Retrait'),
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                Text(
                  _formatDate(tx['created_at'] ?? ''),
                  style: GoogleFonts.inter(color: AppColors.sub, fontSize: 11),
                ),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : '-'}${formatAmount(tx['amount'] ?? 0)}',
            style: GoogleFonts.spaceGrotesk(
              fontWeight: FontWeight.w700,
              color: isCredit ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String date) {
    try {
      final d = DateTime.parse(date);
      return '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return date;
    }
  }
}

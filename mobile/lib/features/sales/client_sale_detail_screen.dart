import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/json_parsers.dart';
import '../../data/models/sale.dart';

class ClientSaleDetailScreen extends StatefulWidget {
  final int saleId;
  const ClientSaleDetailScreen({super.key, required this.saleId});
  @override State<ClientSaleDetailScreen> createState() => _ClientSaleDetailScreenState();
}

class _ClientSaleDetailScreenState extends State<ClientSaleDetailScreen> {
  Sale? sale; bool loading = true; bool paying = false;
  final phone = TextEditingController(); final amount = TextEditingController();
  @override void initState() { super.initState(); load(); }
  @override void dispose() { phone.dispose(); amount.dispose(); super.dispose(); }
  Future<void> load() async { try { final r = await ApiService.getSale(widget.saleId); if (mounted) setState(() { sale = Sale.fromJson(jsonMap(r['sale'] ?? r['data'] ?? r)); loading = false; }); } catch (_) { if (mounted) setState(() => loading = false); } }
  Future<void> pay() async {
    final current = sale; if (current == null) return;
    final value = int.tryParse(amount.text) ?? current.remainingAmount;
    if (value < 1 || value > current.remainingAmount) { _message('Montant invalide'); return; }
    final number = phone.text.replaceAll(' ', '');
    if (!RegExp(r'^\+?[0-9]{8,15}$').hasMatch(number)) { _message('Saisissez votre numéro Mobile Money'); return; }
    setState(() => paying = true);
    try {
      final r = await ApiService.initiateMobilePayment(current.id, {'gateway':'dexpay','amount':value,'phone':number});
      final url = r['checkout_url'] as String?;
      if (url == null || url.isEmpty) throw Exception('Lien de paiement indisponible');
      if (mounted) await context.push('/paiement-web', extra: {'paymentUrl': url, 'successUrl': '', 'cancelUrl': '', 'title': 'Paiement PayTrack'});
      await load();
    } catch (e) { _message('$e'); } finally { if (mounted) setState(() => paying = false); }
  }
  void _message(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  @override Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final s = sale; if (s == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Dossier introuvable')));
    return Scaffold(appBar: AppBar(title: const Text('Mon dossier')), body: ListView(padding: const EdgeInsets.all(20), children: [
      Text(s.reference, style: GoogleFonts.sourceSans3(color: AppColors.sub)), const SizedBox(height: 6), Text(s.articleName, style: GoogleFonts.sourceSans3(fontSize: 24,fontWeight: FontWeight.w700)),
      const SizedBox(height: 20), Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: AppColors.hero,borderRadius: BorderRadius.circular(18)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children:[Text('Reste à payer',style: GoogleFonts.sourceSans3(color: Colors.white70)),Text(formatAmount(s.remainingAmount),style: GoogleFonts.sourceSans3(color:Colors.white,fontSize:30,fontWeight:FontWeight.w700))])),
      const SizedBox(height:24), Text('Payer mon échéance',style: GoogleFonts.sourceSans3(fontSize:18,fontWeight:FontWeight.w700)), const SizedBox(height:4), Text('Vous payez uniquement le montant indiqué. Aucun frais ne vous est ajouté.',style:GoogleFonts.sourceSans3(color:AppColors.sub)),
      const SizedBox(height:16), TextField(controller:amount,keyboardType:TextInputType.number,decoration:InputDecoration(labelText:'Montant (FCFA)',hintText:'${s.remainingAmount}',border:const OutlineInputBorder())), const SizedBox(height:12), TextField(controller:phone,keyboardType:TextInputType.phone,decoration:const InputDecoration(labelText:'Numéro Mobile Money',hintText:'77 123 45 67',border:OutlineInputBorder())),
      const SizedBox(height:20), FilledButton.icon(onPressed: paying ? null : pay, icon: paying ? const SizedBox(height:18,width:18,child:CircularProgressIndicator(strokeWidth:2)) : const Icon(Icons.lock_outline), label: Text('Payer ${formatAmount(int.tryParse(amount.text) ?? s.remainingAmount)}')),
      const SizedBox(height:10), Text('La confirmation est effectuée de façon sécurisée par DexPay.',textAlign:TextAlign.center,style:GoogleFonts.sourceSans3(fontSize:12,color:AppColors.sub)),
    ]));
}
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

class MentionsLegalesScreen extends StatelessWidget {
  const MentionsLegalesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Mentions légales', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection('Éditeur', '''
PayTrack est édité par :
ATAABA GROUP
Siège social : Dakar, Sénégal
Email : contact@ataaba.com
Téléphone : +221 XX XXX XX XX
NINEA : [En cours d'immatriculation]
'''),
            _buildSection('Hébergement', '''
L'application est hébergée par :
Hostinger International Ltd.
61 Lordou Vironos Street
6023 Larnaca, Chypre
'''),
            _buildSection('Directeur de publication', '''
Le directeur de la publication est le représentant légal de ATAABA GROUP.
'''),
            _buildSection('Propriété intellectuelle', '''
L'ensemble du contenu de l'application PayTrack (logos, textes, éléments graphiques, vidéos, etc.) est protégé par le droit d'auteur et le droit des marques.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments de l'application est interdite sans autorisation écrite préalable.
'''),
            _buildSection('Contact', '''
Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
- Par email : legal@ataaba.com
- Par courrier : ATAABA GROUP, Dakar, Sénégal
'''),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.spaceGrotesk(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 8),
          Text(content.trim(), style: GoogleFonts.inter(fontSize: 14, color: AppColors.sub, height: 1.6)),
        ],
      ),
    );
  }
}

class CGUScreen extends StatelessWidget {
  const CGUScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('CGU', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Conditions Générales d\'Utilisation', style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('Dernière mise à jour : Août 2026', style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted)),
            const SizedBox(height: 24),

            _buildSection('1. Objet', '''
Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation de l'application PayTrack, solution de gestion commerciale éditée par ATAABA GROUP.
'''),
            _buildSection('2. Acceptation des CGU', '''
L'utilisation de PayTrack implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
'''),
            _buildSection('3. Description du service', '''
PayTrack est une application de gestion commerciale permettant :
- La gestion des ventes et paiements
- Le suivi des clients et créances
- La gestion des stocks et inventaires
- La gestion des fournisseurs et commandes
- Le suivi des abonnements et portefeuille
'''),
            _buildSection('4. Inscription et compte', '''
Pour utiliser PayTrack, vous devez créer un compte en fournissant des informations exactes et complètes. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.
'''),
            _buildSection('5. Abonnement et tarification', '''
PayTrack propose plusieurs plans d'abonnement :
- Essentiel : 5 000 FCFA/mois
- Pro : 9 000 FCFA/mois
- Business : 13 000 FCFA/mois

Une période d'essai de 14 jours est offerte à l'inscription. Les tarifs peuvent être modifiés avec un préavis de 30 jours.
'''),
            _buildSection('6. Données personnelles', '''
ATAABA GROUP s'engage à protéger vos données personnelles conformément à la législation en vigueur. Pour plus d'informations, consultez notre Politique de confidentialité.
'''),
            _buildSection('7. Responsabilité', '''
ATAABA GROUP ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser l'application.
'''),
            _buildSection('8. Résiliation', '''
Vous pouvez résilier votre abonnement à tout moment depuis votre espace client. La résiliation prend effet à la fin de la période de facturation en cours.
'''),
            _buildSection('9. Modification des CGU', '''
ATAABA GROUP se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés de toute modification substantielle.
'''),
            _buildSection('10. Droit applicable', '''
Les présentes CGU sont régies par le droit sénégalais. Tout litige sera soumis aux tribunaux compétents de Dakar.
'''),
            _buildSection('Contact', '''
Pour toute question : support@ataaba.com
'''),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 6),
          Text(content.trim(), style: GoogleFonts.inter(fontSize: 14, color: AppColors.sub, height: 1.6)),
        ],
      ),
    );
  }
}

class ConfidentialiteScreen extends StatelessWidget {
  const ConfidentialiteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Confidentialité', style: GoogleFonts.spaceGrotesk(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.surface,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Politique de confidentialité', style: GoogleFonts.spaceGrotesk(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text('Dernière mise à jour : Août 2026', style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted)),
            const SizedBox(height: 24),

            _buildSection('1. Collecte des données', '''
Nous collectons les données suivantes :
- Informations d'identification (nom, email, téléphone)
- Données de transaction (ventes, paiements, clients)
- Données techniques (appareil, adresse IP, logs)
'''),
            _buildSection('2. Utilisation des données', '''
Vos données sont utilisées pour :
- Fournir et améliorer nos services
- Traiter vos transactions
- Vous envoyer des notifications importantes
- Assurer la sécurité de votre compte
'''),
            _buildSection('3. Stockage et sécurité', '''
Vos données sont stockées sur des serveurs sécurisés. Nous utilisons le chiffrement SSL/TLS pour protéger les transmissions de données. Les mots de passe sont hashés avec bcrypt.
'''),
            _buildSection('4. Partage des données', '''
Nous ne vendons pas vos données. Elles peuvent être partagées avec :
- Nos prestataires techniques (hébergement, paiement)
- Les autorités si requis par la loi
'''),
            _buildSection('5. Vos droits', '''
Conformément à la législation, vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement
- Droit à la portabilité
- Droit d'opposition

Pour exercer ces droits : privacy@ataaba.com
'''),
            _buildSection('6. Cookies', '''
L'application utilise des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire n'est utilisé.
'''),
            _buildSection('7. Conservation', '''
Vos données sont conservées pendant la durée de votre abonnement et 5 ans après la clôture de votre compte, conformément aux obligations légales.
'''),
            _buildSection('8. Contact DPO', '''
Délégué à la Protection des Données :
Email : dpo@ataaba.com
Adresse : ATAABA GROUP, Dakar, Sénégal
'''),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.spaceGrotesk(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 6),
          Text(content.trim(), style: GoogleFonts.inter(fontSize: 14, color: AppColors.sub, height: 1.6)),
        ],
      ),
    );
  }
}

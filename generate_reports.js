const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, PageBreak } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function makeRow(cells, headerBg) {
  return new TableRow({ children: cells.map((text, i) => new TableCell({
    borders,
    width: { size: Math.floor(9360 / cells.length), type: WidthType.DXA },
    shading: headerBg ? { fill: headerBg, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: !!headerBg, color: headerBg ? 'FFFFFF' : undefined })] })]
  }))});
}

// ═══ RAPPORT 1: POUR LE BOSS ═══
const bossDoc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1D6FE8' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '1A1A1A' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'PayTrack', size: 48, bold: true, color: '1D6FE8' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Rapport de livraison - Version 1', size: 32, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: '20 juillet 2026', size: 22, color: '6B7280' })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Ce qui a ete livre (V1 Demo)')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('La version 1 de PayTrack est une demonstration fonctionnelle complete. Elle permet de visualiser le parcours complet : vitrine, inscription, connexion, creation de vente, suivi des paiements, scan QR et tableaux de bord.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Application Web (React + Vite)')] }),
      ...['Landing page vitrine avec tarifs, fonctionnalites, temoignages',
        'Page inscription en 2 etapes (compte + boutique)',
        'Page de connexion avec recuperation mot de passe',
        'Tableau de bord vendeur (KPIs, graphiques, ventes recentes)',
        'Tableau de bord client (suivi paiements, progression)',
        'Liste des ventes avec filtres par statut et recherche',
        'Creation de vente en 4 etapes (client, article, conditions, recapitulatif)',
        'Detail vente avec echeancier complet',
        'Liste des clients',
        'Historique des paiements avec filtres',
        'Scanner QR Code avec camera (html5-qrcode)',
        'Consultation dossier via QR Code (lien public)',
        'Navigation responsive (sidebar + mobile)',
      ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] })),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Application Mobile (Flutter - Android)')] }),
      ...['Ecran de connexion',
        'Tableau de bord vendeur',
        'Tableau de bord client',
        'Liste des ventes',
        'Detail vente avec echeancier',
        'Liste des clients',
        'Historique des paiements',
        'Scanner QR Code natif',
      ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] })),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Deploiement')] }),
      ...['Web : deploye sur Cloudflare Pages (paytrack-c20.pages.dev)',
        'Mobile : APK Android disponible',
        'Code source : github.com/idy-00/paytrack',
      ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] })),

      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Ce qui manque pour la V1 production')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('La version actuelle fonctionne avec des donnees de demonstration. Pour une mise en production reelle :')] }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4000, 2680, 2680],
        rows: [
          makeRow(['Fonctionnalite', 'Priorite', 'Statut'], '1D6FE8'),
          makeRow(['Backend API (Laravel)', 'Critique', 'Non commence']),
          makeRow(['Base de donnees MySQL', 'Critique', 'Non commence']),
          makeRow(['Authentification reelle (JWT)', 'Critique', 'Non commence']),
          makeRow(['Integration Wave / Orange Money', 'Haute', 'Non commence']),
          makeRow(['Alertes SMS automatiques', 'Haute', 'Non commence']),
          makeRow(['Alertes WhatsApp', 'Haute', 'Non commence']),
          makeRow(['Generation recus PDF', 'Haute', 'Non commence']),
          makeRow(['Export rapports CSV/PDF', 'Moyenne', 'Non commence']),
          makeRow(['Multi-boutiques (isolation)', 'Moyenne', 'Non commence']),
          makeRow(['Gestion roles et permissions', 'Moyenne', 'Non commence']),
          makeRow(['Journal audit', 'Moyenne', 'Non commence']),
          makeRow(['Mode hors ligne (mobile)', 'Basse', 'Non commence']),
          makeRow(['Notifications push (FCM)', 'Basse', 'Non commence']),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Ce que vous devez fournir')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Pour avancer vers la production, voici les elements necessaires :')] }),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [
          makeRow(['Element requis', 'Pourquoi'], '1D6FE8'),
          makeRow(['Logo officiel PayTrack (PNG/SVG)', 'Affiche sur app, recus et emails']),
          makeRow(['Nom de domaine (ex: paytrack.sn)', 'URL finale pour le site web']),
          makeRow(['Hebergement serveur (VPS ou cloud)', 'Backend API et base de donnees']),
          makeRow(['Compte Wave Merchant', 'Reception paiements mobile money']),
          makeRow(['Compte Orange Money Merchant', 'Reception paiements mobile money']),
          makeRow(['Compte SMS Gateway (Twilio/Orange)', 'Envoi des alertes et rappels']),
          makeRow(['Compte WhatsApp Business API', 'Rappels automatiques WhatsApp']),
          makeRow(['Informations legales (CGU)', 'Pages legales obligatoires']),
          makeRow(['Compte Google Play (25$)', 'Publication app Android']),
          makeRow(['Contenu des messages de rappel', 'Textes des SMS/WhatsApp']),
          makeRow(['Adresse email pro (noreply@...)', 'Envoi recus et confirmations']),
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun('4. Prochaines etapes')] }),
      ...['Validation de cette demo (web + mobile) par le client',
        'Reception des elements listes ci-dessus',
        'Developpement backend API + base de donnees (2-3 semaines)',
        'Integration paiements mobile money (1 semaine)',
        'Integration alertes SMS/WhatsApp (1 semaine)',
        'Tests et mise en production',
      ].map(t => new Paragraph({ numbering: { reference: 'numbers', level: 0 }, spacing: { after: 80 }, children: [new TextRun(t)] })),

      new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: 'Estimation totale pour la V1 production : 4 a 6 semaines apres validation.', bold: true })] }),
    ]
  }]
});

// ═══ RAPPORT 2: POUR MOI (guide des pages) ═══
const myDoc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1D6FE8' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: '1A1A1A' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'PayTrack - Guide des Pages', size: 48, bold: true, color: '1D6FE8' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Explication de chaque ecran (Web + Mobile)', size: 24, color: '6B7280' })] }),

      // WEB
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('APPLICATION WEB')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Landing Page (/')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Page vitrine publique pour presenter PayTrack aux prospects.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Hero avec slogan, fonctionnalites, comment ca marche (4 etapes), temoignages clients, tarifs (3 plans), CTA inscription. Bouton "Demarrer gratuitement" mene a /register.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Inscription (/register)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Creer un nouveau compte vendeur/entreprise.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Etapes : ', bold: true }), new TextRun('1) Nom, email, telephone, mot de passe. 2) Nom boutique, ville, secteur activite, taille equipe. Apres validation, redirige vers login.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Connexion (/login)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Authentifier un utilisateur existant.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Demo : ', bold: true }), new TextRun('Vendeur = moussa@phoneshop-dakar.com / demo1234. Client = aminata@gmail.com / demo1234. Inclut recuperation mot de passe.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Tableau de bord vendeur (/dashboard)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Vue globale de l\'activite du vendeur.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('4 KPIs (ventes actives, montant encaisse, en retard, taux recouvrement). Graphique encaissements. Liste des prochaines echeances. Ventes recentes. Acces rapide a nouvelle vente.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Tableau de bord client (/client/dashboard)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Espace client pour voir ses propres paiements.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Montant total restant a payer, progression globale, prochaine echeance, historique de ses dossiers. Le client ne voit QUE ses propres donnees.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Ventes (/ventes)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Lister toutes les ventes a credit.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Filtres par statut (actif, retard, solde, litige). Barre de recherche. Pour chaque vente : client, article, montant, progression, statut. Clic ouvre le detail.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Nouvelle vente (/ventes/nouvelle)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Creer un dossier de paiement par tranche.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Etapes : ', bold: true }), new TextRun('1) Selectionner client. 2) Selectionner article. 3) Definir acompte, nombre de tranches, frequence. 4) Recapitulatif + confirmation. Genere automatiquement le QR Code et l\'echeancier.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Detail vente (/ventes/:id)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Voir tout le detail d\'un dossier de paiement.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Infos client, article, montants (total/paye/restant), barre de progression, echeancier detaille (chaque tranche avec date, montant, statut), historique des paiements, QR Code du dossier.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Clients (/clients)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Repertoire des clients de la boutique.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Nom, telephone, ville, date creation. Recherche. Clic pour voir les ventes associees.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Paiements (/paiements)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Historique de tous les paiements recus.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Date, client, montant, methode (Wave, Orange Money, especes...), reference dossier. Filtres par methode et recherche.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Scanner QR (/qr-scan)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Scanner un QR Code pour ouvrir le dossier correspondant.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Active la camera du telephone/PC. Detecte le QR Code et ouvre directement le dossier de vente. Aussi recherche manuelle par reference.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('QR Code public (/qr/:uuid)')] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Role : ', bold: true }), new TextRun('Page accessible sans connexion quand un client scanne son QR Code.')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Contenu : ', bold: true }), new TextRun('Resume du dossier : montant total, paye, restant, progression. Ne montre pas les donnees sensibles.')] }),

      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('APPLICATION MOBILE (Flutter)')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Memes fonctionnalites que le web, adaptees au mobile :')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Login')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Connexion avec email/mot de passe. Memes identifiants demo que le web.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Dashboard vendeur')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('KPIs, graphiques, ventes recentes. Interface optimisee pour ecran tactile.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Dashboard client')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Vue simplifiee : montant restant, prochaine echeance, progression.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Liste ventes')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Toutes les ventes actives avec filtres. Tap pour voir detail.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Detail vente')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Echeancier, progression, QR Code. Bouton partager QR via WhatsApp.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Clients')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Repertoire clients, recherche rapide, appel direct depuis la fiche.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Paiements')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Historique encaissements, filtre par methode de paiement.')] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Scanner QR')] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun('Scanner natif camera. Detecte le QR et ouvre le dossier instantanement. Plus rapide que le web car utilise la camera native.')] }),
    ]
  }]
});

async function main() {
  const buf1 = await Packer.toBuffer(bossDoc);
  fs.writeFileSync('docs/PayTrack_Rapport_Boss_V1.docx', buf1);
  console.log('OK: docs/PayTrack_Rapport_Boss_V1.docx');

  const buf2 = await Packer.toBuffer(myDoc);
  fs.writeFileSync('docs/PayTrack_Guide_Pages.docx', buf2);
  console.log('OK: docs/PayTrack_Guide_Pages.docx');
}
main();

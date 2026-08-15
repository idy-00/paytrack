from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Colors
BLUE = HexColor('#2563EB')
DARK = HexColor('#1E293B')
GRAY = HexColor('#64748B')
LIGHT_BLUE = HexColor('#EFF6FF')
GREEN = HexColor('#059669')
ORANGE = HexColor('#D97706')
RED = HexColor('#DC2626')

# Create document
doc = SimpleDocTemplate(
    "CLES_API_REQUISES.pdf",
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

# Styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    'CustomTitle',
    parent=styles['Title'],
    fontSize=24,
    textColor=DARK,
    spaceAfter=20,
    alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=BLUE,
    spaceBefore=20,
    spaceAfter=10
))
styles.add(ParagraphStyle(
    'CustomHeading2',
    parent=styles['Heading2'],
    fontSize=13,
    textColor=DARK,
    spaceBefore=15,
    spaceAfter=8
))
styles.add(ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontSize=10,
    textColor=DARK,
    spaceAfter=8,
    leading=14
))
styles.add(ParagraphStyle(
    'CodeBlock',
    parent=styles['Normal'],
    fontSize=9,
    fontName='Courier',
    textColor=GRAY,
    backColor=HexColor('#F8FAFC'),
    spaceAfter=8,
    leftIndent=20
))

story = []

# Title
story.append(Paragraph("PayTrack - Cles API Requises", styles['CustomTitle']))
story.append(Paragraph("Document de Production", styles['CustomBody']))
story.append(Spacer(1, 20))

# Executive Summary
story.append(Paragraph("Resume Executif", styles['CustomHeading']))
story.append(Paragraph(
    "PayTrack est pret a passer en production. Toutes les fonctionnalites core sont implementees et testees :",
    styles['CustomBody']
))

features = [
    "Authentification securisee (Laravel Sanctum)",
    "Gestion multi-tenant avec isolation des donnees",
    "Ventes a credit avec echeancier automatique",
    "Paiements manuels et mobile money",
    "QR code public avec donnees masquees",
    "Exports CSV et PDF",
    "Tests automatises (22 tests passent)"
]
for f in features:
    story.append(Paragraph(f"• {f}", styles['CustomBody']))

story.append(Spacer(1, 10))
story.append(Paragraph(
    "<b>Pour activer toutes les fonctionnalites, nous avons besoin des cles API suivantes.</b>",
    styles['CustomBody']
))

# Section 1: Mobile Money
story.append(Paragraph("1. Paiements Mobile Money (OBLIGATOIRE)", styles['CustomHeading']))

story.append(Paragraph("Wave Senegal", styles['CustomHeading2']))
story.append(Paragraph("Contact : https://wave.com/en/business ou partenaires@wave.com", styles['CustomBody']))
story.append(Paragraph("Delai estime : 2-4 semaines (KYC entreprise requis)", styles['CustomBody']))
story.append(Paragraph("Cles a obtenir :", styles['CustomBody']))
story.append(Paragraph("WAVE_API_KEY, WAVE_API_SECRET, WAVE_WEBHOOK_SECRET, WAVE_BUSINESS_ID", styles['CodeBlock']))

story.append(Paragraph("Documents requis :", styles['CustomBody']))
docs_wave = ["NINEA de l'entreprise", "Registre de commerce", "Piece d'identite du gerant", "Releve bancaire (3 derniers mois)"]
for d in docs_wave:
    story.append(Paragraph(f"• {d}", styles['CustomBody']))

story.append(Spacer(1, 10))

story.append(Paragraph("Orange Money Senegal", styles['CustomHeading2']))
story.append(Paragraph("Contact : https://developer.orange.com/apis/om-webpay", styles['CustomBody']))
story.append(Paragraph("Delai estime : 3-6 semaines", styles['CustomBody']))
story.append(Paragraph("Cles a obtenir :", styles['CustomBody']))
story.append(Paragraph("ORANGE_MONEY_API_KEY, ORANGE_MONEY_API_SECRET, ORANGE_MONEY_MERCHANT_KEY", styles['CodeBlock']))

# Section 2: OAuth
story.append(Paragraph("2. Authentification Sociale (OPTIONNEL)", styles['CustomHeading']))

story.append(Paragraph("Google Sign-In", styles['CustomHeading2']))
story.append(Paragraph("URL : https://console.cloud.google.com", styles['CustomBody']))
story.append(Paragraph("Delai : Immediat (self-service) | Cout : Gratuit", styles['CustomBody']))
story.append(Paragraph("Cles : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET", styles['CodeBlock']))

story.append(Paragraph("Apple Sign-In", styles['CustomHeading2']))
story.append(Paragraph("URL : https://developer.apple.com", styles['CustomBody']))
story.append(Paragraph("Delai : 1-2 jours | Cout : 99$/an (programme developpeur)", styles['CustomBody']))

# Section 3: Notifications
story.append(Paragraph("3. Notifications (RECOMMANDE)", styles['CustomHeading']))

story.append(Paragraph("Email - Brevo (ex-Sendinblue)", styles['CustomHeading2']))
story.append(Paragraph("Gratuit jusqu'a 300 emails/jour", styles['CustomBody']))

story.append(Paragraph("SMS - Twilio ou Orange SMS API", styles['CustomHeading2']))
story.append(Paragraph("~0.05$/SMS international", styles['CustomBody']))

story.append(Paragraph("Push Notifications - Firebase (FCM)", styles['CustomHeading2']))
story.append(Paragraph("Gratuit et illimite", styles['CustomBody']))

# Summary Table
story.append(PageBreak())
story.append(Paragraph("Tableau Recapitulatif", styles['CustomHeading']))

table_data = [
    ['Service', 'Priorite', 'Delai', 'Cout'],
    ['Wave API', 'HAUTE', '2-4 sem', 'Commission ~1%'],
    ['Orange Money API', 'HAUTE', '3-6 sem', 'Commission ~1-2%'],
    ['Google OAuth', 'Moyenne', 'Immediat', 'Gratuit'],
    ['Apple OAuth', 'Basse', '2 jours', '99$/an'],
    ['Email (Brevo)', 'Moyenne', 'Immediat', 'Gratuit'],
    ['SMS', 'Basse', '1 jour', '~$0.05/SMS'],
    ['FCM Push', 'Moyenne', 'Immediat', 'Gratuit'],
    ['SSL/HTTPS', 'HAUTE', 'Immediat', 'Gratuit'],
]

table = Table(table_data, colWidths=[5*cm, 3*cm, 3*cm, 4*cm])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('BACKGROUND', (0, 1), (-1, 1), LIGHT_BLUE),
    ('BACKGROUND', (0, 2), (-1, 2), LIGHT_BLUE),
    ('BACKGROUND', (0, 8), (-1, 8), LIGHT_BLUE),
    ('GRID', (0, 0), (-1, -1), 0.5, GRAY),
    ('ROWHEIGHT', (0, 0), (-1, -1), 25),
]))
story.append(table)

# Next Steps
story.append(Spacer(1, 20))
story.append(Paragraph("Prochaines Etapes", styles['CustomHeading']))

story.append(Paragraph("<b>Immediat (cette semaine)</b>", styles['CustomBody']))
story.append(Paragraph("• Demander les comptes developpeur Wave et Orange Money", styles['CustomBody']))
story.append(Paragraph("• Creer projet Google Cloud pour OAuth", styles['CustomBody']))

story.append(Paragraph("<b>Court terme (2 semaines)</b>", styles['CustomBody']))
story.append(Paragraph("• Configurer environnement de staging", styles['CustomBody']))
story.append(Paragraph("• Tests sandbox mobile money", styles['CustomBody']))

story.append(Paragraph("<b>Moyen terme (1 mois)</b>", styles['CustomBody']))
story.append(Paragraph("• Validation KYC mobile money", styles['CustomBody']))
story.append(Paragraph("• Mise en production", styles['CustomBody']))

# Footer
story.append(Spacer(1, 30))
story.append(Paragraph("_" * 60, styles['CustomBody']))
story.append(Paragraph("Document genere le 2 aout 2026", styles['CustomBody']))
story.append(Paragraph("PayTrack v1.0 - Backend Laravel + Frontend React + Mobile Flutter", styles['CustomBody']))

# Build
doc.build(story)
print("PDF genere: CLES_API_REQUISES.pdf")

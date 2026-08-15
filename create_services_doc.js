const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
        PageNumber, HeadingLevel } = require('docx');
const fs = require('fs');

// Colors - minimal, professional
const PRIMARY = "1A5276";    // Dark blue (titles only)
const TEXT = "000000";       // Black text

// Border style
const border = { style: BorderStyle.SINGLE, size: 1, color: "BDC3C7" };
const borders = { top: border, bottom: border, left: border, right: border };

// Table cell helper
function cell(text, opts = {}) {
    const { bold, header, width, align } = opts;
    return new TableCell({
        borders,
        width: { size: width || 2340, type: WidthType.DXA },
        shading: { fill: header ? "F2F2F2" : "FFFFFF", type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
            alignment: align || AlignmentType.LEFT,
            children: [new TextRun({
                text,
                bold: bold || header,
                color: TEXT,
                size: 22
            })]
        })]
    });
}

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Arial", size: 22 } } },
        paragraphStyles: [
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 36, bold: true, color: PRIMARY, font: "Arial" },
              paragraph: { spacing: { before: 400, after: 200 } } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 28, bold: true, color: PRIMARY, font: "Arial" },
              paragraph: { spacing: { before: 300, after: 150 } } },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }
            }
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "ATAABA Expertise - Services API", color: "95A5A6", size: 18 })]
                })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "Page ", color: "95A5A6", size: 18 }),
                        new TextRun({ children: [PageNumber.CURRENT], color: "95A5A6", size: 18 }),
                        new TextRun({ text: " | ATAABA Expertise", color: "95A5A6", size: 18 })
                    ]
                })]
            })
        },
        children: [
            // Title
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
                children: [new TextRun({ text: "Services et APIs", size: 48, bold: true, color: PRIMARY })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [new TextRun({ text: "Infrastructure Technique - ATAABA Expertise", size: 32, color: TEXT })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
                children: [new TextRun({ text: "Services mutualisés pour tous les projets (actuels et futurs)", size: 24, color: "666666", italics: true })]
            }),

            // Main table
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Vue d'ensemble")] }),

            new Table({
                width: { size: 10080, type: WidthType.DXA },
                columnWidths: [3000, 3200, 3880],
                rows: [
                    new TableRow({
                        children: [
                            cell("Service", { header: true, width: 3000 }),
                            cell("Recommandation", { header: true, width: 3200 }),
                            cell("Usage Projets", { header: true, width: 3880 }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("Paiement Mobile", { bold: true, width: 3000 }),
                            cell("PayDunya", { width: 3200 }),
                            cell("Paiements in-app, e-commerce", { width: 3880 }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("SMS", { bold: true, width: 3000, gray: true }),
                            cell("Africa's Talking", { width: 3200, gray: true }),
                            cell("OTP, rappels, alertes", { width: 3880, gray: true }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("Email", { bold: true, width: 3000 }),
                            cell("Brevo", { width: 3200 }),
                            cell("Emails transactionnels", { width: 3880 }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("VPS", { bold: true, width: 3000, gray: true }),
                            cell("Hostinger / DigitalOcean", { width: 3200, gray: true }),
                            cell("Hébergement multi-projets", { width: 3880, gray: true }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("Push Mobile", { bold: true, width: 3000 }),
                            cell("Firebase FCM", { width: 3200 }),
                            cell("Push notifications mobiles", { width: 3880 }),
                        ]
                    }),
                    new TableRow({
                        children: [
                            cell("Code source", { bold: true, width: 3000, gray: true }),
                            cell("GitHub Organization", { width: 3200, gray: true }),
                            cell("Repos centralisés, gestion équipe", { width: 3880, gray: true }),
                        ]
                    }),
                ]
            }),

            new Paragraph({ spacing: { before: 400 } }),

            // Section 1: PayDunya
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1. Paiement Mobile Money - PayDunya")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Avantages : ", bold: true, color: TEXT }),
                new TextRun({ text: "Agrégateur sénégalais, supporte Wave + Orange Money + Free Money en un seul SDK, dashboard en français, inscription rapide (24-48h).", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 200 }, children: [
                new TextRun({ text: "Site: ", bold: true, color: TEXT }),
                new TextRun({ text: "https://paydunya.com", color: PRIMARY })
            ]}),

            // Section 2: Africa's Talking
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2. SMS - Africa's Talking")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Avantages : ", bold: true, color: TEXT }),
                new TextRun({ text: "Couverture Afrique complète, API simple, sandbox gratuit pour tests.", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 200 }, children: [
                new TextRun({ text: "Site: ", bold: true, color: TEXT }),
                new TextRun({ text: "https://africastalking.com", color: PRIMARY })
            ]}),

            // Section 3: Brevo
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3. Email Transactionnel - Brevo")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Avantages : ", bold: true, color: TEXT }),
                new TextRun({ text: "Ex-Sendinblue, templates, tracking, API simple.", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 200 }, children: [
                new TextRun({ text: "Site: ", bold: true, color: TEXT }),
                new TextRun({ text: "https://brevo.com", color: PRIMARY })
            ]}),

            // Section 4: VPS
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4. VPS - Hostinger ou DigitalOcean")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Avantages : ", bold: true, color: TEXT }),
                new TextRun({ text: "Cron jobs, queue workers, SSL auto, plusieurs projets sur même serveur.", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 200 }, children: [
                new TextRun({ text: "Config recommandée : ", bold: true, color: TEXT }),
                new TextRun({ text: "2 vCPU / 4 Go RAM", color: TEXT })
            ]}),

            // Section 5: Firebase
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5. Push Notifications - Firebase FCM")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Avantages : ", bold: true, color: TEXT }),
                new TextRun({ text: "Gratuit, intégration Flutter/React Native, Analytics inclus, Auth disponible.", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 200 }, children: [
                new TextRun({ text: "Site: ", bold: true, color: TEXT }),
                new TextRun({ text: "https://console.firebase.google.com", color: PRIMARY })
            ]}),

            // Section 6: GitHub Organization
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6. Code Source - GitHub Organization")] }),
            new Paragraph({ spacing: { after: 100 }, children: [
                new TextRun({ text: "Utilité : ", bold: true, color: TEXT }),
                new TextRun({ text: "Centraliser tous les repos de l'entreprise sous un seul compte, gérer les accès de l'équipe (arrivées/départs).", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 400 }, children: [
                new TextRun({ text: "Site : ", bold: true, color: TEXT }),
                new TextRun({ text: "https://github.com/organizations/new", color: PRIMARY })
            ]}),

            new Paragraph({ spacing: { before: 200 } }),

            // Actions Section
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Actions Immédiates")] }),

            new Paragraph({ spacing: { after: 150 }, children: [
                new TextRun({ text: "1. PayDunya ", bold: true, color: TEXT }),
                new TextRun({ text: "- Créer compte marchand sur paydunya.com, obtenir master_key + private_key + token", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 150 }, children: [
                new TextRun({ text: "2. Africa's Talking ", bold: true, color: TEXT }),
                new TextRun({ text: "- Créer compte, ajouter crédit, obtenir API_KEY", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 150 }, children: [
                new TextRun({ text: "3. Firebase ", bold: true, color: TEXT }),
                new TextRun({ text: "- Créer projet, télécharger google-services.json (Android) et GoogleService-Info.plist (iOS)", color: TEXT })
            ]}),
            new Paragraph({ spacing: { after: 150 }, children: [
                new TextRun({ text: "4. VPS (optionnel) ", bold: true, color: TEXT }),
                new TextRun({ text: "- Migrer de Hostinger shared vers VPS si besoin cron/queue workers", color: TEXT })
            ]}),

            new Paragraph({ spacing: { before: 400 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ATAABA Expertise", color: "666666", size: 20, italics: true })]
            }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("ATAABA_Services_API.docx", buffer);
    console.log("Document created: ATAABA_Services_API.docx");
});

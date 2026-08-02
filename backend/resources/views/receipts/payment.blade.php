<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu {{ $payment->receipt_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; line-height: 1.4; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a365d; padding-bottom: 15px; }
        .header h1 { font-size: 18px; color: #1a365d; margin-bottom: 5px; }
        .header .shop-name { font-size: 14px; font-weight: bold; }
        .header .shop-info { font-size: 10px; color: #666; }
        .receipt-title { background: #1a365d; color: white; text-align: center; padding: 8px; margin: 15px 0; font-size: 14px; }
        .info-grid { display: table; width: 100%; margin-bottom: 15px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; width: 40%; padding: 5px 0; font-weight: bold; color: #555; }
        .info-value { display: table-cell; padding: 5px 0; }
        .amount-box { background: #f7f7f7; border: 1px solid #ddd; padding: 15px; text-align: center; margin: 20px 0; }
        .amount-box .amount { font-size: 24px; font-weight: bold; color: #1a365d; }
        .amount-box .label { font-size: 10px; color: #666; margin-top: 5px; }
        .section { margin: 15px 0; }
        .section-title { font-weight: bold; color: #1a365d; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; }
        .signature { margin-top: 40px; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>REÇU DE PAIEMENT</h1>
        @if($shop)
            <div class="shop-name">{{ $shop->name }}</div>
            <div class="shop-info">
                @if($shop->address) {{ $shop->address }} @endif
                @if($shop->city) - {{ $shop->city }} @endif
                @if($shop->phone) <br>Tél: {{ $shop->phone }} @endif
            </div>
        @elseif($tenant)
            <div class="shop-name">{{ $tenant->name }}</div>
        @endif
    </div>

    <div class="receipt-title">N° {{ $payment->receipt_number }}</div>

    <div class="section">
        <div class="section-title">INFORMATIONS CLIENT</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom</div>
                <div class="info-value">{{ $client->full_name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $client->phone }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">DÉTAILS DU PAIEMENT</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($payment->payment_date)->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Mode</div>
                <div class="info-value">{{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Type</div>
                <div class="info-value">{{ ucfirst($payment->payment_type) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Réf. vente</div>
                <div class="info-value">{{ $sale->reference }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Article</div>
                <div class="info-value">{{ $sale->article_name }}</div>
            </div>
        </div>
    </div>

    <div class="amount-box">
        <div class="amount">{{ number_format($payment->amount, 0, ',', ' ') }} FCFA</div>
        <div class="label">MONTANT PAYÉ</div>
    </div>

    <div class="section">
        <div class="section-title">SITUATION DU DOSSIER</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Montant total</div>
                <div class="info-value">{{ number_format($sale->total_amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Déjà payé</div>
                <div class="info-value">{{ number_format($sale->paid_amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Reste à payer</div>
                <div class="info-value"><strong>{{ number_format($sale->remaining_amount, 0, ',', ' ') }} FCFA</strong></div>
            </div>
        </div>
    </div>

    <div class="signature">
        <div class="signature-line">Signature vendeur</div>
    </div>

    <div class="footer">
        Reçu généré le {{ now()->format('d/m/Y à H:i') }}<br>
        @if($payment->recordedBy) Enregistré par: {{ $payment->recordedBy->name }} @endif
    </div>
</body>
</html>

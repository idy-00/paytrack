<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Contrat {{ $sale->reference }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; line-height: 1.4; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a365d; padding-bottom: 15px; }
        .header h1 { font-size: 16px; color: #1a365d; margin-bottom: 5px; }
        .header .shop-name { font-size: 14px; font-weight: bold; }
        .header .shop-info { font-size: 10px; color: #666; }
        .contract-title { background: #1a365d; color: white; text-align: center; padding: 8px; margin: 15px 0; font-size: 14px; }
        .info-grid { display: table; width: 100%; margin-bottom: 10px; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; width: 40%; padding: 4px 0; font-weight: bold; color: #555; }
        .info-value { display: table-cell; padding: 4px 0; }
        .section { margin: 12px 0; }
        .section-title { font-weight: bold; color: #1a365d; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 8px; font-size: 12px; }
        table.schedule { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
        table.schedule th, table.schedule td { border: 1px solid #ddd; padding: 5px; text-align: left; }
        table.schedule th { background: #f0f0f0; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; }
        .status-actif { background: #d4edda; color: #155724; }
        .status-solde { background: #cce5ff; color: #004085; }
        .status-retard { background: #f8d7da; color: #721c24; }
        .status-en_attente { background: #fff3cd; color: #856404; }
        .status-paye { background: #d4edda; color: #155724; }
        .totals { background: #f7f7f7; padding: 10px; margin: 15px 0; }
        .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        .signatures { display: table; width: 100%; margin-top: 30px; }
        .sig-col { display: table-cell; width: 50%; text-align: center; }
        .sig-line { border-top: 1px solid #333; width: 150px; margin: 30px auto 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRAT DE VENTE PAR TRANCHES</h1>
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

    <div class="contract-title">
        Réf: {{ $sale->reference }}
        <span class="status-badge status-{{ $sale->status }}">{{ strtoupper($sale->status) }}</span>
    </div>

    <div class="section">
        <div class="section-title">CLIENT</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom complet</div>
                <div class="info-value">{{ $client->full_name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $client->phone }}</div>
            </div>
            @if($client->address)
            <div class="info-row">
                <div class="info-label">Adresse</div>
                <div class="info-value">{{ $client->address }}@if($client->city), {{ $client->city }}@endif</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">ARTICLE</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Désignation</div>
                <div class="info-value">{{ $sale->article_name }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Prix total</div>
                <div class="info-value"><strong>{{ number_format($sale->total_amount, 0, ',', ' ') }} FCFA</strong></div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">MODALITÉS DE PAIEMENT</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Acompte versé</div>
                <div class="info-value">{{ number_format($sale->down_payment, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Nombre de tranches</div>
                <div class="info-value">{{ $sale->installment_count }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Montant par tranche</div>
                <div class="info-value">{{ number_format($sale->installment_amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fréquence</div>
                <div class="info-value">{{ ucfirst($sale->frequency) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date début</div>
                <div class="info-value">{{ $sale->start_date->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date fin prévue</div>
                <div class="info-value">{{ $sale->end_date->format('d/m/Y') }}</div>
            </div>
        </div>
    </div>

    @if($sale->schedules->count() > 0)
    <div class="section">
        <div class="section-title">ÉCHÉANCIER</div>
        <table class="schedule">
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Échéance</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Payé le</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->schedules as $schedule)
                <tr>
                    <td>{{ $schedule->installment_number }}</td>
                    <td>{{ $schedule->due_date->format('d/m/Y') }}</td>
                    <td>{{ number_format($schedule->amount, 0, ',', ' ') }}</td>
                    <td><span class="status-badge status-{{ $schedule->status }}">{{ $schedule->status }}</span></td>
                    <td>{{ $schedule->paid_date ? $schedule->paid_date->format('d/m/Y') : '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="totals">
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Total payé</div>
                <div class="info-value">{{ number_format($sale->paid_amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Reste à payer</div>
                <div class="info-value"><strong>{{ number_format($sale->remaining_amount, 0, ',', ' ') }} FCFA</strong></div>
            </div>
        </div>
    </div>

    <div class="signatures">
        <div class="sig-col">
            <div class="sig-line"></div>
            Le Vendeur
        </div>
        <div class="sig-col">
            <div class="sig-line"></div>
            Le Client
        </div>
    </div>

    <div class="footer">
        Document généré le {{ now()->format('d/m/Y à H:i') }}<br>
        @if($sale->createdBy) Vente enregistrée par: {{ $sale->createdBy->name }} @endif
    </div>
</body>
</html>

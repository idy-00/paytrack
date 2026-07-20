<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reçu de paiement — {{ $payment->receipt_number }}</title>
<style>
  body { font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; background: #FAFAF8; color: #1A2332; margin: 0; padding: 0; }
  .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E2DDD6; }
  .header { background: #1A2332; padding: 28px 32px; }
  .header-title { font-size: 22px; font-weight: 700; color: #fff; margin: 0; letter-spacing: -0.01em; }
  .header-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin: 4px 0 0; }
  .body { padding: 32px; }
  .amount-hero { font-size: 36px; font-weight: 700; color: #1C7A52; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .amount-sub { font-size: 13px; color: #5A6A7A; margin: 4px 0 0; }
  .divider { border: 0; border-top: 1px solid #E2DDD6; margin: 24px 0; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #F2EFE9; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #5A6A7A; }
  .row-value { font-weight: 500; font-variant-numeric: tabular-nums; }
  .progress-track { background: #F2EFE9; border-radius: 4px; height: 8px; margin: 16px 0 8px; }
  .progress-fill { background: #1C7A52; border-radius: 4px; height: 8px; }
  .progress-label { font-size: 12px; color: #5A6A7A; text-align: right; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #D1FAE5; color: #0D5E3A; }
  .footer { background: #F2EFE9; padding: 20px 32px; font-size: 12px; color: #8896A3; text-align: center; }
  .cta { display: inline-block; background: #1B5FA8; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 20px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="header-title">PayTrack</div>
    <div class="header-sub">Reçu de paiement</div>
  </div>

  <div class="body">
    <p style="margin:0 0 4px;font-size:14px;color:#5A6A7A">Bonjour,</p>
    <p style="margin:0 0 20px;font-size:15px;font-weight:500">{{ $sale->client->full_name }}</p>

    <div class="amount-hero">{{ number_format($payment->amount, 0, '.', ' ') }} FCFA</div>
    <div class="amount-sub">Reçu confirmé · {{ $payment->receipt_number }}</div>
    <div class="amount-sub" style="margin-top:4px">{{ \Carbon\Carbon::parse($payment->payment_date)->format('d/m/Y') }}</div>

    <hr class="divider" />

    <div class="row">
      <span class="row-label">Article</span>
      <span class="row-value">{{ $sale->article_name }}</span>
    </div>
    <div class="row">
      <span class="row-label">Référence dossier</span>
      <span class="row-value" style="font-family:monospace">{{ $sale->reference }}</span>
    </div>
    <div class="row">
      <span class="row-label">Mode de paiement</span>
      <span class="row-value" style="text-transform:capitalize">{{ str_replace('_', ' ', $payment->payment_method) }}</span>
    </div>
    <div class="row">
      <span class="row-label">Montant total</span>
      <span class="row-value">{{ number_format($sale->total_amount, 0, '.', ' ') }} FCFA</span>
    </div>
    <div class="row">
      <span class="row-label">Déjà payé</span>
      <span class="row-value" style="color:#1C7A52">{{ number_format($sale->paid_amount, 0, '.', ' ') }} FCFA</span>
    </div>
    <div class="row">
      <span class="row-label">Reste à payer</span>
      <span class="row-value" style="color:#1B5FA8">{{ number_format($remaining, 0, '.', ' ') }} FCFA</span>
    </div>

    @php
      $pct = $sale->total_amount > 0 ? round(($sale->paid_amount / $sale->total_amount) * 100) : 0;
    @endphp
    <div class="progress-track">
      <div class="progress-fill" style="width:{{ $pct }}%"></div>
    </div>
    <div class="progress-label">{{ $pct }}% réglé</div>

    @if($remaining <= 0)
    <p style="margin:20px 0 0;"><span class="badge">✓ Dossier entièrement soldé</span></p>
    @endif

    <a href="{{ url('/qr/' . $sale->qr_uuid) }}" class="cta">Voir mon dossier en ligne</a>
  </div>

  <div class="footer">
    {{ $shopName }} · Ce reçu a été généré automatiquement par PayTrack.<br />
    Ne pas répondre à cet email.
  </div>
</div>
</body>
</html>

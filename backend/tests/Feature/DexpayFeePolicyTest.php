<?php

namespace Tests\Feature;

use App\Services\DexpayService;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DexpayFeePolicyTest extends TestCase
{
    public function test_cash_in_info_does_not_turn_missing_dexpay_fees_into_zero(): void
    {
        $service = app(DexpayService::class);
        $info = $service->extractPaymentInfo([
            'event' => 'checkout.completed',
            'data' => ['amount' => 10_000],
        ]);

        $this->assertNull($info['fee_amount']);
        $this->assertNull($info['merchant_net']);
    }

    public function test_cash_out_quote_uses_the_fee_returned_by_dexpay_provider_api(): void
    {
        config()->set('services.dexpay.public_key', 'pk_test');
        config()->set('services.dexpay.secret_key', 'sk_test');

        Http::fake([
            '*/api/v1/payouts-providers*' => Http::response([
                'data' => [[
                    'provider_short_name' => 'wave_sn_payout',
                    'provider_country' => 'SN',
                    'provider_fee_type' => 'percentage',
                    'provider_fee' => 2.3,
                ]],
            ]),
        ]);

        $quote = app(DexpayService::class)->quotePayout(10_000, 'wave_sn_payout');

        $this->assertSame(230, $quote['estimated_fee']);
        $this->assertSame(9_770, $quote['estimated_net_amount']);
        $this->assertSame('dexpay_provider_api', $quote['fee_source']);
    }

    public function test_only_dexpay_is_exposed_as_a_runtime_gateway(): void
    {
        config()->set('services.dexpay.public_key', 'pk_test');
        config()->set('services.wave.api_key', 'legacy-key');
        config()->set('services.orange_money.enabled', true);

        $this->assertSame(['dexpay'], PaymentGatewayFactory::available());
    }

    public function test_webhook_signature_is_verified_against_the_raw_body(): void
    {
        config()->set('services.dexpay.secret_key', 'sk_test_signature');
        $rawBody = '{"event":"checkout.completed", "amount":1000}';
        $signature = hash_hmac('sha256', $rawBody, 'sk_test_signature');

        $this->assertTrue(app(DexpayService::class)->verifyWebhookSignature($rawBody, $signature));
        $this->assertFalse(app(DexpayService::class)->verifyWebhookSignature(
            '{"event":"checkout.completed","amount":1000}',
            $signature,
        ));
    }

    public function test_real_dexpay_flat_webhook_payload_is_extracted(): void
    {
        $info = app(DexpayService::class)->extractPaymentInfo([
            'event' => 'checkout.completed',
            'reference' => 'ORDER_12345',
            'checkout_session_id' => 'session_123',
            'transaction_id' => 'transaction_123',
            'status' => 'completed',
            'amount' => 10_000,
            'currency' => 'XOF',
            'operator' => 'wave_sn',
            'customer' => ['phone' => '+221771234567'],
        ]);

        $this->assertSame('transaction_123', $info['transaction_id']);
        $this->assertSame('ORDER_12345', $info['reference']);
        $this->assertSame(10_000, $info['amount']);
        $this->assertSame('wave_sn', $info['operator']);
    }
}

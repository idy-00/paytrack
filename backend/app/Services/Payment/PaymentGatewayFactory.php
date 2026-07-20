<?php

namespace App\Services\Payment;

use App\Services\Payment\Gateways\FreeMoneyGateway;
use App\Services\Payment\Gateways\OrangeMoneyGateway;
use App\Services\Payment\Gateways\WaveGateway;
use InvalidArgumentException;

/**
 * Resolves the correct payment gateway by name.
 *
 * Gateways actifs pour la V1 :
 *   - wave         → ACTIF (ATAABA, numéro 78 751 72 72)
 *   - orange_money → EN ATTENTE (feature flag ORANGE_MONEY_ENABLED=false)
 *   - free_money   → SKIP V1 (désactivé définitivement)
 *
 * Usage: PaymentGatewayFactory::make('wave')->initiate($request)
 */
class PaymentGatewayFactory
{
    private static array $gateways = [
        'wave'         => WaveGateway::class,
        'orange_money' => OrangeMoneyGateway::class,
        // 'free_money' → désactivé V1
    ];

    public static function make(string $gateway): PaymentGatewayInterface
    {
        $key = strtolower($gateway);

        // Orange Money: vérifier le feature flag avant de résoudre
        if ($key === 'orange_money' && ! config('services.orange_money.enabled', false)) {
            throw new InvalidArgumentException(
                "Orange Money est désactivé (code marchand en attente). "
                . "Activer avec ORANGE_MONEY_ENABLED=true une fois validé."
            );
        }

        // Free Money: désactivé V1
        if ($key === 'free_money') {
            throw new InvalidArgumentException(
                "Free Money n'est pas disponible dans la V1."
            );
        }

        $class = self::$gateways[$key] ?? null;

        if (! $class) {
            throw new InvalidArgumentException(
                "Gateway inconnu: '{$gateway}'. Disponibles: " . implode(', ', self::available())
            );
        }

        return app($class);
    }

    /** Retourne les gateways actuellement actifs */
    public static function available(): array
    {
        $active = ['wave'];

        if (config('services.orange_money.enabled', false)) {
            $active[] = 'orange_money';
        }

        return $active;
    }
}

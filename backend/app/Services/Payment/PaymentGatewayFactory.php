<?php

namespace App\Services\Payment;

use App\Services\Payment\Gateways\DexpayGateway;
use InvalidArgumentException;

/**
 * Resolves the correct payment gateway by name.
 *
 * Gateways actifs :
 *   - dexpay       → ACTIF (agrégateur principal - Wave, Orange Money, MTN, Moov)
 *   - wave         → ACTIF (direct - ATAABA, numéro 78 751 72 72)
 *   - orange_money → EN ATTENTE (feature flag ORANGE_MONEY_ENABLED=false)
 *   - free_money   → SKIP V1 (désactivé définitivement)
 *
 * Usage: PaymentGatewayFactory::make('dexpay')->initiate($request)
 */
class PaymentGatewayFactory
{
    private static array $gateways = [
        'dexpay'       => DexpayGateway::class,
    ];

    public static function make(string $gateway): PaymentGatewayInterface
    {
        $key = strtolower($gateway);

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
        $active = [];

        // DexPay est l'agrégateur principal (inclut Wave, Orange Money, MTN, Moov)
        if (config('services.dexpay.public_key')) {
            $active[] = 'dexpay';
        }

        return $active ?: ['dexpay']; // Défaut à dexpay si rien n'est configuré
    }
}

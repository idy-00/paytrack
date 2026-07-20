<?php

namespace App\Services\Notification\Templates;

/**
 * SMS / WhatsApp message templates.
 * All variables use {{variable_name}} syntax.
 * Multilingual: fr (default), en, wo (wolof).
 */
class MessageTemplates
{
    private static array $templates = [
        // ── Payment received ────────────────────────────────────────────
        'payment_received' => [
            'fr' => "✅ Bonjour {{client_name}}, votre paiement de {{amount}} FCFA a été reçu pour {{article}}. Reçu n°{{receipt}}. Reste dû : {{remaining}} FCFA. Merci ! — {{shop_name}}",
            'en' => "✅ Hello {{client_name}}, your payment of {{amount}} XOF has been received for {{article}}. Receipt #{{receipt}}. Remaining: {{remaining}} XOF. Thank you! — {{shop_name}}",
            'wo' => "✅ Mangi dem {{client_name}}, am nga {{amount}} FCFA bëgg ak {{article}}. Numéro reçu: {{receipt}}. Dëkk ci dëkk : {{remaining}} FCFA. Jërejëf! — {{shop_name}}",
        ],
        // ── Payment reminder (1 day before due) ─────────────────────────
        'payment_reminder' => [
            'fr' => "⏰ Rappel — {{client_name}}, votre tranche n°{{installment_num}} de {{amount}} FCFA pour {{article}} est prévue demain ({{due_date}}). — {{shop_name}}",
            'en' => "⏰ Reminder — {{client_name}}, your installment #{{installment_num}} of {{amount}} XOF for {{article}} is due tomorrow ({{due_date}}). — {{shop_name}}",
        ],
        // ── Payment overdue ──────────────────────────────────────────────
        'payment_overdue' => [
            'fr' => "⚠️ {{client_name}}, votre tranche de {{amount}} FCFA pour {{article}} était due le {{due_date}} et n'a pas encore été reçue. Merci de régulariser. — {{shop_name}}",
            'en' => "⚠️ {{client_name}}, your installment of {{amount}} XOF for {{article}} was due on {{due_date}} and has not been received. Please settle. — {{shop_name}}",
        ],
        // ── Fully paid / settled ─────────────────────────────────────────
        'sale_settled' => [
            'fr' => "🎉 Félicitations {{client_name}} ! Votre dossier pour {{article}} est entièrement soldé. Merci de votre confiance. — {{shop_name}}",
            'en' => "🎉 Congratulations {{client_name}}! Your account for {{article}} is fully settled. Thank you! — {{shop_name}}",
        ],
        // ── New sale created (sent to client) ────────────────────────────
        'sale_created' => [
            'fr' => "📋 Bonjour {{client_name}}, une vente par tranche a été créée pour vous chez {{shop_name}}.\nArticle : {{article}}\nTotal : {{total}} FCFA\nAcompte : {{down_payment}} FCFA\n{{installment_count}} tranches de {{installment_amount}} FCFA ({{frequency}}).\nRéférence : {{reference}}",
            'en' => "📋 Hello {{client_name}}, an installment sale has been created for you at {{shop_name}}.\nItem: {{article}}\nTotal: {{total}} XOF\nDown payment: {{down_payment}} XOF\n{{installment_count}} installments of {{installment_amount}} XOF ({{frequency}}).\nRef: {{reference}}",
        ],
        // ── Weekly summary (sent to vendor) ─────────────────────────────
        'weekly_summary' => [
            'fr' => "📊 Résumé semaine — {{shop_name}}\nEncaissé : {{collected}} FCFA\nEn retard : {{overdue_count}} dossiers ({{overdue_amount}} FCFA)\nActifs : {{active_count}} ventes",
        ],
    ];

    public static function render(string $template, string $lang, array $vars): string
    {
        $text = self::$templates[$template][$lang]
            ?? self::$templates[$template]['fr']
            ?? "Template '{$template}' not found.";

        foreach ($vars as $key => $value) {
            $text = str_replace("{{$key}}", $value, $text);
        }

        return $text;
    }

    public static function get(string $template, string $lang = 'fr'): ?string
    {
        return self::$templates[$template][$lang]
            ?? self::$templates[$template]['fr']
            ?? null;
    }

    public static function all(): array
    {
        return array_keys(self::$templates);
    }
}

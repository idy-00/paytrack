<?php

namespace App\Services\Notification;

interface NotificationServiceInterface
{
    /**
     * Send a single message to one recipient.
     * @param string $to Phone (+221XXXXXXXXX) or email
     * @param string $template Template key (see config/paytrack.php)
     * @param array  $variables Variables to inject into the template
     */
    public function send(string $to, string $template, array $variables = []): NotificationResult;

    /**
     * Send in bulk. Returns results keyed by recipient.
     */
    public function sendBulk(array $recipients, string $template, array $variables = []): array;
}

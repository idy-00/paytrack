<?php

namespace App\Services\Notification;

readonly class NotificationResult
{
    public function __construct(
        public bool    $success,
        public ?string $messageId,
        public string  $message,
        public array   $rawResponse = [],
    ) {}
}

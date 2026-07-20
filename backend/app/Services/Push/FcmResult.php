<?php

namespace App\Services\Push;

readonly class FcmResult
{
    public function __construct(
        public bool    $success,
        public ?string $messageId,
        public string  $message,
        public array   $rawResponse = [],
    ) {}
}

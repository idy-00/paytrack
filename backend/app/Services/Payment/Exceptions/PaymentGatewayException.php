<?php

namespace App\Services\Payment\Exceptions;

class PaymentGatewayException extends \RuntimeException {}

class InvalidWebhookSignature extends PaymentGatewayException {}

class GatewayUnavailableException extends PaymentGatewayException {}

<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $type = 'login',
        public ?string $userName = null,
    ) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'login' => 'PayTrack — Votre code de connexion',
            'register' => 'PayTrack — Confirmez votre inscription',
            'password_reset' => 'PayTrack — Réinitialisation de mot de passe',
        ];

        return new Envelope(
            subject: $subjects[$this->type] ?? 'PayTrack — Votre code de vérification',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp-code',
        );
    }
}

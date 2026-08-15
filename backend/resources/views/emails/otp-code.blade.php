<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de vérification PayTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F7F5F0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <tr>
            <td>
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #1D6FE8 0%, #1557B8 100%); border-radius: 16px; line-height: 56px; font-size: 24px;">
                        📱
                    </div>
                    <h1 style="margin: 16px 0 0 0; font-size: 24px; font-weight: 700; color: #1A1A1A;">PayTrack</h1>
                </div>

                <!-- Card -->
                <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #E8E4DD;">
                    @if($type === 'login')
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A1A;">Connexion à votre compte</h2>
                        <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                            @if($userName)
                                Bonjour {{ $userName }},<br>
                            @endif
                            Voici votre code de connexion :
                        </p>
                    @elseif($type === 'register')
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A1A;">Confirmez votre inscription</h2>
                        <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                            Bienvenue sur PayTrack ! Voici votre code de confirmation :
                        </p>
                    @else
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A1A;">Réinitialisation du mot de passe</h2>
                        <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
                            Vous avez demandé à réinitialiser votre mot de passe. Voici votre code :
                        </p>
                    @endif

                    <!-- OTP Code -->
                    <div style="background: #F7F5F0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1D6FE8; font-family: monospace;">
                            {{ $code }}
                        </div>
                    </div>

                    <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; text-align: center;">
                        ⏱️ Ce code expire dans <strong style="color: #1A1A1A;">10 minutes</strong>
                    </p>
                    <p style="margin: 0; color: #9CA3AF; font-size: 12px; text-align: center;">
                        Si vous n'avez pas demandé ce code, ignorez cet email.
                    </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 32px;">
                    <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                        © {{ date('Y') }} PayTrack — Suivi de paiements intelligent
                    </p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>

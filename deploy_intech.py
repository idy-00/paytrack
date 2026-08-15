#!/usr/bin/env python3
import paramiko
import os

HOST = '82.198.228.133'
PORT = 65002
USER = 'u166382491'
PASS = 'At@@b@Expertise2828'
REMOTE_BASE = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend'
LOCAL_BASE = 'backend'

FILES = [
    ('app/Services/IntechService.php', 'app/Services/IntechService.php'),
    ('app/Http/Controllers/Api/Webhook/IntechWebhookController.php', 'app/Http/Controllers/Api/Webhook/IntechWebhookController.php'),
    ('app/Http/Controllers/Api/KycController.php', 'app/Http/Controllers/Api/KycController.php'),
    ('app/Http/Controllers/Api/WalletController.php', 'app/Http/Controllers/Api/WalletController.php'),
    ('app/Http/Controllers/Api/AtaabaAdminController.php', 'app/Http/Controllers/Api/AtaabaAdminController.php'),
    ('app/Models/TenantKycDocument.php', 'app/Models/TenantKycDocument.php'),
    ('app/Models/WithdrawalRequest.php', 'app/Models/WithdrawalRequest.php'),
    ('app/Models/Tenant.php', 'app/Models/Tenant.php'),
    ('config/services.php', 'config/services.php'),
    ('routes/api.php', 'routes/api.php'),
    ('database/migrations/2026_08_15_000001_add_intech_and_kyc_fields.php', 'database/migrations/2026_08_15_000001_add_intech_and_kyc_fields.php'),
    ('.env.hostinger', '.env'),
]

print(f"Connecting to {HOST}:{PORT}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, port=PORT, username=USER, password=PASS, timeout=60, banner_timeout=60)
sftp = ssh.open_sftp()

for local, remote in FILES:
    local_path = os.path.join(LOCAL_BASE, local)
    remote_path = f'{REMOTE_BASE}/{remote}'

    # Create remote directory if needed
    remote_dir = os.path.dirname(remote_path)
    try:
        sftp.stat(remote_dir)
    except FileNotFoundError:
        print(f"Creating directory: {remote_dir}")
        stdin, stdout, stderr = ssh.exec_command(f'mkdir -p {remote_dir}')
        stdout.read()

    if os.path.exists(local_path):
        print(f"Uploading: {local} -> {remote}")
        sftp.put(local_path, remote_path)
    else:
        print(f"SKIP (not found): {local}")

print("\nRunning migrations...")
stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_BASE} && php artisan migrate --force 2>&1')
print(stdout.read().decode())
print(stderr.read().decode())

print("\nClearing cache...")
stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_BASE} && php artisan config:cache && php artisan route:cache 2>&1')
print(stdout.read().decode())

sftp.close()
ssh.close()
print("\nDone!")

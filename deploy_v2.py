#!/usr/bin/env python3
"""Deploy PayTrack v2 (subscriptions, wallets, orders) to Hostinger"""
import paramiko
import os

HOST = '82.198.228.133'
PORT = 65002
USER = 'u166382491'
PASS = os.environ.get('HOSTINGER_SSH_PASS', 'At@@b@Expertise2828')
REMOTE_BASE = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend'
LOCAL_BASE = r'C:\Users\RYZEN  5\paytrack\backend'

# New/modified files to upload
FILES = [
    # Models
    'app/Models/SubscriptionPlan.php',
    'app/Models/Subscription.php',
    'app/Models/SubscriptionInvoice.php',
    'app/Models/Wallet.php',
    'app/Models/WalletTransaction.php',
    'app/Models/WithdrawalRequest.php',
    'app/Models/PaytechWebhook.php',
    'app/Models/Supplier.php',
    'app/Models/SupplierOrder.php',
    'app/Models/SupplierOrderItem.php',
    'app/Models/SupplierPayment.php',
    'app/Models/Order.php',
    'app/Models/OrderItem.php',
    'app/Models/OrderPayment.php',
    'app/Models/StockMovement.php',
    'app/Models/Inventory.php',
    'app/Models/InventoryItem.php',
    'app/Models/Tenant.php',
    'app/Models/Article.php',

    # Services
    'app/Services/PaytechService.php',
    'app/Services/SubscriptionService.php',
    'app/Services/StockService.php',

    # Controllers
    'app/Http/Controllers/Api/AtaabaAdminController.php',
    'app/Http/Controllers/Api/SubscriptionController.php',
    'app/Http/Controllers/Api/WalletController.php',
    'app/Http/Controllers/Api/OrderController.php',
    'app/Http/Controllers/Api/SupplierController.php',
    'app/Http/Controllers/Api/SupplierOrderController.php',
    'app/Http/Controllers/Api/StockController.php',
    'app/Http/Controllers/Api/AuthController.php',
    'app/Http/Controllers/Api/Webhook/PaytechWebhookController.php',

    # Middleware
    'app/Http/Middleware/CheckSubscription.php',
    'app/Http/Middleware/CheckPlanFeature.php',

    # Policies
    'app/Policies/OrderPolicy.php',
    'app/Policies/SupplierPolicy.php',
    'app/Policies/SupplierOrderPolicy.php',

    # Providers
    'app/Providers/AppServiceProvider.php',

    # Config
    'config/services.php',
    'bootstrap/app.php',
    'routes/api.php',

    # Commands
    'app/Console/Commands/CheckSubscriptions.php',
]

def ensure_remote_dir(sftp, path):
    """Create remote directory if it doesn't exist"""
    dirs = path.split('/')
    current = ''
    for d in dirs[:-1]:  # Skip filename
        if not d:
            continue
        current += '/' + d
        try:
            sftp.stat(current)
        except FileNotFoundError:
            print(f'  Creating dir: {current}')
            sftp.mkdir(current)

def main():
    print('Connecting to Hostinger...')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS)
    sftp = ssh.open_sftp()
    print('Connected!\n')

    success = 0
    failed = []

    for rel_path in FILES:
        local_path = os.path.join(LOCAL_BASE, rel_path)
        remote_path = f'{REMOTE_BASE}/{rel_path}'

        if not os.path.exists(local_path):
            print(f'SKIP (not found): {rel_path}')
            failed.append(rel_path)
            continue

        try:
            ensure_remote_dir(sftp, remote_path)
            sftp.put(local_path, remote_path)
            print(f'OK: {rel_path}')
            success += 1
        except Exception as e:
            print(f'FAIL: {rel_path} - {e}')
            failed.append(rel_path)

    sftp.close()

    # Clear Laravel cache
    print('\nClearing Laravel cache...')
    stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_BASE} && php artisan config:clear && php artisan route:clear && php artisan cache:clear 2>&1')
    print(stdout.read().decode())

    ssh.close()

    print(f'\n=== DEPLOY COMPLETE ===')
    print(f'Uploaded: {success}/{len(FILES)}')
    if failed:
        print(f'Failed: {failed}')

if __name__ == '__main__':
    main()

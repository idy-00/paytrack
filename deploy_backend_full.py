#!/usr/bin/env python3
"""Deploy full PayTrack backend to Hostinger"""
import paramiko
import os

HOST = '82.198.228.133'
PORT = 65002
USER = 'u166382491'
PASS = os.environ.get('HOSTINGER_SSH_PASS')
if not PASS:
    raise ValueError('HOSTINGER_SSH_PASS environment variable required')
REMOTE_BASE = '/home/u166382491/domains/lightsalmon-eel-638395.hostingersite.com/public_html/backend'
LOCAL_BASE = r'C:\Users\RYZEN  5\paytrack\backend'

# Files to upload (local relative to backend/, remote relative to REMOTE_BASE)
FILES = [
    # Controllers
    'app/Http/Controllers/Api/ArticleController.php',
    'app/Http/Controllers/Api/AuthController.php',
    'app/Http/Controllers/Api/DashboardController.php',
    'app/Http/Controllers/Api/PaymentController.php',
    'app/Http/Controllers/Api/AdminController.php',
    'app/Http/Controllers/Api/AtaabaAdminController.php',
    'app/Http/Controllers/Api/OrderController.php',
    'app/Http/Controllers/Api/OtpController.php',
    'app/Http/Controllers/Api/StockController.php',
    'app/Http/Controllers/Api/SubscriptionController.php',
    'app/Http/Controllers/Api/SupplierController.php',
    'app/Http/Controllers/Api/SupplierOrderController.php',
    'app/Http/Controllers/Api/WalletController.php',
    'app/Http/Controllers/Api/Webhook/PaytechWebhookController.php',
    # Middleware
    'app/Http/Middleware/CheckSubscription.php',
    'app/Http/Middleware/CheckPlanFeature.php',
    # Models
    'app/Models/Article.php',
    'app/Models/Shop.php',
    'app/Models/Tenant.php',
    'app/Models/Order.php',
    'app/Models/OrderItem.php',
    'app/Models/OrderPayment.php',
    'app/Models/Subscription.php',
    'app/Models/SubscriptionPlan.php',
    'app/Models/SubscriptionInvoice.php',
    'app/Models/Wallet.php',
    'app/Models/WalletTransaction.php',
    'app/Models/WithdrawalRequest.php',
    'app/Models/Supplier.php',
    'app/Models/SupplierOrder.php',
    'app/Models/SupplierOrderItem.php',
    'app/Models/SupplierPayment.php',
    'app/Models/StockMovement.php',
    'app/Models/Inventory.php',
    'app/Models/InventoryItem.php',
    'app/Models/PaytechWebhook.php',
    # Services
    'app/Services/PaytechService.php',
    'app/Services/SubscriptionService.php',
    'app/Services/StockService.php',
    # Console Commands
    'app/Console/Commands/CheckSubscriptions.php',
    # Config
    'app/Providers/AppServiceProvider.php',
    'bootstrap/app.php',
    'config/services.php',
    'routes/api.php',
    # Migrations
    'database/migrations/2026_08_07_000001_add_subscriptions_wallets_orders.php',
    # Seeders
    'database/seeders/SubscriptionPlanSeeder.php',
    # Env example
    '.env.example',
]

def ensure_remote_dir(sftp, path):
    """Ensure remote directory exists"""
    dirs = path.split('/')
    current = ''
    for d in dirs[:-1]:  # Exclude filename
        current += '/' + d if current else d
        try:
            sftp.stat(f'{REMOTE_BASE}/{current}')
        except IOError:
            try:
                sftp.mkdir(f'{REMOTE_BASE}/{current}')
                print(f'  Created dir: {current}')
            except IOError:
                pass

def main():
    print('Connecting to Hostinger...')
    ssh = paramiko.SSHClient()
    known_hosts = os.path.expanduser('~/.ssh/known_hosts')
    if os.path.exists(known_hosts):
        ssh.load_host_keys(known_hosts)
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=PASS)
    sftp = ssh.open_sftp()
    print('Connected!\n')

    uploaded = 0
    skipped = 0

    for rel_path in FILES:
        local_path = os.path.join(LOCAL_BASE, rel_path)
        remote_path = f'{REMOTE_BASE}/{rel_path}'

        if not os.path.exists(local_path):
            print(f'SKIP (not found): {rel_path}')
            skipped += 1
            continue

        ensure_remote_dir(sftp, rel_path)
        sftp.put(local_path, remote_path)
        print(f'OK: {rel_path}')
        uploaded += 1

    sftp.close()
    ssh.close()
    print(f'\nBackend deployed! {uploaded} files uploaded, {skipped} skipped.')

if __name__ == '__main__':
    main()

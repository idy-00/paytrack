#!/usr/bin/env python3
"""Full API test suite for PayTrack - tests all endpoints and workflows"""
import requests
import json
from datetime import datetime

BASE_URL = 'https://lightsalmon-eel-638395.hostingersite.com/backend/public/api'
TEST_USER = {
    'name': 'Client Test',
    'email': f'test_{datetime.now().strftime("%H%M%S")}@test.com',
    'password': 'TestPass123!',
    'password_confirmation': 'TestPass123!',
    'phone': '781194805',
    'shop_name': 'Boutique Test Wave'
}
TOKEN = None
TENANT_ID = None

created = {
    'client_id': None,
    'article_id': None,
    'sale_id': None,
    'order_id': None,
    'supplier_id': None,
}

def log(emoji, msg):
    print(f"{emoji} {msg}")

def is_ok(r):
    """Check if response is successful"""
    if r is None:
        return False
    if isinstance(r, list):
        return True
    if isinstance(r, dict):
        return not r.get('_error')
    return True

def get_id(r, *keys):
    """Extract ID from response"""
    if isinstance(r, dict):
        for k in keys:
            if '.' in k:
                parts = k.split('.')
                val = r
                for p in parts:
                    val = val.get(p, {}) if isinstance(val, dict) else {}
                if val:
                    return val
            elif r.get(k):
                return r.get(k)
    return None

def api(method, endpoint, data=None, auth=True):
    """Make API request"""
    headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
    if auth and TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'

    url = f'{BASE_URL}{endpoint}'

    try:
        if method == 'GET':
            r = requests.get(url, headers=headers, timeout=30)
        elif method == 'POST':
            r = requests.post(url, headers=headers, json=data, timeout=30)
        elif method == 'PUT':
            r = requests.put(url, headers=headers, json=data, timeout=30)
        elif method == 'DELETE':
            r = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f'Unknown method: {method}')

        if r.status_code >= 400:
            return {'_error': True, '_status': r.status_code, '_body': r.text[:300]}

        if r.status_code == 204:
            return {'_empty': True}

        return r.json()
    except Exception as e:
        return {'_error': True, '_exception': str(e)}

def test_public_endpoints():
    log('=', '=== PUBLIC ENDPOINTS ===')

    r = api('GET', '/plans', auth=False)
    if isinstance(r, list):
        log('OK', f'/plans -> {len(r)} plans')
        for p in r:
            log(' ', f"  - {p.get('name')}: {p.get('price_monthly')} FCFA/mois")
    else:
        log('!' if not is_ok(r) else 'OK', f'/plans -> {r}')

def test_auth():
    global TOKEN, TENANT_ID
    log('=', '=== AUTH ===')

    r = api('POST', '/auth/login', {'email': TEST_USER['email'], 'password': TEST_USER['password']}, auth=False)
    if is_ok(r) and r.get('token'):
        TOKEN = r.get('token')
        TENANT_ID = r.get('user', {}).get('tenant_id')
        log('OK', f'Login OK')
        return True

    log(' ', 'Login failed, trying register...')
    r = api('POST', '/auth/register', TEST_USER, auth=False)
    if is_ok(r) and r.get('token'):
        TOKEN = r.get('token')
        TENANT_ID = r.get('user', {}).get('tenant_id')
        log('OK', f'Register OK')
        return True

    log('!', f'Auth FAIL: {r}')
    return False

def test_me():
    r = api('GET', '/auth/me')
    if is_ok(r):
        user = r.get('user', r)
        log('OK', f'/auth/me -> {user.get("email", user)}')
    else:
        log('!', f'/auth/me FAIL: {r}')

def test_dashboard():
    log('=', '=== DASHBOARD ===')
    for endpoint in ['/dashboard/stats', '/dashboard/activity', '/dashboard/upcoming']:
        r = api('GET', endpoint)
        log('OK' if is_ok(r) else '!', f'{endpoint}')

def test_subscription():
    log('=', '=== SUBSCRIPTION ===')

    r = api('GET', '/subscription/current')
    if is_ok(r):
        sub = r.get('subscription') if isinstance(r, dict) else None
        if sub:
            log('OK', f'Subscription: {sub.get("plan", {}).get("name")} - {sub.get("status")}')
        else:
            log('OK', 'No subscription yet')
    else:
        log('!', f'/subscription/current FAIL: {r}')

    r = api('GET', '/subscription/invoices')
    log('OK' if is_ok(r) else '!', '/subscription/invoices')

def test_wallet():
    log('=', '=== WALLET ===')

    r = api('GET', '/wallet')
    if is_ok(r) and isinstance(r, dict):
        log('OK', f'Wallet balance: {r.get("balance", 0)} FCFA')
    else:
        log('!', f'/wallet FAIL: {r}')

    r = api('GET', '/wallet/transactions')
    log('OK' if is_ok(r) else '!', '/wallet/transactions')

    r = api('GET', '/wallet/withdrawals')
    log('OK' if is_ok(r) else '!', '/wallet/withdrawals')

def test_clients():
    log('=', '=== CLIENTS ===')

    client_data = {
        'full_name': 'Ibrahima Test Client Wave',
        'phone': '781194805',
        'email': 'wave@test.com',
        'address': 'Dakar, Senegal'
    }
    r = api('POST', '/clients', client_data)
    if is_ok(r):
        created['client_id'] = get_id(r, 'id', 'client.id')
        log('OK', f'Client created: {created["client_id"]}')
    else:
        log('!', f'Create client FAIL: {r}')

    r = api('GET', '/clients')
    log('OK' if is_ok(r) else '!', '/clients')

    if created['client_id']:
        r = api('GET', f'/clients/{created["client_id"]}')
        log('OK' if is_ok(r) else '!', f'/clients/{created["client_id"]}')

        r = api('PUT', f'/clients/{created["client_id"]}', {'adresse': 'Dakar Plateau'})
        log('OK' if is_ok(r) else '!', f'Update client')

def test_articles():
    log('=', '=== ARTICLES ===')

    article_data = {
        'name': 'iPhone 15 Pro Test',
        'price': 850000,
        'stock': 10,
        'stock_alert_threshold': 3,
        'track_stock': True
    }
    r = api('POST', '/articles', article_data)
    if is_ok(r):
        created['article_id'] = get_id(r, 'id', 'article.id')
        log('OK', f'Article created: {created["article_id"]}')
    else:
        log('!', f'Create article FAIL: {r}')

    r = api('GET', '/articles')
    log('OK' if is_ok(r) else '!', '/articles')

def test_sales():
    log('=', '=== SALES ===')

    if not created['client_id'] or not created['article_id']:
        log('!', 'Skip sales - need client and article')
        return

    sale_data = {
        'client_id': created['client_id'],
        'article_id': created['article_id'],
        'article_name': 'iPhone 15 Pro Test',
        'total_amount': 850000,
        'down_payment': 200000,
        'payment_mode': 'tranche',
        'installment_count': 10,
        'frequency': 'mensuel',
        'start_date': datetime.now().strftime('%Y-%m-%d'),
    }
    r = api('POST', '/sales', sale_data)
    if is_ok(r):
        created['sale_id'] = get_id(r, 'id', 'sale.id', 'vente.id')
        log('OK', f'Sale created: {created["sale_id"]}')
    else:
        log('!', f'Create sale FAIL: {r}')

    r = api('GET', '/sales')
    log('OK' if is_ok(r) else '!', '/sales')

def test_orders():
    log('=', '=== ORDERS ===')

    if not created['client_id'] or not created['article_id']:
        log('!', 'Skip orders - need client and article')
        return

    order_data = {
        'client_id': created['client_id'],
        'items': [{'article_id': created['article_id'], 'quantity': 1, 'unit_price': 850000}],
        'notes': 'Test order via API'
    }
    r = api('POST', '/orders', order_data)
    if is_ok(r):
        created['order_id'] = get_id(r, 'id', 'order.id')
        log('OK', f'Order created: {created["order_id"]}')
    else:
        log('!', f'Create order FAIL: {r}')

    r = api('GET', '/orders')
    log('OK' if is_ok(r) else '!', '/orders')

    if created['order_id']:
        r = api('PUT', f'/orders/{created["order_id"]}/status', {'status': 'confirmed'})
        log('OK' if is_ok(r) else '!', 'Order status -> confirmed')

def test_stock():
    log('=', '=== STOCK ===')

    r = api('GET', '/stock/overview')
    log('OK' if is_ok(r) else '!', '/stock/overview')

    r = api('GET', '/stock/movements')
    log('OK' if is_ok(r) else '!', '/stock/movements')

    r = api('GET', '/stock/alerts')
    log('OK' if is_ok(r) else '!', '/stock/alerts')

    if created['article_id']:
        r = api('POST', '/stock/adjust', {
            'article_id': created['article_id'],
            'quantity': 5,
            'type': 'in',
            'reason': 'test_adjustment',
            'notes': 'API test'
        })
        log('OK' if is_ok(r) else '!', f'Stock adjustment')

def test_suppliers():
    log('=', '=== SUPPLIERS (Business plan only) ===')

    r = api('POST', '/suppliers', {
        'name': 'Fournisseur Test',
        'phone': '771234567',
        'email': 'fournisseur@test.com',
        'address': 'Zone Industrielle Dakar'
    })
    if is_ok(r):
        created['supplier_id'] = get_id(r, 'id', 'supplier.id')
        log('OK', f'Supplier created: {created["supplier_id"]}')
    else:
        log('!', f'Suppliers: {r.get("_status", "?")} (may need Business plan)')

    r = api('GET', '/suppliers')
    log('OK' if is_ok(r) else '!', '/suppliers')

def test_inventories():
    log('=', '=== INVENTORIES (Pro/Business only) ===')

    r = api('GET', '/inventories')
    log('OK' if is_ok(r) else '!', '/inventories')

    r = api('POST', '/inventories', {'name': 'Inventaire Test'})
    log('OK' if is_ok(r) else '!', f'Create inventory: {r.get("_status", "OK") if isinstance(r, dict) else "OK"}')

def test_users():
    log('=', '=== USERS ===')
    r = api('GET', '/users')
    log('OK' if is_ok(r) else '!', '/users')

def test_shops():
    log('=', '=== SHOPS ===')
    r = api('GET', '/shops')
    log('OK' if is_ok(r) else '!', '/shops')

def test_exports():
    log('=', '=== EXPORTS ===')
    for endpoint in ['/exports/sales', '/exports/payments', '/exports/overdue']:
        r = api('GET', endpoint)
        log('OK' if is_ok(r) else '!', endpoint)

def main():
    print('\n' + '='*60)
    print('PAYTRACK FULL API TEST')
    print(f'Base URL: {BASE_URL}')
    print(f'Test user: {TEST_USER["email"]}')
    print('='*60 + '\n')

    test_public_endpoints()

    if test_auth():
        test_me()
        test_dashboard()
        test_subscription()
        test_wallet()
        test_clients()
        test_articles()
        test_sales()
        test_orders()
        test_stock()
        test_suppliers()
        test_inventories()
        test_users()
        test_shops()
        test_exports()

    print('\n' + '='*60)
    print('TEST COMPLETE')
    print(f'Created: {json.dumps(created, indent=2)}')
    print('='*60)

if __name__ == '__main__':
    main()

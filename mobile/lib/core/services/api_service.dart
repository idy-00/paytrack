import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

bool _isNetworkError(dynamic e) {
  return e.toString().contains('SocketException') ||
         e.toString().contains('ClientException') ||
         e.toString().contains('Connection refused');
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

class ApiService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  static String get baseUrl {
    // Production API on Hostinger
    return 'https://lightsalmon-eel-638395.hostingersite.com/backend/public/api';
  }

  static Future<String?> getToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_tokenKey);
    }
    return await _storage.read(key: _tokenKey);
  }

  static Future<void> setToken(String token) async {
    debugPrint('ApiService: Saving token');
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, token);
    } else {
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  static Future<void> clearToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_tokenKey);
    } else {
      await _storage.delete(key: _tokenKey);
    }
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _headers(),
      );
      return _handleResponse(response);
    } catch (e) {
      if (_isNetworkError(e)) throw ApiException('Serveur inaccessible. Vérifiez votre connexion.');
      rethrow;
    }
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final url = '$baseUrl$endpoint';
    debugPrint('API POST: $url');
    debugPrint('API DATA: ${jsonEncode(data)}');
    try {
      final headers = await _headers();
      debugPrint('API HEADERS: $headers');
      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: jsonEncode(data),
      );
      debugPrint('API RESPONSE: ${response.statusCode}');
      return _handleResponse(response);
    } catch (e) {
      debugPrint('API ERROR: $e');
      if (_isNetworkError(e)) throw ApiException('Serveur inaccessible. Vérifiez votre connexion.');
      rethrow;
    }
  }

  static Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _headers(),
        body: jsonEncode(data),
      );
      return _handleResponse(response);
    } catch (e) {
      if (_isNetworkError(e)) throw ApiException('Serveur inaccessible. Vérifiez votre connexion.');
      rethrow;
    }
  }

  static Future<dynamic> delete(String endpoint) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: await _headers(),
      );
      return _handleResponse(response);
    } catch (e) {
      if (_isNetworkError(e)) throw ApiException('Serveur inaccessible. Vérifiez votre connexion.');
      rethrow;
    }
  }

  static dynamic _handleResponse(http.Response response) {
    debugPrint('API Response [${response.statusCode}]: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');

    if (response.statusCode == 401) {
      clearToken();
      throw ApiException('Session expirée', 401);
    }

    if (response.statusCode == 204) {
      return null;
    }

    // Check if response is HTML (error page) instead of JSON
    if (response.body.trim().startsWith('<!DOCTYPE') || response.body.trim().startsWith('<html')) {
      throw ApiException('Erreur serveur (${response.statusCode})', response.statusCode);
    }

    dynamic body;
    try {
      body = response.body.isNotEmpty ? jsonDecode(response.body) : null;
    } catch (e) {
      throw ApiException('Réponse invalide du serveur', response.statusCode);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final message = body?['message'] ?? 'Erreur serveur (${response.statusCode})';
    throw ApiException(message, response.statusCode);
  }

  // Auth endpoints
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await post('/auth/login', {
      'email': email,
      'password': password,
    });
    if (response['token'] != null) {
      await setToken(response['token']);
    }
    return response;
  }

  static Future<void> logout() async {
    try {
      await post('/auth/logout', {});
    } catch (_) {
      // Ignore logout errors
    }
    await clearToken();
  }

  static Future<Map<String, dynamic>> me() async {
    return await get('/auth/me');
  }

  // Dashboard
  static Future<Map<String, dynamic>> dashboardStats() async {
    return await get('/dashboard/stats');
  }

  static Future<List<dynamic>> dashboardUpcoming() async {
    return await get('/dashboard/upcoming');
  }

  // Sales
  static Future<Map<String, dynamic>> getSales({String? status, String? search}) async {
    String query = '';
    if (status != null || search != null) {
      final params = <String>[];
      if (status != null) params.add('status=$status');
      if (search != null) params.add('search=$search');
      query = '?${params.join('&')}';
    }
    return await get('/sales$query');
  }

  static Future<Map<String, dynamic>> getSale(int id) async {
    return await get('/sales/$id');
  }

  static Future<Map<String, dynamic>> createSale(Map<String, dynamic> data) async {
    return await post('/sales', data);
  }

  // Payments
  static Future<Map<String, dynamic>> createPayment(int saleId, Map<String, dynamic> data) async {
    return await post('/sales/$saleId/payments', data);
  }

  // Clients
  static Future<Map<String, dynamic>> getClients({String? search}) async {
    final query = search != null ? '?search=$search' : '';
    return await get('/clients$query');
  }

  static Future<Map<String, dynamic>> getClient(int id) async {
    return await get('/clients/$id');
  }

  static Future<Map<String, dynamic>> createClient(Map<String, dynamic> data) async {
    return await post('/clients', data);
  }

  // Articles
  static Future<Map<String, dynamic>> getArticles({bool activeOnly = true}) async {
    final query = activeOnly ? '?active_only=1' : '';
    return await get('/articles$query');
  }

  // QR
  static Future<Map<String, dynamic>> getQrInfo(String uuid) async {
    return await get('/qr/$uuid');
  }

  // ── Subscription ─────────────────────────────────────────────────────────
  static Future<List<dynamic>> getPlans() async {
    return await get('/plans');
  }

  static Future<Map<String, dynamic>> getSubscription() async {
    return await get('/subscription/current');
  }

  static Future<Map<String, dynamic>> changePlan(int planId, String billingCycle) async {
    return await post('/subscription/change-plan', {
      'plan_id': planId,
      'billing_cycle': billingCycle,
    });
  }

  static Future<Map<String, dynamic>> requestAssistedSetup() async {
    return await post('/subscription/assisted-setup', {});
  }

  static Future<Map<String, dynamic>> getInvoices() async {
    return await get('/subscription/invoices');
  }

  static Future<Map<String, dynamic>> payInvoice(int invoiceId) async {
    return await post('/subscription/invoices/$invoiceId/pay', {});
  }

  // ── Wallet ───────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getWallet() async {
    return await get('/wallet');
  }

  static Future<Map<String, dynamic>> getWalletTransactions() async {
    return await get('/wallet/transactions');
  }

  static Future<Map<String, dynamic>> requestWithdrawal({
    required int amount,
    required String payoutMethod,
    required String payoutAccount,
  }) async {
    return await post('/wallet/withdraw', {
      'amount': amount,
      'payout_method': payoutMethod,
      'payout_account': payoutAccount,
    });
  }

  static Future<Map<String, dynamic>> getWithdrawals() async {
    return await get('/wallet/withdrawals');
  }

  // ── KYC ──────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getKycStatus() async {
    return await get('/kyc/status');
  }

  static Future<Map<String, dynamic>> uploadKycDocument({
    required String documentType,
    required String filePath,
    required String fileName,
  }) async {
    final token = await getToken();
    final uri = Uri.parse('$baseUrl/kyc/upload');
    final request = http.MultipartRequest('POST', uri);

    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'application/json';
    request.fields['document_type'] = documentType;
    request.files.add(await http.MultipartFile.fromPath('file', filePath, filename: fileName));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    return _handleResponse(response);
  }

  // ── Orders ───────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getOrders({String? status, String? search}) async {
    String query = '';
    final params = <String>[];
    if (status != null) params.add('status=$status');
    if (search != null) params.add('search=$search');
    if (params.isNotEmpty) query = '?${params.join('&')}';
    return await get('/orders$query');
  }

  static Future<Map<String, dynamic>> getOrder(int id) async {
    return await get('/orders/$id');
  }

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    return await post('/orders', data);
  }

  static Future<Map<String, dynamic>> updateOrderStatus(int orderId, String status) async {
    return await put('/orders/$orderId/status', {'status': status});
  }

  static Future<Map<String, dynamic>> recordOrderPayment(int orderId, Map<String, dynamic> data) async {
    return await post('/orders/$orderId/payments', data);
  }

  static Future<Map<String, dynamic>> initiateOrderPayment(int orderId, Map<String, dynamic> data) async {
    return await post('/orders/$orderId/pay-online', data);
  }

  // ── Stock ────────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getStockOverview() async {
    return await get('/stock/overview');
  }

  static Future<Map<String, dynamic>> getStockMovements() async {
    return await get('/stock/movements');
  }

  static Future<Map<String, dynamic>> adjustStock(Map<String, dynamic> data) async {
    return await post('/stock/adjust', data);
  }

  static Future<Map<String, dynamic>> getStockAlerts() async {
    return await get('/stock/alerts');
  }

  // ── Inventories ──────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getInventories() async {
    return await get('/inventories');
  }

  static Future<Map<String, dynamic>> getInventory(int id) async {
    return await get('/inventories/$id');
  }

  static Future<Map<String, dynamic>> createInventory(Map<String, dynamic> data) async {
    return await post('/inventories', data);
  }

  static Future<Map<String, dynamic>> updateInventoryItem(int invId, int itemId, Map<String, dynamic> data) async {
    return await put('/inventories/$invId/items/$itemId', data);
  }

  static Future<Map<String, dynamic>> completeInventory(int id) async {
    return await post('/inventories/$id/complete', {});
  }

  static Future<void> cancelInventory(int id) async {
    return await delete('/inventories/$id');
  }

  // ── Suppliers ────────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getSuppliers({String? search}) async {
    final query = search != null ? '?search=$search' : '';
    return await get('/suppliers$query');
  }

  static Future<Map<String, dynamic>> getSupplier(int id) async {
    return await get('/suppliers/$id');
  }

  static Future<Map<String, dynamic>> createSupplier(Map<String, dynamic> data) async {
    return await post('/suppliers', data);
  }

  static Future<Map<String, dynamic>> updateSupplier(int id, Map<String, dynamic> data) async {
    return await put('/suppliers/$id', data);
  }

  static Future<void> deleteSupplier(int id) async {
    return await delete('/suppliers/$id');
  }

  static Future<Map<String, dynamic>> getSupplierDebts() async {
    return await get('/suppliers-debts');
  }

  // ── Supplier Orders ──────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getSupplierOrders({String? status}) async {
    final query = status != null ? '?status=$status' : '';
    return await get('/supplier-orders$query');
  }

  static Future<Map<String, dynamic>> getSupplierOrder(int id) async {
    return await get('/supplier-orders/$id');
  }

  static Future<Map<String, dynamic>> createSupplierOrder(Map<String, dynamic> data) async {
    return await post('/supplier-orders', data);
  }

  static Future<Map<String, dynamic>> updateSupplierOrderStatus(int id, String status) async {
    return await put('/supplier-orders/$id/status', {'status': status});
  }

  static Future<Map<String, dynamic>> receiveSupplierItems(int orderId, List<Map<String, dynamic>> items) async {
    return await post('/supplier-orders/$orderId/receive', {'items': items});
  }

  static Future<Map<String, dynamic>> recordSupplierPayment(int orderId, Map<String, dynamic> data) async {
    return await post('/supplier-orders/$orderId/payments', data);
  }
}

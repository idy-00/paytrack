import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';

class AuthUser {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? shop;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.shop,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'] ?? 'vendeur',
      shop: json['shop'],
    );
  }
}

class AuthState {
  final AuthUser? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isLoggedIn => user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  Future<void> login(String email, String password) async {
    state = const AuthState(isLoading: true);

    try {
      final response = await ApiService.login(email, password);
      final user = AuthUser.fromJson(response['user']);
      state = AuthState(user: user);
    } on ApiException catch (e) {
      state = AuthState(error: e.message);
    } catch (e) {
      state = AuthState(error: 'Erreur de connexion: $e');
    }
  }

  Future<void> logout() async {
    await ApiService.logout();
    state = const AuthState();
  }

  Future<void> checkAuth() async {
    final token = await ApiService.getToken();
    if (token == null) {
      state = const AuthState();
      return;
    }

    try {
      final userData = await ApiService.me();
      final user = AuthUser.fromJson(userData);
      state = AuthState(user: user);
    } catch (e) {
      await ApiService.clearToken();
      state = const AuthState();
    }
  }

  void clearError() =>
      state = AuthState(user: state.user, isLoading: state.isLoading);
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

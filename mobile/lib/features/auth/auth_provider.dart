import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

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

  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  /// Returns a demo session identifier for offline/demo mode.
  /// Replace with a real JWT from your backend in production.
  static String _makeDemoSession(int userId) => 'session_user_$userId';

  Future<void> login(String email, String password) async {
    state = const AuthState(isLoading: true);
    await Future.delayed(const Duration(milliseconds: 800));

    if (email == 'moussa@phoneshop-dakar.com' && password == 'demo1234') {
      await _storage.write(key: _tokenKey, value: _makeDemoSession(1));
      state = const AuthState(
        user: AuthUser(
          id: 1,
          name: 'Moussa Diallo',
          email: 'moussa@phoneshop-dakar.com',
          role: 'vendeur',
          shop: 'Phone Shop Dakar',
        ),
      );
    } else if (email == 'aminata@gmail.com' && password == 'demo1234') {
      await _storage.write(key: _tokenKey, value: _makeDemoSession(2));
      state = const AuthState(
        user: AuthUser(
          id: 2,
          name: 'Aminata Ndiaye',
          email: 'aminata@gmail.com',
          role: 'client',
        ),
      );
    } else {
      state = const AuthState(error: 'Email ou mot de passe incorrect.');
    }
  }

  Future<void> logout() async {
    await _storage.delete(key: _tokenKey);
    state = const AuthState();
  }

  void clearError() =>
      state = AuthState(user: state.user, isLoading: state.isLoading);
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';

class DashboardStats {
  final int totalEncaisse;
  final int totalRestant;
  final int ventesActives;
  final int ventesEnRetard;
  final int ventesSoldees;

  const DashboardStats({
    required this.totalEncaisse,
    required this.totalRestant,
    required this.ventesActives,
    required this.ventesEnRetard,
    required this.ventesSoldees,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalEncaisse: (json['total_encaisse'] ?? 0).toInt(),
      totalRestant: (json['total_restant'] ?? 0).toInt(),
      ventesActives: (json['ventes_actives'] ?? 0).toInt(),
      ventesEnRetard: (json['ventes_en_retard'] ?? 0).toInt(),
      ventesSoldees: (json['ventes_soldees'] ?? 0).toInt(),
    );
  }
}

class DashboardState {
  final DashboardStats? stats;
  final List<dynamic> upcomingSchedules;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.stats,
    this.upcomingSchedules = const [],
    this.isLoading = false,
    this.error,
  });
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  DashboardNotifier() : super(const DashboardState());

  Future<void> fetchDashboard() async {
    state = DashboardState(
      stats: state.stats,
      upcomingSchedules: state.upcomingSchedules,
      isLoading: true,
    );

    try {
      final results = await Future.wait([
        ApiService.dashboardStats(),
        ApiService.dashboardUpcoming(),
      ]);

      state = DashboardState(
        stats: DashboardStats.fromJson(results[0] as Map<String, dynamic>),
        upcomingSchedules: results[1] as List<dynamic>,
        isLoading: false,
      );
    } on ApiException catch (e) {
      state = DashboardState(
        stats: state.stats,
        upcomingSchedules: state.upcomingSchedules,
        isLoading: false,
        error: e.message,
      );
    } catch (e) {
      state = DashboardState(
        stats: state.stats,
        upcomingSchedules: state.upcomingSchedules,
        isLoading: false,
        error: 'Erreur: $e',
      );
    }
  }
}

final dashboardProvider = StateNotifierProvider<DashboardNotifier, DashboardState>(
  (ref) => DashboardNotifier(),
);

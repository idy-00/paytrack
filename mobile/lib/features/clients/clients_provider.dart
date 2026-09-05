import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';
import '../../data/models/client.dart';
import '../../core/utils/json_parsers.dart';

final clientsProvider =
    StateNotifierProvider<ClientsNotifier, AsyncValue<List<Client>>>((ref) {
  return ClientsNotifier();
});

class ClientsNotifier extends StateNotifier<AsyncValue<List<Client>>> {
  ClientsNotifier() : super(const AsyncValue.loading());

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final data = await ApiService.get('/clients');
      final list = jsonList(jsonMap(data)['data'])
          .map((e) => Client.fromJson(jsonMap(e)))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() => load();

  Future<Client?> create(Map<String, dynamic> payload) async {
    try {
      final data = await ApiService.post('/clients', payload);
      final envelope = jsonMap(data);
      final client = Client.fromJson(
        jsonMap(envelope['data']).isNotEmpty
            ? jsonMap(envelope['data'])
            : envelope,
      );
      state.whenData((list) {
        state = AsyncValue.data([client, ...list]);
      });
      return client;
    } catch (e) {
      rethrow;
    }
  }
}

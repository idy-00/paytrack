int jsonInt(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.round();
  if (value is String) return num.tryParse(value)?.round() ?? fallback;
  return fallback;
}

String jsonString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  return value is String ? value : value.toString();
}

Map<String, dynamic> jsonMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, item) => MapEntry(key.toString(), item));
  }
  return const <String, dynamic>{};
}

List<dynamic> jsonList(dynamic value) => value is List ? value : const [];

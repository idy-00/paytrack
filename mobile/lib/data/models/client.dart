import '../../core/utils/json_parsers.dart';

class Client {
  final int id;
  final String name;
  final String email;
  final String phone;
  final String city;

  const Client({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.city,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: jsonInt(json['id']),
      name: jsonString(json['name']),
      email: jsonString(json['email']),
      phone: jsonString(json['phone']),
      city: jsonString(json['city'] ?? json['address']),
    );
  }

  String get initials => name
      .split(' ')
      .where((p) => p.isNotEmpty)
      .take(2)
      .map((p) => p[0].toUpperCase())
      .join();
}

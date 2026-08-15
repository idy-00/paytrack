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
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      city: json['city'] ?? json['address'] ?? '',
    );
  }

  String get initials => name
      .split(' ')
      .where((p) => p.isNotEmpty)
      .take(2)
      .map((p) => p[0].toUpperCase())
      .join();
}

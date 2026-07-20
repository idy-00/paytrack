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

  String get initials => name
      .split(' ')
      .where((p) => p.isNotEmpty)
      .take(2)
      .map((p) => p[0].toUpperCase())
      .join();
}

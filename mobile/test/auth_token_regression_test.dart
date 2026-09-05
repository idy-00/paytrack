import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('le login ne remplace jamais le jeton API par un jeton factice', () {
    final source = File('lib/features/auth/login_screen.dart').readAsStringSync();

    expect(source, isNot(contains('tok_vendor_')));
    expect(source, isNot(contains('tok_client_')));
    expect(source, isNot(contains("write(key: 'auth_token'")));
  });
}

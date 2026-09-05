import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('routes de création', () {
    final routerFile = File('lib/shared/navigation/app_router.dart');

    test('Nouvelle vente est déclarée avant le détail dynamique', () {
      final source = routerFile.readAsStringSync();
      expect(source.indexOf("path: '/ventes/nouvelle'"),
          lessThan(source.indexOf("path: '/ventes/:id'")));
    });

    test('Nouvelle commande est déclarée avant le détail dynamique', () {
      final source = routerFile.readAsStringSync();
      expect(source.indexOf("path: '/commandes/nouvelle'"),
          lessThan(source.indexOf("path: '/commandes/:id'")));
    });
  });
}

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// The PayTrack monogram: growing green columns crossed by the blue progress line.
/// It mirrors the supplied brand mark without depending on a raster asset.
class PayTrackMark extends StatelessWidget {
  const PayTrackMark({super.key, this.size = 42, this.onDark = false});

  final double size;
  final bool onDark;

  @override
  Widget build(BuildContext context) => SizedBox.square(
        dimension: size,
        child: CustomPaint(painter: _PayTrackMarkPainter(onDark: onDark)),
      );
}

class _PayTrackMarkPainter extends CustomPainter {
  const _PayTrackMarkPainter({required this.onDark});
  final bool onDark;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final green = Paint()..color = AppColors.green;
    final blue = Paint()
      ..color = onDark ? Colors.white : AppColors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * .075
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final radius = Radius.circular(w * .075);
    void column(double x, double y, double width, double height) =>
        canvas.drawRRect(
            RRect.fromRectAndRadius(Rect.fromLTWH(x, y, width, height), radius),
            green);
    column(w * .08, h * .54, w * .18, h * .31);
    column(w * .34, h * .37, w * .18, h * .48);
    column(w * .60, h * .18, w * .18, h * .67);
    final path = Path()
      ..moveTo(w * .06, h * .68)
      ..lineTo(w * .22, h * .53)
      ..lineTo(w * .42, h * .60)
      ..lineTo(w * .70, h * .29)
      ..lineTo(w * .91, h * .15);
    canvas.drawPath(path, blue);
    canvas.drawCircle(
        Offset(w * .91, h * .15), w * .04, Paint()..color = blue.color);
  }

  @override
  bool shouldRepaint(covariant _PayTrackMarkPainter oldDelegate) =>
      oldDelegate.onDark != onDark;
}

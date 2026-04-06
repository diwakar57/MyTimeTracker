import 'package:flutter/material.dart';
import '../models/timer_state.dart';

String formatDuration(int seconds) {
  if (seconds < 0) seconds = 0;
  final h = seconds ~/ 3600;
  final m = (seconds % 3600) ~/ 60;
  final s = seconds % 60;
  final parts = <String>[];
  if (h > 0) parts.add('${h}h');
  if (m > 0 || h > 0) parts.add('${m}m');
  parts.add('${s}s');
  return parts.join(' ');
}

double getElapsedSec(ActivityTimer timer) {
  if (timer.status == TimerStatus.idle) return 0;
  if (timer.status == TimerStatus.paused) return timer.accumulatedSec;
  if (timer.status == TimerStatus.running && timer.startTime != null) {
    final elapsed = DateTime.now()
            .difference(DateTime.parse(timer.startTime!))
            .inMilliseconds /
        1000.0;
    return timer.accumulatedSec + elapsed;
  }
  return timer.accumulatedSec;
}

DateTimeRange getDayBoundary(DateTime date) {
  final start = DateTime(date.year, date.month, date.day, 0, 0, 0);
  final end = DateTime(date.year, date.month, date.day, 23, 59, 59, 999);
  return DateTimeRange(start: start, end: end);
}

DateTimeRange getWeekBoundary(DateTime date) {
  // weekday: 1=Mon, 7=Sun → shift to Monday
  final diff = 1 - date.weekday;
  final start = DateTime(date.year, date.month, date.day + diff, 0, 0, 0);
  final end = DateTime(start.year, start.month, start.day + 6, 23, 59, 59, 999);
  return DateTimeRange(start: start, end: end);
}

DateTimeRange getMonthBoundary(DateTime date) {
  final start = DateTime(date.year, date.month, 1, 0, 0, 0);
  // Day 0 of next month == last day of current month
  final end = DateTime(date.year, date.month + 1, 0, 23, 59, 59, 999);
  return DateTimeRange(start: start, end: end);
}

Color hexToColor(String hex) {
  final hexCode = hex.replaceFirst('#', '');
  return Color(int.parse('FF$hexCode', radix: 16));
}

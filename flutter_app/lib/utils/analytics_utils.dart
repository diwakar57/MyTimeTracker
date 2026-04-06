import '../models/session.dart';
import '../models/activity.dart';
import 'time_utils.dart';

double getActivityTotalSec(
  List<Session> sessions,
  String activityId,
  DateTime from,
  DateTime to,
) {
  return sessions
      .where((s) {
        if (s.activityId != activityId) return false;
        final end = s.endTime != null ? DateTime.parse(s.endTime!) : DateTime.now();
        return !end.isBefore(from) && !end.isAfter(to);
      })
      .fold(0.0, (sum, s) => sum + s.durationSec);
}

double getAllActivitiesTotalSec(
  List<Session> sessions,
  DateTime from,
  DateTime to,
) {
  return sessions
      .where((s) {
        final end = s.endTime != null ? DateTime.parse(s.endTime!) : DateTime.now();
        return !end.isBefore(from) && !end.isAfter(to);
      })
      .fold(0.0, (sum, s) => sum + s.durationSec);
}

int getStreak(List<Session> sessions) {
  final completed = sessions.where((s) => s.endTime != null).toList();
  if (completed.isEmpty) return 0;

  final daySet = <String>{};
  for (final s in completed) {
    final d = DateTime.parse(s.endTime!);
    daySet.add('${d.year}-${d.month}-${d.day}');
  }

  int streak = 0;
  final today = DateTime.now();
  var check = DateTime(today.year, today.month, today.day - 1);

  while (true) {
    final key = '${check.year}-${check.month}-${check.day}';
    if (daySet.contains(key)) {
      streak++;
      check = check.subtract(const Duration(days: 1));
    } else {
      break;
    }
  }
  return streak;
}

Activity? getTopActivity(
  List<Session> sessions,
  List<Activity> activities,
  DateTime from,
  DateTime to,
) {
  if (activities.isEmpty) return null;
  Activity? top;
  double topSec = 0;
  for (final a in activities) {
    final sec = getActivityTotalSec(sessions, a.id, from, to);
    if (sec > topSec) {
      topSec = sec;
      top = a;
    }
  }
  return top;
}

List<Map<String, dynamic>> getDailyTotals(
  List<Session> sessions,
  DateTime from,
  DateTime to,
) {
  final results = <Map<String, dynamic>>[];
  var cursor = DateTime(from.year, from.month, from.day);
  final endDay = DateTime(to.year, to.month, to.day);

  while (!cursor.isAfter(endDay)) {
    final range = getDayBoundary(cursor);
    final totalSec = getAllActivitiesTotalSec(sessions, range.start, range.end);
    results.add({
      'date': '${cursor.month}/${cursor.day}',
      'totalMin': (totalSec / 60).round(),
    });
    cursor = cursor.add(const Duration(days: 1));
  }
  return results;
}

List<Map<String, dynamic>> getActivityBreakdown(
  List<Session> sessions,
  List<Activity> activities,
  DateTime from,
  DateTime to,
) {
  final totals = activities
      .map((a) => {
            'activity': a,
            'totalSec': getActivityTotalSec(sessions, a.id, from, to),
          })
      .toList();
  final grandTotal = totals.fold<double>(0, (s, t) => s + (t['totalSec'] as double));
  return totals
      .map((t) => {
            'activity': t['activity'],
            'totalSec': t['totalSec'],
            'percentage': grandTotal > 0
                ? ((t['totalSec'] as double) / grandTotal * 100).round()
                : 0,
          })
      .toList();
}

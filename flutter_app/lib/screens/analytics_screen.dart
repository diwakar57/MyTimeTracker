import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/activity.dart';
import '../utils/time_utils.dart';
import '../utils/analytics_utils.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final sessions = provider.sessions;
    final activities = provider.activities;
    final now = DateTime.now();

    final dayRange = getDayBoundary(now);
    final weekRange = getWeekBoundary(now);
    final monthRange = getMonthBoundary(now);
    final lastWeekStart = weekRange.start.subtract(const Duration(days: 7));
    final lastWeekEnd = weekRange.end.subtract(const Duration(days: 7));

    final todayTotal =
        getAllActivitiesTotalSec(sessions, dayRange.start, dayRange.end);
    final weekTotal =
        getAllActivitiesTotalSec(sessions, weekRange.start, weekRange.end);
    final monthTotal =
        getAllActivitiesTotalSec(sessions, monthRange.start, monthRange.end);
    final lastWeekTotal =
        getAllActivitiesTotalSec(sessions, lastWeekStart, lastWeekEnd);

    final streak = getStreak(sessions);
    final topActivity =
        getTopActivity(sessions, activities, weekRange.start, weekRange.end);
    final weekDiff = weekTotal - lastWeekTotal;

    final recentSessions = [...sessions]
      ..removeWhere((s) => s.endTime == null)
      ..sort((a, b) =>
          DateTime.parse(b.endTime!).compareTo(DateTime.parse(a.endTime!)));
    final displaySessions = recentSessions.take(10).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF111827),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text('Analytics',
            style:
                TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Summary row
          Row(
            children: [
              _StatCard(
                  label: 'Today',
                  value: formatDuration(todayTotal.floor())),
              const SizedBox(width: 8),
              _StatCard(
                  label: 'This Week',
                  value: formatDuration(weekTotal.floor())),
              const SizedBox(width: 8),
              _StatCard(
                  label: 'This Month',
                  value: formatDuration(monthTotal.floor())),
            ],
          ),
          const SizedBox(height: 12),
          // Insight cards row
          Row(
            children: [
              Expanded(
                child: _InfoCard(
                  label: '🔥 Streak',
                  child: Text(
                    '$streak day${streak != 1 ? 's' : ''}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _InfoCard(
                  label: '🏆 Top (Week)',
                  child: topActivity != null
                      ? Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: hexToColor(topActivity.color),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                topActivity.name,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        )
                      : const Text('—',
                          style: TextStyle(
                              color: Colors.white, fontSize: 20)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _InfoCard(
            label: '📈 Week vs Last Week',
            child: Text(
              '${weekDiff >= 0 ? '↑' : '↓'} ${formatDuration(weekDiff.abs().floor())}',
              style: TextStyle(
                color: weekDiff >= 0 ? Colors.green : Colors.red,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Activity breakdown table
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Activity Breakdown',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                // Header
                Row(
                  children: [
                    const Expanded(
                        flex: 3,
                        child: Text('Activity',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 12))),
                    const Expanded(
                        flex: 2,
                        child: Text('Today',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 12))),
                    const Expanded(
                        flex: 2,
                        child: Text('Week',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 12))),
                    const Expanded(
                        flex: 2,
                        child: Text('Month',
                            style: TextStyle(
                                color: Colors.grey, fontSize: 12))),
                  ],
                ),
                const SizedBox(height: 4),
                const Divider(color: Color(0xFF374151)),
                ...activities.map((a) {
                  final todayA = getActivityTotalSec(
                      sessions, a.id, dayRange.start, dayRange.end);
                  final weekA = getActivityTotalSec(
                      sessions, a.id, weekRange.start, weekRange.end);
                  final monthA = getActivityTotalSec(
                      sessions, a.id, monthRange.start, monthRange.end);
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: hexToColor(a.color),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(a.name,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 13),
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                                flex: 2,
                                child: Text(formatDuration(todayA.floor()),
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 12))),
                            Expanded(
                                flex: 2,
                                child: Text(formatDuration(weekA.floor()),
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 12))),
                            Expanded(
                                flex: 2,
                                child: Text(formatDuration(monthA.floor()),
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 12))),
                          ],
                        ),
                      ),
                      const Divider(color: Color(0xFF374151), height: 1),
                    ],
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Recent sessions
          _Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Recent Sessions',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                if (displaySessions.isEmpty)
                  const Text('No sessions yet.',
                      style: TextStyle(color: Colors.grey))
                else
                  ...displaySessions.map((s) {
                    final activity = activities.firstWhere(
                      (a) => a.id == s.activityId,
                      orElse: () => Activity(
                          id: '',
                          name: 'Unknown',
                          color: '#888888',
                          createdAt: ''),
                    );
                    final endDate = DateTime.parse(s.endTime!);
                    final timeStr =
                        '${endDate.month}/${endDate.day} ${endDate.hour}:${endDate.minute.toString().padLeft(2, '0')}';
                    return Column(
                      children: [
                        const Divider(color: Color(0xFF374151), height: 1),
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: hexToColor(activity.color),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(activity.name,
                                    style: const TextStyle(
                                        color: Colors.white, fontSize: 13)),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(formatDuration(s.durationSec.floor()),
                                      style: const TextStyle(
                                          color: Colors.grey, fontSize: 13)),
                                  Text(timeStr,
                                      style: const TextStyle(
                                          color: Colors.grey, fontSize: 11)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1F2937),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(label,
                style: const TextStyle(color: Colors.grey, fontSize: 11)),
            const SizedBox(height: 4),
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String label;
  final Widget child;
  const _InfoCard({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(12),
      ),
      child: child,
    );
  }
}

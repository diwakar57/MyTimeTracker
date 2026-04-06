import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/app_provider.dart';
import '../models/activity.dart';
import '../utils/time_utils.dart';
import '../utils/analytics_utils.dart';

class ChartsScreen extends StatelessWidget {
  const ChartsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final sessions = provider.sessions;
    final activities = provider.activities;
    final now = DateTime.now();

    final weekRange = getWeekBoundary(now);
    final thirtyStart =
        getDayBoundary(now.subtract(const Duration(days: 29))).start;

    // Bar chart: activity totals this week (minutes)
    final barData = activities
        .map((a) => {
              'activity': a,
              'minutes': (getActivityTotalSec(
                          sessions, a.id, weekRange.start, weekRange.end) /
                      60)
                  .round(),
            })
        .where((d) => (d['minutes'] as int) > 0)
        .toList();

    // Line chart: daily totals last 30 days
    final lineData = getDailyTotals(sessions, thirtyStart, now);

    // Donut chart: activity breakdown this week
    final donutData = getActivityBreakdown(
            sessions, activities, weekRange.start, weekRange.end)
        .where((d) => (d['totalSec'] as double) > 0)
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFF111827),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text('Charts',
            style:
                TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // --- Bar chart ---
          _ChartCard(
            title: 'Activity Totals This Week',
            child: barData.isEmpty
                ? const _EmptyChart()
                : SizedBox(
                    height: 220,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: barData
                                .map((d) =>
                                    (d['minutes'] as int).toDouble())
                                .reduce((a, b) => a > b ? a : b) *
                            1.3,
                        barTouchData: BarTouchData(
                          touchTooltipData: BarTouchTooltipData(
                            getTooltipColor: (_) =>
                                const Color(0xFF374151),
                            getTooltipItem: (group, _, rod, __) {
                              final d = barData[group.x];
                              final name =
                                  (d['activity'] as Activity).name;
                              return BarTooltipItem(
                                '$name\n${rod.toY.round()} min',
                                const TextStyle(
                                    color: Colors.white, fontSize: 12),
                              );
                            },
                          ),
                        ),
                        titlesData: FlTitlesData(
                          rightTitles: const AxisTitles(
                              sideTitles:
                                  SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(
                              sideTitles:
                                  SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, _) {
                                final idx = value.toInt();
                                if (idx < 0 || idx >= barData.length) {
                                  return const SizedBox.shrink();
                                }
                                final name = (barData[idx]['activity']
                                        as Activity)
                                    .name;
                                return Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    name.length > 7
                                        ? '${name.substring(0, 7)}…'
                                        : name,
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 9),
                                  ),
                                );
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            axisNameWidget: const Text('min',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 10)),
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 36,
                              getTitlesWidget: (value, _) => Text(
                                value.toInt().toString(),
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 9),
                              ),
                            ),
                          ),
                        ),
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (_) => const FlLine(
                              color: Color(0xFF374151), strokeWidth: 1),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups:
                            barData.asMap().entries.map((entry) {
                          final d = entry.value;
                          final color =
                              hexToColor((d['activity'] as Activity).color);
                          return BarChartGroupData(
                            x: entry.key,
                            barRods: [
                              BarChartRodData(
                                toY: (d['minutes'] as int).toDouble(),
                                color: color,
                                width: 18,
                                borderRadius:
                                    const BorderRadius.vertical(
                                        top: Radius.circular(4)),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 16),

          // --- Line chart ---
          _ChartCard(
            title: 'Daily Totals (Last 30 Days)',
            child: lineData.every((d) => (d['totalMin'] as int) == 0)
                ? const _EmptyChart()
                : SizedBox(
                    height: 220,
                    child: LineChart(
                      LineChartData(
                        lineTouchData: LineTouchData(
                          touchTooltipData: LineTouchTooltipData(
                            getTooltipColor: (_) =>
                                const Color(0xFF374151),
                            getTooltipItems: (spots) =>
                                spots.map((spot) {
                              final d = lineData[spot.x.toInt()];
                              return LineTooltipItem(
                                '${d['date']}\n${spot.y.toInt()} min',
                                const TextStyle(
                                    color: Colors.white, fontSize: 12),
                              );
                            }).toList(),
                          ),
                        ),
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (_) => const FlLine(
                              color: Color(0xFF374151), strokeWidth: 1),
                        ),
                        titlesData: FlTitlesData(
                          rightTitles: const AxisTitles(
                              sideTitles:
                                  SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(
                              sideTitles:
                                  SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              interval: 7,
                              getTitlesWidget: (value, _) {
                                final idx = value.toInt();
                                if (idx < 0 ||
                                    idx >= lineData.length) {
                                  return const SizedBox.shrink();
                                }
                                return Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    lineData[idx]['date'] as String,
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 9),
                                  ),
                                );
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            axisNameWidget: const Text('min',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 10)),
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 36,
                              getTitlesWidget: (value, _) => Text(
                                value.toInt().toString(),
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 9),
                              ),
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: lineData
                                .asMap()
                                .entries
                                .map((e) => FlSpot(
                                      e.key.toDouble(),
                                      (e.value['totalMin'] as int)
                                          .toDouble(),
                                    ))
                                .toList(),
                            isCurved: true,
                            color: const Color(0xFF6366F1),
                            barWidth: 2,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: const Color(0xFF6366F1)
                                  .withOpacity(0.12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
          const SizedBox(height: 16),

          // --- Donut chart ---
          _ChartCard(
            title: 'Activity Split This Week',
            child: donutData.isEmpty
                ? const _EmptyChart()
                : Column(
                    children: [
                      SizedBox(
                        height: 220,
                        child: PieChart(
                          PieChartData(
                            sectionsSpace: 2,
                            centerSpaceRadius: 60,
                            sections: donutData.map((d) {
                              final activity =
                                  d['activity'] as Activity;
                              final pct = d['percentage'] as int;
                              return PieChartSectionData(
                                color: hexToColor(activity.color),
                                value: d['totalSec'] as double,
                                title: '$pct%',
                                radius: 50,
                                titleStyle: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 16,
                        runSpacing: 6,
                        alignment: WrapAlignment.center,
                        children: donutData.map((d) {
                          final activity = d['activity'] as Activity;
                          final minutes =
                              ((d['totalSec'] as double) / 60).round();
                          return Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: hexToColor(activity.color),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${activity.name} (${minutes}m)',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _ChartCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _EmptyChart extends StatelessWidget {
  const _EmptyChart();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Center(
          child:
              Text('No data yet.', style: TextStyle(color: Colors.grey))),
    );
  }
}

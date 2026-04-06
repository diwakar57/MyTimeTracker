import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/activity.dart';
import '../models/timer_state.dart';
import '../providers/app_provider.dart';
import '../utils/time_utils.dart';
import '../utils/analytics_utils.dart';

class ActivityCard extends StatefulWidget {
  final Activity activity;
  final VoidCallback onEdit;

  const ActivityCard({
    super.key,
    required this.activity,
    required this.onEdit,
  });

  @override
  State<ActivityCard> createState() => _ActivityCardState();
}

class _ActivityCardState extends State<ActivityCard> {
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final timer = provider.timers[widget.activity.id];
    final status = timer?.status ?? TimerStatus.idle;
    final elapsed = timer != null ? getElapsedSec(timer) : 0.0;

    final now = DateTime.now();
    final dayRange = getDayBoundary(now);
    final todayTotal = getActivityTotalSec(
      provider.sessions,
      widget.activity.id,
      dayRange.start,
      dayRange.end,
    );
    final todayDisplay =
        status == TimerStatus.running ? todayTotal + elapsed : todayTotal;

    final accentColor = hexToColor(widget.activity.color);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(12),
        border: Border(left: BorderSide(color: accentColor, width: 4)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration:
                    BoxDecoration(color: accentColor, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  widget.activity.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 17,
                  ),
                ),
              ),
              _IconBtn(
                icon: Icons.edit_outlined,
                onPressed: widget.onEdit,
              ),
              const SizedBox(width: 4),
              _IconBtn(
                icon: Icons.delete_outline,
                color: Colors.grey,
                hoverColor: Colors.red,
                onPressed: () => _confirmDelete(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Timer display
          Center(
            child: Text(
              formatDuration(elapsed.floor()),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 36,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
              ),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              status == TimerStatus.running
                  ? '● RUNNING'
                  : status == TimerStatus.paused
                      ? '⏸ PAUSED'
                      : '○ IDLE',
              style: TextStyle(
                color: status == TimerStatus.running
                    ? Colors.green
                    : status == TimerStatus.paused
                        ? Colors.amber
                        : Colors.grey,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 12),
          // Primary action button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: status == TimerStatus.running
                    ? const Color(0xFFD97706)
                    : status == TimerStatus.paused
                        ? const Color(0xFF059669)
                        : const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onPressed: () => _handlePrimary(context.read<AppProvider>(), status),
              child: Text(
                status == TimerStatus.running
                    ? '⏸ Pause'
                    : status == TimerStatus.paused
                        ? '▶ Resume'
                        : '▶ Start',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              'Today: ${formatDuration(todayDisplay.floor())}',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _handlePrimary(AppProvider provider, TimerStatus status) {
    if (status == TimerStatus.idle) {
      provider.startTimer(widget.activity.id);
    } else if (status == TimerStatus.running) {
      provider.pauseTimer(widget.activity.id);
    } else {
      provider.resumeTimer(widget.activity.id);
    }
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1F2937),
        title: const Text('Delete Activity',
            style: TextStyle(color: Colors.white)),
        content: Text(
          'Delete "${widget.activity.name}"?',
          style: const TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AppProvider>().deleteActivity(widget.activity.id);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final Color color;
  final Color? hoverColor;

  const _IconBtn({
    required this.icon,
    required this.onPressed,
    this.color = Colors.grey,
    this.hoverColor,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon, size: 18, color: color),
      onPressed: onPressed,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(),
      splashRadius: 16,
    );
  }
}

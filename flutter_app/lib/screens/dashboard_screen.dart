import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/activity.dart';
import '../widgets/activity_card.dart';
import '../widgets/activity_modal.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final activities = provider.activities;

    return Scaffold(
      backgroundColor: const Color(0xFF111827),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text(
          'Dashboard',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: () => _showSettings(context, provider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showActivityModal(context),
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.add),
        label: const Text('Add Activity'),
      ),
      body: activities.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.timer_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No activities yet.',
                      style: TextStyle(color: Colors.grey, fontSize: 18)),
                  Text('Tap + to get started.',
                      style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              itemCount: activities.length,
              itemBuilder: (context, i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: ActivityCard(
                  activity: activities[i],
                  onEdit: () => _showActivityModal(context, activity: activities[i]),
                ),
              ),
            ),
    );
  }

  void _showActivityModal(BuildContext context, {Activity? activity}) {
    showDialog(
      context: context,
      builder: (_) => ActivityModal(
        activity: activity,
        onSave: (name, color) {
          final provider = context.read<AppProvider>();
          if (activity != null) {
            provider.updateActivity(activity.id, name: name, color: color);
          } else {
            provider.addActivity(name, color);
          }
        },
      ),
    );
  }

  void _showSettings(BuildContext context, AppProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1F2937),
        title: const Text('Settings', style: TextStyle(color: Colors.white)),
        content: StatefulBuilder(
          builder: (_, setState) => SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Allow Overlapping Timers',
                style: TextStyle(color: Colors.white, fontSize: 14)),
            subtitle: const Text('Run multiple activities at once',
                style: TextStyle(color: Colors.grey, fontSize: 12)),
            value: provider.allowOverlap,
            onChanged: (val) {
              provider.setAllowOverlap(val);
              setState(() {});
            },
            activeColor: const Color(0xFF6366F1),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close',
                style: TextStyle(color: Color(0xFF6366F1))),
          ),
        ],
      ),
    );
  }
}

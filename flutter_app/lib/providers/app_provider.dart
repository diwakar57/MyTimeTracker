import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import '../models/activity.dart';
import '../models/session.dart';
import '../models/timer_state.dart';

const _uuid = Uuid();

const _defaultActivities = [
  {'name': 'Study', 'color': '#6366f1'},
  {'name': 'Grading', 'color': '#f59e0b'},
  {'name': 'Exercise', 'color': '#10b981'},
  {'name': 'Research', 'color': '#3b82f6'},
  {'name': 'Paper Reading', 'color': '#ec4899'},
];

class AppProvider extends ChangeNotifier {
  List<Activity> _activities = [];
  List<Session> _sessions = [];
  Map<String, ActivityTimer> _timers = {};
  bool _allowOverlap = false;
  bool _initialized = false;

  List<Activity> get activities => _activities;
  List<Session> get sessions => _sessions;
  Map<String, ActivityTimer> get timers => _timers;
  bool get allowOverlap => _allowOverlap;
  bool get initialized => _initialized;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();

    final activitiesJson = prefs.getString('activities');
    if (activitiesJson != null) {
      final list = jsonDecode(activitiesJson) as List;
      _activities =
          list.map((e) => Activity.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      _activities = _defaultActivities
          .map((a) => Activity(
                id: _uuid.v4(),
                name: a['name']!,
                color: a['color']!,
                createdAt: DateTime.now().toIso8601String(),
              ))
          .toList();
    }

    final sessionsJson = prefs.getString('sessions');
    if (sessionsJson != null) {
      final list = jsonDecode(sessionsJson) as List;
      _sessions =
          list.map((e) => Session.fromJson(e as Map<String, dynamic>)).toList();
    }

    final timersJson = prefs.getString('timers');
    if (timersJson != null) {
      final map = jsonDecode(timersJson) as Map<String, dynamic>;
      _timers = map.map(
        (k, v) => MapEntry(k, ActivityTimer.fromJson(v as Map<String, dynamic>)),
      );
    }

    _allowOverlap = prefs.getBool('allowOverlap') ?? false;
    _initialized = true;
    notifyListeners();
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        'activities', jsonEncode(_activities.map((a) => a.toJson()).toList()));
    await prefs.setString(
        'sessions', jsonEncode(_sessions.map((s) => s.toJson()).toList()));
    await prefs.setString(
        'timers', jsonEncode(_timers.map((k, v) => MapEntry(k, v.toJson()))));
    await prefs.setBool('allowOverlap', _allowOverlap);
  }

  void addActivity(String name, String color) {
    final activity = Activity(
      id: _uuid.v4(),
      name: name,
      color: color,
      createdAt: DateTime.now().toIso8601String(),
    );
    _activities = [..._activities, activity];
    notifyListeners();
    _save();
  }

  void updateActivity(String id, {String? name, String? color}) {
    _activities = _activities.map((a) {
      if (a.id != id) return a;
      return a.copyWith(name: name, color: color);
    }).toList();
    notifyListeners();
    _save();
  }

  void deleteActivity(String id) {
    final newTimers = Map<String, ActivityTimer>.from(_timers)..remove(id);
    _timers = newTimers;
    _activities = _activities.where((a) => a.id != id).toList();
    _sessions = _sessions.where((s) => s.activityId != id).toList();
    notifyListeners();
    _save();
  }

  void startTimer(String activityId) {
    final now = DateTime.now().toIso8601String();
    final newTimers = Map<String, ActivityTimer>.from(_timers);
    final newSessions = List<Session>.from(_sessions);

    if (!_allowOverlap) {
      for (final id in newTimers.keys.toList()) {
        if (id == activityId) continue;
        final t = newTimers[id]!;
        if (t.status != TimerStatus.running) continue;
        final start =
            t.startTime != null ? DateTime.parse(t.startTime!) : DateTime.now();
        final segSec =
            DateTime.now().difference(start).inMilliseconds / 1000.0;
        newSessions.add(Session(
          id: _uuid.v4(),
          activityId: id,
          startTime: t.startTime!,
          endTime: now,
          durationSec: segSec,
        ));
        newTimers[id] = t.copyWith(
          status: TimerStatus.paused,
          clearStartTime: true,
          accumulatedSec: t.accumulatedSec + segSec,
        );
      }
    }

    final existing = newTimers[activityId];
    newTimers[activityId] = ActivityTimer(
      activityId: activityId,
      status: TimerStatus.running,
      startTime: now,
      accumulatedSec: existing?.accumulatedSec ?? 0,
    );

    _timers = newTimers;
    _sessions = newSessions;
    notifyListeners();
    _save();
  }

  void pauseTimer(String activityId) {
    final timer = _timers[activityId];
    if (timer == null || timer.status != TimerStatus.running) return;

    final now = DateTime.now().toIso8601String();
    final start =
        timer.startTime != null ? DateTime.parse(timer.startTime!) : DateTime.now();
    final segSec = DateTime.now().difference(start).inMilliseconds / 1000.0;
    final totalSec = timer.accumulatedSec + segSec;

    _sessions = [
      ..._sessions,
      Session(
        id: _uuid.v4(),
        activityId: activityId,
        startTime: timer.startTime!,
        endTime: now,
        durationSec: segSec,
      ),
    ];
    _timers = {
      ..._timers,
      activityId: timer.copyWith(
        status: TimerStatus.paused,
        clearStartTime: true,
        accumulatedSec: totalSec,
      ),
    };
    notifyListeners();
    _save();
  }

  void resumeTimer(String activityId) {
    final timer = _timers[activityId];
    if (timer == null || timer.status != TimerStatus.paused) return;

    final now = DateTime.now().toIso8601String();
    final newTimers = Map<String, ActivityTimer>.from(_timers);
    final newSessions = List<Session>.from(_sessions);

    if (!_allowOverlap) {
      for (final id in newTimers.keys.toList()) {
        if (id == activityId) continue;
        final t = newTimers[id]!;
        if (t.status != TimerStatus.running) continue;
        final start =
            t.startTime != null ? DateTime.parse(t.startTime!) : DateTime.now();
        final segSec =
            DateTime.now().difference(start).inMilliseconds / 1000.0;
        newSessions.add(Session(
          id: _uuid.v4(),
          activityId: id,
          startTime: t.startTime!,
          endTime: now,
          durationSec: segSec,
        ));
        newTimers[id] = t.copyWith(
          status: TimerStatus.paused,
          clearStartTime: true,
          accumulatedSec: t.accumulatedSec + segSec,
        );
      }
    }

    newTimers[activityId] = timer.copyWith(
      status: TimerStatus.running,
      startTime: now,
    );

    _timers = newTimers;
    _sessions = newSessions;
    notifyListeners();
    _save();
  }

  void setAllowOverlap(bool val) {
    _allowOverlap = val;
    notifyListeners();
    _save();
  }
}

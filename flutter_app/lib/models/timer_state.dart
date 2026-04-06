enum TimerStatus { idle, running, paused }

class ActivityTimer {
  final String activityId;
  final TimerStatus status;
  final String? startTime;
  final double accumulatedSec;

  const ActivityTimer({
    required this.activityId,
    required this.status,
    this.startTime,
    required this.accumulatedSec,
  });

  ActivityTimer copyWith({
    TimerStatus? status,
    String? startTime,
    bool clearStartTime = false,
    double? accumulatedSec,
  }) {
    return ActivityTimer(
      activityId: activityId,
      status: status ?? this.status,
      startTime: clearStartTime ? null : (startTime ?? this.startTime),
      accumulatedSec: accumulatedSec ?? this.accumulatedSec,
    );
  }

  Map<String, dynamic> toJson() => {
        'activityId': activityId,
        'status': status.name,
        'startTime': startTime,
        'accumulatedSec': accumulatedSec,
      };

  factory ActivityTimer.fromJson(Map<String, dynamic> json) => ActivityTimer(
        activityId: json['activityId'] as String,
        status: TimerStatus.values.firstWhere(
          (s) => s.name == json['status'],
          orElse: () => TimerStatus.idle,
        ),
        startTime: json['startTime'] as String?,
        accumulatedSec: (json['accumulatedSec'] as num).toDouble(),
      );
}

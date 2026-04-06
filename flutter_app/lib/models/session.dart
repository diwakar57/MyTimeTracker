class Session {
  final String id;
  final String activityId;
  final String startTime;
  final String? endTime;
  final double durationSec;

  const Session({
    required this.id,
    required this.activityId,
    required this.startTime,
    this.endTime,
    required this.durationSec,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'activityId': activityId,
        'startTime': startTime,
        'endTime': endTime,
        'durationSec': durationSec,
      };

  factory Session.fromJson(Map<String, dynamic> json) => Session(
        id: json['id'] as String,
        activityId: json['activityId'] as String,
        startTime: json['startTime'] as String,
        endTime: json['endTime'] as String?,
        durationSec: (json['durationSec'] as num).toDouble(),
      );
}

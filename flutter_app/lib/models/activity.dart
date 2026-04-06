class Activity {
  final String id;
  final String name;
  final String color;
  final String createdAt;

  const Activity({
    required this.id,
    required this.name,
    required this.color,
    required this.createdAt,
  });

  Activity copyWith({String? name, String? color}) {
    return Activity(
      id: id,
      name: name ?? this.name,
      color: color ?? this.color,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'color': color,
        'createdAt': createdAt,
      };

  factory Activity.fromJson(Map<String, dynamic> json) => Activity(
        id: json['id'] as String,
        name: json['name'] as String,
        color: json['color'] as String,
        createdAt: json['createdAt'] as String,
      );
}

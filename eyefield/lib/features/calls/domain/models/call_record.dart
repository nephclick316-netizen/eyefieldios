import 'package:eyefield/features/echoes/domain/models/echo.dart';

class CallRecord {
  final String id;
  final String callerId;
  final String receiverId;
  final EchoUser caller;
  final EchoUser receiver;
  final String startTime;
  final String? endTime;
  final String status; // 'missed', 'completed', 'ongoing'
  final String callType; // 'audio', 'video'

  CallRecord({
    required this.id,
    required this.callerId,
    required this.receiverId,
    required this.caller,
    required this.receiver,
    required this.startTime,
    this.endTime,
    required this.status,
    required this.callType,
  });

  factory CallRecord.fromJson(Map<String, dynamic> json, EchoUser caller, EchoUser receiver) {
    return CallRecord(
      id: json['id'].toString(),
      callerId: json['caller_id'],
      receiverId: json['receiver_id'],
      caller: caller,
      receiver: receiver,
      startTime: json['start_time'] ?? json['created_at'] ?? DateTime.now().toIso8601String(),
      endTime: json['end_time'],
      status: json['status'] ?? 'completed',
      callType: json['call_type'] ?? 'audio',
    );
  }
}

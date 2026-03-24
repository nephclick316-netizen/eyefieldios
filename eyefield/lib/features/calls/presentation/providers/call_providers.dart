import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eyefield/features/calls/data/repositories/call_repository.dart';
import 'package:eyefield/features/calls/domain/models/call_record.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';

final callRepositoryProvider = Provider<CallRepository>((ref) {
  return CallRepository();
});

final callHistoryProvider = FutureProvider<List<CallRecord>>((ref) async {
  final userId = ref.watch(currentUserProvider)?.id;
  if (userId == null) return [];
  return ref.watch(callRepositoryProvider).getCallHistory(userId);
});

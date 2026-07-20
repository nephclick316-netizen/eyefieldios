import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/echo.dart';
import '../../domain/models/pulse.dart';
import 'package:eyefield/features/echoes/data/repositories/echo_repository.dart';
import 'package:eyefield/features/echoes/data/repositories/pulse_repository.dart';

final echoRepositoryProvider = Provider<EchoRepository>((ref) {
  return EchoRepository();
});

final echoesProvider = FutureProvider.family<List<Echo>, int>((ref, page) async {
  return ref.watch(echoRepositoryProvider).getEchoes(page: page);
});

final pulseRepositoryProvider = Provider<PulseRepository>((ref) {
  return PulseRepository();
});

final pulsesProvider = FutureProvider<List<Pulse>>((ref) async {
  return ref.watch(pulseRepositoryProvider).getPulses();
});

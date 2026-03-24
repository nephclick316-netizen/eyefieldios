import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eyefield/features/profile/data/repositories/profile_repository.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository();
});

final userProfileProvider = FutureProvider.family<ProfileUser?, String>((ref, userId) async {
  return ref.watch(profileRepositoryProvider).getProfile(userId);
});

final currentUserProfileProvider = FutureProvider<ProfileUser?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  return ref.watch(profileRepositoryProvider).getProfile(user.id);
});

final profileTabProvider = StateProvider<int>((ref) => 0); // 0 = Echoes, 1 = Listings

final followersCountProvider = FutureProvider.family<int, String>((ref, userId) async {
  return ref.watch(profileRepositoryProvider).getFollowersCount(userId);
});

final followingCountProvider = FutureProvider.family<int, String>((ref, userId) async {
  return ref.watch(profileRepositoryProvider).getFollowingCount(userId);
});

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/call_providers.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

class CallListScreen extends ConsumerWidget {
  const CallListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final callHistoryAsync = ref.watch(callHistoryProvider);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Custom Top Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                   Text(
                    'EyeField',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white : const Color(0xFF00172D),
                    ),
                  ),
                  const Spacer(),
                  const Icon(LucideIcons.bell, color: Color(0xFF64748B)),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.share2, color: Color(0xFF64748B)),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.compass, color: Color(0xFF64748B)),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.layoutGrid, size: 16, color: Color(0xFF4F46E5)),
                        const SizedBox(width: 6),
                        const Text(
                          'ENDOCARD',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Calls',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(LucideIcons.userPlus, size: 18),
                          label: const Text('NEW CALL', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00007A),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    const Text(
                      'RECENT',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 1.2,
                      ),
                    ),
                    callHistoryAsync.when(
                      data: (calls) {
                        if (calls.isEmpty) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 60),
                            child: Center(
                              child: Text(
                                'No recent calls',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ),
                          );
                        }
                        return ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: calls.length,
                          itemBuilder: (context, index) {
                            final call = calls[index];
                            final currentUser = ref.read(currentUserProvider);
                            final isCaller = call.callerId == currentUser?.id;
                            final otherUser = isCaller ? call.receiver : call.caller;
                            final isVideo = call.callType == 'video';
                            final isMissed = call.status == 'missed';

                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(
                                radius: 24,
                                backgroundImage: NetworkImage(otherUser.avatar),
                              ),
                              title: Text(
                                otherUser.displayName,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: isMissed ? Colors.red : (isDarkMode ? Colors.white : const Color(0xFF0F172A)),
                                ),
                              ),
                              subtitle: Row(
                                children: [
                                  Icon(
                                    isCaller ? LucideIcons.arrowUpRight : LucideIcons.arrowDownLeft,
                                    size: 14,
                                    color: isMissed ? Colors.red : Colors.green,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _formatTime(call.startTime),
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              trailing: Icon(isVideo ? LucideIcons.video : LucideIcons.phone, color: const Color(0xFF00007A)),
                            );
                          },
                        );
                      },
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (e, st) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 60),
                        child: Center(child: Text('Error loading calls: $e')),
                      ),
                    ),
                    const SizedBox(height: 100),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'QUICK CONTACTS',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF94A3B8),
                            letterSpacing: 1.2,
                          ),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text(
                            'View All',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF00007A),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildContactCard(
                      name: 'EyeField Member',
                      handle: '@user_1446d',
                      avatarUrl: 'https://i.pravatar.cc/150?u=user1',
                    ),
                    const SizedBox(height: 100), // Padding for bottom nav
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard({required String name, required String handle, required String avatarUrl}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundImage: NetworkImage(avatarUrl),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F172A),
                  ),
                ),
                Text(
                  handle,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.video, size: 20, color: Color(0xFF0F172A)),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.phone, size: 20, color: Color(0xFF0F172A)),
          ),
        ],
      ),
    );
  }

  String _formatTime(String isoString) {
    try {
      final date = DateTime.parse(isoString).toLocal();
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return 'Unknown';
    }
  }
}

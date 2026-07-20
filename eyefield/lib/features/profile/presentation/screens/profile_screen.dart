import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/profile/presentation/providers/profile_providers.dart';
import 'package:eyefield/features/echoes/presentation/providers/echo_providers.dart';
import 'package:eyefield/features/cascadea/presentation/providers/product_providers.dart';
import 'package:eyefield/features/cascadea/presentation/screens/product_list_screen.dart';
import 'package:eyefield/features/settings/presentation/screens/settings_screen.dart';
import 'package:eyefield/features/chat/presentation/providers/chat_providers.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  final String? userId;
  const ProfileScreen({super.key, this.userId});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Widget _buildStatColumn(String label, int count, bool isDark) {
    return Column(
      children: [
        Text(
          count >= 1000 ? '${(count / 1000).toStringAsFixed(1)}K' : count.toString(),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  void _showContactSearch() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _ContactSearchSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = ref.watch(currentUserProvider)?.id;
    final targetUserId = widget.userId ?? currentUserId;

    if (targetUserId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final profileAsync = ref.watch(userProfileProvider(targetUserId));
    final isMe = targetUserId == currentUserId;
    final selectedTab = ref.watch(profileTabProvider);
    final theme = Theme.of(context);
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
              child: profileAsync.when(
                data: (profile) {
                  if (profile == null) return const Center(child: Text('No profile found'));
                  
                  return SingleChildScrollView(
                    child: Column(
                      children: [
                        // User Handle & Settings Row
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '@${profile.username}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              if (isMe)
                                GestureDetector(
                                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isDarkMode ? Colors.grey[800] : const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(LucideIcons.settings, color: isDarkMode ? Colors.white : const Color(0xFF0F172A), size: 20),
                                  ),
                                ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Large Avatar with Add Button
                        Stack(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.orange, width: 2),
                              ),
                              child: CircleAvatar(
                                radius: 70,
                                backgroundImage: CachedNetworkImageProvider(profile.avatar),
                              ),
                            ),
                            if (isMe)
                              Positioned(
                                bottom: 0,
                                right: 15,
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF0F172A),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(LucideIcons.plus, color: Colors.white, size: 20),
                                ),
                              ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        Text(
                          profile.displayName,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          profile.bio?.isNotEmpty == true ? profile.bio! : 'EyeField Member',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF64748B),
                          ),
                        ),

                        const SizedBox(height: 24),

                        Builder(
                          builder: (context) {
                            int echoesCount = 0;
                            int listingsCount = 0;
                            final echoesAsync = ref.watch(echoesProvider(0));
                            final productsAsync = ref.watch(productsProvider(0));
                            
                            echoesAsync.whenData((echoes) {
                              echoesCount = echoes.where((e) => e.user.id == profile.id).length;
                            });
                            productsAsync.whenData((products) {
                              listingsCount = products.where((p) => p.seller.id == profile.id).length;
                            });

                            final followersCount = ref.watch(followersCountProvider(profile.id)).value ?? 0;
                            final followingCount = ref.watch(followingCountProvider(profile.id)).value ?? 0;
                            final isDark = Theme.of(context).brightness == Brightness.dark;

                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  _buildStatColumn('Followers', followersCount, isDark),
                                  _buildStatColumn('Following', followingCount, isDark),
                                  _buildStatColumn('Echoes', echoesCount, isDark),
                                  _buildStatColumn('Listings', listingsCount, isDark),
                                ],
                              ),
                            );
                          }
                        ),

                        const SizedBox(height: 32),

                        // Location & Link
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.mapPin, size: 16, color: Colors.orange),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                profile.businessDetails?['address']?.toString().toUpperCase() ?? 'GLOBAL',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                              ),
                            ),
                            const SizedBox(width: 14),
                            const Icon(LucideIcons.link, size: 16, color: Color(0xFF64748B)),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                profile.businessDetails?['website']?.toString().toUpperCase() ?? 'EYEFIELD.ME',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                              ),
                            ),
                            if (profile.phoneNumber != null && profile.phoneNumber!.isNotEmpty) ...[
                              const SizedBox(width: 14),
                              const Icon(LucideIcons.phone, size: 16, color: Color(0xFF64748B)),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  profile.phoneNumber!,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF64748B)),
                                ),
                              ),
                            ],
                          ],
                        ),

                        const SizedBox(height: 32),

                        const SizedBox(height: 24),

                        // Action Buttons
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF00172D),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 20),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                  child: const Text('SETTINGS', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _showContactSearch,
                                  icon: const Icon(LucideIcons.userPlus, size: 20),
                                  label: const Text('SEARCH', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFF1F5F9),
                                    foregroundColor: const Color(0xFF0F172A),
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 20),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 48),

                        // Tabs
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () => ref.read(profileTabProvider.notifier).state = 0,
                                      child: Column(
                                        children: [
                                          Icon(LucideIcons.layers, color: selectedTab == 0 ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) : const Color(0xFF94A3B8)),
                                          const SizedBox(height: 8),
                                          Text(
                                            'MY ECHOES',
                                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: selectedTab == 0 ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) : const Color(0xFF94A3B8)),
                                          ),
                                          const SizedBox(height: 12),
                                          Container(height: 3, color: selectedTab == 0 ? (isDarkMode ? Colors.white : const Color(0xFF00172D)) : Colors.transparent),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () => ref.read(profileTabProvider.notifier).state = 1,
                                      child: Column(
                                        children: [
                                          Icon(LucideIcons.shoppingBag, color: selectedTab == 1 ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) : const Color(0xFF94A3B8)),
                                          const SizedBox(height: 8),
                                          Text(
                                            'MY LISTINGS',
                                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: selectedTab == 1 ? (isDarkMode ? Colors.white : const Color(0xFF0F172A)) : const Color(0xFF94A3B8)),
                                          ),
                                          const SizedBox(height: 12),
                                          Container(height: 3, color: selectedTab == 1 ? (isDarkMode ? Colors.white : const Color(0xFF00172D)) : Colors.transparent),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        
                        // Tab Content Placeholder
                        const SizedBox(height: 24),
                        if (selectedTab == 0)
                          _buildEchoesTab(ref, profile.id)
                        else
                          _buildListingsTab(context, ref, profile.id),

                        const SizedBox(height: 100), // Padding for bottom nav
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, st) => Center(child: Text('Error: $e')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEchoesTab(WidgetRef ref, String userId) {
    final echoesAsync = ref.watch(echoesProvider(0));
    return echoesAsync.when(
      data: (echoes) {
        final userEchoes = echoes.where((e) => e.user.id == userId).toList();
        if (userEchoes.isEmpty) {
          return const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('No echoes yet', style: TextStyle(color: Color(0xFF94A3B8)))));
        }
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 4),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 2,
            mainAxisSpacing: 2,
          ),
          itemCount: userEchoes.length,
          itemBuilder: (context, index) {
            final echo = userEchoes[index];
            return Stack(
              fit: StackFit.expand,
              children: [
                if (echo.mediaUrl != null && echo.mediaUrl!.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: echo.mediaUrl!,
                    fit: BoxFit.cover,
                  )
                else
                  Container(color: Colors.grey[800]),
                
                // Overlay for likes at the top
                Positioned(
                  top: 4,
                  right: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.heart, size: 10, color: Colors.white),
                        const SizedBox(width: 4),
                        Text('${echo.likes}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error: $e')),
    );
  }

  Widget _buildListingsTab(BuildContext context, WidgetRef ref, String userId) {
    final productsAsync = ref.watch(productsProvider(0));
    return productsAsync.when(
      data: (products) {
        final userProducts = products.where((p) => p.seller.id == userId).toList();
        if (userProducts.isEmpty) {
          return const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('No listings yet', style: TextStyle(color: Color(0xFF94A3B8)))));
        }
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 16,
            mainAxisSpacing: 20,
          ),
          itemCount: userProducts.length,
          itemBuilder: (context, index) => ProductCard(product: userProducts[index]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Error: $e')),
    );
  }
}

class _ContactSearchSheet extends ConsumerStatefulWidget {
  const _ContactSearchSheet();

  @override
  ConsumerState<_ContactSearchSheet> createState() => _ContactSearchSheetState();
}

class _ContactSearchSheetState extends ConsumerState<_ContactSearchSheet> {
  final _searchController = TextEditingController();
  List<ProfileUser> _results = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _searchUsers(''); // Load initial nearby/suggested users
  }

  Future<void> _searchUsers(String query) async {
    setState(() => _isLoading = true);
    try {
      final results = await ref.read(profileRepositoryProvider).searchUsers(query);
      if (mounted) {
        setState(() {
          _results = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _startChat(ProfileUser user) async {
    final currentUserId = ref.read(currentUserProvider)?.id;
    if (currentUserId == null) return;
    try {
      await ref.read(chatRepositoryProvider).findOrCreateConversation(currentUserId, user.id);
      if (mounted) {
        Navigator.pop(context);
        ref.invalidate(conversationsProvider);
        // Optionally redirect to Conversations tab or show Toast
      }
    } catch (e) {
      print('Error starting chat: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: _searchUsers,
                    decoration: InputDecoration(
                      hintText: 'Search or find nearby users...',
                      prefixIcon: const Icon(LucideIcons.search, size: 20),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final user = _results[index];
                      if (user.id == ref.read(currentUserProvider)?.id) return const SizedBox.shrink();
                      
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundImage: CachedNetworkImageProvider(user.avatar),
                        ),
                        title: Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('@${user.username}'),
                        onTap: () => _startChat(user),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}


import { User, Echo, Story, Product } from './types';
import { AFRICAN_COUNTRIES_DATA } from './utils/countryData';

export const CURRENT_USER: User = {
  id: 'me',
  username: 'iam_alex',
  displayName: 'Alex Carter',
  avatar: 'https://picsum.photos/seed/alex/200/200',
  bio: 'Explorer of pixels and ideas. ✨',
  isVerified: true,
};

export const AFRICAN_COUNTRIES = AFRICAN_COUNTRIES_DATA;

export const MOCK_STORIES: Story[] = [
  { id: 's1', user: CURRENT_USER, mediaUrl: 'https://picsum.photos/seed/s1/400/600', hasSeen: false, strokeColor: 'border-navy-950' },
  { id: 's2', user: { id: 'u1', username: 'sarah_j', displayName: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/200/200' }, mediaUrl: 'https://picsum.photos/seed/s2/400/600', hasSeen: false, strokeColor: 'border-pink-500' },
  { id: 's3', user: { id: 'u2', username: 'mike_codes', displayName: 'Michael Roberts', avatar: 'https://picsum.photos/seed/mike/200/200' }, mediaUrl: 'https://picsum.photos/seed/s3/400/600', hasSeen: true, strokeColor: 'border-green-500' },
  { id: 's4', user: { id: 'u3', username: 'art_by_lea', displayName: 'Lea Thompson', avatar: 'https://picsum.photos/seed/lea/200/200' }, mediaUrl: 'https://picsum.photos/seed/s4/400/600', hasSeen: false, strokeColor: 'border-yellow-500' },
];

export const MOCK_ECHOS: Echo[] = [
  {
    id: 'e1',
    user: { id: 'u1', username: 'sarah_j', displayName: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/200/200' },
    type: 'image',
    content: 'Loving the vibes at the beach today! 🌊',
    mediaUrl: 'https://picsum.photos/seed/beach/800/600',
    likes: 1240,
    comments: 42,
    timestamp: '2h ago',
    tags: ['lifestyle', 'summer']
  },
  {
    id: 'e2',
    user: { id: 'u2', username: 'mike_codes', displayName: 'Michael Roberts', avatar: 'https://picsum.photos/seed/mike/200/200' },
    type: 'text',
    content: 'Just launched my new open source project on Cascadea! Check it out if you want to support high-quality coding tools.',
    likes: 89,
    comments: 12,
    timestamp: '5h ago',
    tags: ['coding', 'cascadea']
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    seller: { id: 'u3', username: 'art_by_lea', displayName: 'Lea Thompson', avatar: 'https://picsum.photos/seed/lea/200/200' },
    name: 'Minimalist Canvas Art',
    price: 450,
    description: 'A hand-painted abstract piece for your modern home.',
    imageUrl: 'https://picsum.photos/seed/art/600/600',
    category: 'Art'
  },
  {
    id: 'p2',
    seller: CURRENT_USER,
    name: 'Retro Mechanical Keyboard',
    price: 180,
    description: 'Custom-built with blue switches and vintage keycaps.',
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
    category: 'Tech'
  },
  {
    id: 'p3',
    seller: { id: 'u1', username: 'sarah_j', displayName: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/200/200' },
    name: 'Silk Summer Scarf',
    price: 55,
    description: 'Lightweight and elegant silk scarf with floral patterns.',
    imageUrl: 'https://picsum.photos/seed/scarf/600/600',
    category: 'Fashion'
  }
];
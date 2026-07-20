export enum AppTab {
  CALLS = 'calls',
  ECHOES = 'echoes',
  CASCADEA = 'cascadea',
  PROFILE = 'profile',
  CHATS = 'chats',
  ADMIN = 'admin'
}

export interface BusinessDetails {
  name: string;
  category: string;
  description: string;
  address: string;
  website?: string;
  socialMedia?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  businessDetails?: BusinessDetails;
  isTyping?: boolean;
  email?: string; // Added email for admin checks
}

export interface Echo {
  id: string;
  user: User;
  type: 'text' | 'image' | 'video';
  content: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
  tags: string[];
  transform?: {
    scale: number;
    x: number;
    y: number;
  };
}

export interface Story {
  id: string;
  user: User;
  mediaUrl: string;
  hasSeen: boolean;
  strokeColor: string;
}

export interface Pulse {
  id: string;
  user: User;
  mediaUrl: string;
  type: 'image' | 'video';
  createdAt: string;
  likes?: number;
  comments?: number;
  transform?: {
    scale: number;
    x: number;
    y: number;
  };
  caption?: string;
}

export type ProductCondition = 'New' | 'Used' | 'Refurbished';

export interface ProductComment {
  id: string;
  userId: string;
  user: User;
  text: string;
  rating: number;
  createdAt: string;
}

export interface Product {
  id: string;
  seller: User;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  category: string;
  condition?: ProductCondition;
  averageRating?: number;
  ratingCount?: number;
  comments?: ProductComment[];
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  profiles: User; // Joined profile data
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  unread_count?: number;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_urls?: string[]; // Array of media urls
  message_type: 'text' | 'image' | 'video' | 'audio' | 'location' | 'document';
  location_data?: any;
  created_at: string;
  is_read?: boolean;
  is_forwarded?: boolean;
  profiles?: User; // Joined sender profile data
}

export interface CallRecord {
  id: string;
  caller_id: string;
  receiver_id: string;
  type: 'voice' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  created_at: string;
  other_user: User;
  is_caller: boolean;
}

export interface Currency {
  code: string;
  symbol: string;
  label: string;
  rate_to_usd: number;
}

export interface AppSettings {
  language: 'en' | 'sw';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  currencyCode: string;
}

export const defaultSettings: AppSettings = {
  language: 'en',
  theme: 'system',
  notifications: true,
  currencyCode: 'USD'
};
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participants: string[]; // user ids
  messages: Message[];
}

import { User, Message, Conversation } from "../types/chatTypes";

type Listener = (m: Message) => void;

class SimpleBus {
  private listeners: { [channel: string]: Listener[] } = {};
  on(channel: string, cb: Listener) {
    this.listeners[channel] = this.listeners[channel] || [];
    this.listeners[channel].push(cb);
  }
  off(channel: string, cb: Listener) {
    if (!this.listeners[channel]) return;
    this.listeners[channel] = this.listeners[channel].filter((l) => l !== cb);
  }
  emit(channel: string, msg: Message) {
    (this.listeners[channel] || []).forEach((cb) => cb(msg));
  }
}

class MockChatService {
  private users: User[] = [];
  private conversations: Map<string, Conversation> = new Map();
  private followers: Map<string, Set<string>> = new Map(); // key: userId, value: set of followerIds (people who follow them)
  private bus = new SimpleBus();
  private currentUser: User;
  private nextUserId = 1;
  private nextConvoId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed with a few users including the current user
    const me: User = { id: "u_me", username: "me", displayName: "Me", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop" };
    const alice: User = { id: "u_alice", username: "alice", displayName: "Alice", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80" };
    const bob: User = { id: "u_bob", username: "bob", displayName: "Bob", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80" };
    const carol: User = { id: "u_carol", username: "carol", displayName: "Carol", avatar: "https://images.unsplash.com/photo-1544005316-4a0e0a2f7b2f?w=400&q=80" };
    this.users = [me, alice, bob, carol];
    // current user is Me
    this.currentUser = me;
    // Everyone follows Me (to allow messaging in this demo by default) and Me follows Alice
    this.ensureFollower(me.id, alice.id);
    this.ensureFollower(bob.id, me.id);
    this.ensureFollower(alice.id, me.id);
  }

  private ensureFollower(followerId: string, followingId: string) {
    if (!this.followers.has(followingId)) this.followers.set(followingId, new Set());
    this.followers.get(followingId)!.add(followerId);
  }

  // Public API
  getCurrentUser(): User {
    return this.currentUser;
  }

  getUsers(): User[] {
    return this.users;
  }

  addUser(username: string, displayName: string): User {
    const id = `u_${username}_${Date.now()}`;
    const user: User = { id, username, displayName };
    this.users.push(user);
    // default no followers
    this.followers.set(username, new Set());
    return user;
  }

  getFollowers(userId: string): string[] {
    const set = this.followers.get(userId);
    return set ? Array.from(set) : [];
  }

  follow(followerId: string, followingId: string): void {
    if (!this.followers.has(followingId)) this.followers.set(followingId, new Set());
    this.followers.get(followingId)!.add(followerId);
  }

  private getConversationKey(a: string, b: string): string {
    return [a, b].sort().join("|");
  }

  private ensureConversation(a: string, b: string): Conversation {
    const key = this.getConversationKey(a, b);
    let convo = this.conversations.get(key);
    if (!convo) {
      convo = { id: `c_${this.nextConvoId++}`, participants: [a, b], messages: [] };
      this.conversations.set(key, convo);
    }
    return convo;
  }

  getConversationsForUser(userId: string): Conversation[] {
    const list: Conversation[] = [];
    for (const convo of this.conversations.values()) {
      if (convo.participants.includes(userId)) list.push(convo);
    }
    return list;
  }

  startConversation(userA: string, userB: string): Conversation {
    // create or fetch existing
    const convo = this.ensureConversation(userA, userB);
    return convo;
  }

  sendMessage(conversationId: string, senderId: string, text: string): Message {
    const convo = Array.from(this.conversations.values()).find((c) => c.id === conversationId);
    if (!convo) throw new Error("Conversation not found");
    const recipientId = convo.participants.find((id) => id !== senderId) || senderId;
    // Enforce: recipient must follow the sender (i.e., recipient is in followers[senderId])
    const followersOfSender = new Set(this.getFollowers(senderId));
    if (!followersOfSender.has(recipientId) && recipientId !== senderId) {
      throw new Error("You can only message your followers");
    }
    const msg: Message = {
      id: `m_${Date.now()}`,
      conversationId,
      senderId,
      content: text,
      timestamp: Date.now(),
    };
    convo.messages.push(msg);
    // Broadcast to any listeners for this convo
    this.bus.emit(conversationId, msg);
    // Optional: auto-reply from recipient to simulate real-time flow
    if (recipientId !== senderId) {
      setTimeout(() => {
        try {
          const auto = this.sendMessage(conversationId, recipientId, "Got it!");
          // ignore auto response errors for simplicity
        } catch {}
      }, 600);
    }
    return msg;
  }

  onMessage(conversationId: string, cb: Listener) {
    this.bus.on(conversationId, cb);
  }
}

const instance = new MockChatService();
export default instance;

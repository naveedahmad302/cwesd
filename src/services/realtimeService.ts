import { messagesAPI } from './api';

export interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    picture: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
    picture: string;
  };
  text: string;
  repliedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  read?: boolean;
  edited?: boolean;
  deleted?: boolean;
  __v?: number;
}

class RealtimeService {
  private pollingIntervals: Map<string, any> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private lastMessageTimes: Map<string, string> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries = 3;

  constructor() {
    this.listeners.set('newMessage', []);
    this.listeners.set('messageEdited', []);
    this.listeners.set('messageDeleted', []);
  }

  // Event listener management
  on(event: string, callback: Function) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback);
    this.listeners.set(event, callbacks);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    this.listeners.set(event, callbacks);
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Start polling for new messages in a chat
  startPolling(senderId: string, receiverId: string, interval: number = 3000) {
    // Validate inputs
    if (!senderId || !receiverId) {
      return;
    }

    const chatId = `${senderId}-${receiverId}`;
    
    // Stop existing polling for this chat
    this.stopPolling(chatId);

    const pollInterval = setInterval(async () => {
      try {
        const response = await messagesAPI.getChat(senderId, receiverId);
        
        // Reset retry attempts on success
        this.retryAttempts.set(chatId, 0);
        
        if (response.status === 200 && response.data) {
          const messages = response.data.data || [];
          
          // Get the last known message time for this chat
          const lastTime = this.lastMessageTimes.get(chatId);
          
          // Filter for new messages
          const newMessages = messages.filter((message: Message) => {
            if (!lastTime) return true;
            return new Date(message.createdAt) > new Date(lastTime);
          });

          // Emit new messages
          newMessages.forEach((message: Message) => {
            this.emit('newMessage', message);
          });

          // Update last message time
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            this.lastMessageTimes.set(chatId, latestMessage.createdAt);
          }
        }
      } catch (error: any) {
        // Log more details about the error
        if (error.response) {
          // If we get a 500 error, implement retry logic
          if (error.response.status === 500) {
            const currentRetries = this.retryAttempts.get(chatId) || 0;
            
            if (currentRetries >= this.maxRetries) {
              this.stopPolling(chatId);
              return;
            }
            
            this.retryAttempts.set(chatId, currentRetries + 1);
            return; // Skip this iteration but continue polling
          }
        }
        
        // Don't emit errors to avoid disrupting the UI
        // Just continue polling
      }
    }, interval);

    this.pollingIntervals.set(chatId, pollInterval);
  }

  // Stop polling for a specific chat
  stopPolling(chatId?: string) {
    if (chatId) {
      const interval = this.pollingIntervals.get(chatId);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(chatId);
        this.retryAttempts.delete(chatId); // Clean up retry attempts
      }
    } else {
      // Stop all polling
      this.pollingIntervals.forEach((interval) => clearInterval(interval));
      this.pollingIntervals.clear();
      this.retryAttempts.clear(); // Clean up all retry attempts
    }
  }

  // Send a message and immediately emit it for better UX
  async sendMessage(senderId: string, receiverId: string, text: string, repliedTo?: string) {
    try {
      const response = await messagesAPI.send(senderId, receiverId, text, repliedTo);
      const message = response.data.data;
      
      // Emit immediately for better UX
      this.emit('newMessage', message);
      
      return message;
    } catch (error) {
      throw error;
    }
  }

  // Edit a message
  async editMessage(messageId: string, userId: string, text: string) {
    try {
      const response = await messagesAPI.edit(messageId, userId, text);
      const message = response.data.data;
      
      this.emit('messageEdited', message);
      return message;
    } catch (error) {
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string) {
    try {
      await messagesAPI.delete(messageId, userId);
      this.emit('messageDeleted', messageId);
    } catch (error) {
      throw error;
    }
  }

  // Get connection status (always true for polling)
  isConnected(): boolean {
    return true;
  }
}

export const realtimeService = new RealtimeService();

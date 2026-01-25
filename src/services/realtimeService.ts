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
      console.error('❌ Invalid senderId or receiverId for polling:', { senderId, receiverId });
      return;
    }

    console.log('✅ Starting polling with valid IDs:', { senderId, receiverId });

    const chatId = `${senderId}-${receiverId}`;
    
    // Stop existing polling for this chat
    this.stopPolling(chatId);

    const pollInterval = setInterval(async () => {
      try {
        console.log(`Polling for messages between ${senderId} and ${receiverId}`);
        const response = await messagesAPI.getChat(senderId, receiverId);
        
        // Reset retry attempts on success
        this.retryAttempts.set(chatId, 0);
        
        if (response.status === 200 && response.data) {
          const messages = response.data.data || [];
          console.log('🔍 Raw API response structure:', {
            status: response.status,
            dataStructure: response.data,
            messagesArray: messages,
            messagesCount: messages.length
          });
          console.log(`Found ${messages.length} messages`);
          
          // Get the last known message time for this chat
          const lastTime = this.lastMessageTimes.get(chatId);
          
          // Filter for new messages
          const newMessages = messages.filter((message: Message) => {
            if (!lastTime) return true;
            return new Date(message.createdAt) > new Date(lastTime);
          });

          // Emit new messages
          newMessages.forEach((message: Message) => {
            console.log('🔍 New message details:', {
              messageId: message._id,
              text: message.text,
              senderId: message.senderId,
              senderIdType: typeof message.senderId,
              actualSenderId: message.senderId._id,
              originalSenderId: senderId,
              originalReceiverId: receiverId,
              isFromOriginalSender: message.senderId._id === senderId,
              isFromOriginalReceiver: message.senderId._id === receiverId,
              createdAt: message.createdAt,
              allKeys: Object.keys(message),
              allValues: Object.values(message)
            });
            this.emit('newMessage', message);
          });

          // Update last message time
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            this.lastMessageTimes.set(chatId, latestMessage.createdAt);
          }
        } else {
          console.warn('Unexpected response format:', response);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        
        // Log more details about the error
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          
          // If we get a 500 error, implement retry logic
          if (error.response.status === 500) {
            const currentRetries = this.retryAttempts.get(chatId) || 0;
            
            if (currentRetries >= this.maxRetries) {
              console.error(`❌ Max retries (${this.maxRetries}) reached for chat ${chatId} - stopping polling`);
              this.stopPolling(chatId);
              return;
            }
            
            this.retryAttempts.set(chatId, currentRetries + 1);
            console.error(`❌ Server error (500) - retry attempt ${currentRetries + 1}/${this.maxRetries}`);
            return; // Skip this iteration but continue polling
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
        } else {
          console.error('Error setting up request:', error.message);
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
    console.log('🔍 Sending message with details:', {
      senderId: senderId,
      senderIdType: typeof senderId,
      receiverId: receiverId,
      receiverIdType: typeof receiverId,
      text: text,
      repliedTo: repliedTo
    });
    
    try {
      const response = await messagesAPI.send(senderId, receiverId, text, repliedTo);
      const message = response.data.data;
      
      console.log('🔍 Message sent successfully, server response:', {
        messageId: message._id,
        messageSenderId: message.senderId,
        messageSenderIdType: typeof message.senderId,
        messageSenderIdObject: message.senderId._id,
        messageText: message.text,
        createdAt: message.createdAt,
        allKeys: Object.keys(message),
        allValues: Object.values(message)
      });
      
      // Emit immediately for better UX
      this.emit('newMessage', message);
      
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
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
      console.error('Failed to edit message:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string) {
    try {
      await messagesAPI.delete(messageId, userId);
      this.emit('messageDeleted', messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  }

  // Get connection status (always true for polling)
  isConnected(): boolean {
    return true;
  }
}

export const realtimeService = new RealtimeService();

import { store } from '../store';
import { messagesApi } from '../store/api';
import { socketService } from './socketService';
import type { Message } from '../types/messages.types';

/** Events emitted by the service */
export type RealtimeEvent = 'newMessage' | 'messageEdited' | 'messageDeleted';
export type RealtimeEventMap = {
  newMessage: Message;
  messageEdited: Message;
  messageDeleted: string;
};

class RealtimeService {
  private pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();
  private listeners = new Map<RealtimeEvent, Array<(data: RealtimeEventMap[RealtimeEvent]) => void>>();
  private lastMessageTimes = new Map<string, string>();
  private retryAttempts = new Map<string, number>();
  private readonly maxRetries = 3;

  constructor() {
    this.listeners.set('newMessage', []);
    this.listeners.set('messageEdited', []);
    this.listeners.set('messageDeleted', []);
  }

  on<K extends RealtimeEvent>(event: K, callback: (data: RealtimeEventMap[K]) => void): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.push(callback as (data: RealtimeEventMap[RealtimeEvent]) => void);
    this.listeners.set(event, callbacks);
  }

  off<K extends RealtimeEvent>(event: K, callback: (data: RealtimeEventMap[K]) => void): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback as (data: RealtimeEventMap[RealtimeEvent]) => void);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    this.listeners.set(event, callbacks);
  }

  private emit<K extends RealtimeEvent>(event: K, data: RealtimeEventMap[K]): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  /** Called by socket (or other transport) when a new message is received in real time */
  notifyNewMessage(message: Message): void {
    this.emit('newMessage', message);
  }

  /** Called by socket (or other transport) when a message is edited in real time */
  notifyMessageEdited(message: Message): void {
    this.emit('messageEdited', message);
  }

  /** Called by socket (or other transport) when a message is deleted in real time */
  notifyMessageDeleted(messageId: string): void {
    this.emit('messageDeleted', messageId);
  }

  startPolling(senderId: string, receiverId: string, interval: number = 3000): void {
    if (!senderId || !receiverId) {
      return;
    }

    const chatId = `${senderId}-${receiverId}`;
    this.stopPolling(chatId);

    const pollInterval = setInterval(async () => {
      try {
        const result = await store.dispatch(
          messagesApi.endpoints.getChat.initiate({ senderId, receiverId })
        );

        this.retryAttempts.set(chatId, 0);

        if (result.data?.data) {
          const messages: Message[] = result.data.data;
          const lastTime = this.lastMessageTimes.get(chatId);

          const newMessages = messages.filter((message) => {
            if (!lastTime) return true;
            const createdAt = message.createdAt;
            return createdAt ? new Date(createdAt) > new Date(lastTime) : false;
          });

          for (const message of newMessages) {
            this.emit('newMessage', message);
          }

          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (latestMessage.createdAt) {
              this.lastMessageTimes.set(chatId, latestMessage.createdAt);
            }
          }
        }
      } catch (err) {
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : undefined;
        if (status === 500) {
          const currentRetries = this.retryAttempts.get(chatId) ?? 0;
          if (currentRetries >= this.maxRetries) {
            this.stopPolling(chatId);
            return;
          }
          this.retryAttempts.set(chatId, currentRetries + 1);
        }
      }
    }, interval);

    this.pollingIntervals.set(chatId, pollInterval);
  }

  stopPolling(chatId?: string): void {
    if (chatId) {
      const interval = this.pollingIntervals.get(chatId);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(chatId);
        this.retryAttempts.delete(chatId);
      }
    } else {
      this.pollingIntervals.forEach(interval => clearInterval(interval));
      this.pollingIntervals.clear();
      this.retryAttempts.clear();
    }
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    repliedTo?: string
  ): Promise<Message | undefined> {
    const result = await store.dispatch(
      messagesApi.endpoints.sendMessage.initiate({ senderId, receiverId, text, repliedTo })
    );

    if (result.data?.data) {
      const message: Message = result.data.data;
      this.emit('newMessage', message);
      if (socketService.isConnected()) {
        if (repliedTo) {
          socketService.emitSendMessageReply({ senderId, receiverId, text, repliedTo });
        } else {
          socketService.emitSendMessage({ senderId, receiverId, text, repliedTo });
        }
      }
      return message;
    }
    if (result.error) {
      throw result.error;
    }
    return undefined;
  }

  async editMessage(
    messageId: string,
    senderId: string,
    receiverId: string,
    text: string,
    repliedTo?: string
  ): Promise<Message | undefined> {
    if (socketService.isConnected()) {
      socketService.emitEditMessage({ senderId, receiverId, text, repliedTo, messageId });
      const optimisticMessage: Message = {
        _id: messageId,
        text,
        senderId,
        receiverId,
        createdAt: new Date().toISOString(),
      };
      this.emit('messageEdited', optimisticMessage);
      return optimisticMessage;
    }
    const result = await store.dispatch(
      messagesApi.endpoints.editMessage.initiate({ senderId, receiverId, text, repliedTo, messageId })
    );
    if (result.data?.data) {
      const message: Message = result.data.data;
      this.emit('messageEdited', message);
      return message;
    }
    if (result.error) {
      throw result.error;
    }
    return undefined;
  }

  async deleteMessage(messageId: string, userId: string, receiverId?: string): Promise<void> {
    await store.dispatch(
      messagesApi.endpoints.deleteMessage.initiate({ messageId, userId })
    );
    this.emit('messageDeleted', messageId);
    if (socketService.isConnected() && receiverId) {
      socketService.emitDeleteMessage({ _id: messageId, senderId: userId, receiverId });
    }
  }

  isConnected(): boolean {
    return true;
  }
}

export const realtimeService = new RealtimeService();
export type { Message };

import { io, Socket } from 'socket.io-client';
import { realtimeService } from './realtimeService';
import type { Message } from '../types/messages.types';
import type {
  SocketMessagePayload,
  SocketEditPayload,
  SocketDeletePayload,
} from '../types/messages.types';

/** Set via env (e.g. react-native-dotenv SOCKET_URL) or leave empty to use REST only */
const SOCKET_URL = '';

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (!SOCKET_URL || socket?.connected) return socket;
  try {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
    socket.on('connect', () => {
      // optional: log
    });
    socket.on('new-message', (data: Message) => {
      realtimeService.notifyNewMessage(data);
    });
    socket.on('message-deleted', (data: { _id?: string } | string) => {
      const id = typeof data === 'string' ? data : data?._id;
      if (id) realtimeService.notifyMessageDeleted(id);
    });
    socket.on('message-edited', (data: Message) => {
      realtimeService.notifyMessageEdited(data);
    });
    socket.on('disconnect', () => {});
    socket.on('connect_error', () => {});
    return socket;
  } catch {
    return null;
  }
}

export const socketService = {
  isConnected(): boolean {
    return !!socket?.connected;
  },

  connect(): Socket | null {
    return getSocket();
  },

  disconnect(): void {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  /** Emit send-message (new message) */
  emitSendMessage(payload: SocketMessagePayload): void {
    const s = getSocket();
    if (s?.connected) s.emit('send-message', { messageData: payload });
  },

  /** Emit send-message-reply (reply to message) */
  emitSendMessageReply(payload: SocketMessagePayload): void {
    const s = getSocket();
    if (s?.connected) s.emit('send-message-reply', { messageData: payload });
  },

  /** Emit edit-message */
  emitEditMessage(payload: SocketEditPayload): void {
    const s = getSocket();
    if (s?.connected) s.emit('edit-message', { messageData: payload });
  },

  /** Emit delete-message */
  emitDeleteMessage(payload: SocketDeletePayload): void {
    const s = getSocket();
    if (s?.connected) s.emit('delete-message', { messageData: payload });
  },
};

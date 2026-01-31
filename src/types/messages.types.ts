export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  text: string;
  repliedTo?: string;
}

/** Socket: send-message / send-message-reply / edit-message payload */
export interface SocketMessagePayload {
  senderId: string;
  receiverId: string;
  text: string;
  repliedTo?: string;
}

/** Socket: edit-message may include messageId (depends on backend) */
export interface SocketEditPayload extends SocketMessagePayload {
  _id?: string;
  messageId?: string;
}

/** Socket: delete-message payload */
export interface SocketDeletePayload {
  _id: string;
  senderId: string;
  receiverId: string;
}

export interface EditMessagePayload {
  userId: string;
  text: string;
}

/** Populated user ref as returned by the API on messages */
export interface MessageUserRef {
  _id: string;
  name: string;
  email?: string;
  picture?: string;
}

/** Nested reply object as returned by the API when repliedTo is populated */
export interface MessageReplyRef {
  _id: string;
  senderId?: string;
  receiverId?: string;
  repliedTo?: string | null;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

/** Message as returned by the API (senderId/receiverId may be ids or populated refs) */
export interface Message {
  _id: string;
  senderId: string | MessageUserRef;
  receiverId: string | MessageUserRef;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  read?: boolean;
  repliedTo?: string | MessageReplyRef | null;
  edited?: boolean;
  deleted?: boolean;
  __v?: number;
}

/** GET /messages/chat/:senderId/:receiverId response */
export interface GetChatResponse {
  success?: boolean;
  message?: string;
  data?: Message[];
}

/** POST send message response */
export interface SendMessageResponse {
  success?: boolean;
  message?: string;
  data?: Message;
}

export interface ChatResponse {
  success?: boolean;
  messages?: Message[];
  data?: Message[];
  chat?: { messages: Message[] };
}

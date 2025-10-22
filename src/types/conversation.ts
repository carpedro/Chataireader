// Formato individual de mensagem (usado internamente)
export interface ConversationData {
  session_id: string;
  execution_id: string;
  timestamp: string;
  author: string;
  message: string;
}

// Formato da API n8n (novo formato agrupado)
export interface ApiConversationSession {
  session_id: string;
  author: string; // whatsapp number
  count_messages: number;
  conversations: ApiMessage[];
  elapsed_time: number;
}

export interface ApiMessage {
  author: 'customer' | 'bot';
  message: string;
  timestamp: string;
}

// Formato individual de mensagem (usado internamente)
export interface ConversationData {
  session_id: string;
  execution_id: string;
  timestamp: string;
  author: string;
  message: string;
  contato?: string; // Número do WhatsApp sem o prefixo 'whatsapp:+'
  first_message_text?: string; // Primeira mensagem da conversa
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

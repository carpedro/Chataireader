import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  author: string;
  message: string;
  timestamp: string;
  highlighted?: boolean;
}

export function MessageBubble({ author, message, timestamp, highlighted }: MessageBubbleProps) {
  // author pode ser 'customer' ou 'bot'
  // customer = mensagem do cliente (branco à esquerda)
  // bot = mensagem do bot (verde à direita)
  const isBot = author === 'bot';
  
  // Debug log
  console.log('💬 MessageBubble:', { author, isBot, message: message.substring(0, 30) });

  const formatTime = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestampStr;
    }
  };

  return (
    <div className={`flex mb-2 md:mb-3 ${isBot ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] md:max-w-[70%] rounded-lg shadow-sm px-2 py-1.5
          ${isBot ? 'bg-[#DCF8C6] rounded-br-none' : 'bg-white rounded-bl-none'}
          ${highlighted ? 'ring-2 ring-yellow-400' : ''}
        `}
      >
        <div className="text-black break-words text-[14px] md:text-[15px] prose prose-sm max-w-none px-1 py-0.5">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc mb-2 pl-4 -ml-2 marker:text-gray-700">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal mb-2 pl-4 -ml-2 marker:text-gray-700">{children}</ol>,
              li: ({ children }) => <li className="mb-1 pl-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-black/10 px-1 py-0.5 rounded text-[13px]">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="bg-black/10 p-2 rounded overflow-x-auto mb-2">{children}</pre>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">{children}</blockquote>
              ),
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isBot ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] md:text-[11px] text-gray-600">
            {formatTime(timestamp)}
          </span>
          {isBot && (
            <div className="flex">
              <Check className="w-3 h-3 text-blue-500" />
              <Check className="w-3 h-3 text-blue-500 -ml-2" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

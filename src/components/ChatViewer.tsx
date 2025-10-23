import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Search, ChevronUp, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageBubble } from './MessageBubble';
import { DateSeparator } from './DateSeparator';
import { ConversationData } from '../types/conversation';

interface ChatViewerProps {
  data: ConversationData[];
  onBack: () => void;
  sessionId?: string;
  onNavigateToSession: (sessionId: string) => void;
}

export function ChatViewer({ data, onBack, sessionId, onNavigateToSession }: ChatViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Get all unique session IDs sorted by last message timestamp
  const allSessions = useMemo(() => {
    const sessionMap = new Map<string, Date>();
    
    data.forEach(msg => {
      const existingDate = sessionMap.get(msg.session_id);
      const currentDate = new Date(msg.timestamp);
      
      if (!existingDate || currentDate > existingDate) {
        sessionMap.set(msg.session_id, currentDate);
      }
    });

    return Array.from(sessionMap.entries())
      .sort((a, b) => b[1].getTime() - a[1].getTime())
      .map(([sessionId]) => sessionId);
  }, [data]);

  const currentSessionIndex = allSessions.indexOf(sessionId || '');
  const hasPrevious = currentSessionIndex > 0;
  const hasNext = currentSessionIndex < allSessions.length - 1;

  const handlePreviousSession = () => {
    if (hasPrevious) {
      onNavigateToSession(allSessions[currentSessionIndex - 1]);
    }
  };

  const handleNextSession = () => {
    if (hasNext) {
      onNavigateToSession(allSessions[currentSessionIndex + 1]);
    }
  };

  // Filter messages by sessionId if provided
  const filteredData = useMemo(() => {
    console.log('📊 ChatViewer - Total de mensagens recebidas:', data.length);
    console.log('🔍 ChatViewer - Session ID selecionado:', sessionId);
    
    if (!sessionId) {
      console.log('⚠️ ChatViewer - Nenhum session_id fornecido, retornando todos os dados');
      return data;
    }
    
    const filtered = data.filter(msg => msg.session_id === sessionId);
    console.log('✅ ChatViewer - Mensagens filtradas para session_id', sessionId, ':', filtered.length);
    
    if (filtered.length > 0) {
      console.log('📝 ChatViewer - Primeira mensagem filtrada:', {
        session_id: filtered[0].session_id,
        author: filtered[0].author,
        message: filtered[0].message.substring(0, 50) + '...',
        timestamp: filtered[0].timestamp
      });
    } else {
      console.warn('⚠️ ChatViewer - Nenhuma mensagem encontrada para este session_id!');
      console.log('📋 ChatViewer - Session IDs disponíveis:', [...new Set(data.map(m => m.session_id))]);
    }
    
    return filtered;
  }, [data, sessionId]);

  // Sort messages chronologically
  const sortedMessages = useMemo(() => {
    console.log('📊 ChatViewer - Ordenando', filteredData.length, 'mensagens');
    
    const sorted = [...filteredData].sort((a, b) => {
      // First, sort by timestamp
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      
      // If timestamps are equal, customer comes before bot
      if (a.author === 'customer' && b.author === 'bot') return -1;
      if (a.author === 'bot' && b.author === 'customer') return 1;
      
      return 0;
    });
    
    // Debug: Log unique author values
    const uniqueAuthors = new Set(sorted.map(m => m.author));
    console.log('🔍 ChatViewer - Valores únicos de author:', Array.from(uniqueAuthors));
    console.log('📝 ChatViewer - Total de mensagens ordenadas:', sorted.length);
    
    if (sorted.length > 0) {
      console.log('📝 ChatViewer - Primeiras 3 mensagens:', sorted.slice(0, 3).map(m => ({ 
        author: m.author, 
        message: m.message.substring(0, 30) + '...' 
      })));
    }
    
    return sorted;
  }, [filteredData]);

  // Find messages matching search term
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return sortedMessages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => msg.message.toLowerCase().includes(term));
  }, [searchTerm, sortedMessages]);

  const currentSessionId = sessionId || filteredData[0]?.session_id || 'N/A';

  // Scroll to current search result
  useEffect(() => {
    if (searchResults.length > 0 && currentResultIndex < searchResults.length) {
      const resultIndex = searchResults[currentResultIndex].index;
      const element = messageRefs.current[resultIndex];
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentResultIndex, searchResults]);

  const handlePreviousResult = () => {
    if (searchResults.length > 0) {
      setCurrentResultIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    }
  };

  const handleNextResult = () => {
    if (searchResults.length > 0) {
      setCurrentResultIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentResultIndex(0);
  };

  return (
    <div className="h-screen flex flex-col bg-[#E5DDD5] relative overflow-hidden">
      {/* WhatsApp Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Navigation Header - 45px thin bar */}
      <div className="bg-[#128C7E] flex items-center justify-between px-4 relative z-10" style={{ height: '45px' }}>
        <button
          onClick={handlePreviousSession}
          disabled={!hasPrevious}
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
            hasPrevious 
              ? 'hover:bg-white/20 text-white cursor-pointer' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          title="Conversa anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleNextSession}
          disabled={!hasNext}
          className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
            hasNext 
              ? 'hover:bg-white/20 text-white cursor-pointer' 
              : 'text-white/30 cursor-not-allowed'
          }`}
          title="Próxima conversa"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Header */}
      <div className="bg-[#075E54] text-white px-3 md:px-4 py-3 flex items-center gap-3 md:gap-4 shadow-md relative z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-white/10 text-white flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h2 className="m-0 text-[16px] md:text-xl truncate">Atendimento Virtual</h2>
          <p className="text-[11px] md:text-[13px] text-gray-200 m-0 break-all">
            Session: {currentSessionId}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b px-3 md:px-4 py-2 md:py-3 relative z-10">
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentResultIndex(0);
              }}
              className="pl-10 pr-10 text-[14px]"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-muted-foreground whitespace-nowrap text-[12px] md:text-[14px]">
                {currentResultIndex + 1}/{searchResults.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousResult}
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextResult}
                  className="h-8 w-8 md:h-9 md:w-9"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="px-3 md:px-6 lg:px-16 xl:px-32 py-4 md:py-6 max-w-[1200px] mx-auto" ref={scrollRef}>
          {(() => {
            console.log('🎨 RENDERIZAÇÃO - Total de mensagens a renderizar:', sortedMessages.length);
            
            if (sortedMessages.length === 0) {
              console.warn('⚠️ RENDERIZAÇÃO - Nenhuma mensagem para exibir!');
              return (
                <div className="flex items-center justify-center h-full text-center py-12">
                  <div>
                    <p className="text-gray-500 mb-2">Nenhuma mensagem encontrada</p>
                    <p className="text-sm text-gray-400">Session ID: {sessionId || 'N/A'}</p>
                  </div>
                </div>
              );
            }
            
            console.log('✅ RENDERIZAÇÃO - Renderizando', sortedMessages.length, 'mensagens');
            console.log('📝 RENDERIZAÇÃO - Primeiras 3 mensagens:', sortedMessages.slice(0, 3).map(m => ({
              author: m.author,
              message: m.message.substring(0, 40) + '...',
              timestamp: m.timestamp
            })));
            
            return sortedMessages.map((msg, index) => {
              const isHighlighted = searchResults.some(result => result.index === index);
              
              // Check if we need to show a date separator
              const showDateSeparator = index === 0 || 
                new Date(msg.timestamp).toDateString() !== new Date(sortedMessages[index - 1].timestamp).toDateString();
              
              return (
                <div key={`${msg.session_id}-${index}`}>
                  {showDateSeparator && <DateSeparator date={msg.timestamp} />}
                  <div ref={(el) => { messageRefs.current[index] = el; }}>
                    <MessageBubble
                      author={msg.author}
                      message={msg.message}
                      timestamp={msg.timestamp}
                      highlighted={isHighlighted && searchTerm.length > 0}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t px-3 md:px-4 py-2 text-center relative z-10">
        <p className="text-muted-foreground m-0 text-[11px] md:text-[14px]">
          {sortedMessages.length} {sortedMessages.length === 1 ? 'mensagem' : 'mensagens'}
        </p>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Search, MessageCircle, Calendar as CalendarIcon, Clock, X, Filter, CalendarRange, Phone } from 'lucide-react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { ConversationData } from '../types/conversation';

interface ConversationListProps {
  data: ConversationData[];
  onSelectConversation: (sessionId: string) => void;
}

interface ConversationSummary {
  session_id: string;
  messageCount: number;
  executionCount: number;
  firstMessage: string;
  lastTimestamp: string;
  firstTimestamp: string;
  contact?: string;
  first_message_text?: string;
}

export function ConversationList({ data, onSelectConversation }: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [messageCountRange, setMessageCountRange] = useState<[number, number]>([0, 1000]);
  const [executionCountRange, setExecutionCountRange] = useState<[number, number]>([0, 100]);
  const [showFilters, setShowFilters] = useState(false);

  // Group messages by session_id
  const conversations = useMemo(() => {
    const grouped = new Map<string, ConversationData[]>();
    
    data.forEach((msg) => {
      if (!grouped.has(msg.session_id)) {
        grouped.set(msg.session_id, []);
      }
      grouped.get(msg.session_id)!.push(msg);
    });

    const summaries: ConversationSummary[] = [];
    
    grouped.forEach((messages, sessionId) => {
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const executions = new Set(messages.map(m => m.execution_id));
      // Procura primeira mensagem que não é do bot (cliente)
      const firstClientMessage = sortedMessages.find(m => {
        const authorLower = m.author.toLowerCase();
        return authorLower !== 'bot' && authorLower !== 'sistema' && authorLower !== 'assistente';
      });
      
      summaries.push({
        session_id: sessionId,
        messageCount: messages.length,
        executionCount: executions.size,
        firstMessage: firstClientMessage?.message || sortedMessages[0]?.message || '',
        lastTimestamp: sortedMessages[sortedMessages.length - 1]?.timestamp || '',
        firstTimestamp: sortedMessages[0]?.timestamp || '',
        contact: messages[0]?.contato,
        first_message_text: messages[0]?.first_message_text
      });
    });

    // Sort by most recent first
    return summaries.sort((a, b) => 
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [data]);

  // Get max values for sliders
  const maxMessageCount = useMemo(() => {
    return Math.max(...conversations.map(c => c.messageCount), 100);
  }, [conversations]);

  const maxExecutionCount = useMemo(() => {
    return Math.max(...conversations.map(c => c.executionCount), 10);
  }, [conversations]);

  // Initialize slider ranges with max values once
  useEffect(() => {
    setMessageCountRange([0, maxMessageCount]);
    setExecutionCountRange([0, maxExecutionCount]);
  }, [maxMessageCount, maxExecutionCount]);

  // Filter conversations by search term and filters
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    // Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.session_id.toLowerCase().includes(term) ||
        conv.firstMessage.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(conv => {
        const convDate = new Date(conv.firstTimestamp);
        if (dateRange.from && convDate < dateRange.from) return false;
        if (dateRange.to) {
          const toEndOfDay = new Date(dateRange.to);
          toEndOfDay.setHours(23, 59, 59, 999);
          if (convDate > toEndOfDay) return false;
        }
        return true;
      });
    }

    // Message count filter
    filtered = filtered.filter(conv => 
      conv.messageCount >= messageCountRange[0] && 
      conv.messageCount <= messageCountRange[1]
    );

    // Execution count filter
    filtered = filtered.filter(conv => 
      conv.executionCount >= executionCountRange[0] && 
      conv.executionCount <= executionCountRange[1]
    );

    return filtered;
  }, [conversations, searchTerm, dateRange, messageCountRange, executionCountRange]);

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
      }

      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setMessageCountRange([0, maxMessageCount]);
    setExecutionCountRange([0, maxExecutionCount]);
  };

  const hasActiveFilters = dateRange.from || dateRange.to || 
    messageCountRange[0] > 0 || messageCountRange[1] < maxMessageCount ||
    executionCountRange[0] > 0 || executionCountRange[1] < maxExecutionCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-4xl h-[95vh] md:h-[90vh] bg-white rounded-lg md:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#075E54] text-white px-3 md:px-4 py-3 md:py-4 flex items-center gap-3 md:gap-4 shadow-md">
          <div className="flex-1 min-w-0">
            <h2 className="m-0 text-[16px] md:text-xl truncate">Conversas de Atendimento</h2>
            <p className="text-[11px] md:text-[13px] text-gray-200 m-0">
              {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'} • {data.length} mensagens
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-b px-3 md:px-4 py-2 md:py-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 text-[14px]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 border-b px-3 md:px-4 py-3 md:py-4 space-y-4">
            {/* Date Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Período de Datas</Label>
                {(dateRange.from || dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                    className="h-6 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left text-sm">
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {dateRange.from.toLocaleDateString('pt-BR')} - {dateRange.to.toLocaleDateString('pt-BR')}
                        </>
                      ) : (
                        dateRange.from.toLocaleDateString('pt-BR')
                      )
                    ) : (
                      'Selecionar período'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Message Count Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Quantidade de Mensagens</Label>
                <span className="text-xs text-gray-500">
                  {messageCountRange[0]} - {messageCountRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={maxMessageCount}
                step={1}
                value={messageCountRange}
                onValueChange={(value) => setMessageCountRange(value as [number, number])}
                className="w-full"
              />
            </div>

            {/* Execution Count Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Quantidade de Execuções</Label>
                <span className="text-xs text-gray-500">
                  {executionCountRange[0]} - {executionCountRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={maxExecutionCount}
                step={1}
                value={executionCountRange}
                onValueChange={(value) => setExecutionCountRange(value as [number, number])}
                className="w-full"
              />
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Todos os Filtros
              </Button>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-2 md:p-4 space-y-2 md:space-y-3">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Card
                  key={conv.session_id}
                  className="p-3 md:p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-[#075E54]"
                  onClick={() => onSelectConversation(conv.session_id)}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#DCF8C6] rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#075E54]" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="m-0 text-[14px] md:text-base break-all">
                          {conv.session_id}
                        </h3>
                        <span className="text-[11px] md:text-[12px] text-gray-500 whitespace-nowrap flex-shrink-0">
                          {formatDate(conv.lastTimestamp)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 truncate m-0 mb-2 text-[13px] md:text-[14px]">
                        {(conv.first_message_text || conv.firstMessage).length > 80 
                          ? `${(conv.first_message_text || conv.firstMessage).slice(0, 80)}...` 
                          : (conv.first_message_text || conv.firstMessage)}
                      </p>
                      
                      <div className="flex items-center gap-2 md:gap-4 text-[11px] md:text-[12px] text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">{conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}</span>
                          <span className="sm:hidden">{conv.messageCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">{conv.executionCount} exec</span>
                          <span className="sm:hidden">{conv.executionCount}</span>
                        </div>
                        {conv.contact && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{conv.contact}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{formatDate(conv.firstTimestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

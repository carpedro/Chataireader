import { ConversationData } from '../types/conversation';

interface ApiResponse {
  success?: boolean;
  data?: any[];
  error?: string;
  [key: string]: any;
}

/**
 * Busca conversas diretamente da API do n8n (client-side)
 * @param tenant Tenant a ser filtrado (default: "pucrs")
 * @param startDate Data inicial no formato ISO (default: 30 dias atrás)
 * @param endDate Data final no formato ISO (default: agora)
 */
export async function fetchConversations(
  tenant: string = 'pucrs',
  startDate?: string,
  endDate?: string
): Promise<ConversationData[]> {
  const startTime = Date.now();
  
  try {
    // Define datas padrão se não fornecidas
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const defaultStartDate = thirtyDaysAgo.toISOString();
    const defaultEndDate = now.toISOString();

    const start_date = startDate || defaultStartDate;
    const end_date = endDate || defaultEndDate;

    console.log('='.repeat(60));
    console.log('🔌 CHAMADA CLIENT-SIDE À API N8N');
    console.log('='.repeat(60));
    console.log('🌐 URL:', 'https://n8n-sales.edtech.com.br/webhook/product');
    console.log('📅 Filtros:', { tenant, start_date, end_date });
    console.log('⏱️  Timeout configurado: 30 segundos');
    console.log('='.repeat(60));

    const requestPayload = {
      action: 'searchAll',
      filter: [
        { tenant },
        { start_date },
        { end_date }
      ]
    };

    console.log('📤 Payload da requisição:', JSON.stringify(requestPayload, null, 2));

    // Setup timeout com AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout de 30s alcançado, abortando requisição...');
      controller.abort();
    }, 30000);

    console.log('⏳ Enviando requisição (aguarde até 30s)...');

    // Chamada direta à API n8n (client-side)
    const response = await fetch('https://n8n-sales.edtech.com.br/webhook/product', {
      method: 'POST',
      headers: {
        'x-authorization': 'e5362baf-c777-4d57-a609-6eaf1f9e87f6',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log(`✅ Resposta recebida em ${responseTime}ms`);
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log('='.repeat(60));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ Erro na resposta da API:', response.status, errorText);
      throw new Error(`n8n API returned ${response.status}: ${errorText}`);
    }

    let result: any;
    try {
      result = await response.json();
      console.log('✅ JSON parseado com sucesso');
      console.log('📦 Tipo de resposta:', Array.isArray(result) ? 'Array' : typeof result);
      if (typeof result === 'object' && result !== null) {
        console.log('📦 Chaves da resposta:', Object.keys(result).join(', '));
      }
    } catch (jsonError) {
      console.error('❌ Erro ao parsear JSON:', jsonError);
      throw new Error('Invalid JSON response from n8n API');
    }

    // Adapt different response formats
    let rawData: any[] = [];
    
    if (Array.isArray(result)) {
      console.log('📋 Resposta é um array direto');
      rawData = result;
    } else if (result.data && Array.isArray(result.data)) {
      console.log('📋 Resposta tem campo .data com array');
      rawData = result.data;
    } else if (result.success && result.data) {
      console.log('📋 Resposta tem success=true e campo .data');
      rawData = Array.isArray(result.data) ? result.data : [result.data];
    } else if (Object.keys(result).length > 0) {
      console.log('📋 Resposta é objeto único, convertendo para array');
      rawData = [result];
    } else {
      console.warn('⚠️ Resposta em formato desconhecido');
    }

    console.log(`📊 Total de registros recebidos: ${rawData.length}`);

    if (rawData.length > 0) {
      console.log('📝 Exemplo do primeiro registro (raw):');
      console.log(JSON.stringify(rawData[0], null, 2));
    }

    // Map to expected format - handle both old and new API formats
    const conversations: ConversationData[] = [];
    
    rawData.forEach((item: any, sessionIndex: number) => {
      const sessionId = item.session_id || item.sessionId || item.session || `unknown_${sessionIndex}`;
      
      // Check if this is the new format with nested conversations array
      if (item.conversations && Array.isArray(item.conversations)) {
        console.log(`🔄 Processando sessão ${sessionId} com ${item.conversations.length} mensagens (novo formato)`);
        
        // Extract contact info from session
        const sessionAuthor = item.author || '';
        const contato = sessionAuthor.replace('whatsapp:+', '') || '';
        
        // Get first message text from session level
        const firstMessage = item.first_message_text || '';
        console.log(`📝 First message text para sessão ${sessionId}:`, firstMessage);
        
        // New format: expand conversations array
        item.conversations.forEach((conv: any, msgIndex: number) => {
          const author = conv.author || '';
          const message = conv.message || '';
          const timestamp = conv.timestamp || new Date().toISOString();
          
          // Map customer/bot to expected format
          let normalizedAuthor = String(author).toLowerCase().trim();
          if (normalizedAuthor === 'customer') {
            normalizedAuthor = 'cliente';
          }
          
          const mapped: ConversationData = {
            session_id: sessionId,
            execution_id: sessionId, // Use session_id as execution_id in new format
            timestamp: timestamp,
            author: normalizedAuthor,
            message: message,
            contato: contato,
            first_message_text: firstMessage
          };
          
          if (sessionIndex === 0 && msgIndex === 0) {
            console.log('🔄 Exemplo de mapeamento (novo formato):');
            console.log('  Original:', JSON.stringify(conv, null, 2));
            console.log('  Mapeado:', JSON.stringify(mapped, null, 2));
          }
          
          conversations.push(mapped);
        });
      } else {
        // Old format: direct message format
        console.log(`🔄 Processando item ${sessionIndex} (formato antigo)`);
        
        // Extract contact info for old format
        const sessionAuthor = item.author || item.sender || item.from || '';
        const contato = sessionAuthor.replace('whatsapp:+', '') || '';
        
        const mapped: ConversationData = {
          session_id: sessionId,
          execution_id: item.execution_id || item.executionId || item.execution || `unknown_${sessionIndex}`,
          timestamp: item.timestamp || item.created_at || item.date || new Date().toISOString(),
          author: item.author || item.sender || item.from || 'unknown',
          message: item.message || item.text || item.content || '',
          contato: contato,
          first_message_text: item.first_message_text || item.message || item.text || item.content || ''
        };
        
        if (sessionIndex === 0) {
          console.log('🔄 Exemplo de mapeamento (formato antigo):');
          console.log('  Mapeado:', JSON.stringify(mapped, null, 2));
        }
        
        conversations.push(mapped);
      }
    });

    console.log('='.repeat(60));
    console.log(`✅ SUCESSO: ${conversations.length} conversas mapeadas`);
    console.log(`⏱️  Tempo total: ${Date.now() - startTime}ms`);
    console.log('='.repeat(60));

    if (conversations.length > 0) {
      // Group by session_id for stats
      const sessions = new Set(conversations.map(c => c.session_id));
      console.log(`📊 Estatísticas:`);
      console.log(`   - Total de mensagens: ${conversations.length}`);
      console.log(`   - Total de sessões: ${sessions.size}`);
      console.log(`   - Média msg/sessão: ${(conversations.length / sessions.size).toFixed(1)}`);
    }

    return conversations;
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('❌ ERRO AO BUSCAR CONVERSAS DA API N8N');
    console.error('⏱️  Tempo até erro:', errorTime, 'ms');
    console.error('🔍 Tipo de erro:', error instanceof Error ? error.name : typeof error);
    console.error('💬 Mensagem:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('📚 Stack trace:', error.stack);
    }

    // Check for CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('⚠️  POSSÍVEL ERRO DE CORS - A API n8n pode não permitir requisições diretas do navegador');
      console.error('💡 Sugestão: Use a tela de upload manual com o comando cURL');
    }

    // Check for timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ TIMEOUT - A requisição demorou mais de 30 segundos');
    }

    console.error('='.repeat(60));
    throw error;
  }
}

/**
 * Busca conversas com range de datas personalizado
 */
export async function fetchConversationsWithDateRange(
  startDate: Date,
  endDate: Date,
  tenant: string = 'pucrs'
): Promise<ConversationData[]> {
  return fetchConversations(
    tenant,
    startDate.toISOString(),
    endDate.toISOString()
  );
}

/**
 * Busca detalhes de uma conversa específica por session_id
 * @param sessionId ID da sessão a ser buscada
 */
export async function fetchConversationDetails(sessionId: string): Promise<ConversationData[]> {
  const startTime = Date.now();
  
  try {
    console.log('='.repeat(60));
    console.log('🔍 BUSCANDO DETALHES DA CONVERSA');
    console.log('='.repeat(60));
    console.log('🌐 URL:', 'https://n8n-sales.edtech.com.br/webhook/product');
    console.log('📋 Session ID:', sessionId);
    console.log('⏱️  Timeout configurado: 30 segundos');
    console.log('='.repeat(60));

    const requestPayload = {
      action: 'search',
      filter: [
        { session_id: sessionId }
      ]
    };

    console.log('📤 Payload da requisição:', JSON.stringify(requestPayload, null, 2));

    // Setup timeout com AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout de 30s alcançado, abortando requisição...');
      controller.abort();
    }, 30000);

    console.log('⏳ Enviando requisição (aguarde até 30s)...');

    // Chamada à API n8n para buscar detalhes da conversa
    const response = await fetch('https://n8n-sales.edtech.com.br/webhook/product', {
      method: 'POST',
      headers: {
        'x-authorization': 'e5362baf-c777-4d57-a609-6eaf1f9e87f6',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log('='.repeat(60));
    console.log(`✅ Resposta recebida em ${responseTime}ms`);
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log('='.repeat(60));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('❌ Erro na resposta da API:', response.status, errorText);
      throw new Error(`n8n API returned ${response.status}: ${errorText}`);
    }

    let result: any;
    try {
      result = await response.json();
      console.log('✅ JSON parseado com sucesso');
      console.log('📦 Tipo de resposta:', Array.isArray(result) ? 'Array' : typeof result);
      if (typeof result === 'object' && result !== null) {
        console.log('📦 Chaves da resposta:', Object.keys(result).join(', '));
      }
    } catch (jsonError) {
      console.error('❌ Erro ao parsear JSON:', jsonError);
      throw new Error('Invalid JSON response from n8n API');
    }

    // Adapt different response formats
    let rawData: any[] = [];
    
    if (Array.isArray(result)) {
      console.log('📋 Resposta é um array direto');
      rawData = result;
    } else if (result.data && Array.isArray(result.data)) {
      console.log('📋 Resposta tem campo .data com array');
      rawData = result.data;
    } else if (result.success && result.data) {
      console.log('📋 Resposta tem success=true e campo .data');
      rawData = Array.isArray(result.data) ? result.data : [result.data];
    } else if (Object.keys(result).length > 0) {
      console.log('📋 Resposta é objeto único, convertendo para array');
      rawData = [result];
    } else {
      console.warn('⚠️ Resposta em formato desconhecido');
    }

    console.log(`📊 Total de registros recebidos: ${rawData.length}`);

    if (rawData.length > 0) {
      console.log('📝 Exemplo do primeiro registro (raw):');
      console.log(JSON.stringify(rawData[0], null, 2));
    }

    // Map to expected format - handle conversation details format
    const conversations: ConversationData[] = [];
    
    rawData.forEach((item: any, sessionIndex: number) => {
      const sessionId = item.session_id || item.sessionId || item.session || `unknown_${sessionIndex}`;
      
      // Extract contact info from session
      const sessionAuthor = item.author || '';
      const contato = sessionAuthor.replace('whatsapp:+', '') || '';
      
      // Get first message text from session level
      const firstMessage = item.first_message_text || '';
      console.log(`📝 First message text para sessão ${sessionId}:`, firstMessage);
      
      // Check if this has conversations array (detailed format)
      if (item.conversations && Array.isArray(item.conversations)) {
        console.log(`🔄 Processando sessão ${sessionId} com ${item.conversations.length} mensagens (formato detalhado)`);
        
        // Process each conversation message
        item.conversations.forEach((conv: any, msgIndex: number) => {
          const author = conv.author || '';
          const message = conv.message || '';
          const timestamp = conv.timestamp || new Date().toISOString();
          
          // Map customer/bot to expected format
          let normalizedAuthor = String(author).toLowerCase().trim();
          if (normalizedAuthor === 'customer') {
            normalizedAuthor = 'cliente';
          }
          
          const mapped: ConversationData = {
            session_id: sessionId,
            execution_id: sessionId, // Use session_id as execution_id
            timestamp: timestamp,
            author: normalizedAuthor,
            message: message,
            contato: contato,
            first_message_text: firstMessage
          };
          
          if (sessionIndex === 0 && msgIndex === 0) {
            console.log('🔄 Exemplo de mapeamento (formato detalhado):');
            console.log('  Original:', JSON.stringify(conv, null, 2));
            console.log('  Mapeado:', JSON.stringify(mapped, null, 2));
          }
          
          conversations.push(mapped);
        });
      } else {
        // Single message format
        console.log(`🔄 Processando item ${sessionIndex} (formato simples)`);
        
        const mapped: ConversationData = {
          session_id: sessionId,
          execution_id: sessionId,
          timestamp: item.timestamp || item.created_at || item.date || new Date().toISOString(),
          author: item.author || item.sender || item.from || 'unknown',
          message: item.message || item.text || item.content || '',
          contato: contato,
          first_message_text: firstMessage
        };
        
        if (sessionIndex === 0) {
          console.log('🔄 Exemplo de mapeamento (formato simples):');
          console.log('  Mapeado:', JSON.stringify(mapped, null, 2));
        }
        
        conversations.push(mapped);
      }
    });

    console.log('='.repeat(60));
    console.log(`✅ SUCESSO: ${conversations.length} mensagens mapeadas`);
    console.log(`⏱️  Tempo total: ${Date.now() - startTime}ms`);
    console.log('='.repeat(60));

    if (conversations.length > 0) {
      // Group by session_id for stats
      const sessions = new Set(conversations.map(c => c.session_id));
      console.log(`📊 Estatísticas:`);
      console.log(`   - Total de mensagens: ${conversations.length}`);
      console.log(`   - Total de sessões: ${sessions.size}`);
      console.log(`   - Média msg/sessão: ${(conversations.length / sessions.size).toFixed(1)}`);
    }

    return conversations;
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('❌ ERRO AO BUSCAR DETALHES DA CONVERSA');
    console.error('⏱️  Tempo até erro:', errorTime, 'ms');
    console.error('🔍 Tipo de erro:', error instanceof Error ? error.name : typeof error);
    console.error('💬 Mensagem:', error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.error('📚 Stack trace:', error.stack);
    }

    // Check for CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('⚠️  POSSÍVEL ERRO DE CORS - A API n8n pode não permitir requisições diretas do navegador');
      console.error('💡 Sugestão: Verifique se a API está configurada para aceitar requisições do frontend');
    }

    // Check for timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ TIMEOUT - A requisição demorou mais de 30 segundos');
    }

    console.error('='.repeat(60));
    throw error;
  }
}

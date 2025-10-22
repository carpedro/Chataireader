import { useState, useEffect } from 'react';
import { ConversationData } from './types/conversation';
import { ConversationList } from './components/ConversationList';
import { ChatViewer } from './components/ChatViewer';
import { LoadingScreen } from './components/LoadingScreen';
import { UploadScreen } from './components/UploadScreen';
import { fetchConversations } from './utils/api';

type AppState = 'loading' | 'upload' | 'list' | 'chat' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [conversationData, setConversationData] = useState<ConversationData[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Try to fetch data from n8n API
    const fetchData = async () => {
      try {
        console.log('🔌 Tentando buscar conversas da API n8n...');
        console.log('⏱️ Aguarde, esta operação pode demorar até 30 segundos...');
        
        // Define o range de datas (20/10 a 21/10)
        const endDate = new Date('2025-10-21T23:59:59.921Z');
        const startDate = new Date('2025-10-20T00:00:01Z');

        console.log('📅 Período:', {
          inicio: startDate.toISOString(),
          fim: endDate.toISOString()
        });

        const data = await fetchConversations(
          'pucrs', // tenant
          startDate.toISOString(),
          endDate.toISOString()
        );

        console.log('✅ Dados recebidos:', data.length, 'registros');

        if (data.length > 0) {
          processConversationData(data);
        } else {
          console.warn('⚠️ Nenhum dado encontrado no período especificado');
          setErrorMessage('Nenhuma conversa encontrada no período de 20/10 a 21/10/2025');
          setAppState('upload');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
        
        // Enhanced error messages
        let userFriendlyMessage = errorMsg;
        
        if (errorMsg.includes('Failed to fetch')) {
          userFriendlyMessage = '🚫 Erro de CORS detectado: A API n8n não permite requisições diretas do navegador. Use o upload manual abaixo.';
          console.error('💡 SOLUÇÃO: Execute o comando cURL no terminal e faça upload do arquivo JSON');
        } else if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
          userFriendlyMessage = '⏰ Timeout: A requisição demorou mais de 30 segundos. Use o upload manual abaixo.';
        } else if (errorMsg.includes('ETIMEDOUT')) {
          userFriendlyMessage = '🌐 Erro de conexão: Não foi possível conectar à API. Use o upload manual abaixo.';
        }
        
        setErrorMessage(userFriendlyMessage);
        
        // Always show upload screen for connection errors
        if (errorMsg.includes('timeout') || 
            errorMsg.includes('ETIMEDOUT') || 
            errorMsg.includes('Failed to fetch') ||
            errorMsg.includes('aborted') ||
            errorMsg.includes('CORS')) {
          console.log('⚠️ Erro de conexão/CORS detectado, mostrando tela de upload...');
          setAppState('upload');
        } else {
          setAppState('error');
        }
      }
    };

    fetchData();
  }, []);

  const processConversationData = (data: ConversationData[]) => {
    console.log('='.repeat(60));
    console.log('📥 App - Recebendo dados processados');
    console.log(`📊 App - Total de mensagens: ${data.length}`);
    
    const uniqueSessions = new Set(data.map((msg) => msg.session_id));
    console.log(`📋 App - Total de sessões: ${uniqueSessions.size}`);
    console.log(`📋 App - Session IDs:`, Array.from(uniqueSessions));
    
    if (data.length > 0) {
      console.log(`📝 App - Primeira mensagem:`, {
        session_id: data[0].session_id,
        author: data[0].author,
        message: data[0].message.substring(0, 50) + '...'
      });
    }
    
    setConversationData(data);

    // Check URL for session_id
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id');
    
    if (sessionIdFromUrl) {
      console.log(`🔗 App - Session ID da URL: ${sessionIdFromUrl}`);
      setSelectedSessionId(sessionIdFromUrl);
      setAppState('chat');
    } else {
      // Check if there's only one session
      if (uniqueSessions.size === 1) {
        const firstSessionId = data[0].session_id;
        console.log(`✅ App - Apenas uma sessão encontrada, navegando para: ${firstSessionId}`);
        setSelectedSessionId(firstSessionId);
        setAppState('chat');
      } else {
        console.log(`📋 App - Múltiplas sessões encontradas, mostrando lista`);
        setAppState('list');
      }
    }
    console.log('='.repeat(60));
  };

  const handleFileUpload = (data: ConversationData[]) => {
    console.log('📁 Arquivo carregado com sucesso:', data.length, 'mensagens');
    processConversationData(data);
  };

  const handleSelectConversation = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setAppState('chat');
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('session_id', sessionId);
    window.history.pushState({}, '', url.toString());
  };

  const handleBackFromChat = () => {
    const uniqueSessions = new Set(conversationData.map(msg => msg.session_id));
    
    // Clear session_id from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    window.history.pushState({}, '', url.toString());
    
    if (uniqueSessions.size === 1) {
      setAppState('loading');
    } else {
      setAppState('list');
    }
  };

  return (
    <div className="size-full">
      {appState === 'loading' && (
        <LoadingScreen />
      )}

      {appState === 'upload' && (
        <UploadScreen 
          onFileProcessed={handleFileUpload}
          errorMessage={errorMessage}
        />
      )}

      {appState === 'error' && (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mb-2">Erro ao Carregar Dados</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#075E54] text-white px-6 py-2 rounded-lg hover:bg-[#064E46] transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
      
      {appState === 'list' && (
        <ConversationList 
          data={conversationData} 
          onSelectConversation={handleSelectConversation}
        />
      )}
      
      {appState === 'chat' && (
        <ChatViewer 
          data={conversationData} 
          onBack={handleBackFromChat}
          sessionId={selectedSessionId}
          onNavigateToSession={handleSelectConversation}
        />
      )}
    </div>
  );
}

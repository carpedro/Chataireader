import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, Copy, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import * as XLSX from 'xlsx';
import { ConversationData, ApiConversationSession } from '../types/conversation';

interface UploadScreenProps {
  onFileProcessed: (data: ConversationData[]) => void;
  errorMessage?: string;
}

export function UploadScreen({ onFileProcessed, errorMessage }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl --location 'https://n8n-sales.edtech.com.br/webhook/product' \\
--header 'x-authorization: e5362baf-c777-4d57-a609-6eaf1f9e87f6' \\
--header 'Content-Type: application/json' \\
--data '{
    "action": "searchAll",
    "filter": [
        { "tenant": "pucrs" },
        { "start_date": "2025-09-29T00:00:01"},
        { "end_date": "2025-10-21T23:59:59.921Z"}
    ]
}' > conversas.json`;

  const processExcel = useCallback((arrayBuffer: ArrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Arquivo Excel vazio');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) {
      throw new Error('Arquivo Excel vazio ou inválido');
    }

    // Get headers from first row
    const headers = jsonData[0].map((h: any) => String(h).trim());
    const requiredColumns = ['session_id', 'timestamp', 'author', 'message'];
    
    // Validate headers
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      throw new Error(`Colunas faltando: ${missingColumns.join(', ')}`);
    }

    const data: ConversationData[] = [];
    
    // Process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData || rowData.length === 0) continue;

      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = rowData[index] !== undefined ? String(rowData[index]).trim() : '';
      });

      // Normalize author to lowercase for consistent processing
      const normalizedAuthor = row.author.toLowerCase();
      
      if (normalizedAuthor !== 'cliente' && normalizedAuthor !== 'bot') {
        throw new Error(`Valor inválido para 'author' na linha ${i + 1}: ${row.author}. Valores aceitos: 'cliente' ou 'bot'`);
      }

      // Skip empty messages
      if (!row.message || row.message.trim() === '') {
        continue;
      }

      data.push({
        session_id: row.session_id,
        timestamp: row.timestamp,
        author: normalizedAuthor as 'cliente' | 'bot',
        message: row.message
      });
    }

    return data;
  }, []);

  const processJSON = useCallback((text: string) => {
    let jsonData = JSON.parse(text);
    
    // Handle different API response formats
    if (!Array.isArray(jsonData)) {
      if (jsonData.data && Array.isArray(jsonData.data)) {
        jsonData = jsonData.data;
      } else if (jsonData.success && jsonData.data) {
        jsonData = Array.isArray(jsonData.data) ? jsonData.data : [jsonData.data];
      } else {
        jsonData = [jsonData];
      }
    }

    if (!Array.isArray(jsonData)) {
      throw new Error('O arquivo JSON deve conter um array de conversas');
    }

    const messages: ConversationData[] = [];

    if (jsonData.length === 0) {
      console.warn('⚠️ Upload - Nenhum dado encontrado no arquivo');
      return messages;
    }

    // Log do primeiro registro para análise
    console.log('📝 Upload - Exemplo do primeiro registro (raw):');
    console.log(JSON.stringify(jsonData[0], null, 2).substring(0, 800) + '...');

    // Detectar formato dos dados automaticamente
    const firstItem = jsonData[0];
    const hasConversationsArray = firstItem.conversations && Array.isArray(firstItem.conversations);
    const hasMessageField = 'message' in firstItem;
    const hasFirstMessageText = 'first_message_text' in firstItem;
    const hasCountMessage = 'count_message' in firstItem;
    
    console.log('🔍 Upload - Detecção de formato:');
    console.log('  - Tem array "conversations"?', hasConversationsArray);
    console.log('  - Tem campo "message"?', hasMessageField);
    console.log('  - Tem campo "first_message_text"?', hasFirstMessageText);
    console.log('  - Tem campo "count_message"?', hasCountMessage);
    console.log('  - Campos disponíveis:', Object.keys(firstItem).join(', '));

    // Verificar se é formato de RESUMO (sem mensagens completas)
    if (hasFirstMessageText || (hasCountMessage && !hasConversationsArray && !hasMessageField)) {
      const errorMessage = 
        'Arquivo contém apenas resumos das sessões, não as mensagens completas.\n\n' +
        'Formato recebido: ' + Object.keys(firstItem).join(', ') + '\n\n' +
        'Formato esperado: objetos com array "conversations" contendo {author, message, timestamp}\n\n' +
        'Por favor, verifique se você está usando o endpoint correto da API ou baixou o arquivo correto.';
      
      console.error('❌ Upload - Formato de RESUMO detectado (sem mensagens)');
      console.error('📋 Campos:', Object.keys(firstItem));
      
      throw new Error(errorMessage);
    }

    if (hasConversationsArray) {
      // FORMATO 1: Sessões agrupadas com array conversations
      console.log('✅ Upload - Formato detectado: AGRUPADO (sessões com array conversations)');
      
      jsonData.forEach((session: any, sessionIndex: number) => {
        const sessionId = session.session_id || `session_${sessionIndex}`;
        const sessionAuthor = session.author || '';
        const countMessages = session.count_messages || session.conversations?.length || 0;
        
        if (!session.conversations || !Array.isArray(session.conversations)) {
          console.warn(`⚠️ Upload - Sessão ${sessionId}: sem array conversations válido`);
          return;
        }
        
        session.conversations.forEach((conv: any) => {
          const author = String(conv.author || '').toLowerCase().trim();
          const message = conv.message || '';
          const timestamp = conv.timestamp || new Date().toISOString();
          
          if (!message.trim()) {
            return; // Ignorar mensagens vazias
          }
          
          messages.push({
            session_id: sessionId,
            session_author: sessionAuthor,
            author: author === 'customer' ? 'customer' : 'bot',
            message: message.trim(),
            timestamp: timestamp,
            count_messages: countMessages
          });
        });
        
        if (sessionIndex === 0) {
          console.log(`📝 Upload - Primeira sessão: ${sessionId} com ${session.conversations.length} mensagens`);
        }
      });
      
    } else if (hasMessageField) {
      // FORMATO 2: Mensagens planas (cada registro é uma mensagem)
      console.log('✅ Upload - Formato detectado: PLANO (cada registro é uma mensagem)');
      
      jsonData.forEach((item: any, index: number) => {
        const sessionId = item.session_id || item.sessionId || `session_${index}`;
        const author = String(item.author || '').toLowerCase().trim();
        const message = item.message || item.text || item.content || '';
        const timestamp = item.timestamp || item.created_at || item.date || new Date().toISOString();
        
        if (!message.trim()) {
          return; // Ignorar mensagens vazias
        }
        
        messages.push({
          session_id: sessionId,
          session_author: item.from || item.sender || '',
          author: author === 'customer' || author === 'user' ? 'customer' : 'bot',
          message: message.trim(),
          timestamp: timestamp,
          count_messages: 0
        });
      });
      
    } else {
      console.error('❌ Upload - Formato não reconhecido! Estrutura:', Object.keys(firstItem));
      throw new Error('Formato de arquivo não reconhecido');
    }

    console.log(`✅ Upload - Total de ${messages.length} mensagens processadas`);
    return messages;
  }, []);

  const handleFile = useCallback(async (file: File) => {
    const isExcel = file.name.endsWith('.xlsx');
    const isJSON = file.name.endsWith('.json');
    
    if (!isExcel && !isJSON) {
      setError('Por favor, selecione um arquivo .xlsx ou .json válido');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setFileName(file.name);

    try {
      let data: ConversationData[];
      
      if (isExcel) {
        const arrayBuffer = await file.arrayBuffer();
        data = processExcel(arrayBuffer);
      } else {
        const text = await file.text();
        data = processJSON(text);
      }
      
      if (data.length === 0) {
        throw new Error('Nenhuma conversa encontrada no arquivo');
      }

      console.log('='.repeat(60));
      console.log(`✅ UploadScreen - Processadas ${data.length} mensagens do arquivo`);
      
      // Estatísticas
      const sessions = new Set(data.map(d => d.session_id));
      const authors = new Set(data.map(d => d.author));
      console.log(`📊 UploadScreen - Estatísticas:`)
      console.log(`   - Total de mensagens: ${data.length}`);
      console.log(`   - Total de sessões: ${sessions.size}`);
      console.log(`   - Autores únicos: ${Array.from(authors).join(', ')}`);
      console.log(`   - Média msg/sessão: ${(data.length / sessions.size).toFixed(1)}`);
      console.log('='.repeat(60));
      
      setSuccess(true);
      setTimeout(() => {
        onFileProcessed(data);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      setSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  }, [processExcel, processJSON, onFileProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Erro ao copiar comando');
    }
  };

  const handleLoadExample = async () => {
    setIsProcessing(true);
    setError('');
    setSuccess(false);
    setFileName('exemplo-formato.json');

    try {
      console.log('🧪 Carregando arquivo de exemplo...');
      const response = await fetch('/exemplo-formato.json');
      
      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo de exemplo');
      }
      
      const text = await response.text();
      const data = processJSON(text);
      
      if (data.length === 0) {
        throw new Error('Nenhuma conversa encontrada no arquivo de exemplo');
      }

      console.log(`✅ Exemplo carregado com sucesso: ${data.length} mensagens`);
      setSuccess(true);
      setTimeout(() => {
        onFileProcessed(data);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exemplo');
      setSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-3 md:p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl md:rounded-2xl shadow-xl p-5 md:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full mb-3 md:mb-4">
            <FileText className="w-7 h-7 md:w-8 md:h-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl md:text-2xl">Importar Conversas</h1>
          <p className="text-muted-foreground text-[14px] md:text-base">
            Faça upload do JSON retornado pela API n8n
          </p>
        </div>

        {errorMessage && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Não foi possível conectar à API automaticamente. Por favor, faça upload manual do arquivo JSON.
            </AlertDescription>
          </Alert>
        )}

        {/* Important Note */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-[12px] md:text-[13px] mb-1">
            <strong>⚠️ Importante:</strong> O arquivo deve conter as <strong>mensagens completas</strong>, não apenas resumos de sessões.
          </p>
          <p className="text-blue-700 text-[11px] md:text-[12px]">
            Formato esperado: sessões com array <code className="bg-blue-100 px-1 rounded">conversations</code> contendo objetos com author/message/timestamp
          </p>
        </div>

        {/* Load Example Button */}
        <div className="mb-6">
          <Button
            onClick={handleLoadExample}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            🧪 Carregar Arquivo de Exemplo (Teste)
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Carrega o arquivo exemplo-formato.json para testar a aplicação
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">📋 Como obter os dados:</h3>
            
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-semibold">1.</span> Copie o comando cURL abaixo</p>
              <p><span className="font-semibold">2.</span> Execute no terminal (Linux/Mac) ou PowerShell (Windows)</p>
              <p><span className="font-semibold">3.</span> Um arquivo <code className="bg-gray-200 px-1 rounded">conversas.json</code> será criado</p>
              <p><span className="font-semibold">4.</span> Faça upload do arquivo usando a área abaixo</p>
            </div>
          </div>

          {/* CURL Command */}
          <div className="relative">
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs md:text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">{curlCommand}</pre>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCurl}
              className="absolute top-2 right-2 bg-white hover:bg-gray-100"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200
            ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-300 hover:border-green-400'}
            ${success ? 'border-green-500 bg-green-50' : ''}
          `}
        >
          <input
            type="file"
            accept=".xlsx,.json"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />

          {!success && (
            <>
              <Upload className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} />
              <p className="mb-2 text-[14px] md:text-base">
                {isDragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo aqui ou clique para selecionar'}
              </p>
              <p className="text-muted-foreground text-[13px] md:text-[14px]">
                Arquivos .json ou .xlsx são aceitos
              </p>
            </>
          )}

          {success && (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-600 mb-3 md:mb-4" />
              <p className="text-green-700 text-[14px] md:text-base">Arquivo processado com sucesso!</p>
              <p className="text-muted-foreground mt-1 text-[13px] md:text-[14px] truncate max-w-full px-2">{fileName}</p>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="mt-4 md:mt-6 text-center">
            <div className="inline-block w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-muted-foreground text-[13px] md:text-[14px]">Processando arquivo...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-[13px] md:text-[14px]">{error}</p>
          </div>
        )}

        {fileName && !error && !success && (
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-muted-foreground text-[13px] md:text-[14px] truncate px-2">Arquivo: {fileName}</p>
          </div>
        )}
      </div>
    </div>
  );
}

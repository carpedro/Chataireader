import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9d8d6ba6/health", (c) => {
  return c.json({ status: "ok" });
});

// Test n8n API connectivity
app.get("/make-server-9d8d6ba6/test-n8n", async (c) => {
  try {
    console.log('🧪 Testando conectividade com n8n API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const startTime = Date.now();
    
    const response = await fetch('https://n8n-sales.edtech.com.br/webhook/product', {
      method: 'POST',
      headers: {
        'x-authorization': 'e5362baf-c777-4d57-a609-6eaf1f9e87f6',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'searchAll',
        filter: [
          { tenant: 'pucrs' },
          { start_date: '2025-10-21T00:00:00Z' },
          { end_date: '2025-10-21T23:59:59Z' }
        ]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    const isJson = response.headers.get('content-type')?.includes('application/json');
    let data = null;
    
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('✅ Teste de conectividade concluído');
    
    return c.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      responseTime: responseTime,
      contentType: response.headers.get('content-type'),
      isJson: isJson,
      sampleData: typeof data === 'string' ? data.substring(0, 200) : data
    });
    
  } catch (err) {
    console.error('❌ Erro no teste de conectividade:', err);
    
    return c.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      errorType: err instanceof Error ? err.name : 'UnknownError',
      isTimeout: err instanceof Error && (err.name === 'AbortError' || err.message.includes('abort'))
    }, 500);
  }
});

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Fetch conversations from n8n API (proxy to avoid CORS)
app.post("/make-server-9d8d6ba6/fetch-n8n", async (c) => {
  const startTime = Date.now();
  
  try {
    const body = await c.req.json();
    const { tenant = 'pucrs', start_date, end_date } = body;

    console.log('='.repeat(60));
    console.log('🔌 Iniciando busca de conversas na API n8n');
    console.log('📅 Filtros:', JSON.stringify({ tenant, start_date, end_date }, null, 2));
    console.log('🌐 URL:', 'https://n8n-sales.edtech.com.br/webhook/product');
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

    // Attempt to fetch with a 30-second timeout
    console.log('⏳ Enviando requisição (timeout: 30s)...');
    
    const n8nResponse = await fetchWithTimeout(
      'https://n8n-sales.edtech.com.br/webhook/product',
      {
        method: 'POST',
        headers: {
          'x-authorization': 'e5362baf-c777-4d57-a609-6eaf1f9e87f6',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(requestPayload)
      },
      30000
    );

    const responseTime = Date.now() - startTime;
    console.log(`✅ Resposta recebida em ${responseTime}ms`);
    console.log(`📊 Status HTTP: ${n8nResponse.status} ${n8nResponse.statusText}`);

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text().catch(() => 'Unknown error');
      console.error('❌ Erro na API n8n:', n8nResponse.status, errorText);
      return c.json({ 
        error: `n8n API returned ${n8nResponse.status}`,
        details: errorText,
        status: n8nResponse.status
      }, n8nResponse.status);
    }

    const contentType = n8nResponse.headers.get('content-type') || '';
    console.log('📋 Content-Type:', contentType);

    let result;
    try {
      result = await n8nResponse.json();
      console.log('✅ JSON parseado com sucesso');
      console.log('📦 Tipo de resposta:', Array.isArray(result) ? 'Array' : typeof result);
      console.log('📦 Estrutura da resposta:', Object.keys(result).join(', '));
    } catch (jsonError) {
      const text = await n8nResponse.text();
      console.error('❌ Erro ao parsear JSON:', jsonError);
      console.error('📄 Resposta raw:', text.substring(0, 500));
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
      console.log('📝 Exemplo do primeiro registro:', JSON.stringify(rawData[0], null, 2));
    }

    // Map to expected format
    const conversations = rawData.map((item: any, index: number) => {
      const mapped = {
        session_id: item.session_id || item.sessionId || item.session || `unknown_${index}`,
        execution_id: item.execution_id || item.executionId || item.execution || `unknown_${index}`,
        timestamp: item.timestamp || item.created_at || item.date || new Date().toISOString(),
        author: item.author || item.sender || item.from || 'unknown',
        message: item.message || item.text || item.content || ''
      };
      
      if (index === 0) {
        console.log('🔄 Exemplo de mapeamento do primeiro registro:');
        console.log('  Original:', JSON.stringify(item, null, 2));
        console.log('  Mapeado:', JSON.stringify(mapped, null, 2));
      }
      
      return mapped;
    });

    console.log(`✅ Mapeadas ${conversations.length} conversas com sucesso`);
    console.log(`⏱️ Tempo total de processamento: ${Date.now() - startTime}ms`);
    console.log('='.repeat(60));
    
    return c.json({ 
      success: true, 
      data: conversations,
      count: conversations.length,
      processingTime: Date.now() - startTime
    });

  } catch (err) {
    const errorTime = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('❌ ERRO ao buscar dados da n8n API');
    console.error('⏱️ Tempo até erro:', errorTime, 'ms');
    console.error('🔍 Tipo de erro:', err instanceof Error ? err.name : typeof err);
    console.error('💬 Mensagem:', err instanceof Error ? err.message : String(err));
    
    if (err instanceof Error && err.stack) {
      console.error('📚 Stack trace:', err.stack);
    }
    console.error('='.repeat(60));
    
    // Determine if it's a timeout error
    const isTimeout = err instanceof Error && (
      err.message.includes('timeout') || 
      err.message.includes('aborted') ||
      err.name === 'AbortError'
    );
    
    return c.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      errorType: err instanceof Error ? err.name : 'UnknownError',
      isTimeout: isTimeout,
      details: err instanceof Error ? err.stack : String(err),
      processingTime: errorTime
    }, 500);
  }
});

Deno.serve(app.fetch);
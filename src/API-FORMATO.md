# Formatos de Dados da API n8n

## Problema Identificado

A API n8n pode retornar diferentes formatos dependendo do parâmetro `action` usado:

### ❌ Formato RESUMO (Não suportado)

Quando você usa `action: "searchAll"`, a API retorna apenas um **resumo** das sessões:

```json
[
  {
    "session_id": "CH13bcf8c9bacb46f5905fb39ceba2fe19",
    "author": "whatsapp:+5511998181498",
    "count_message": 1,
    "last_message_date": "2025-10-21T23:39:13.178Z",
    "first_message_text": "Olá! Estava acessando..."
  }
]
```

**Este formato NÃO contém as mensagens completas** - apenas metadados das sessões.

### ✅ Formato COMPLETO (Suportado)

O formato correto deve conter o array `conversations` com todas as mensagens:

```json
[
  {
    "session_id": "CH796178b437c64d3493d4cbb43c30f308",
    "author": "whatsapp:+5599981593559",
    "count_messages": 15,
    "conversations": [
      {
        "author": "customer",
        "message": "Olá! Estava acessando a página...",
        "timestamp": "2025-10-20T22:00:54.433Z"
      },
      {
        "author": "bot",
        "message": "Olá! Fico feliz em ajudar você...",
        "timestamp": "2025-10-20T22:00:54.433Z"
      }
    ],
    "elapsed_time": 1960.659
  }
]
```

## Soluções

### Opção 1: Usar o endpoint correto da API

Se a API suportar, use um parâmetro `action` diferente que retorne as mensagens completas:

```bash
curl --location 'https://n8n-sales.edtech.com.br/webhook/product' \
--header 'x-authorization: e5362baf-c777-4d57-a609-6eaf1f9e87f6' \
--header 'Content-Type: application/json' \
--data '{
    "action": "searchConversations",  // OU outro action que retorne mensagens completas
    "filter": [
        { "tenant": "pucrs" },
        { "start_date": "2025-10-10T00:00:01"},
        { "end_date": "2025-10-21T23:59:59.921Z"}
    ]
}' > conversas-completas.json
```

### Opção 2: Usar o arquivo de exemplo

A aplicação já vem com um arquivo de exemplo no formato correto:

1. Clique no botão "🧪 Carregar Arquivo de Exemplo (Teste)"
2. O sistema carregará `/exemplo-formato.json` que está no formato correto

### Opção 3: Converter manualmente

Se você só tem acesso ao formato de resumo, precisará:

1. Acessar cada session_id individualmente via API
2. Obter as mensagens completas de cada sessão
3. Montar o JSON no formato correto manualmente

## Validação

Ao fazer upload, a aplicação detecta automaticamente o formato e mostra mensagens claras se:

- ✅ **Formato AGRUPADO**: Sessões com array `conversations` - processado com sucesso
- ✅ **Formato PLANO**: Cada registro é uma mensagem - processado com sucesso
- ❌ **Formato RESUMO**: Apenas metadados - erro com instruções

## Estrutura Esperada

Campos obrigatórios em cada mensagem dentro do array `conversations`:

- `author`: "customer" ou "bot"
- `message`: texto da mensagem
- `timestamp`: data/hora no formato ISO

Campos opcionais no objeto da sessão:

- `session_id`: identificador único da sessão
- `author`: número do WhatsApp (quem iniciou a conversa)
- `count_messages`: total de mensagens
- `elapsed_time`: tempo decorrido da conversa

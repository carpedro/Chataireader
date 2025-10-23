# ChatAI - Reader

## 📋 Visão Geral

O **ChatAI - Reader** é uma aplicação web desenvolvida em React/TypeScript para visualização e análise de conversas de atendimento virtual. O projeto permite carregar, filtrar e navegar por conversas de chat, com interface inspirada no WhatsApp para melhor experiência do usuário.

## 🎯 Funcionalidades Principais

### 1. **Carregamento de Dados**
- **API n8n**: Integração direta com API do n8n para buscar conversas automaticamente
- **Upload Manual**: Opção de upload de arquivos JSON quando a API não está disponível
- **Fallback Inteligente**: Sistema que detecta erros de CORS/timeout e oferece alternativas

### 2. **Visualização de Conversas**
- **Lista de Conversas**: Interface com cards mostrando resumo de cada conversa
- **Visualizador de Chat**: Interface similar ao WhatsApp para leitura das mensagens
- **Navegação entre Sessões**: Navegação fácil entre diferentes conversas

### 3. **Sistema de Busca e Filtros**
- **Busca em Tempo Real**: Pesquisa por conteúdo das mensagens
- **Filtros Avançados**: 
  - Filtro por período de datas
  - Filtro por quantidade de mensagens
  - Filtro por quantidade de execuções
- **Destaque de Resultados**: Mensagens encontradas são destacadas

### 4. **Interface Responsiva**
- **Design Mobile-First**: Otimizado para dispositivos móveis
- **Tema WhatsApp**: Cores e layout inspirados no WhatsApp
- **Componentes Reutilizáveis**: Biblioteca de componentes UI baseada em Radix UI

## 🏗️ Arquitetura do Projeto

### **Estrutura de Pastas**
```
src/
├── components/           # Componentes React
│   ├── ui/             # Componentes de interface (Radix UI)
│   ├── ChatViewer.tsx  # Visualizador de conversas
│   ├── ConversationList.tsx # Lista de conversas
│   ├── MessageBubble.tsx # Bolha de mensagem
│   └── UploadScreen.tsx # Tela de upload
├── types/              # Definições de tipos TypeScript
├── utils/              # Utilitários e API
├── styles/             # Estilos globais
└── supabase/           # Configurações do Supabase
```

### **Estados da Aplicação**
1. **`loading`**: Tela de carregamento inicial
2. **`upload`**: Tela de upload manual
3. **`list`**: Lista de conversas
4. **`chat`**: Visualizador de conversa individual
5. **`error`**: Tela de erro

### **Fluxo de Dados**
```
API n8n → fetchConversations() → processConversationData() → 
ConversationList/ChatViewer → MessageBubble
```

## 🔧 Tecnologias Utilizadas

### **Frontend**
- **React 18** com TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilização
- **Radix UI** para componentes acessíveis
- **Lucide React** para ícones

### **Backend/API**
- **n8n** para automação e API
- **Supabase** para armazenamento (opcional)
- **Hono** para serverless functions

### **Bibliotecas Principais**
- `@radix-ui/*` - Componentes de interface
- `react-hook-form` - Gerenciamento de formulários
- `react-markdown` - Renderização de markdown
- `xlsx` - Processamento de planilhas
- `recharts` - Gráficos e visualizações

## 📊 Estrutura de Dados

### **ConversationData**
```typescript
interface ConversationData {
  session_id: string;      // ID único da sessão
  execution_id: string;    // ID da execução
  timestamp: string;        // Data/hora da mensagem
  author: string;          // 'cliente' ou 'bot'
  message: string;         // Conteúdo da mensagem
}
```

### **API n8n**
- **Endpoint**: `https://n8n-sales.edtech.com.br/webhook/product`
- **Método**: POST
- **Headers**: `x-authorization` com token
- **Payload**: Filtros por tenant, data inicial e final

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn

### **Instalação**
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### **Configuração**
- A aplicação roda na porta 3000 por padrão
- Configurações do Vite em `vite.config.ts`
- Aliases de import configurados para facilitar imports

## 🎨 Design System

### **Cores Principais**
- **Verde WhatsApp**: `#075E54` (header)
- **Verde Claro**: `#128C7E` (navegação)
- **Fundo**: `#E5DDD5` (background do chat)
- **Branco**: `#FFFFFF` (cards e mensagens)

### **Componentes UI**
- Baseados em Radix UI para acessibilidade
- Customizados com Tailwind CSS
- Responsivos e mobile-first

## 🔍 Funcionalidades Detalhadas

### **Sistema de Busca**
- Busca em tempo real nas mensagens
- Navegação entre resultados encontrados
- Destaque visual dos termos encontrados
- Contador de resultados

### **Filtros Avançados**
- **Período**: Seleção de data inicial e final
- **Mensagens**: Range slider para quantidade de mensagens
- Execuções**: Range para número de execuções
- **Limpeza**: Botão para limpar todos os filtros

### **Navegação**
- **URLs com Estado**: session_id na URL para compartilhamento
- **Histórico**: Navegação entre conversas
- **Breadcrumbs**: Indicação da conversa atual

## 🛠️ Desenvolvimento

### **Estrutura de Componentes**
- **App.tsx**: Componente principal com gerenciamento de estado
- **ChatViewer**: Visualizador de conversas individuais
- **ConversationList**: Lista e filtros de conversas
- **MessageBubble**: Componente de mensagem individual
- **UploadScreen**: Interface de upload manual

### **Gerenciamento de Estado**
- Estado local com React hooks
- Context para dados globais
- URL como fonte de verdade para navegação

### **Tratamento de Erros**
- Detecção de erros de CORS
- Timeout de 30 segundos para API
- Mensagens de erro amigáveis
- Fallback para upload manual

## 📱 Responsividade

- **Mobile First**: Design otimizado para mobile
- **Breakpoints**: sm, md, lg, xl
- **Componentes Adaptativos**: Tamanhos e layouts responsivos
- **Touch Friendly**: Botões e interações otimizadas para touch

## 🔒 Segurança

- **CORS Handling**: Tratamento adequado de erros de CORS
- **Timeout Protection**: Prevenção de requisições infinitas
- **Input Validation**: Validação de dados de entrada
- **Error Boundaries**: Tratamento de erros de renderização

## 📈 Performance

- **Lazy Loading**: Carregamento sob demanda
- **Memoização**: useMemo para cálculos pesados
- **Virtualização**: Para listas grandes (futuro)
- **Debounce**: Para busca em tempo real

## 🧪 Testes

- **Estrutura Preparada**: Componentes testáveis
- **Mocks**: Para API e dados externos
- **Cobertura**: Foco em componentes críticos

## 🚀 Deploy

- **Build Otimizado**: Vite com otimizações
- **Static Assets**: Arquivos estáticos otimizados
- **CDN Ready**: Preparado para CDN
- **Environment Variables**: Configuração por ambiente

## 📝 Próximos Passos

1. **Testes Automatizados**: Implementar testes unitários e E2E
2. **PWA**: Transformar em Progressive Web App
3. **Offline Support**: Cache para funcionamento offline
4. **Analytics**: Métricas de uso e performance
5. **Export**: Funcionalidade de exportar conversas
6. **Real-time**: Atualizações em tempo real
7. **Multi-tenant**: Suporte a múltiplos tenants

## 🤝 Contribuição

1. Fork do projeto
2. Criação de branch para feature
3. Commit das mudanças
4. Push para o branch
5. Abertura de Pull Request

## 📄 Licença

Este projeto está sob licença privada. Consulte o arquivo de licença para mais detalhes.

---

**Desenvolvido com ❤️ para análise de conversas de atendimento virtual**

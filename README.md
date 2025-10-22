
# ChatAI - Reader

Uma aplicação web moderna para visualização e análise de conversas de atendimento virtual, desenvolvida em React/TypeScript com interface inspirada no WhatsApp.

## 🚀 Funcionalidades

- **📱 Interface WhatsApp-like**: Design familiar e intuitivo
- **🔍 Busca Avançada**: Pesquisa em tempo real com filtros
- **📊 Análise de Conversas**: Visualização detalhada de atendimentos
- **🔄 Integração n8n**: Carregamento automático via API
- **📁 Upload Manual**: Fallback para arquivos JSON
- **📱 Responsivo**: Otimizado para mobile e desktop

## 🛠️ Tecnologias

- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS** (estilização)
- **Radix UI** (componentes)
- **n8n** (API backend)
- **Supabase** (opcional)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

A aplicação estará disponível em `http://localhost:3002`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/            # Componentes de interface
│   ├── ChatViewer.tsx # Visualizador de conversas
│   ├── ConversationList.tsx # Lista de conversas
│   └── UploadScreen.tsx # Tela de upload
├── types/             # Definições TypeScript
├── utils/             # Utilitários e API
└── styles/            # Estilos globais
```

## 🎯 Estados da Aplicação

1. **Loading**: Carregamento inicial
2. **Upload**: Upload manual de arquivos
3. **List**: Lista de conversas com filtros
4. **Chat**: Visualização individual de conversa
5. **Error**: Tratamento de erros

## 🔧 Configuração

### API n8n
- **Endpoint**: `https://n8n-sales.edtech.com.br/webhook/product`
- **Método**: POST
- **Headers**: `x-authorization` com token
- **Timeout**: 30 segundos

### Variáveis de Ambiente
```env
VITE_API_URL=https://n8n-sales.edtech.com.br/webhook/product
VITE_API_TOKEN=e5362baf-c777-4d57-a609-6eaf1f9e87f6
```

## 📊 Estrutura de Dados

```typescript
interface ConversationData {
  session_id: string;      // ID da sessão
  execution_id: string;    // ID da execução
  timestamp: string;        // Data/hora
  author: string;          // 'cliente' ou 'bot'
  message: string;         // Conteúdo da mensagem
}
```

## 🎨 Design System

### Cores
- **Verde WhatsApp**: `#075E54`
- **Verde Claro**: `#128C7E`
- **Fundo Chat**: `#E5DDD5`
- **Branco**: `#FFFFFF`

### Componentes
- Baseados em Radix UI
- Customizados com Tailwind CSS
- Totalmente responsivos

## 🔍 Funcionalidades Detalhadas

### Sistema de Busca
- Busca em tempo real
- Navegação entre resultados
- Destaque visual
- Contador de resultados

### Filtros Avançados
- **Período**: Seleção de datas
- **Mensagens**: Range de quantidade
- **Execuções**: Filtro por execuções
- **Limpeza**: Reset de filtros

### Navegação
- URLs com estado
- Histórico de navegação
- Compartilhamento de links

## 🚀 Deploy

```bash
# Build para produção
npm run build

# Os arquivos estarão em ./build/
```

## 📱 Responsividade

- **Mobile First**: Otimizado para mobile
- **Breakpoints**: sm, md, lg, xl
- **Touch Friendly**: Interações otimizadas

## 🧪 Desenvolvimento

### Scripts Disponíveis
```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview do build
```

### Estrutura de Componentes
- **App.tsx**: Componente principal
- **ChatViewer**: Visualizador de conversas
- **ConversationList**: Lista com filtros
- **MessageBubble**: Mensagem individual
- **UploadScreen**: Upload manual

## 🔒 Segurança

- Tratamento de erros CORS
- Timeout de requisições
- Validação de entrada
- Error boundaries

## 📈 Performance

- Lazy loading
- Memoização de cálculos
- Otimização de re-renders
- Build otimizado

## 🤝 Contribuição

1. Fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença privada.

## 📞 Suporte

Para dúvidas ou suporte, consulte a documentação completa em `PROJETO.md`

---

**Desenvolvido com ❤️ para análise de conversas de atendimento virtual**

> **Nota**: Este projeto foi baseado no design do Figma disponível em: https://www.figma.com/design/6nKwdfRYkPAV6ISpX5jWGQ/ChatAI---Reader
  
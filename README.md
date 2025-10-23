# 💬 ChatAI - Reader

Visualizador de conversas do ChatAI com suporte ao novo formato de API n8n.

## 🌟 Funcionalidades

- ✅ **Visualização de Conversas**: Interface estilo WhatsApp para ler conversas
- ✅ **Upload de Arquivos**: Suporte para JSON e Excel (.xlsx)
- ✅ **Busca Avançada**: Pesquise mensagens e navegue entre resultados
- ✅ **Filtros**: Filtre por data, quantidade de mensagens
- ✅ **Navegação**: Navegue entre diferentes sessões de conversa
- ✅ **Responsivo**: Interface adaptada para desktop e mobile
- ✅ **Markdown**: Suporte completo para formatação de mensagens

## 🚀 Início Rápido

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

### Produção

```bash
# Criar build de produção
npm run build

# A pasta 'build' conterá os arquivos para deploy
```

## 📋 Formato de Dados

A aplicação aceita JSON no seguinte formato:

```json
[
  {
    "session_id": "CH796178b437c64d3493d4cbb43c30f308",
    "author": "whatsapp:+5599981593559",
    "count_messages": 15,
    "conversations": [
      {
        "author": "customer",
        "message": "Olá! Gostaria de informações...",
        "timestamp": "2025-10-20T22:00:54.433Z"
      },
      {
        "author": "bot",
        "message": "Olá! Fico feliz em ajudar...",
        "timestamp": "2025-10-20T22:00:54.433Z"
      }
    ],
    "elapsed_time": 1960.659
  }
]
```

### Campos Obrigatórios

- `session_id`: Identificador único da sessão
- `author` (raiz): Número de telefone do cliente (formato: `whatsapp:+55...`)
- `conversations`: Array de mensagens
  - `author`: `"customer"` ou `"bot"`
  - `message`: Texto da mensagem (suporta Markdown)
  - `timestamp`: Data/hora no formato ISO

## 🛠️ Deploy

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

ou clique no botão abaixo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/chataireader)

### Opção 2: Netlify

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

### Opção 3: Scripts Automáticos

**Windows:**
```bash
.\deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📁 Estrutura do Projeto

```
Chataireader/
├── src/
│   ├── components/         # Componentes React
│   │   ├── ChatViewer.tsx  # Visualizador de chat
│   │   ├── ConversationList.tsx  # Lista de conversas
│   │   ├── MessageBubble.tsx     # Bolha de mensagem
│   │   ├── UploadScreen.tsx      # Tela de upload
│   │   └── ui/                   # Componentes UI
│   ├── types/              # Definições TypeScript
│   ├── utils/              # Utilitários e API
│   ├── App.tsx             # Componente principal
│   └── main.tsx            # Entry point
├── public/                 # Arquivos estáticos
├── index.html             # HTML base
├── vite.config.ts         # Configuração Vite
├── vercel.json            # Configuração Vercel
├── netlify.toml           # Configuração Netlify
└── package.json           # Dependências
```

## 🔧 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones
- **React Markdown** - Renderização de Markdown
- **XLSX** - Leitura de Excel

## 🎨 Customização

### Cores do Tema

As cores principais podem ser ajustadas em `src/index.css`:

```css
:root {
  --color-primary: #075E54;  /* Verde WhatsApp */
  --color-secondary: #128C7E;
  --color-message-bot: #DCF8C6;
  --color-message-user: #FFFFFF;
}
```

## 📝 Changelog

### v1.1.0 - Atual
- ✅ Removido campo `execution_id` (simplificação)
- ✅ Suporte completo ao novo formato da API n8n
- ✅ Mapeamento automático de `customer` → `cliente`
- ✅ Interface de filtros melhorada
- ✅ Performance otimizada

### v1.0.0
- ✅ Versão inicial
- ✅ Upload de JSON e Excel
- ✅ Visualização de conversas
- ✅ Busca e filtros

## 🐛 Solução de Problemas

### Erro de CORS
Se você receber erro de CORS ao conectar à API n8n:
1. Use o upload manual de arquivos JSON
2. Execute o comando cURL fornecido na tela de upload
3. Faça upload do arquivo `conversas.json` gerado

### Build Falha
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Mensagens não aparecem
1. Verifique o formato do JSON
2. Confira se os campos `author` estão como `"customer"` ou `"bot"`
3. Verifique o console do navegador (F12)

## 📄 Licença

Este projeto é baseado no design original disponível em [Figma](https://www.figma.com/design/6nKwdfRYkPAV6ISpX5jWGQ/ChatAI---Reader).

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para questões e suporte:
- Abra uma [Issue](https://github.com/seu-usuario/chataireader/issues)
- Consulte o [Guia de Deploy](DEPLOY.md)

---

Desenvolvido com ❤️ para facilitar a visualização de conversas do ChatAI

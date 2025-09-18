# 📚 Englytics - Dicionário Avançado de Inglês

**Englytics** é um dicionário de inglês moderno e completo, desenvolvido com as mais recentes tecnologias web. Oferece uma experiência rica e intuitiva para aprendizado de inglês, combinando definições detalhadas, tradução automática, rede semântica de palavras e recursos de pronúncia.

## ✨ Funcionalidades Principais

### 🔍 **Busca Inteligente**
- Definições detalhadas com exemplos práticos
- Múltiplas definições por palavra com diferentes contextos
- Informações etimológicas e origem das palavras
- Classificação gramatical (substantivo, verbo, adjetivo, etc.)

### 🌐 **Tradução Automática**
- Tradução instantânea Inglês ↔ Português
- Cache inteligente de traduções (válido por 24 horas)
- Tradução de definições e exemplos
- Otimização de performance com armazenamento local

### 🔊 **Recursos de Áudio**
- Pronúncia em áudio nativo via API
- Text-to-speech integrado com Web Speech API
- Transcrição fonética internacional (IPA)
- Controles de reprodução intuitivos

### 🕸️ **Rede Semântica**
- Palavras relacionadas por similaridade semântica
- Sinônimos e antônimos organizados
- Visualização de força de relacionamento
- Navegação fluida entre palavras conectadas

### 💾 **Persistência de Dados**
- Sistema de favoritos com armazenamento local
- Histórico de buscas (últimas 15 palavras)
- Preferências de usuário persistentes
- Cache otimizado para melhor performance

### 🎨 **Interface Moderna**
- Design responsivo para todos os dispositivos
- Modo claro/escuro com alternância suave
- Ícones modernos com Lucide React
- Interface bilíngue (Português/Inglês)
- Animações e transições fluidas

### ♿ **Acessibilidade**
- Labels ARIA apropriados
- Navegação por teclado completa
- Suporte a leitores de tela
- Contraste adequado em ambos os temas
- Indicadores visuais de estado

### 📱 **Progressive Web App (PWA)**
- Instalável como aplicativo nativo no desktop e mobile
- Funcionamento offline básico com Service Worker
- Cache inteligente de recursos estáticos
- Experiência de app nativo com manifest personalizado
- Ícone e nome personalizados na tela inicial

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 19.1.0** - Biblioteca principal
- **TypeScript 4.9.5** - Tipagem estática
- **Tailwind CSS 3.3.0** - Framework de estilos
- **Lucide React** - Ícones modernos e consistentes
- **Create React App** - Configuração e build

### **APIs Integradas**
- **[DictionaryAPI.dev](https://dictionaryapi.dev/)** - Definições e dados linguísticos
- **[Datamuse API](https://www.datamuse.com/api/)** - Rede semântica e palavras relacionadas
- **[MyMemory Translation](https://mymemory.translated.net/)** - Tradução automática
- **Web Speech API** - Text-to-speech nativo do navegador

### **PWA e Offline**
- **Service Worker** - Cache e funcionamento offline
- **Web App Manifest** - Configuração para instalação como PWA
- **Cache API** - Armazenamento local de recursos

### **Ferramentas de Desenvolvimento**
- **PostCSS** - Processamento de CSS
- **Jest + Testing Library** - Testes unitários
- **ESLint** - Linting de código
- **npm** - Gerenciamento de dependências

## 🚀 Como Executar Localmente

### **Pré-requisitos**
- Node.js 16+ instalado
- npm ou yarn como gerenciador de pacotes

### **Instalação**

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/englytics-app.git
   cd englytics-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

4. **Acesse a aplicação:**
   ```
   http://localhost:3000
   ```

## 📱 Instalação como PWA

O Englytics pode ser instalado como um aplicativo nativo em seu dispositivo:

### **Desktop (Chrome, Edge, Safari)**
1. Acesse a aplicação no navegador
2. Procure pelo ícone de "Instalar" na barra de endereços
3. Clique em "Instalar Englytics" ou similar
4. O app será adicionado ao seu sistema como aplicativo nativo

### **Mobile (Android/iOS)**
1. Abra a aplicação no navegador móvel
2. **Android**: Toque no menu (⋮) → "Adicionar à tela inicial"
3. **iOS**: Toque no botão compartilhar (□↗) → "Adicionar à Tela de Início"
4. O ícone do Englytics aparecerá na sua tela inicial

### **Benefícios do PWA**
- ⚡ Carregamento mais rápido
- 📱 Experiência de app nativo
- 🔄 Funcionamento offline básico
- 💾 Menor uso de dados com cache
- 🚀 Acesso direto da tela inicial

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|----------|
| `npm start` | Inicia o servidor de desenvolvimento |
| `npm build` | Cria a versão otimizada para produção |
| `npm test` | Executa os testes unitários |
| `npm run eject` | Ejeta as configurações do CRA (irreversível) |

## 📁 Estrutura do Projeto

```
englytics-app/
├── public/                 # Arquivos públicos
│   ├── index.html         # Template HTML principal
│   ├── gitbook.svg        # Logo da aplicação
│   ├── manifest.json      # Configurações PWA
│   └── sw.js             # Service Worker para PWA
├── src/                   # Código fonte
│   ├── App.tsx           # Componente principal
│   ├── index.tsx         # Ponto de entrada
│   ├── index.css         # Estilos globais
│   └── setupTests.ts     # Configuração de testes
├── package.json          # Dependências e scripts
├── tailwind.config.js    # Configuração do Tailwind
├── tsconfig.json         # Configuração do TypeScript
└── README.md            # Documentação
```

## 💡 Funcionalidades Técnicas

### **Gerenciamento de Estado**
- Hooks nativos do React (useState, useEffect, useCallback)
- Estado local otimizado com memoização
- Persistência automática no localStorage

### **Performance**
- Cache inteligente de traduções
- Debounce em buscas (se implementado)
- Lazy loading de componentes (se aplicável)
- Otimização de re-renders com useCallback

### **Tratamento de Erros**
- Estados de loading e erro bem definidos
- Fallbacks para APIs indisponíveis
- Mensagens de erro amigáveis ao usuário
- Retry automático em falhas de rede

## 🔧 Configurações Locais

A aplicação armazena as seguintes informações no navegador:

- **Histórico de buscas** (últimas 15 palavras)
- **Palavras favoritas** (ilimitado)
- **Preferência de tema** (claro/escuro)
- **Idioma da interface** (Português/Inglês)
- **Cache de traduções** (válido por 24 horas)
- **Configurações de acessibilidade**

## 🌟 Próximas Funcionalidades

- [ ] Exportação de favoritos
- [ ] Flashcards para estudo
- [ ] Estatísticas de uso
- [ ] Integração com APIs de conjugação verbal
- [ ] Suporte a mais idiomas
- [ ] Sincronização entre dispositivos
- [ ] Modo offline avançado com sincronização

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para a comunidade de aprendizes de inglês.

---

**⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!**


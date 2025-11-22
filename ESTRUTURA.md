# Estrutura da Biblioteca CEP Parallel Search

## 📁 Estrutura de Arquivos

```
biblioteca-para-npm/
├── src/                          # Código fonte
│   ├── errors/                   # Classes de erro
│   │   └── CepError.js           # Erros customizados (ValidationError, ServiceError, TimeoutError)
│   ├── services/                 # Serviços de CEP
│   │   ├── baseService.js        # Classe base para serviços
│   │   ├── brasilApiService.js   # Serviço BrasilAPI
│   │   ├── viaCepService.js      # Serviço ViaCEP
│   │   ├── wideNetService.js      # Serviço WideNet
│   │   ├── correiosService.js    # Serviço Correios (SOAP)
│   │   └── index.js              # Factory de serviços
│   ├── utils/                    # Utilitários
│   │   ├── cepValidator.js       # Validação e normalização de CEP
│   │   └── promiseUtils.js       # Utilitários de Promise (Promise.any polyfill)
│   ├── index.js                  # Arquivo principal da biblioteca
│   ├── index.d.ts                # Definições TypeScript
│   └── *.test.js                 # Testes unitários
├── examples/                     # Exemplos de uso
│   └── basic-usage.js            # Exemplos práticos
├── dist/                         # Código compilado (gerado após build)
├── coverage/                     # Relatório de cobertura (gerado após testes)
├── package.json                  # Configuração do npm
├── package-lock.json             # Lock de dependências
├── babel.config.js              # Configuração do Babel
├── jest.config.js               # Configuração do Jest
├── .eslintrc.js                 # Configuração do ESLint
├── .gitignore                   # Arquivos ignorados pelo Git
├── .npmignore                   # Arquivos ignorados no npm
├── LICENSE                      # Licença MIT
├── README.md                    # Documentação principal
├── CHANGELOG.md                 # Histórico de mudanças
└── ESTRUTURA.md                 # Este arquivo
```

## 🏗️ Arquitetura

### 1. Camada de Erros (`src/errors/`)
- **CepError**: Classe base para todos os erros
- **ValidationError**: Erros de validação de CEP
- **ServiceError**: Erros dos serviços de CEP
- **TimeoutError**: Erros de timeout

### 2. Camada de Serviços (`src/services/`)
- **BaseCepService**: Classe abstrata com lógica comum
- **BrasilApiService**: Implementação do BrasilAPI
- **ViaCepService**: Implementação do ViaCEP
- **WideNetService**: Implementação do WideNet
- **CorreiosService**: Implementação dos Correios (SOAP/XML)

### 3. Camada de Utilitários (`src/utils/`)
- **cepValidator**: Validação, normalização e formatação de CEP
- **promiseUtils**: Utilitários para Promise (polyfill Promise.any, timeout)

### 4. Camada Principal (`src/index.js`)
- **searchCep**: Função principal que orquestra a busca paralela
- Exporta classes de erro para uso externo

## 🔄 Fluxo de Execução

```
1. Usuário chama searchCep(cep, options)
   ↓
2. Validação e normalização do CEP
   ├─ validateInputType: Verifica se é string ou number
   ├─ removeSpecialCharacters: Remove caracteres especiais
   ├─ leftPadWithZeros: Preenche zeros à esquerda
   └─ validateInputLength: Valida comprimento (8 caracteres)
   ↓
3. Seleção de serviços
   ├─ Se providers especificados: usa apenas esses
   └─ Se não: usa todos os serviços disponíveis
   ↓
4. Busca paralela
   ├─ Cria promise para cada serviço
   ├─ Aplica timeout individual
   └─ Usa Promise.any para retornar a primeira resposta
   ↓
5. Tratamento de resultado
   ├─ Sucesso: retorna dados normalizados
   └─ Erro: agrega erros e lança ServiceError/TimeoutError
```

## 🎯 Características Principais

### Busca Paralela
- Consulta todos os serviços simultaneamente
- Retorna a primeira resposta bem-sucedida
- Usa `Promise.any` (com polyfill para compatibilidade)

### Tratamento de Erros
- **ValidationError**: CEP inválido (formato, comprimento)
- **ServiceError**: Todos os serviços falharam
- **TimeoutError**: Todas as requisições excederam timeout
- Erros detalhados com informações de cada serviço

### Validação Robusta
- Aceita string ou número
- Remove caracteres especiais automaticamente
- Preenche zeros à esquerda
- Valida comprimento (exatamente 8 caracteres)

### Configuração Flexível
- Timeout configurável por requisição
- Seleção de provedores específicos
- Compatível com Node.js 12+

## 📦 Dependências

### Produção
- `node-fetch@^2.7.0`: Para requisições HTTP

### Desenvolvimento
- `@babel/*`: Transpilação ES6+
- `jest`: Framework de testes
- `eslint`: Linter de código

## 🚀 Scripts NPM

```bash
npm run build          # Compila código fonte
npm test              # Executa testes
npm run test:watch    # Testes em modo watch
npm run test:coverage # Cobertura de testes
npm run lint          # Verifica código
npm run lint:fix      # Corrige problemas de lint
```

## 📝 Próximos Passos

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Compilar código**:
   ```bash
   npm run build
   ```

3. **Executar testes**:
   ```bash
   npm test
   ```

4. **Testar localmente**:
   ```bash
   node examples/basic-usage.js
   ```

5. **Publicar no npm** (quando estiver pronto):
   ```bash
   npm publish
   ```

## 🔍 Melhorias Futuras

- [ ] Cache de resultados
- [ ] Retry automático com backoff
- [ ] Métricas de performance
- [ ] Suporte a batch requests
- [ ] Webhooks para notificações
- [ ] Rate limiting
- [ ] Logging configurável



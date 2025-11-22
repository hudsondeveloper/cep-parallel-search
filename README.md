# CEP Parallel Search

Biblioteca Node.js profissional para busca de CEP com múltiplas consultas em paralelo e tratamento robusto de erros.

## 🚀 Características

- ✅ **Busca Paralela**: Consulta múltiplos serviços simultaneamente e retorna a resposta mais rápida
- ✅ **Cancelamento Automático**: Cancela requisições pendentes quando uma resolve primeiro
- ✅ **Cache Automático**: Cache de 15 dias para funcionamento offline e maior velocidade
- ✅ **Alta Disponibilidade**: Usa vários serviços como fallback automático
- ✅ **Tratamento Robusto de Erros**: Classes de erro específicas e mensagens detalhadas
- ✅ **Timeout Configurável**: Controle individual de timeout por requisição
- ✅ **TypeScript**: Suporte completo com definições de tipos
- ✅ **Validação Inteligente**: Valida CEP e providers automaticamente
- ✅ **Flexível**: Aceita CEP como string ou número, com ou sem formatação
- ✅ **Gerenciamento de Cache**: Funções para limpar e inspecionar o cache
- ✅ **Zero Dependencies**: Apenas `node-fetch` como dependência
- ✅ **100% Testado**: Cobertura completa de testes

## 📦 Instalação

```bash
npm install cep-parallel-search
```

### Suporte a Módulos

A biblioteca suporta CommonJS e ES Modules:

**CommonJS:**
```javascript
const { searchCep } = require('cep-parallel-search');
```

**ES Modules:**
```javascript
import { searchCep } from 'cep-parallel-search';
// ou
import searchCep from 'cep-parallel-search';
```

**TypeScript:**
```typescript
import { searchCep, CepResult } from 'cep-parallel-search';
```

## 📖 Uso Básico

```javascript
const { searchCep } = require('cep-parallel-search');

// Busca básica (usa cache automático de 15 dias)
searchCep('01310100')
  .then(result => {
    console.log(result);
    // {
    //   cep: '01310100',
    //   state: 'SP',
    //   city: 'São Paulo',
    //   street: 'Avenida Paulista',
    //   neighborhood: 'Bela Vista',
    //   service: 'brasilapi'
    // }
    // Na próxima consulta do mesmo CEP, retorna instantaneamente do cache!
  })
  .catch(error => {
    console.error('Erro:', error.message);
  });
```

### 💾 Cache Automático

A biblioteca utiliza cache automático de **15 dias** para melhorar a performance:

- ✅ **Funciona offline**: Após a primeira consulta, funciona sem internet
- ✅ **Muito mais rápido**: Consultas em cache são instantâneas
- ✅ **Limpeza automática**: Entradas expiradas são removidas automaticamente
- ✅ **Persistente**: Cache é salvo em `~/.cep-parallel-search/cache.json`
- ✅ **Otimizado**: Operações de cache são assíncronas e não bloqueiam

```javascript
// Primeira consulta - faz requisição HTTP
const result1 = await searchCep('01310100'); // ~200-500ms

// Segunda consulta (mesmo CEP) - retorna do cache
const result2 = await searchCep('01310100'); // ~1ms (instantâneo!)

// Desabilitar cache para uma consulta específica
const result3 = await searchCep('01310100', { useCache: false });
```

### ⚡ Cancelamento Automático

A biblioteca cancela automaticamente requisições pendentes quando uma resolve primeiro, economizando recursos:

```javascript
// Quando uma requisição resolve, as outras são canceladas automaticamente
// Isso economiza banda e recursos do servidor
const result = await searchCep('01310100', {
  providers: ['brasilapi', 'viacep'] // Ambas iniciam, mas apenas a mais rápida completa
});
```

## 🔧 Uso Avançado

### Com async/await

```javascript
const { searchCep } = require('cep-parallel-search');

async function buscarCep() {
  try {
    const result = await searchCep('01310100');
    console.log('CEP encontrado:', result);
  } catch (error) {
    if (error.type === 'validation_error') {
      console.error('CEP inválido:', error.message);
    } else if (error.type === 'service_error') {
      console.error('Erro nos serviços:', error.errors);
    }
  }
}
```

### Com opções personalizadas

```javascript
const { searchCep, VALID_PROVIDERS } = require('cep-parallel-search');

// Com timeout e providers específicos
const result = await searchCep('01310100', {
  timeout: 5000,        // 5 segundos (padrão: 30000)
  providers: ['brasilapi', 'viacep'], // Apenas estes serviços (padrão: todos)
  useCache: true        // Usar cache (padrão: true)
});

// Verificar providers válidos
console.log('Providers disponíveis:', VALID_PROVIDERS);
// ['brasilapi', 'viacep']
```

### Opções Disponíveis

A função `searchCep` aceita as seguintes opções:

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `timeout` | `number` | `30000` | Timeout em milissegundos para cada requisição |
| `providers` | `CepProvider[]` | `[]` (todos) | Lista de provedores a usar |
| `useCache` | `boolean` | `true` | Se deve usar cache (15 dias de duração) |

### Validação de Providers

A biblioteca valida automaticamente os providers fornecidos:

```javascript
const { searchCep, isValidProvider } = require('cep-parallel-search');

// Verificar se um provider é válido
if (isValidProvider('brasilapi')) {
  console.log('Provider válido!');
}

// Tentar usar provider inválido lançará ValidationError
try {
  await searchCep('01310100', {
    providers: ['invalid-provider'] // ❌ Erro!
  });
} catch (error) {
  console.error('Erro:', error.message);
  // "Providers inválidos: invalid-provider"
}
```

### Aceita CEP como número

```javascript
// Funciona com string ou número
await searchCep('01310100');  // ✅
await searchCep(1310100);     // ✅ (zeros à esquerda são adicionados)
await searchCep('01310-100'); // ✅ (caracteres especiais são removidos)
```

## 🛠️ Serviços Disponíveis

A biblioteca consulta os seguintes serviços em paralelo:

| Serviço | Descrição | Disponibilidade |
|---------|-----------|-----------------|
| **brasilapi** | BrasilAPI - API pública brasileira | ✅ Sempre |
| **viacep** | ViaCEP - Serviço gratuito | ✅ Sempre |
| ~~widenet~~ | WideNet - CDN de CEPs | 🚧 Em desenvolvimento |
| ~~correios~~ | Correios - Serviço oficial (SOAP) | 🚧 Em desenvolvimento |

> **Nota:** Os serviços `widenet` e `correios` serão adicionados em atualizações futuras.

Por padrão, todos os serviços disponíveis são consultados. Você pode especificar quais usar:

```javascript
// Usar apenas BrasilAPI e ViaCEP
await searchCep('01310100', {
  providers: ['brasilapi', 'viacep']
});
```

## ⚠️ Tratamento de Erros

A biblioteca possui classes de erro específicas para diferentes situações. Todas as classes de erro herdam de `CepError` e incluem propriedades `type` e `errors` para tratamento detalhado.

### CepError (Classe Base)

Classe base para todos os erros relacionados a CEP:

```javascript
const { CepError } = require('cep-parallel-search');

try {
  await searchCep('invalid');
} catch (error) {
  if (error instanceof CepError) {
    console.error('Tipo de erro:', error.type);
    console.error('Mensagem:', error.message);
    console.error('Detalhes:', error.errors);
  }
}
```

### ValidationError

Erro quando o CEP tem formato inválido ou providers são inválidos:

```javascript
const { ValidationError } = require('cep-parallel-search');

try {
  await searchCep('123456789'); // CEP muito longo
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Erro de validação:', error.message);
    console.error('Tipo:', error.type); // 'validation_error'
    console.error('Detalhes:', error.errors);
  }
}

// Também lançado para providers inválidos
try {
  await searchCep('01310100', {
    providers: ['invalid-provider']
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Provider inválido:', error.message);
  }
}
```

### ServiceError

Erro quando todos os serviços falharam:

```javascript
const { ServiceError } = require('cep-parallel-search');

try {
  await searchCep('99999999'); // CEP inexistente
} catch (error) {
  if (error instanceof ServiceError) {
    console.error('Todos os serviços falharam:', error.message);
    console.error('Tipo:', error.type); // 'service_error'
    console.error('Erros individuais:', error.errors);
    // error.errors é um array com os erros de cada serviço
    error.errors.forEach(err => {
      console.error(`  - ${err.service}: ${err.message}`);
    });
  }
}
```

### TimeoutError

Erro quando todas as requisições excederam o timeout:

```javascript
const { TimeoutError } = require('cep-parallel-search');

try {
  await searchCep('01310100', { timeout: 100 }); // Timeout muito curto
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Timeout:', error.message);
    console.error('Tipo:', error.type); // 'timeout_error'
    console.error('Erros:', error.errors);
  }
}
```

### Tratamento Genérico

```javascript
const { 
  searchCep, 
  CepError, 
  ValidationError, 
  ServiceError, 
  TimeoutError 
} = require('cep-parallel-search');

async function buscarCepComTratamento(cep) {
  try {
    return await searchCep(cep);
  } catch (error) {
    if (error instanceof ValidationError) {
      // CEP inválido ou providers inválidos
      console.error('Erro de validação:', error.message);
      return null;
    } else if (error instanceof TimeoutError) {
      // Todas as requisições excederam o timeout
      console.error('Timeout em todas as requisições');
      return null;
    } else if (error instanceof ServiceError) {
      // Todos os serviços falharam
      console.error('Todos os serviços falharam');
      return null;
    } else if (error instanceof CepError) {
      // Outro erro relacionado a CEP
      console.error('Erro de CEP:', error.message);
      return null;
    } else {
      // Erro desconhecido
      throw error;
    }
  }
}
```

## 📋 Estrutura de Resposta

A resposta sempre inclui os campos básicos. Quando o serviço é ViaCEP, campos extras são incluídos:

```typescript
interface CepResult {
  // Campos básicos (sempre presentes)
  cep: string;           // CEP formatado (8 dígitos)
  state: string;         // Estado (UF)
  city: string;          // Cidade
  street: string;        // Logradouro/Rua
  neighborhood: string;  // Bairro
  service: string;      // Nome do serviço que retornou
  
  // Campos extras do ViaCEP (apenas quando service === 'viacep')
  complemento?: string;  // Complemento do endereço
  unidade?: string;       // Unidade do endereço
  estado?: string;        // Nome completo do estado
  regiao?: string;        // Região do Brasil
  ibge?: string;          // Código IBGE do município
  gia?: string;            // Código GIA
  ddd?: string;            // Código DDD
  siafi?: string;          // Código SIAFI
}
```

### Exemplo de resposta do ViaCEP

```javascript
{
  cep: "01001000",
  state: "SP",
  city: "São Paulo",
  street: "Praça da Sé",
  neighborhood: "Sé",
  service: "viacep",
  complemento: "lado ímpar",
  unidade: "",
  estado: "São Paulo",
  regiao: "Sudeste",
  ibge: "3550308",
  gia: "1004",
  ddd: "11",
  siafi: "7107"
}
```

## 🔍 Exemplos Completos

### Exemplo 1: Validação de CEP

```javascript
const { searchCep, ValidationError } = require('cep-parallel-search');

async function validarCep(cep) {
  try {
    const result = await searchCep(cep);
    return {
      valido: true,
      dados: result
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        valido: false,
        motivo: 'Formato inválido',
        erro: error.message
      };
    }
    throw error;
  }
}
```

### Exemplo 2: Busca com Fallback e Retry

```javascript
const { searchCep } = require('cep-parallel-search');

async function buscarComFallback(cep) {
  // Tenta primeiro com timeout curto e provider mais rápido
  try {
    return await searchCep(cep, {
      timeout: 2000,
      providers: ['brasilapi'] // Mais rápido
    });
  } catch (error) {
    // Se falhar, tenta com todos os serviços
    console.log('Primeira tentativa falhou, tentando com todos os serviços...');
    return await searchCep(cep, {
      timeout: 10000,
      providers: [] // Todos os serviços
    });
  }
}
```

### Exemplo 3: Múltiplos CEPs em Paralelo

```javascript
const { searchCep } = require('cep-parallel-search');

async function buscarMultiplosCeps(ceps) {
  // Busca todos os CEPs em paralelo
  const promises = ceps.map(cep => 
    searchCep(cep).catch(error => ({
      cep,
      sucesso: false,
      erro: error.message,
      tipo: error.type
    }))
  );

  const resultados = await Promise.all(promises);
  return resultados;
}

// Uso
const ceps = ['01310100', '20040020', '30130100'];
const resultados = await buscarMultiplosCeps(ceps);
resultados.forEach(result => {
  if (result.sucesso === false) {
    console.error(`CEP ${result.cep}: ${result.erro}`);
  } else {
    console.log(`CEP ${result.cep}: ${result.city} - ${result.street}`);
  }
});
```

### Exemplo 4: Gerenciamento de Cache

```javascript
const { 
  searchCep, 
  getCacheInfo, 
  clearExpiredCache, 
  clearCache 
} = require('cep-parallel-search');

async function exemploCache() {
  // Buscar alguns CEPs
  await searchCep('01310100');
  await searchCep('20040020');
  
  // Ver informações do cache
  const info = getCacheInfo();
  console.log(`Cache: ${info.validEntries} entradas válidas`);
  console.log(`Cache: ${info.expiredEntries} entradas expiradas`);
  console.log(`Tamanho estimado: ${info.estimatedSize} bytes`);
  console.log(`Arquivo: ${info.cacheFile}`);
  
  // Limpar apenas entradas expiradas
  const removidas = clearExpiredCache();
  console.log(`${removidas} entradas expiradas removidas`);
  
  // Limpar todo o cache (se necessário)
  // clearCache();
}
```

### Exemplo 5: Tratamento Completo de Erros

```javascript
const { 
  searchCep, 
  CepError,
  ValidationError, 
  ServiceError, 
  TimeoutError 
} = require('cep-parallel-search');

async function buscarCepCompleto(cep) {
  try {
    const result = await searchCep(cep, {
      timeout: 5000,
      providers: ['brasilapi', 'viacep'],
      useCache: true
    });
    
    return {
      sucesso: true,
      dados: result
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return {
        sucesso: false,
        tipo: 'validacao',
        mensagem: error.message,
        detalhes: error.errors
      };
    } else if (error instanceof TimeoutError) {
      return {
        sucesso: false,
        tipo: 'timeout',
        mensagem: 'Todas as requisições excederam o tempo limite',
        detalhes: error.errors
      };
    } else if (error instanceof ServiceError) {
      return {
        sucesso: false,
        tipo: 'servico',
        mensagem: 'Todos os serviços falharam',
        detalhes: error.errors.map(e => ({
          servico: e.service,
          erro: e.message
        }))
      };
    } else if (error instanceof CepError) {
      return {
        sucesso: false,
        tipo: 'cep',
        mensagem: error.message,
        detalhes: error.errors
      };
    } else {
      return {
        sucesso: false,
        tipo: 'desconhecido',
        mensagem: error.message
      };
    }
  }
}
```

### Exemplo 6: Integração com Express.js

```javascript
const express = require('express');
const { searchCep, ValidationError, ServiceError } = require('cep-parallel-search');

const app = express();

app.get('/cep/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    const result = await searchCep(cep);
    res.json({ sucesso: true, dados: result });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        sucesso: false,
        erro: 'CEP inválido',
        mensagem: error.message
      });
    } else if (error instanceof ServiceError) {
      res.status(503).json({
        sucesso: false,
        erro: 'Serviços indisponíveis',
        mensagem: error.message
      });
    } else {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro interno',
        mensagem: error.message
      });
    }
  }
});

app.listen(3000);
```

## 💻 Uso com TypeScript

A biblioteca inclui definições de tipos TypeScript completas:

```typescript
import { 
  searchCep, 
  CepResult, 
  SearchCepOptions,
  ValidationError,
  ServiceError,
  TimeoutError,
  VALID_PROVIDERS,
  isValidProvider,
  clearCache,
  clearExpiredCache,
  getCacheInfo,
  CacheInfo
} from 'cep-parallel-search';

async function exemploTypeScript(cep: string): Promise<CepResult | null> {
  try {
    const options: SearchCepOptions = {
      timeout: 5000,
      providers: ['brasilapi', 'viacep'],
      useCache: true
    };
    
    const result: CepResult = await searchCep(cep, options);
    return result;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Erro de validação:', error.message);
    } else if (error instanceof ServiceError) {
      console.error('Erro de serviço:', error.message);
    } else if (error instanceof TimeoutError) {
      console.error('Timeout:', error.message);
    }
    return null;
  }
}

// Type guard
function usarProvider(provider: string) {
  if (isValidProvider(provider)) {
    // TypeScript sabe que provider é 'brasilapi' | 'viacep'
    console.log('Provider válido:', provider);
  }
}
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

## 📝 API Reference

### `searchCep(cep, options?)`

Busca informações de CEP usando múltiplos serviços em paralelo. Cancela automaticamente requisições pendentes quando uma resolve primeiro.

**Parâmetros:**
- `cep` (string | number): CEP a ser consultado (aceita formatos: `'01310100'`, `1310100`, `'01310-100'`)
- `options` (object, opcional):
  - `timeout` (number): Timeout em milissegundos para cada requisição (padrão: `30000`)
  - `providers` (CepProvider[]): Lista de provedores a usar (padrão: `[]` = todos disponíveis)
    - Valores válidos: `'brasilapi' | 'viacep'`
    - Nota: `widenet` e `correios` serão adicionados em atualizações futuras
  - `useCache` (boolean): Se deve usar cache (padrão: `true`)
    - Cache tem duração de 15 dias
    - Cache é salvo em `~/.cep-parallel-search/cache.json`

**Retorna:** `Promise<CepResult>`

**Lança:**
- `ValidationError`: Se o CEP tem formato inválido ou providers são inválidos
- `ServiceError`: Se todos os serviços falharam
- `TimeoutError`: Se todas as requisições excederam o timeout

**Comportamento:**
- Consulta todos os serviços especificados em paralelo
- Retorna a primeira resposta bem-sucedida
- Cancela automaticamente requisições pendentes quando uma resolve
- Usa cache se `useCache` for `true` e houver cache válido
- Salva resultado no cache após sucesso (se `useCache` for `true`)

### `VALID_PROVIDERS`

Constante com a lista de providers válidos:

```javascript
const { VALID_PROVIDERS } = require('cep-parallel-search');
console.log(VALID_PROVIDERS);
// ['brasilapi', 'viacep']
```

### `isValidProvider(provider)`

Verifica se um provider é válido:

```javascript
const { isValidProvider } = require('cep-parallel-search');

isValidProvider('brasilapi'); // true
isValidProvider('viacep');    // true
isValidProvider('invalid');   // false
isValidProvider('widenet');    // false (em desenvolvimento)
```

**Parâmetros:**
- `provider` (string): Nome do provider a verificar

**Retorna:** `boolean` - `true` se o provider é válido, `false` caso contrário

**TypeScript:** Esta função é um type guard, então pode ser usada para type narrowing:

```typescript
import { isValidProvider, CepProvider } from 'cep-parallel-search';

function useProvider(provider: string) {
  if (isValidProvider(provider)) {
    // TypeScript sabe que provider é CepProvider aqui
    const validProvider: CepProvider = provider;
  }
}
```

### Classes de Erro

Todas as classes de erro estão disponíveis para importação:

```javascript
const { 
  CepError,        // Classe base
  ValidationError, // Erro de validação
  ServiceError,    // Erro de serviço
  TimeoutError     // Erro de timeout
} = require('cep-parallel-search');
```

**Propriedades comuns:**
- `name` (string): Nome da classe de erro
- `message` (string): Mensagem de erro
- `type` (string): Tipo do erro (`'validation_error'`, `'service_error'`, `'timeout_error'`)
- `errors` (array): Array com detalhes dos erros

### Exportação Padrão

A biblioteca também exporta `searchCep` como exportação padrão:

```javascript
// CommonJS
const searchCep = require('cep-parallel-search').default;
// ou
const searchCep = require('cep-parallel-search');

// ES Modules
import searchCep from 'cep-parallel-search';
```

### Gerenciamento de Cache

A biblioteca fornece funções para gerenciar o cache de forma programática:

#### `clearCache()`

Limpa todo o cache (remove o arquivo de cache):

```javascript
const { clearCache } = require('cep-parallel-search');

const success = clearCache(); // Remove todos os CEPs do cache
console.log(success); // true se sucesso, false se erro
```

**Retorna:** `boolean` - `true` se o cache foi limpo com sucesso, `false` em caso de erro

#### `clearExpiredCache()`

Limpa apenas entradas expiradas (mais de 15 dias):

```javascript
const { clearExpiredCache } = require('cep-parallel-search');

const removed = clearExpiredCache();
console.log(`${removed} entradas expiradas foram removidas`);
```

**Retorna:** `number` - Número de entradas removidas

#### `getCacheInfo()`

Retorna informações detalhadas sobre o cache:

```javascript
const { getCacheInfo } = require('cep-parallel-search');

const info = getCacheInfo();
console.log(info);
// {
//   totalEntries: 150,        // Total de entradas no cache
//   validEntries: 145,         // Entradas válidas (não expiradas)
//   expiredEntries: 5,         // Entradas expiradas
//   cacheFile: '/home/user/.cep-parallel-search/cache.json',
//   cacheDir: '/home/user/.cep-parallel-search',
//   estimatedSize: 45000       // Tamanho estimado em bytes
// }
```

**Retorna:** `CacheInfo` - Objeto com informações sobre o cache

**Interface TypeScript:**
```typescript
interface CacheInfo {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  cacheFile: string;
  cacheDir: string;
  estimatedSize: number;
}
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [BrasilAPI](https://brasilapi.com.br/) - API pública brasileira
- [ViaCEP](https://viacep.com.br/) - Serviço gratuito de CEP
- [WideNet](https://apicep.com/) - CDN de CEPs (em desenvolvimento)
- [Correios](https://www.correios.com.br/) - Serviço oficial (em desenvolvimento)

## 📊 Requisitos

- **Node.js**: >= 12.0.0
- **Dependências**: `node-fetch` (^2.7.0)

## 🔧 Scripts Disponíveis

```bash
# Build (CommonJS e ESM)
npm run build

# Build apenas CommonJS
npm run build:cjs

# Build apenas ESM
npm run build:esm

# Executar testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# Linter
npm run lint

# Linter com correção automática
npm run lint:fix
```

## 📊 Status

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen)

## 🎯 Casos de Uso

- ✅ **Aplicações Web**: Busca rápida de endereços em formulários
- ✅ **APIs REST**: Endpoint para consulta de CEP
- ✅ **Scripts CLI**: Ferramentas de linha de comando
- ✅ **Aplicações Mobile**: Busca offline com cache
- ✅ **Validação de Dados**: Verificação de CEPs em sistemas
- ✅ **Integração com Sistemas**: APIs que precisam de dados de endereço

## ⚡ Performance e Otimizações

A biblioteca foi otimizada para máxima performance:

- **Busca Paralela**: Consulta múltiplos serviços simultaneamente, retornando a resposta mais rápida
- **Cancelamento Inteligente**: Cancela automaticamente requisições pendentes quando uma resolve
- **Cache em Memória**: Cache em memória para evitar múltiplas leituras do arquivo
- **Operações Assíncronas**: Operações de cache são assíncronas e não bloqueiam a execução
- **Limpeza Automática**: Entradas expiradas são removidas automaticamente em background
- **Validação Rápida**: Validação de CEP e providers é feita antes de fazer requisições HTTP

### Benchmarks

- **Primeira consulta**: ~200-500ms (requisição HTTP)
- **Consultas em cache**: ~1ms (instantâneo)
- **Múltiplos CEPs em paralelo**: Escala linearmente com o número de CEPs

## 📁 Estrutura do Projeto

```
cep-parallel-search/
├── src/
│   ├── index.js              # Ponto de entrada principal
│   ├── index.d.ts            # Definições TypeScript
│   ├── errors/
│   │   └── CepError.js       # Classes de erro
│   ├── services/
│   │   ├── baseService.js    # Classe base para serviços
│   │   ├── brasilApiService.js
│   │   ├── viaCepService.js
│   │   └── index.js
│   └── utils/
│       ├── cache.js          # Gerenciamento de cache
│       ├── cepValidator.js   # Validação de CEP
│       ├── providerValidator.js
│       └── promiseUtils.js   # Utilitários de Promise
├── dist/                     # Build compilado
├── examples/                 # Exemplos de uso
└── package.json
```

## 🔒 Segurança

- ✅ **Validação de Entrada**: Todos os CEPs são validados antes de fazer requisições
- ✅ **Sanitização**: CEPs são normalizados e sanitizados automaticamente
- ✅ **Timeout**: Requisições têm timeout configurável para evitar travamentos
- ✅ **Tratamento de Erros**: Erros são tratados de forma segura sem expor informações sensíveis
- ✅ **Sem Dependências Maliciosas**: Apenas `node-fetch` como dependência externa

## 🐛 Troubleshooting

### Problema: Cache não está funcionando

**Solução**: Verifique as permissões do diretório `~/.cep-parallel-search/`:

```javascript
const { getCacheInfo } = require('cep-parallel-search');
const info = getCacheInfo();
console.log('Cache dir:', info.cacheDir);
// Verifique se o diretório existe e tem permissões de escrita
```

### Problema: Timeout muito frequente

**Solução**: Aumente o timeout padrão:

```javascript
const result = await searchCep('01310100', {
  timeout: 60000 // 60 segundos
});
```

### Problema: Todos os serviços falhando

**Solução**: Verifique sua conexão com a internet e tente novamente:

```javascript
try {
  const result = await searchCep('01310100', {
    timeout: 10000,
    useCache: false // Força nova requisição
  });
} catch (error) {
  console.error('Erros dos serviços:', error.errors);
}
```

## 📚 Recursos Adicionais

- **Documentação Completa**: Este README contém toda a documentação necessária
- **Exemplos**: Veja a pasta `examples/` para mais exemplos de uso
- **TypeScript**: Definições de tipos completas incluídas
- **Testes**: Cobertura completa de testes para garantir qualidade



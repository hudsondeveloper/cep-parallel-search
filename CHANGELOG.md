# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added
- Implementação inicial da biblioteca
- Suporte a múltiplos serviços de CEP em paralelo:
  - BrasilAPI ✅
  - ViaCEP ✅ (com campos extras: complemento, unidade, estado, regiao, ibge, gia, ddd, siafi)
  - WideNet 🚧 (em desenvolvimento)
  - Correios (SOAP) 🚧 (em desenvolvimento)
- **Cache automático de 30 dias**:
  - Funciona offline após primeira consulta
  - Consultas em cache são instantâneas
  - Limpeza automática de entradas expiradas
  - Cache persistente em `~/.cep-parallel-search/cache.json`
  - Funções de gerenciamento: `clearCache()`, `clearExpiredCache()`, `getCacheInfo()`
- Busca paralela com Promise.any
- Tratamento robusto de erros:
  - ValidationError para CEPs inválidos
  - ServiceError para falhas nos serviços
  - TimeoutError para timeouts
- Suporte a TypeScript com definições de tipos
- Validação e normalização de CEP:
  - Aceita string ou número
  - Remove caracteres especiais
  - Preenche zeros à esquerda
- Timeout configurável por requisição
- Seleção de provedores específicos
- Documentação completa no README
- Testes unitários básicos
- Exemplos de uso

### Features
- Busca paralela em múltiplos serviços
- Retorna a resposta mais rápida
- Fallback automático entre serviços
- Cache automático para performance e funcionamento offline
- Tratamento detalhado de erros
- Compatível com Node.js 12+



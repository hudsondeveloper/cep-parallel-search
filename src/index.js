const { normalizeAndValidateCep } = require('./utils/cepValidator');
const { parallelWithTimeout, promiseAny } = require('./utils/promiseUtils');
const { validateProviders, normalizeProviders } = require('./utils/providerValidator');
const { getCachedResult, setCachedResult } = require('./utils/cache');
const { getServicesByNames } = require('./services');
const { ValidationError, ServiceError, TimeoutError } = require('./errors/CepError');

/**
 * @typedef {'brasilapi'|'viacep'} CepProvider
 * Provider válido para busca de CEP
 * Nota: widenet e correios serão adicionados em atualizações futuras
 */

/**
 * Busca informações de CEP usando múltiplos serviços em paralelo
 * Utiliza cache automático de 30 dias para melhor performance
 *
 * @param {string|number} cep - CEP a ser consultado (pode ser string ou número)
 * @param {Object} [options={}] - Opções de configuração
 * @param {number} [options.timeout=30000] - Timeout em milissegundos para cada requisição
 * @param {CepProvider[]} [options.providers=[]] - Lista de provedores a usar. Se vazio, usa todos disponíveis
 * @param {boolean} [options.useCache=true] - Se deve usar cache (padrão: true)
 * @returns {Promise<Object>} Promise que resolve com os dados do CEP
 * @throws {ValidationError} Se o CEP ou providers são inválidos
 * @throws {ServiceError} Se todos os serviços falharam
 * @throws {TimeoutError} Se todas as requisições excederam o timeout
 *
 * @example
 * // Busca básica (usa cache automaticamente)
 * const result = await searchCep('01310100');
 *
 * @example
 * // Com opções
 * const result = await searchCep('01310100', {
 *   timeout: 5000,
 *   providers: ['brasilapi', 'viacep'],
 *   useCache: true // padrão
 * });
 *
 * @example
 * // Desabilitar cache
 * const result = await searchCep('01310100', {
 *   useCache: false
 * });
 */
async function searchCep(cep, options = {}) {
  const {
    timeout = 30000,
    providers = [],
    useCache = true
  } = options;
  
  try {
    // Valida a lista de providers
    validateProviders(providers);
    // Normaliza os providers (remove duplicatas, converte para lowercase)
    const normalizedProviders = normalizeProviders(providers);
    
    // Valida e normaliza o CEP
    const normalizedCep = await normalizeAndValidateCep(cep);
    
    // Verifica cache antes de fazer requisição
    if (useCache) {
      const cachedResult = getCachedResult(normalizedCep);
      if (cachedResult?.city) {
        return cachedResult;
      }
    }
    
    // Obtém os serviços a serem usados
    const services = getServicesByNames(normalizedProviders, timeout);

    if (services.length === 0) {
      throw new ValidationError(
        'Nenhum serviço disponível para consulta',
        [{
          message: 'Lista de serviços está vazia',
          service: 'service_validation'
        }]
      );
    }
    
    // Cria promises para cada serviço com AbortController para cancelamento
    // NOTA: .map() executa de forma síncrona, mas retorna um array de Promises
    // Isso é correto porque service.search() retorna uma Promise (operação assíncrona)
    // As requisições HTTP são iniciadas imediatamente e executadas em paralelo
    
    // Cria AbortControllers para cada serviço para permitir cancelamento
    const abortControllers = services.map(() => new AbortController());
    
    // Armazena os métodos fetch originais para restaurar depois
    const originalFetches = services.map(service => service.fetch.bind(service));
    
    // Temporariamente modifica o método fetch de cada serviço para usar o AbortController
    services.forEach((service, index) => {
      const originalFetch = originalFetches[index];
      service.fetch = function(url, options = {}) {
        return originalFetch(url, { ...options, signal: abortControllers[index].signal });
      };
    });
    
    const promises = services.map((service, index) => {
      // service.search() retorna uma Promise (operação assíncrona HTTP)
      return service.search(normalizedCep)
        .then(result => {
          return result;
        })
        .catch(error => {
          // Se a requisição foi cancelada (abortada), não trata como erro
          // Isso acontece quando outra requisição resolve primeiro
          if (error.name === 'AbortError' || error.type === 'aborted' || 
              (error instanceof ServiceError && error.message && error.message.includes('cancelada'))) {
            // Re-lança o erro para que seja ignorado pelo promiseAny
            throw error;
          }
          
          // Captura erros de cada serviço individualmente
          const serviceError = {
            message: error.message || 'Erro desconhecido',
            service: service.name || 'unknown',
            type: error.type || 'service_error'
          };

          // Se for um ServiceError, extrai informações
          if (error instanceof ServiceError && error.errors && error.errors.length > 0) {
            return error.errors[0];
          }

          return serviceError;
        });
    });
    
    // Executa todas as requisições em paralelo com timeout
    // Cria callbacks de cancelamento que abortam as requisições HTTP
    const cancelCallbacks = abortControllers.map((controller) => () => {
      controller.abort();
    });
    
    try {
      // parallelWithTimeout agora aceita callbacks de cancelamento adicionais
      const result = await parallelWithTimeout(promises, timeout, cancelCallbacks);
      
      // Restaura os métodos fetch originais
      services.forEach((service, index) => {
        service.fetch = originalFetches[index];
      });
      
      // Salva no cache após sucesso (apenas se cache estiver habilitado)
      if (useCache) {
        setCachedResult(normalizedCep, result);
      }
      
      return result;
    } catch (error) {
      // Restaura os métodos fetch originais mesmo em caso de erro
      services.forEach((service, index) => {
        service.fetch = originalFetches[index];
      });
      
      // Se todas as promises falharam, coleta todos os erros
      let allErrors = [];
      // Se for um AggregateError, extrai os erros
      if (error.errors && Array.isArray(error.errors)) {
        allErrors = error.errors;
      } else if (Array.isArray(error)) {
        allErrors = error;
      } else {
        allErrors = [{
          message: error.message || 'Erro desconhecido',
          service: 'unknown',
          originalError: error.message
        }];
      }
      
      // Verifica se foi timeout
      const timeoutErrors = allErrors.filter(e => 
        e.message && e.message.includes('timeout')
      );
      
      if (timeoutErrors.length === allErrors.length) {
        throw new TimeoutError(
          'Todas as requisições excederam o tempo limite',
          allErrors
        );
      }
      
      throw new ServiceError(
        'Todos os serviços de CEP retornaram erro',
        allErrors
      );
    }
  } catch (error) {
    // Re-lança erros de validação e serviço
    if (error instanceof ValidationError || 
        error instanceof ServiceError || 
        error instanceof TimeoutError) {
      throw error;
    }

    // Converte outros erros em ValidationError
    throw new ValidationError(
      `Erro ao processar CEP: ${error.message}`,
      [{
        message: error.message,
        service: 'cep_processing',
        originalError: error.message
      }]
    );
  }
}

/**
 * Busca CEP de forma síncrona (não recomendado, use searchCep)
 * Mantido apenas para compatibilidade
 */
function searchCepSync(cep, options = {}) {
  throw new Error('searchCepSync não é suportado. Use searchCep com await ou .then()');
}

module.exports = {
  searchCep,
  searchCepSync,
  // Exporta classes de erro para uso externo
  CepError: require('./errors/CepError').CepError,
  ValidationError: require('./errors/CepError').ValidationError,
  ServiceError: require('./errors/CepError').ServiceError,
  TimeoutError: require('./errors/CepError').TimeoutError,
  // Exporta utilitários de provider
  VALID_PROVIDERS: require('./utils/providerValidator').VALID_PROVIDERS,
  isValidProvider: require('./utils/providerValidator').isValidProvider,
  // Exporta utilitários de cache
  clearCache: require('./utils/cache').clearCache,
  clearExpiredCache: require('./utils/cache').clearExpiredCache,
  getCacheInfo: require('./utils/cache').getCacheInfo
};

// Exporta como default também
module.exports.default = searchCep;



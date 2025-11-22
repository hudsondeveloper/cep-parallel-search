const fetch = require('node-fetch');
const { ServiceError } = require('../errors/CepError');

/**
 * Classe base para serviços de CEP
 */
class BaseCepService {
  constructor(name, defaultTimeout = 30000) {
    this.name = name;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Faz uma requisição HTTP com tratamento de erros
   * Suporta cancelamento via AbortController
   */
  async fetch(url, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    
    // Cria AbortController para permitir cancelamento
    const abortController = options.signal || new AbortController();
    let timeoutId = null;
    
    // Cria uma promise de timeout que cancela a requisição
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(new ServiceError(
          `Timeout ao conectar com ${this.name}`,
          [{
            message: `Requisição excedeu o timeout de ${timeout}ms`,
            service: this.name,
            timeout: timeout
          }]
        ));
      }, timeout);
    });

    try {
      // Usa Promise.race para implementar timeout
      // node-fetch já tem suporte a timeout, mas vamos garantir compatibilidade
      const fetchOptions = {
        ...options,
        signal: abortController.signal,
        timeout: timeout
      };

      // Remove timeout do options para evitar conflito (node-fetch usa signal)
      delete fetchOptions.timeout;

      const fetchPromise = fetch(url, fetchOptions);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Limpa o timeout se a requisição completou antes do timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return response;
    } catch (error) {
      // Limpa o timeout em caso de erro
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Se a requisição foi abortada (cancelada), não lança erro
      if (error.name === 'AbortError' || error.type === 'aborted') {
        throw new ServiceError(
          `Requisição cancelada para ${this.name}`,
          [{
            message: 'Requisição foi cancelada',
            service: this.name
          }]
        );
      }
      
      // Se já for um ServiceError (timeout), re-lança
      if (error instanceof ServiceError) {
        throw error;
      }

      // Verifica se é erro de timeout do node-fetch
      if (error.type === 'request-timeout' || 
          error.message && error.message.includes('timeout')) {
        throw new ServiceError(
          `Timeout ao conectar com ${this.name}`,
          [{
            message: `Requisição excedeu o timeout de ${timeout}ms`,
            service: this.name,
            timeout: timeout
          }]
        );
      }

      // Erros de conexão
      if (error.code === 'ENOTFOUND' || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT') {
        throw new ServiceError(
          `Erro de conexão com ${this.name}`,
          [{
            message: `Não foi possível conectar ao serviço ${this.name}`,
            service: this.name,
            code: error.code
          }]
        );
      }

      // Se já for um ServiceError, re-lança
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Erro ao consultar ${this.name}`,
        [{
          message: error.message || 'Erro desconhecido',
          service: this.name,
          originalError: error.message
        }]
      );
    }
  }

  /**
 * Normaliza a resposta do serviço para o formato padrão
 */
  normalizeResponse(data) {
    return {
      cep: data.cep,
      state: data.state || data.uf,
      city: data.city || data.localidade || data.cidade,
      street: data.street || data.logradouro || data.end || data.address || data.logradouroDNEC,
      neighborhood: data.neighborhood || data.bairro || data.district,
      service: this.name
    };
  }

  /**
   * Método abstrato que deve ser implementado pelas classes filhas
   */
  async search(cep) {
    throw new Error('Método search deve ser implementado pela classe filha');
  }
}

module.exports = BaseCepService;


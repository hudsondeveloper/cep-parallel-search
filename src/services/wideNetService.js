const BaseCepService = require('./baseService');
const { ServiceError } = require('../errors/CepError');

class WideNetService extends BaseCepService {
  constructor(timeout = 30000) {
    super('widenet', timeout);
    this.baseUrl = 'https://cdn.apicep.com/file/apicep';
  }

  async search(cep) {
    try {
      // Formata CEP com hífen: 12345678 -> 12345-678
      const cepWithDash = `${cep.slice(0, 5)}-${cep.slice(5)}`;
      const url = `${this.baseUrl}/${cepWithDash}.json`;

      const response = await this.fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'cep-parallel-search'
        },
        timeout: this.defaultTimeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new ServiceError(
            'CEP não encontrado na base do WideNet',
            [{
              message: 'CEP não encontrado',
              service: this.name,
              status: response.status
            }]
          );
        }

        throw new ServiceError(
          `Erro HTTP ${response.status} ao consultar WideNet`,
          [{
            message: `Status ${response.status}`,
            service: this.name,
            status: response.status
          }]
        );
      }

      const data = await response.json();

      if (data.ok === false || data.status !== 200) {
        throw new ServiceError(
          'CEP não encontrado na base do WideNet',
          [{
            message: data.message || 'CEP não encontrado',
            service: this.name
          }]
        );
      }

      if (!data || !data.code) {
        throw new ServiceError(
          'Resposta inválida do WideNet',
          [{
            message: 'Dados de CEP não encontrados na resposta',
            service: this.name
          }]
        );
      }

      // Remove hífen do CEP se presente
      const normalizedData = {
        ...data,
        cep: data.code.replace(/-/g, '')
      };

      return this.normalizeResponse(normalizedData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Erro ao consultar WideNet: ${error.message}`,
        [{
          message: error.message,
          service: this.name,
          originalError: error.message
        }]
      );
    }
  }
}

module.exports = WideNetService;



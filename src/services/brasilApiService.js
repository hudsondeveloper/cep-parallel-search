const BaseCepService = require('./baseService');
const { ServiceError } = require('../errors/CepError');

class BrasilApiService extends BaseCepService {
  constructor(timeout = 30000) {
    super('brasilapi', timeout);
    this.baseUrl = 'https://brasilapi.com.br/api/cep/v1';
  }

  async search(cep) {
    try {
      const url = `${this.baseUrl}/${cep}`;
      const response = await this.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'cep-parallel-search'
        },
        timeout: this.defaultTimeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new ServiceError(
            'CEP não encontrado na base do BrasilAPI',
            [{
              message: 'CEP não encontrado',
              service: this.name,
              status: response.status
            }]
          );
        }

        throw new ServiceError(
          `Erro HTTP ${response.status} ao consultar BrasilAPI`,
          [{
            message: `Status ${response.status}`,
            service: this.name,
            status: response.status
          }]
        );
      }

      const data = await response.json();

      if (!data || !data.cep) {
        throw new ServiceError(
          'Resposta inválida do BrasilAPI',
          [{
            message: 'Dados de CEP não encontrados na resposta',
            service: this.name
          }]
        );
      }

      const result = this.normalizeResponse(data);
      return result;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Erro ao consultar BrasilAPI: ${error.message}`,
        [{
          message: error.message,
          service: this.name,
          originalError: error.message
        }]
      );
    }
  }
}

module.exports = BrasilApiService;



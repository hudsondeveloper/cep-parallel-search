const BaseCepService = require('./baseService');
const { ServiceError } = require('../errors/CepError');

class ViaCepService extends BaseCepService {
  constructor(timeout = 30000) {
    super('viacep', timeout);
    this.baseUrl = 'https://viacep.com.br/ws';
  }

  async search(cep) {
    try {
      const url = `${this.baseUrl}/${cep}/json/`;
      const response = await this.fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'cep-parallel-search'
        },
        timeout: this.defaultTimeout
      });

      if (!response.ok) {
        throw new ServiceError(
          `Erro HTTP ${response.status} ao consultar ViaCEP`,
          [{
            message: `Status ${response.status}`,
            service: this.name,
            status: response.status
          }]
        );
      }

      const data = await response.json();

      if (data.erro === true) {
        throw new ServiceError(
          'CEP não encontrado na base do ViaCEP',
          [{
            message: 'CEP não encontrado',
            service: this.name
          }]
        );
      }

      if (!data || !data.cep) {
        throw new ServiceError(
          'Resposta inválida do ViaCEP',
          [{
            message: 'Dados de CEP não encontrados na resposta',
            service: this.name
          }]
        );
      }

      // Remove hífen do CEP se presente
      const normalizedData = {
        ...data,
        cep: data.cep.replace(/-/g, '')
      };

      const result = this.normalizeResponse(normalizedData);
      return result;
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Erro ao consultar ViaCEP: ${error.message}`,
        [{
          message: error.message,
          service: this.name,
          originalError: error.message
        }]
      );
    }
  }

  /**
   * Normaliza a resposta do ViaCEP incluindo todos os campos disponíveis
   */
  normalizeResponse(data) {
    return {
      // Campos básicos (obrigatórios)
      cep: data.cep,
      state: data.uf,
      city: data.localidade,
      street: data.logradouro,
      neighborhood: data.bairro,
      service: this.name,
      
      // Campos extras do ViaCEP
      complemento: data.complemento || '',
      unidade: data.unidade || '',
      estado: data.estado || '',
      regiao: data.regiao || '',
      ibge: data.ibge || '',
      gia: data.gia || '',
      ddd: data.ddd || '',
      siafi: data.siafi || ''
    };
  }
}

module.exports = ViaCepService;



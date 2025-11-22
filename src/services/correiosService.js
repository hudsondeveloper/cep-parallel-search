const BaseCepService = require('./baseService');
const { ServiceError } = require('../errors/CepError');

class CorreiosService extends BaseCepService {
  constructor(timeout = 30000) {
    super('correios', timeout);
    this.baseUrl = 'https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente';
  }

  /**
   * Faz o parse do XML de resposta dos Correios
   */
  parseXMLResponse(xmlString) {
    try {
      const returnMatch = xmlString.match(/<return>(.*?)<\/return>/s);
      if (!returnMatch) {
        throw new Error('Formato XML inválido');
      }

      const returnContent = returnMatch[1];
      const parsed = {};

      // Extrai campos do XML
      const fields = ['cep', 'uf', 'cidade', 'bairro', 'end'];
      fields.forEach(field => {
        const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 's');
        const match = returnContent.match(regex);
        if (match) {
          parsed[field] = match[1].trim();
        }
      });

      return parsed;
    } catch (error) {
      throw new Error(`Erro ao processar XML: ${error.message}`);
    }
  }

  /**
   * Extrai mensagem de erro do XML
   */
  parseXMLError(xmlString) {
    try {
      const faultMatch = xmlString.match(/<faultstring>(.*?)<\/faultstring>/s);
      if (faultMatch) {
        return faultMatch[1].trim();
      }
      return 'Erro desconhecido dos Correios';
    } catch (error) {
      return 'Erro ao processar mensagem de erro';
    }
  }

  async search(cep) {
    try {
      const soapBody = `<?xml version="1.0"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cli="http://cliente.bean.master.sigep.bsb.correios.com.br/">
  <soapenv:Header />
  <soapenv:Body>
    <cli:consultaCEP>
      <cep>${cep}</cep>
    </cli:consultaCEP>
  </soapenv:Body>
</soapenv:Envelope>`;

      const response = await this.fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'cache-control': 'no-cache',
          'User-Agent': 'cep-parallel-search'
        },
        body: soapBody,
        timeout: this.defaultTimeout
      });

      const xmlText = await response.text();

      if (!response.ok) {
        const errorMessage = this.parseXMLError(xmlText);
        throw new ServiceError(
          `Erro ao consultar Correios: ${errorMessage}`,
          [{
            message: errorMessage,
            service: this.name,
            status: response.status
          }]
        );
      }

      const parsedData = this.parseXMLResponse(xmlText);

      if (!parsedData.cep) {
        throw new ServiceError(
          'CEP não encontrado na base dos Correios',
          [{
            message: 'CEP não encontrado',
            service: this.name
          }]
        );
      }

      // Mapeia campos dos Correios para formato padrão
      const normalizedData = {
        cep: parsedData.cep,
        uf: parsedData.uf,
        cidade: parsedData.cidade,
        bairro: parsedData.bairro,
        end: parsedData.end
      };

      return this.normalizeResponse(normalizedData);
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError(
        `Erro ao consultar Correios: ${error.message}`,
        [{
          message: error.message,
          service: this.name,
          originalError: error.message
        }]
      );
    }
  }
}

module.exports = CorreiosService;



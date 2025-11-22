const BrasilApiService = require('./brasilApiService');
const ViaCepService = require('./viaCepService');
const WideNetService = require('./wideNetService');
const CorreiosService = require('./correiosService');

/**
 * Factory para criar instâncias de serviços
 */
function createService(serviceName, timeout) {
  const services = {
    brasilapi: () => new BrasilApiService(timeout),
    viacep: () => new ViaCepService(timeout),
    widenet: () => new WideNetService(timeout),
    correios: () => new CorreiosService(timeout)
  };

  if (!services[serviceName]) {
    throw new Error(`Serviço "${serviceName}" não encontrado. Serviços disponíveis: ${Object.keys(services).join(', ')}`);
  }

  return services[serviceName]();
}

/**
 * Retorna todos os serviços disponíveis
 * Nota: widenet e correios estão temporariamente desabilitados
 */
function getAllServices(timeout) {
  return [
    new BrasilApiService(timeout),
    new ViaCepService(timeout)
    // WideNetService e CorreiosService serão adicionados em atualizações futuras
  ];
}

/**
 * Retorna serviços disponíveis por nome
 */
function getServicesByNames(serviceNames, timeout) {
  if (!Array.isArray(serviceNames) || serviceNames.length === 0) {
    return getAllServices(timeout);
  }

  // Valida cada nome de serviço antes de criar
  // NOTA: .map() aqui é usado corretamente porque createService() é síncrono
  // Não retorna Promises, apenas objetos de serviço
  const validServices = serviceNames.map(name => {
    try {
      // createService() é síncrono - apenas cria instâncias de classes
      return createService(name, timeout);
    } catch (error) {
      // Se o serviço não existir, ignora silenciosamente
      // (já foi validado em validateProviders)
      return null;
    }
  }).filter(service => service !== null);

  return validServices;
}

module.exports = {
  BrasilApiService,
  ViaCepService,
  WideNetService,
  CorreiosService,
  createService,
  getAllServices,
  getServicesByNames
};


